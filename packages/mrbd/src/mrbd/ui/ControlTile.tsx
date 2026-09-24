/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ControlTile component for Meta Ray-Ban Display
 *
 * A control tile for settings and toggles.
 * Extends Container with checked/unchecked states, icon with
 * background circle, title, and optional horizontal progress bar.
 *
 * No touch on Meta Ray-Ban Display -- all interaction via d-pad/trackpad.
 */

import {
  forwardRef,
  memo,
  useState,
  useMemo,
  useCallback,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  Container,
  PartialFocusSupportedAxis,
} from '@wearables-ui-toolkit/foundation/components/Container';
import { State, InteractionState, VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import {
  Interpolators,
  createTransition,
} from '@wearables-ui-toolkit/foundation/motion/Animations';
import type { ControlTileProps } from './ControlTile.types';
import {
  CONTROL_TILE_DEFAULT_TITLE_MAX_LINES,
  CONTROL_TILE_SPRING_DURATION,
} from './private/ControlTileMetrics';
import { ControlTileContent } from './private/ControlTileContent';
import {
  getControlTileAriaState,
  getControlTileIconScale,
  getControlTileIconSize,
  getControlTileProgressMode,
  getControlTileSliderState,
  hasControlTileProgressBar,
  shouldHandleControlTileProgressKey,
  shouldShowControlTileIconBackground,
} from './private/ControlTileLayout';
import {
  createControlTileMaterial,
  getControlTileIconOverlayStyle,
  getControlTileIconTintColor,
} from './private/ControlTileMaterials';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import type { SliderBarState } from './SliderBar';
import styles from './ControlTile.module.css';

/**
 * Layout: full-width, wrap-content height, minHeight 120px.
 * The tile does NOT have a hardcoded width — it fills its parent container.
 * Two tiles side-by-side each expand equally in a horizontal
 * row with an 8px gap. The often-cited 264px width is the RESULT of
 * (536 - 8) / 2, where 536 is the content area width on a 600px screen.
 *
 * The height is also NOT hardcoded — it uses minHeight 120px and
 * wrap-content, so taller content (e.g. multi-line title) grows the tile.
 */

/**
 * Minimum height (120px) is set in CSS (.controlTile min-height: 120px).
 */

export type { ControlTileProps } from './ControlTile.types';

const EMPTY_CONTROL_TILE_STYLE: CSSProperties = {};
const DEFAULT_CONTROL_TILE_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.MEDIUM);

function getStateFromVisualStateOverride(
  visualStateOverride: VisualState | undefined,
  fallbackState: State,
): State {
  switch (visualStateOverride) {
    case VisualState.FOCUSED:
      return State.FOCUSED;
    case VisualState.PRESSED:
      return State.PRESSED;
    case VisualState.DEFAULT:
    case VisualState.NONE:
      return State.DEFAULT;
    default:
      return fallbackState;
  }
}

function isDirectionalArrowKey(key: string): boolean {
  return (
    key === 'ArrowUp' ||
    key === 'ArrowDown' ||
    key === 'ArrowLeft' ||
    key === 'ArrowRight'
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * ControlTile component
 * Settings/toggle tile with icon, title, and optional progress bar.
 *
 * Key handling:
 * - Enter/Space: click (handled by Container)
 * - ArrowLeft/ArrowRight: decrement/increment when horizontal progress is shown
 */
export const ControlTile = memo(forwardRef<HTMLDivElement, ControlTileProps>(
  function ControlTile(
    {
      title,
      titleMaxLines = CONTROL_TILE_DEFAULT_TITLE_MAX_LINES,
      checked = null,
      icon,
      iconAnimationKey,
      animateIconChanges = false,
      animateProgressChanges = false,
      iconTintColor,
      checkedIconTintColor,
      iconContainerMaterial,
      checkedIconContainerMaterial,
      showCircularProgressBar = false,
      showHorizontalProgressBar = false,
      progress,
      lockFocus = false,
      onLockedFocusLost,
      onIncrement,
      onDecrement,
      onClick,
      material: materialProp,
      shapeProvider = DEFAULT_CONTROL_TILE_SHAPE_PROVIDER,
      disabled = false,
      style = EMPTY_CONTROL_TILE_STYLE,
      className = '',
      visualStateOverride,
      onStateChange,
      onKeyDown,
      onKeyUp,
      partialFocusSupportedAxis,
      ...containerProps
    },
    ref
  ) {
    const [interactionState, setInteractionState] = useState<State>(State.DEFAULT);
    const material = useMemo(
      () => materialProp ?? createControlTileMaterial(),
      [materialProp],
    );

    // ---- State change ----

    const handleStateChange = useCallback((prev: InteractionState, next: InteractionState) => {
      setInteractionState(next.state);
      if (
        lockFocus &&
        (prev.state === State.FOCUSED || prev.state === State.PRESSED) &&
        next.state === State.DEFAULT
      ) {
        onLockedFocusLost?.();
      }
      onStateChange?.(prev, next);
    }, [lockFocus, onLockedFocusLost, onStateChange]);
    const contentState = useMemo(
      () => getStateFromVisualStateOverride(visualStateOverride, interactionState),
      [interactionState, visualStateOverride],
    );

    // ---- Keyboard handling for progress ----

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        const isDirectionalArrow = isDirectionalArrowKey(event.key);
        const shouldHandleProgressKey = shouldHandleControlTileProgressKey({
          showHorizontalProgressBar,
          disabled,
        });

        if (
          shouldHandleProgressKey &&
          (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
        ) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        if (lockFocus && isDirectionalArrow) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        onKeyDown?.(event);
      },
      [
        disabled,
        lockFocus,
        onKeyDown,
        showHorizontalProgressBar,
      ]
    );
    const handleKeyUp = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        const isDirectionalArrow = isDirectionalArrowKey(event.key);
        const shouldHandleProgressKey = shouldHandleControlTileProgressKey({
          showHorizontalProgressBar,
          disabled,
        });

        if (
          shouldHandleProgressKey &&
          (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
        ) {
          event.preventDefault();
          event.stopPropagation();
          if (progress != null) {
            if (event.key === 'ArrowRight') {
              onIncrement?.(progress);
            } else {
              onDecrement?.(progress);
            }
          }
          return;
        }

        if (lockFocus && isDirectionalArrow) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        onKeyUp?.(event);
      },
      [
        disabled,
        lockFocus,
        onDecrement,
        onIncrement,
        onKeyUp,
        progress,
        showHorizontalProgressBar,
      ],
    );

    // ---- Mutual exclusion: only one progress mode active ----
    // Each setter disables the other. When both props are true,
    // horizontal takes priority.
    const progressMode = useMemo(
      () => getControlTileProgressMode({
        showHorizontalProgressBar,
        showCircularProgressBar,
      }),
      [showCircularProgressBar, showHorizontalProgressBar],
    );
    const effectiveShowHorizontal = progressMode === 'horizontal';
    const effectiveShowCircular = progressMode === 'circular';
    const hasProgressBar = hasControlTileProgressBar(progressMode);
    const defaultCheckedIconContainerMaterial = useMemo(
      MaterialLibrary.controlTileCheckedIcon,
      [],
    );
    const usesDefaultCheckedIconMaterial =
      checkedIconContainerMaterial === undefined;
    const effectiveCheckedIconContainerMaterial =
      usesDefaultCheckedIconMaterial
        ? defaultCheckedIconContainerMaterial
        : checkedIconContainerMaterial;
    const effectiveIconTintColor = useMemo(
      () => getControlTileIconTintColor({
        checked,
        iconTintColor,
        checkedIconTintColor,
        usesDefaultCheckedIconMaterial,
      }),
      [
        checked,
        checkedIconTintColor,
        iconTintColor,
        usesDefaultCheckedIconMaterial,
      ],
    );

    // ---- Icon background visibility ----
    // Visible when: (focused OR iconContainerMaterial OR checked) AND icon present AND NOT horizontal progress bar
    // Note: circular progress does NOT hide the icon background (only horizontal does)
    const showIconBackground = useMemo(() => {
      return shouldShowControlTileIconBackground({
        state: contentState,
        checked,
        hasIcon: icon != null,
        progressMode,
        hasIconContainerMaterial:
          iconContainerMaterial != null ||
          (checked === true && effectiveCheckedIconContainerMaterial != null),
      });
    }, [
      checked,
      effectiveCheckedIconContainerMaterial,
      contentState,
      icon,
      iconContainerMaterial,
      progressMode,
    ]);

    // ---- Icon sizing ----
    // hasProgressBar (either type) → 24px (--uit-icon-medium), else 32px (--uit-icon-large)
    const iconSize = useMemo(
      () => getControlTileIconSize(hasProgressBar),
      [hasProgressBar],
    );
    // Scale only applies to horizontal mode (icon scale is 1.099 for horizontal)
    const iconScale = useMemo(
      () => getControlTileIconScale(progressMode),
      [progressMode],
    );

    // ---- SliderBar state mapping ----
    const sliderBarState = useMemo((): SliderBarState => {
      return getControlTileSliderState({
        progressMode,
        state: contentState,
      });
    }, [contentState, progressMode]);

    // ---- Transitions ----
    const iconBackgroundTransition = useMemo(
      () => createTransition(
        'opacity',
        CONTROL_TILE_SPRING_DURATION,
        Interpolators.CONTAINER_SCALE
      ),
      [],
    );

    // ---- Icon background color ----
    const iconBackgroundStyle: CSSProperties = useMemo(
      () => getControlTileIconOverlayStyle({
        visible: showIconBackground,
        transition: iconBackgroundTransition,
      }),
      [iconBackgroundTransition, showIconBackground],
    );

    // ---- Accessibility ----
    const ariaState = useMemo(
      () => getControlTileAriaState({ title, checked, progress }),
      [checked, progress, title],
    );

    // ---- Container style ----
    // No fixed width/height — tile fills its parent via flex and uses min-height.
    // Parent container (e.g. a flex row with gap) determines actual tile width.
    const containerStyle: CSSProperties = useMemo(
      () => ({
        ...style,
      }),
      [style],
    );
    const rootClassName = useMemo(
      () => `${styles.controlTile} ${className}`,
      [className],
    );

    return (
      <Container
        ref={ref}
        className={rootClassName}
        style={containerStyle}
        material={material}
        shapeProvider={shapeProvider}
        disabled={disabled}
        visualStateOverride={visualStateOverride}
        onClick={onClick}
        onStateChange={handleStateChange}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        partialFocusSupportedAxis={
          lockFocus ? PartialFocusSupportedAxis.None : partialFocusSupportedAxis
        }
        /**
         * Smooth corners use ResizeObserver-measured dimensions for the SVG
         * clip path, so responsive width is supported. The first render
         * briefly uses CSS border-radius until measurement completes.
         *
         * The 72x72 icon container background uses border-radius: 50%
         * separately (visually equivalent to a smooth circle at that size).
         */
        role={ariaState.role}
        ariaLabel={ariaState.ariaLabel}
        aria-valuenow={ariaState.ariaValueNow}
        aria-valuemin={ariaState.ariaValueMin}
        aria-valuemax={ariaState.ariaValueMax}
        aria-checked={ariaState.ariaChecked}
        {...containerProps}
      >
        <ControlTileContent
          title={title}
          titleMaxLines={titleMaxLines}
          icon={icon}
          iconAnimationKey={iconAnimationKey}
          animateIconChanges={animateIconChanges}
          animateProgressChanges={animateProgressChanges}
          progress={progress}
          showCircularProgress={effectiveShowCircular}
          showHorizontalProgress={effectiveShowHorizontal}
          iconBackgroundStyle={iconBackgroundStyle}
          iconTintColor={effectiveIconTintColor}
          iconContainerMaterial={iconContainerMaterial}
          checked={checked}
          checkedIconContainerMaterial={effectiveCheckedIconContainerMaterial}
          iconSize={iconSize}
          iconScale={iconScale}
          sliderBarState={sliderBarState}
        />
      </Container>
    );
  }
));
