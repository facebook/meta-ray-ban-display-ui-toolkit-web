/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * QuickReplyButton component for Meta Ray-Ban Display
 *
 * A compact button for quick reply scenarios (messaging).
 * 72px height (vs Button's 88px). Icon reveals on focus/press.
 * Implements the `Sizable` layout contract used by ButtonGroup.
 *
 * No touch on Meta Ray-Ban Display -- all interaction via d-pad/trackpad.
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
  type CSSProperties,
} from 'react';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import type { ContainerStateChangeAnimation } from '@wearables-ui-toolkit/foundation/components/Container';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import { State, InteractionState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import {
  AnimationDurations,
  getEasedProgressForStateChange,
} from '@wearables-ui-toolkit/foundation/motion/Animations';
import {
  getQuickReplyContentScale,
  getQuickReplyDisabledOpacity,
  getQuickReplyIconAlpha,
  getQuickReplyLayoutCompensation,
  getQuickReplyTargetWidth,
  isQuickReplyStateExpanded,
  shouldShowQuickReplyIcon,
} from './private/QuickReplyButtonLayout';
import {
  QUICK_REPLY_BUTTON_HEIGHT,
  QUICK_REPLY_BUTTON_MINIMUM_WIDTH,
  QUICK_REPLY_OPACITY_EXPAND_DELAY,
} from './private/QuickReplyButtonMetrics';
import { QuickReplyButtonContent } from './private/QuickReplyButtonContent';
import type { QuickReplyButtonProps } from './QuickReplyButton.types';
import styles from './QuickReplyButton.module.css';

export type { QuickReplyButtonProps } from './QuickReplyButton.types';

const EMPTY_QUICK_REPLY_BUTTON_STYLE: CSSProperties = {};
const DEFAULT_QUICK_REPLY_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.FULL);

interface QuickReplyAnimationValues {
  width: number;
  scale: number;
  iconAlpha: number;
}

function getTransitionDuration(
  previousState: State,
  nextState: State,
): number {
  if (nextState === State.PRESSED) {
    return AnimationDurations.CONTAINER_PRESS_IN;
  }

  if (previousState === State.PRESSED) {
    return AnimationDurations.CONTAINER_PRESS_OUT;
  }

  return AnimationDurations.CONTAINER_STATE_CHANGE;
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function areAnimationValuesAtTarget(
  startValues: QuickReplyAnimationValues,
  targetValues: QuickReplyAnimationValues,
): boolean {
  return (
    Math.abs(startValues.width - targetValues.width) < 0.01 &&
    Math.abs(startValues.scale - targetValues.scale) < 0.0001 &&
    Math.abs(startValues.iconAlpha - targetValues.iconAlpha) < 0.001
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * QuickReplyButton component
 * Compact reply button that expands to show icon on focus.
 *
 * Implements Sizable for ButtonGroup compatibility.
 * Width animates between collapsed (text only) and expanded (text + icon).
 */
export const QuickReplyButton = memo(forwardRef<HTMLDivElement, QuickReplyButtonProps>(
  function QuickReplyButton(
    {
      title,
      icon,
      material: materialProp,
      shapeProvider = DEFAULT_QUICK_REPLY_SHAPE_PROVIDER,
      disabled = false,
      onClick,
      onStateChange,
      style = EMPTY_QUICK_REPLY_BUTTON_STYLE,
      className = '',
      ...containerProps
    },
    ref
  ) {
    const [state, setState] = useState<State>(State.DEFAULT);
    const defaultIconAlpha = getQuickReplyIconAlpha(
      shouldShowQuickReplyIcon(Boolean(icon), Boolean(title && title.length > 0), false),
    );
    const [animatedValues, setAnimatedValuesState] = useState<QuickReplyAnimationValues>({
      width: QUICK_REPLY_BUTTON_MINIMUM_WIDTH,
      scale: getQuickReplyContentScale(State.DEFAULT, QUICK_REPLY_BUTTON_MINIMUM_WIDTH),
      iconAlpha: defaultIconAlpha,
    });
    const [measuredContentWidth, setMeasuredContentWidth] = useState<number>(0);
    const isAnimatingRef = useRef(false);
    const animatedValuesRef = useRef<QuickReplyAnimationValues>(animatedValues);
    const material = useMemo(
      () => materialProp ?? MaterialLibrary.button(),
      [materialProp],
    );

    // Refs for measuring
    const contentViewContainerRef = useRef<HTMLDivElement>(null);
    const contentViewRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);

    const hasText = useMemo(
      () => Boolean(title && title.length > 0),
      [title],
    );
    const hasIcon = useMemo(
      () => Boolean(icon),
      [icon],
    );

    const isExpanded = useMemo(
      () => isQuickReplyStateExpanded(state),
      [state],
    );

    const shouldShowIcon = useMemo(
      () => shouldShowQuickReplyIcon(hasIcon, hasText, isExpanded),
      [hasIcon, hasText, isExpanded],
    );

    const setAnimatedValues = useCallback((nextValues: QuickReplyAnimationValues): void => {
      animatedValuesRef.current = nextValues;
      setAnimatedValuesState(nextValues);
    }, []);

    /**
     * Measure content natural width
     */
    useEffect(() => {
      if (contentViewContainerRef.current && contentViewRef.current) {
        requestAnimationFrame(() => {
          if (!contentViewRef.current || !contentViewContainerRef.current) return;

          const outer = contentViewContainerRef.current;
          const originalWidth = outer.style.width;
          outer.style.width = 'auto';

          const measured = contentViewRef.current.offsetWidth;

          outer.style.width = originalWidth;

          if (measured > 0) {
            setMeasuredContentWidth(Math.ceil(measured) + 1);
          }
        });
      }
    }, [title, icon, hasText, hasIcon]);

    /**
     * Calculate target container width.
     */
    const targetWidth = useMemo(() => {
      return getQuickReplyTargetWidth({
        hasText,
        shouldShowIcon,
        textWidth: titleRef.current?.offsetWidth ?? 0,
      });
    }, [hasText, shouldShowIcon, title, measuredContentWidth]);

    const getTargetValuesForState = useCallback((nextState: State): QuickReplyAnimationValues => {
      const nextIsExpanded = isQuickReplyStateExpanded(nextState);
      const nextShouldShowIcon = shouldShowQuickReplyIcon(
        hasIcon,
        hasText,
        nextIsExpanded,
      );
      const nextWidth = getQuickReplyTargetWidth({
        hasText,
        shouldShowIcon: nextShouldShowIcon,
        textWidth: titleRef.current?.offsetWidth ?? 0,
      });

      return {
        width: nextWidth,
        scale: getQuickReplyContentScale(nextState, nextWidth),
        iconAlpha: getQuickReplyIconAlpha(nextShouldShowIcon),
      };
    }, [hasIcon, hasText, measuredContentWidth, title]);

    useLayoutEffect(() => {
      const targetValues = getTargetValuesForState(state);

      if (areAnimationValuesAtTarget(animatedValuesRef.current, targetValues)) {
        setAnimatedValues(targetValues);
        return;
      }

      if (!isAnimatingRef.current) {
        setAnimatedValues(targetValues);
      }
    }, [
      getTargetValuesForState,
      setAnimatedValues,
      state,
      targetWidth,
    ]);

    const createStateChangeAnimations = useCallback(({
      prevInteraction,
      newInteraction,
      animated,
    }: {
      prevInteraction: InteractionState;
      newInteraction: InteractionState;
      animated: boolean;
    }): ContainerStateChangeAnimation[] => {
      const startValues = animatedValuesRef.current;
      const targetValues = getTargetValuesForState(newInteraction.state);
      const duration = getTransitionDuration(
        prevInteraction.state,
        newInteraction.state,
      );
      const opacityDelay =
        targetValues.iconAlpha > startValues.iconAlpha &&
        newInteraction.state !== State.PRESSED &&
        prevInteraction.state !== State.PRESSED
          ? QUICK_REPLY_OPACITY_EXPAND_DELAY
          : 0;
      const opacityDuration = Math.max(duration - opacityDelay, 0);

      setState(newInteraction.state);

      if (!animated || areAnimationValuesAtTarget(startValues, targetValues)) {
        isAnimatingRef.current = false;
        setAnimatedValues(targetValues);
        return [];
      }

      return [{
        duration,
        onStart: () => {
          isAnimatingRef.current = true;
          setAnimatedValues(startValues);
        },
        onFrame: (elapsedMs) => {
          const geometryProgress = Math.min(elapsedMs / duration, 1);
          const easedGeometryProgress = getEasedProgressForStateChange(
            prevInteraction.state,
            newInteraction.state,
            geometryProgress,
          );
          const opacityProgress = opacityDuration <= 0
            ? 1
            : Math.min(Math.max((elapsedMs - opacityDelay) / opacityDuration, 0), 1);
          const easedOpacityProgress = getEasedProgressForStateChange(
            prevInteraction.state,
            newInteraction.state,
            opacityProgress,
          );

          setAnimatedValues({
            width: lerp(startValues.width, targetValues.width, easedGeometryProgress),
            scale: lerp(startValues.scale, targetValues.scale, easedGeometryProgress),
            iconAlpha: lerp(startValues.iconAlpha, targetValues.iconAlpha, easedOpacityProgress),
          });
        },
        onCancel: () => {
          isAnimatingRef.current = false;
        },
        onComplete: () => {
          setAnimatedValues(targetValues);
          isAnimatingRef.current = false;
        },
      }];
    }, [
      getTargetValuesForState,
      setAnimatedValues,
    ]);

    const handleStateChange = useCallback((
      prev: InteractionState,
      next: InteractionState,
    ) => {
      onStateChange?.(prev, next);
    }, [onStateChange]);

    const iconAlpha = animatedValues.iconAlpha;
    const contentScale = animatedValues.scale;

    // ---- Disabled opacity ----
    const disabledOpacity = useMemo(
      () => getQuickReplyDisabledOpacity(disabled),
      [disabled],
    );

    // ---- Container style ----
    const containerStyle: CSSProperties = useMemo(
      () => ({
        transform: `scale(${contentScale})`,
        opacity: disabledOpacity,
        transition: 'none',
        ['--uit-button-layout-compensation' as string]:
          `${getQuickReplyLayoutCompensation(animatedValues.width, contentScale)}px`,
        ...style,
      }),
      [
        animatedValues.width,
        contentScale,
        disabledOpacity,
        style,
      ],
    );

    // ---- Content view container (outer, animated width) ----
    const contentViewContainerStyle: CSSProperties = useMemo(
      () => ({
        width: '100%',
        height: QUICK_REPLY_BUTTON_HEIGHT,
        transition: 'none',
      }),
      [],
    );

    // ---- Content view (inner, natural width) ----
    const contentViewStyle: CSSProperties = useMemo(
      () => ({
        width: measuredContentWidth > 0 ? measuredContentWidth : 'fit-content',
        height: '100%',
        minWidth: QUICK_REPLY_BUTTON_MINIMUM_WIDTH,
      }),
      [measuredContentWidth],
    );
    const rootClassName = useMemo(
      () => `${styles.quickReplyButton} ${className}`,
      [className],
    );

    return (
      <Container
        ref={ref}
        {...containerProps}
        className={rootClassName}
        style={containerStyle}
        material={material}
        shapeProvider={shapeProvider}
        disabled={disabled}
        onClick={onClick}
        onStateChange={handleStateChange}
        stateChangeAnimations={createStateChangeAnimations}
        role="button"
        ariaLabel={title ?? undefined}
        width={animatedValues.width}
        height={QUICK_REPLY_BUTTON_HEIGHT}
        data-uit-button-group-item-height={QUICK_REPLY_BUTTON_HEIGHT}
      >
        <QuickReplyButtonContent
          contentViewContainerRef={contentViewContainerRef}
          contentViewRef={contentViewRef}
          titleRef={titleRef}
          contentViewContainerStyle={contentViewContainerStyle}
          contentViewStyle={contentViewStyle}
          title={title}
          icon={icon}
          hasText={hasText}
          hasIcon={hasIcon}
          isExpanded={isExpanded}
          iconAlpha={iconAlpha}
        />
      </Container>
    );
  }
));
