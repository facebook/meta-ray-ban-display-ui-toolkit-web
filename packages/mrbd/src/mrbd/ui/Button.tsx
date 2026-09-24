/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Button component for Meta Ray-Ban Display
 * Extends Container with icon/avatar/text support and state-driven animations
 */

import {
  forwardRef,
  memo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
  useImperativeHandle,
  type CSSProperties,
} from 'react';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import type { ContainerStateChangeAnimation } from '@wearables-ui-toolkit/foundation/components/Container';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';
import type { InteractionState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import {
  getEasedProgressForStateChange,
} from '@wearables-ui-toolkit/foundation/motion/Animations';
import {
  BUTTON_HEIGHT,
  BUTTON_MINIMUM_WIDTH,
  ICON_COUNTER_SCALE_EXPANDED,
  LeadingAccessoryRenderMode,
  getButtonMaxWidth,
  getButtonTargetWidth,
  getButtonVisualState,
  lerp,
  shouldDeferButtonStateChangeUntilMeasured,
  shouldTruncateButtonContent,
} from './private/ButtonLayout';
import type { ButtonAnimationValues } from './private/ButtonLayout';
import {
  areButtonAnimationValuesAtTarget,
  getButtonAnimationTargetValues,
  getButtonAnimationTiming,
  getButtonInitialAnimationValues,
} from './private/ButtonAnimation';
import { measureButtonNaturalContentWidth } from './private/ButtonMeasurement';
import { usePrefersReducedMotion } from '@wearables-ui-toolkit/foundation/motion/usePrefersReducedMotion';
import type {
  ButtonActionTransitionOptions,
  ButtonHandle,
  ButtonProps,
} from './Button.types';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import { ButtonContent } from './private/ButtonContent';
import styles from './Button.module.css';
export type {
  ButtonProps,
  ButtonHandle,
  ButtonActionTransitionOptions,
} from './Button.types';

const EMPTY_BUTTON_STYLE: CSSProperties = {};
const DEFAULT_BUTTON_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.FULL);

/**
 * Action-transition timing (ms). The action-transition motion: a shrink
 * (ease-in-out) to scale 0, an icon/title swap while invisible, then a
 * spring-like scale-back.
 */
const ACTION_TRANSITION_SHRINK_MS = 200;
const ACTION_TRANSITION_GROW_MS = 350;
const ACTION_TRANSITION_TITLE_SWAP_DELAY_MS = 250;

/**
 * Button component
 * Rich interactive button with icon/avatar and text
 */
export const Button = memo(forwardRef<ButtonHandle, ButtonProps>(
  function Button(
    {
      title,
      subtitle,
      alwaysShowText = false,
      icon,
      iconTintColor,
      applyIconTinting = true,
      showIconActiveIndicator = false,
      iconRotation = 0,
      animateIconRotation = false,
      iconRotationDuration = 1000,
      avatarSrc,
      avatarPrimaryContent,
      avatarAlt,
      statusIndicator,
      statusIndicatorIcon,
      avatarBadgeSrc,
      avatarBadgeContent,
      placeholderStyle,
      trailingTag,
      enforceMaxWidth = false,
      width,
      material: materialProp,
      shapeProvider = DEFAULT_BUTTON_SHAPE_PROVIDER,
      disabled = false,
      onClick,
      style = EMPTY_BUTTON_STYLE,
      className = '',
      ...containerProps
    },
    ref
  ) {
    const prefersReducedMotion = usePrefersReducedMotion();
    const hasAvatar = avatarSrc != null || avatarPrimaryContent != null;
    const [state, setState] = useState<State>(State.DEFAULT);
    const [animatedValues, setAnimatedValuesState] = useState<ButtonAnimationValues>(() => {
      // First paint has no DOM measurement yet. Seed from props so a button that
      // rests expanded (alwaysShowText or text-only) paints at full text opacity /
      // scale / icon margin on the first frame instead of animate-expanding from
      // an unmeasured state. width stays BUTTON_MINIMUM_WIDTH (no measurement) but
      // remains numeric; containerWidth below drives the expanded first-paint box
      // until the mount measurement lands.
      const initialRenderMode = hasAvatar
        ? LeadingAccessoryRenderMode.AVATAR
        : icon
          ? LeadingAccessoryRenderMode.ICON
          : LeadingAccessoryRenderMode.NONE;
      return getButtonInitialAnimationValues({
        measuredContentWidth: 0,
        renderMode: initialRenderMode,
        hasText: Boolean(title || subtitle),
        alwaysShowText,
      });
    });
    const [pressLayoutScale, setPressLayoutScale] = useState<number | null>(null);
    const [measuredContentWidth, setMeasuredContentWidth] = useState<number>(0);
    // Action-transition overrides (see animateActionTransition). When unset
    // (undefined), the declarative `icon`/`title` props drive the display.
    const [overrideIcon, setOverrideIcon] = useState<IconSource | undefined>(undefined);
    const [overrideTitle, setOverrideTitle] = useState<string | undefined>(undefined);
    const [iconActionScale, setIconActionScale] = useState<number>(1);
    const [iconActionTransition, setIconActionTransition] = useState<string>('none');
    const hasInitializedRef = useRef(false);
    const isAnimatingRef = useRef(false);
    const pendingMeasurementRef = useRef(false);
    const measurementFrameRef = useRef<number | null>(null);
    const animatedValuesRef = useRef<ButtonAnimationValues>(animatedValues);
    const latestTargetValuesRef = useRef<ButtonAnimationValues>(animatedValues);
    const rootRef = useRef<HTMLDivElement>(null);
    const actionTransitionTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

    // Reset any action-transition override when the declarative props change, so
    // the props remain the source of truth: setting the icon/title overrides an
    // in-flight transition's end state.
    useEffect(() => {
      setOverrideIcon(undefined);
    }, [icon]);
    useEffect(() => {
      setOverrideTitle(undefined);
    }, [title]);

    const effectiveIcon = overrideIcon !== undefined ? overrideIcon : icon;
    const effectiveTitle = overrideTitle !== undefined ? overrideTitle : title;
    const material = useMemo(
      () => materialProp ?? MaterialLibrary.button(),
      [materialProp],
    );

    // Refs for the two-container structure
    const contentViewContainerRef = useRef<HTMLDivElement>(null); // Outer, animated width
    const contentViewRef = useRef<HTMLDivElement>(null); // Inner, natural width

    /**
     * Determine leading accessory render mode
     */
    const renderMode = useMemo<LeadingAccessoryRenderMode>(() => {
      if (hasAvatar) return LeadingAccessoryRenderMode.AVATAR;
      if (effectiveIcon) return LeadingAccessoryRenderMode.ICON;
      return LeadingAccessoryRenderMode.NONE;
    }, [effectiveIcon, hasAvatar]);

    /**
     * Check if we have text content
     */
    const hasText = useMemo(
      () => Boolean(effectiveTitle || subtitle),
      [subtitle, effectiveTitle],
    );

    // These buttons rest expanded (no collapse at DEFAULT) and must paint at
    // natural width on the first frame.
    const startsExpanded = useMemo(
      () => alwaysShowText || renderMode === LeadingAccessoryRenderMode.NONE,
      [alwaysShowText, renderMode],
    );

    const setAnimatedValues = useCallback((nextValues: ButtonAnimationValues): void => {
      animatedValuesRef.current = nextValues;
      setAnimatedValuesState(nextValues);
    }, []);

    const commitMeasuredContentWidth = useCallback((measured: number): number => {
      if (measured <= 0) {
        return 0;
      }

      const w = Math.ceil(measured);
      setMeasuredContentWidth(prev => prev === w ? prev : w);
      return w;
    }, []);

    const measureNaturalContentWidth = useCallback((): number => {
      return measureButtonNaturalContentWidth({
        outerContainer: contentViewContainerRef.current,
        contentView: contentViewRef.current,
        renderMode,
        hasText,
        classNames: {
          iconContent: styles.iconContent,
          textContent: styles.textContent,
          trailingTag: styles.trailingTag,
        },
      });
    }, [hasText, renderMode]);

    const measureAndCommitNaturalContentWidth = useCallback((): number => {
      return commitMeasuredContentWidth(measureNaturalContentWidth());
    }, [commitMeasuredContentWidth, measureNaturalContentWidth]);

    const requestNaturalContentWidthMeasurement = useCallback(() => {
      if (measurementFrameRef.current != null) {
        window.cancelAnimationFrame(measurementFrameRef.current);
      }

      measurementFrameRef.current = window.requestAnimationFrame(() => {
        measurementFrameRef.current = null;
        if (isAnimatingRef.current) {
          pendingMeasurementRef.current = true;
          return;
        }

        pendingMeasurementRef.current = false;
        measureAndCommitNaturalContentWidth();
      });
    }, [measureAndCommitNaturalContentWidth]);

    useEffect(() => {
      return () => {
        if (measurementFrameRef.current != null) {
          window.cancelAnimationFrame(measurementFrameRef.current);
          measurementFrameRef.current = null;
        }
      };
    }, []);

    /**
     * Determines if avatar renders as standalone in DEFAULT state
     * Renders a standalone avatar when in the default state.
     * True when: AVATAR mode AND NOT alwaysShowText
     * (text is hidden in default state, so avatar appears standalone)
     */
    const rendersStandaloneAvatarWhenDefaultState = useMemo(
      () => renderMode === LeadingAccessoryRenderMode.AVATAR && !alwaysShowText,
      [alwaysShowText, renderMode],
    );

    const textOpacity = animatedValues.textOpacity;

    /**
     * Measure content width on mount and when content changes
     * Measures the INNER contentView (natural width)
     * CRITICAL: Must measure when outer container is NOT constraining the width
     */
    useLayoutEffect(() => {
      if (!contentViewContainerRef.current || !contentViewRef.current) return;

      const w = measureAndCommitNaturalContentWidth();

      if (w > 0) {
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true;
          setAnimatedValues(
            getButtonInitialAnimationValues({
              measuredContentWidth: w,
              renderMode,
              hasText,
              alwaysShowText,
            }),
          );
        }
      }
    }, [
      alwaysShowText,
      hasAvatar,
      hasText,
      effectiveIcon,
      measureAndCommitNaturalContentWidth,
      renderMode,
      setAnimatedValues,
      subtitle,
      effectiveTitle,
    ]);

    useEffect(() => {
      const fontFaceSet = (document as Document & { fonts?: FontFaceSet }).fonts;
      if (fontFaceSet == null) {
        return;
      }

      let cancelled = false;
      fontFaceSet.ready.then(() => {
        if (cancelled) {
          return;
        }
        requestNaturalContentWidthMeasurement();
      });

      return () => {
        cancelled = true;
      };
    }, [
      alwaysShowText,
      hasAvatar,
      hasText,
      effectiveIcon,
      requestNaturalContentWidthMeasurement,
      renderMode,
      subtitle,
      effectiveTitle,
    ]);

    // Observe both the locked content view and its natural-size children.
    // WebView can mount a route with fallback font metrics and then resolve
    // static font widths after the page-entry focus snap. The parent width is
    // fixed at the old measurement, so observing only that parent misses the
    // child text width change.
    useEffect(() => {
      const el = contentViewRef.current;
      if (!el) return;

      const ro = new ResizeObserver(() => {
        // The natural content width is invariant during a clip-width animation
        // (only the container width lerps), so skip re-measuring per frame while
        // animating; onComplete + fonts.ready reconcile any genuine late change.
        if (isAnimatingRef.current) {
          pendingMeasurementRef.current = true;
          return;
        }
        requestNaturalContentWidthMeasurement();
      });
      ro.observe(el);
      Array.from(el.children).forEach(child => {
        if (child instanceof Element) {
          ro.observe(child);
        }
      });

      return () => {
        ro.disconnect();
      };
    }, [requestNaturalContentWidthMeasurement]);

    /**
     * Determine if content should be truncated with ellipsis
     * Only truncate when:
     * 1. enforceMaxWidth is true
     * 2. We have a valid measurement (measuredContentWidth > 0)
     * 3. Content actually exceeds max width
     * This ensures we don't constrain the inner container before measurement
     */
    const shouldTruncate = useMemo(() => {
      return shouldTruncateButtonContent(
        enforceMaxWidth,
        measuredContentWidth,
        renderMode,
      );
    }, [enforceMaxWidth, measuredContentWidth, renderMode]);

    /**
     * Calculate target width based on state (content view container sizing)
     */
    const targetWidth = useMemo(() => {
      return getButtonTargetWidth({
        customWidth: width,
        renderMode,
        hasText,
        state,
        alwaysShowText,
        measuredContentWidth,
        enforceMaxWidth,
      });
    }, [width, renderMode, hasText, state, alwaysShowText, measuredContentWidth, enforceMaxWidth]);

    const targetValues = useMemo(
      () => getButtonAnimationTargetValues({
        state,
        targetWidth,
        renderMode,
        hasText,
        alwaysShowText,
      }),
      [alwaysShowText, hasText, renderMode, state, targetWidth],
    );
    useLayoutEffect(() => {
      latestTargetValuesRef.current = targetValues;
    }, [targetValues]);

    const buttonRailLayoutTargets = useMemo(() => {
      const getTarget = (targetState: State): ButtonAnimationValues => {
        const stateTargetWidth = getButtonTargetWidth({
          customWidth: width,
          renderMode,
          hasText,
          state: targetState,
          alwaysShowText,
          measuredContentWidth,
          enforceMaxWidth,
        });
        return getButtonAnimationTargetValues({
          state: targetState,
          targetWidth: stateTargetWidth,
          renderMode,
          hasText,
          alwaysShowText,
        });
      };

      return {
        default: getTarget(State.DEFAULT),
        focused: getTarget(State.FOCUSED),
      };
    }, [
      alwaysShowText,
      enforceMaxWidth,
      hasText,
      measuredContentWidth,
      renderMode,
      width,
    ]);

    useLayoutEffect(() => {
      const root = rootRef.current;
      if (root == null) {
        return;
      }

      root.dataset.uitButtonDefaultLayoutWidth = String(
        buttonRailLayoutTargets.default.width,
      );
      root.dataset.uitButtonDefaultScale = String(
        buttonRailLayoutTargets.default.scale,
      );
      root.dataset.uitButtonFocusedLayoutWidth = String(
        buttonRailLayoutTargets.focused.width,
      );
      root.dataset.uitButtonFocusedScale = String(
        buttonRailLayoutTargets.focused.scale,
      );
    }, [buttonRailLayoutTargets]);

    useEffect(() => {
      if (!hasInitializedRef.current) {
        return;
      }

      const startValues = animatedValuesRef.current;

      if (areButtonAnimationValuesAtTarget(startValues, targetValues)) {
        setAnimatedValues(targetValues);
        return;
      }

      if (!isAnimatingRef.current) {
        setAnimatedValues(targetValues);
      }
    }, [setAnimatedValues, targetValues]);

    const createStateChangeAnimations = useCallback(({
      prevInteraction,
      newInteraction,
      animated,
    }: {
      prevInteraction: InteractionState;
      newInteraction: InteractionState;
      animated: boolean;
    }): ContainerStateChangeAnimation[] => {
      const nextTargetWidth = getButtonTargetWidth({
        customWidth: width,
        renderMode,
        hasText,
        state: newInteraction.state,
        alwaysShowText,
        measuredContentWidth,
        enforceMaxWidth,
      });

      const startValues = animatedValuesRef.current;
      const targetValues = getButtonAnimationTargetValues({
        state: newInteraction.state,
        targetWidth: nextTargetWidth,
        renderMode,
        hasText,
        alwaysShowText,
      });

      const {
        duration,
        opacityDuration,
        opacityDelay,
      } = getButtonAnimationTiming({
        state: newInteraction.state,
        previousState: prevInteraction.state,
        startValues,
        targetValues,
      });
      const totalDuration = Math.max(duration, opacityDelay + opacityDuration);
      const isPressTransition =
        prevInteraction.state === State.PRESSED ||
        newInteraction.state === State.PRESSED;
      if (
        prevInteraction.state !== State.PRESSED &&
        newInteraction.state === State.PRESSED
      ) {
        setPressLayoutScale(startValues.scale);
      } else if (
        prevInteraction.state !== State.PRESSED &&
        newInteraction.state !== State.PRESSED
      ) {
        setPressLayoutScale(null);
      }
      setState(newInteraction.state);

      // A content-driven text button can receive page-entry focus before its
      // natural width is measurable. Do not animate toward the 88px fallback;
      // the measurement-commit effect applies the current-state target once the
      // width is known. Explicit-width buttons do not depend on this measurement.
      if (shouldDeferButtonStateChangeUntilMeasured({
        customWidth: width,
        state: newInteraction.state,
        hasText,
        measuredContentWidth,
      })) {
        isAnimatingRef.current = false;
        return [];
      }

      if (
        !animated ||
        prefersReducedMotion ||
        areButtonAnimationValuesAtTarget(startValues, targetValues)
      ) {
        isAnimatingRef.current = false;
        setAnimatedValues(targetValues);
        if (newInteraction.state !== State.PRESSED) {
          setPressLayoutScale(null);
        }
        if (!isPressTransition) {
          requestNaturalContentWidthMeasurement();
        }
        return [];
      }

      return [{
        duration: totalDuration,
        onStart: () => {
          isAnimatingRef.current = true;
          setAnimatedValues(startValues);
        },
        onFrame: (elapsedMs) => {
          const latestTargetValues = latestTargetValuesRef.current;
          const geometryProgress = Math.min(elapsedMs / duration, 1);
          const easedGeometryProgress = getEasedProgressForStateChange(
            prevInteraction.state,
            newInteraction.state,
            geometryProgress,
          );
          const opacityProgress = Math.min(
            Math.max((elapsedMs - opacityDelay) / opacityDuration, 0),
            1,
          );
          const easedOpacityProgress = getEasedProgressForStateChange(
            prevInteraction.state,
            newInteraction.state,
            opacityProgress,
          );

          setAnimatedValues({
            width: lerp(
              startValues.width,
              latestTargetValues.width,
              easedGeometryProgress,
            ),
            scale: lerp(
              startValues.scale,
              latestTargetValues.scale,
              easedGeometryProgress,
            ),
            iconLeadingMargin: lerp(
              startValues.iconLeadingMargin,
              latestTargetValues.iconLeadingMargin,
              easedGeometryProgress,
            ),
            textOpacity: lerp(
              startValues.textOpacity,
              latestTargetValues.textOpacity,
              easedOpacityProgress,
            ),
          });
        },
        onComplete: () => {
          const shouldRemeasure = pendingMeasurementRef.current;
          setAnimatedValues(latestTargetValuesRef.current);
          if (newInteraction.state !== State.PRESSED) {
            setPressLayoutScale(null);
          }
          isAnimatingRef.current = false;
          pendingMeasurementRef.current = false;
          if (shouldRemeasure) {
            requestNaturalContentWidthMeasurement();
          }
        },
        onCancel: () => {
          isAnimatingRef.current = false;
          if (pendingMeasurementRef.current) {
            requestNaturalContentWidthMeasurement();
          }
        },
      }];
    }, [
      alwaysShowText,
      enforceMaxWidth,
      hasText,
      measuredContentWidth,
      prefersReducedMotion,
      requestNaturalContentWidthMeasurement,
      renderMode,
      setAnimatedValues,
      width,
    ]);

    const clearActionTransitionTimers = useCallback(() => {
      actionTransitionTimersRef.current.forEach(clearTimeout);
      actionTransitionTimersRef.current = [];
    }, []);

    /**
     * Action transition: shrink the icon to scale 0, swap the icon/title while
     * invisible, then spring it back to full size. The title (if provided) snaps
     * in partway through the grow phase.
     *
     * No-op unless `endingIcon` is provided (exactly one icon source is
     * required). With reduced motion the swap is applied immediately.
     */
    const animateActionTransition = useCallback(
      ({ endingIcon, endingTitle }: ButtonActionTransitionOptions): void => {
        if (endingIcon == null) {
          return;
        }

        clearActionTransitionTimers();

        const applyEndState = () => {
          setOverrideIcon(endingIcon);
          if (endingTitle != null && endingTitle !== '') {
            setOverrideTitle(endingTitle);
          }
          setIconActionTransition('none');
          setIconActionScale(1);
        };

        if (prefersReducedMotion) {
          applyEndState();
          return;
        }

        // Phase 1: shrink the current icon to 0 (ease-in-out).
        setIconActionTransition(
          `transform ${ACTION_TRANSITION_SHRINK_MS}ms ease-in-out`,
        );
        setIconActionScale(0);

        // Phase 2: swap the (invisible) icon, then spring it back up.
        const swapTimer = setTimeout(() => {
          setOverrideIcon(endingIcon);
          setIconActionTransition(
            `transform ${ACTION_TRANSITION_GROW_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
          );
          setIconActionScale(1);
        }, ACTION_TRANSITION_SHRINK_MS);
        actionTransitionTimersRef.current.push(swapTimer);

        if (endingTitle != null && endingTitle !== '') {
          const titleTimer = setTimeout(() => {
            setOverrideTitle(endingTitle);
          }, ACTION_TRANSITION_TITLE_SWAP_DELAY_MS);
          actionTransitionTimersRef.current.push(titleTimer);
        }

        const settleTimer = setTimeout(() => {
          setIconActionTransition('none');
          setIconActionScale(1);
        }, ACTION_TRANSITION_SHRINK_MS + ACTION_TRANSITION_GROW_MS);
        actionTransitionTimersRef.current.push(settleTimer);
      },
      [clearActionTransitionTimers, prefersReducedMotion],
    );

    useEffect(() => clearActionTransitionTimers, [clearActionTransitionTimers]);

    useImperativeHandle(
      ref,
      (): ButtonHandle => ({
        animateActionTransition,
        getElement: () => rootRef.current,
      }),
      [animateActionTransition],
    );

    /**
     * Computed visual state for Container
     * If standalone avatar in DEFAULT state, use NONE to hide material layers
     */
    const computedVisualState = useMemo(
      () => getButtonVisualState(state, rendersStandaloneAvatarWhenDefaultState),
      [rendersStandaloneAvatarWhenDefaultState, state],
    );

    const visualStateForInteractionState = useCallback(
      (interaction: InteractionState) =>
        getButtonVisualState(
          interaction.state,
          rendersStandaloneAvatarWhenDefaultState,
        ),
      [rendersStandaloneAvatarWhenDefaultState],
    );

    /**
     * Icon counter-scale tracks the parent's scale change.
     * When collapsed, the icon/avatar inversely tracks the animated parent scale
     * so its visual size stays steady while the container shrinks.
     */
    const iconCounterScale = useMemo(
      () => state !== State.PRESSED && !alwaysShowText
        ? 1 / animatedValues.scale
        : ICON_COUNTER_SCALE_EXPANDED,
      [alwaysShowText, animatedValues.scale, state],
    );

    /**
     * Container styles
     */
    const containerStyle: CSSProperties = useMemo(
      () => ({
        transform: `scale(${animatedValues.scale})`,
        transition: 'none',
        // Floor/cap the outer box ONLY when width is not caller-provided (the same
        // condition that can produce the pre-measure `max-content` containerWidth):
        // the floor backs the material box and the cap stops a long enforceMaxWidth
        // button overshooting for the one frame before shouldTruncate engages. An
        // explicit caller width stays authoritative (matches getButtonTargetWidth).
        minWidth: width == null ? BUTTON_MINIMUM_WIDTH : undefined,
        maxWidth:
          width == null && enforceMaxWidth
            ? getButtonMaxWidth(renderMode)
            : undefined,
        ['--uit-button-layout-compensation' as string]:
          `${-Math.max(
            0,
          (animatedValues.width - BUTTON_HEIGHT) *
            (1 - (pressLayoutScale ?? animatedValues.scale)) / 2,
          )}px`,
        ...style,
      }),
      [
        animatedValues.scale,
        animatedValues.width,
        enforceMaxWidth,
        renderMode,
        style,
      pressLayoutScale,
        width,
      ],
    );

    // Before a pixel measurement exists, a startsExpanded button lays out at
    // max-content so it paints expanded on the first frame; everything else pins
    // to the numeric animated width. Once the mount measurement lands
    // (measuredContentWidth > 0) this falls through to animatedValues.width so
    // focus/press width lerps run on pixels. A caller-provided width always wins.
    const containerWidth: number | string =
      width == null && startsExpanded && measuredContentWidth <= 0
        ? 'max-content'
        : animatedValues.width;

    /**
     * Content view container styles (outer, clipped viewport).
     * Width is driven by the Container's numeric width prop so material strokes/glow
     * and the clipped content viewport consume the same animation frame.
     */
    const contentViewContainerStyle: CSSProperties = useMemo(
      () => ({
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        transition: 'none',
      }),
      [],
    );

    /**
     * Content view styles (inner, natural width)
     * This is locked to its measured width so text is always full-size (just gets clipped)
     * EXCEPTION: When shouldTruncate is true (content exceeds max width), constrain for ellipsis
     * Use targetWidth to avoid timing issues on initial render
     */
    const contentViewStyle: CSSProperties = useMemo(
      () => ({
        width: shouldTruncate
          ? targetWidth
          : (measuredContentWidth > 0 ? measuredContentWidth : 'fit-content'),
        height: '100%',
        minWidth: BUTTON_MINIMUM_WIDTH,
      }),
      [measuredContentWidth, shouldTruncate, targetWidth],
    );

    const buttonClassName = useMemo(
      () => `${styles.button} ${className}`,
      [className],
    );

    return (
      <Container
        ref={rootRef}
        {...containerProps}
        className={buttonClassName}
        style={containerStyle}
        material={material}
        shapeProvider={shapeProvider}
        disabled={disabled}
        onClick={onClick}
        visualStateOverride={computedVisualState}
        visualStateForInteractionStateFn={visualStateForInteractionState}
        stateChangeAnimations={createStateChangeAnimations}
        width={containerWidth}
        height={BUTTON_HEIGHT}
        clipContent={false}
        role="button"
        data-uit-button-group-item-height={BUTTON_HEIGHT}
      >
        <ButtonContent
          contentViewContainerRef={contentViewContainerRef}
          contentViewRef={contentViewRef}
          contentViewContainerStyle={contentViewContainerStyle}
          contentViewStyle={contentViewStyle}
          renderMode={renderMode}
          icon={effectiveIcon}
          iconTintColor={iconTintColor}
          applyIconTinting={applyIconTinting}
          showIconActiveIndicator={showIconActiveIndicator}
          iconRotation={iconRotation}
          animateIconRotation={animateIconRotation && !prefersReducedMotion}
          iconRotationDuration={iconRotationDuration}
          avatarSrc={avatarSrc}
          avatarPrimaryContent={avatarPrimaryContent}
          avatarAlt={avatarAlt}
          statusIndicator={statusIndicator}
          statusIndicatorIcon={statusIndicatorIcon}
          avatarBadgeSrc={avatarBadgeSrc}
          avatarBadgeContent={avatarBadgeContent}
          placeholderStyle={placeholderStyle}
          title={effectiveTitle}
          subtitle={subtitle}
          trailingTag={trailingTag}
          hasText={hasText}
          shouldTruncate={shouldTruncate}
          iconLeadingMargin={animatedValues.iconLeadingMargin}
          iconCounterScale={iconCounterScale}
          iconActionScale={iconActionScale}
          iconActionTransition={iconActionTransition}
          textOpacity={textOpacity}
        />
      </Container>
    );
  }
));
