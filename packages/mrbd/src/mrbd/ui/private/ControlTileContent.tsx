/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  SpringConfigs,
  SpringIntegrator,
} from '@wearables-ui-toolkit/foundation/motion/Animations';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { ContainerMaterial } from '@wearables-ui-toolkit/foundation';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import {
  IconTintColor,
  getIconTintBlendMode,
  getIconTintCSSVariable,
} from '../IconTintColor';
import { CircularProgressBar } from '../CircularProgressBar';
import {
  CONTROL_TILE_CIRCULAR_PROGRESS_MARGIN,
  CONTROL_TILE_CIRCULAR_PROGRESS_STROKE_WIDTH,
  CONTROL_TILE_ICON_CONTAINER_SIZE,
} from './ControlTileMetrics';
import { SliderBarState } from '../SliderBar';
import { SliderBarInternal } from './SliderBarInternal';
import styles from '../ControlTile.module.css';

const ICON_CONTAINER_BACKGROUND_STYLE: CSSProperties = {
  width: CONTROL_TILE_ICON_CONTAINER_SIZE,
  height: CONTROL_TILE_ICON_CONTAINER_SIZE,
};
const CIRCULAR_PROGRESS_WRAPPER_STYLE: CSSProperties = {
  position: 'absolute',
  top: CONTROL_TILE_CIRCULAR_PROGRESS_MARGIN,
  left: CONTROL_TILE_CIRCULAR_PROGRESS_MARGIN,
  right: CONTROL_TILE_CIRCULAR_PROGRESS_MARGIN,
  bottom: CONTROL_TILE_CIRCULAR_PROGRESS_MARGIN,
};
const CONTROL_TILE_ANIMATED_VIEW_IN_MIN = 0.5;
const CONTROL_TILE_ANIMATED_VIEW_IN_MAX = 1;
const CONTROL_TILE_ICON_SWAP_MIN_SCALE = 0.5;
const CONTROL_TILE_ICON_SWAP_MAX_STEP_SECONDS = 1 / 30;
const CONTROL_TILE_ICON_SWAP_MAX_DURATION_MS = 1000;
const CONTROL_TILE_ICON_MATERIAL_SCALE = () => 1;
const CONTROL_TILE_ICON_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.FULL);

interface ControlTileContentProps {
  title?: string;
  titleMaxLines: number;
  icon?: IconSource;
  iconAnimationKey?: string | number;
  animateIconChanges?: boolean;
  animateProgressChanges?: boolean;
  progress?: number;
  showCircularProgress: boolean;
  showHorizontalProgress: boolean;
  iconBackgroundStyle: CSSProperties;
  iconTintColor?: IconTintColor;
  iconContainerMaterial?: ContainerMaterial | null;
  checked?: boolean | null;
  checkedIconContainerMaterial?: ContainerMaterial | null;
  iconSize: number;
  iconScale: number;
  sliderBarState: SliderBarState;
}

function getSwapAlpha(progress: number): number {
  return progress < 0.5
    ? 1 - progress * 2
    : (progress - 0.5) * 2;
}

function getRestartProgressFromSwapAlpha(alpha: number): number {
  return alpha <= 0
    ? 0.5
    : (1 - alpha) / 2;
}

function getAnimatedViewAlpha(progress: number): number {
  if (progress <= CONTROL_TILE_ANIMATED_VIEW_IN_MIN) {
    return 0;
  }
  if (progress >= CONTROL_TILE_ANIMATED_VIEW_IN_MAX) {
    return 1;
  }

  return (
    (progress - CONTROL_TILE_ANIMATED_VIEW_IN_MIN) /
    (CONTROL_TILE_ANIMATED_VIEW_IN_MAX - CONTROL_TILE_ANIMATED_VIEW_IN_MIN)
  );
}

function multiplyOpacity(
  opacity: CSSProperties['opacity'],
  multiplier: number,
): number {
  if (opacity == null) {
    return multiplier;
  }

  const numericOpacity = typeof opacity === 'number'
    ? opacity
    : Number(opacity);
  return Number.isFinite(numericOpacity)
    ? numericOpacity * multiplier
    : multiplier;
}

/**
 * This spring loop calls setState every frame (~60x/sec), which
 * re-renders the memoized ControlTileContent subtree to recompute the derived
 * opacity/transform. The produced visuals are correct — this is a performance
 * concern, not a visual gap. The established convention here (see
 * Container.createRootInteractionParticipant) is to keep the spring math in the
 * rAF loop but apply per-frame results by writing element.style.transform /
 * opacity directly to the icon/overlay refs, so animation does not re-render the
 * subtree. Migrating this loop to that ref-driven pattern is the remaining work;
 * it changes no pixels, so it is deferred to a perf pass rather than risked here.
 */
function useControlTileSpringValue(
  targetValue: number,
  animated: boolean,
): number {
  const [value, setValue] = useState(targetValue);
  const valueRef = useRef(targetValue);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (animationFrameRef.current != null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (!animated) {
      valueRef.current = targetValue;
      setValue(targetValue);
      return undefined;
    }

    const startValue = valueRef.current;
    const spring = new SpringIntegrator(SpringConfigs.CONTROL_TILE_ICON_SWAP);
    spring.setTarget(targetValue, startValue);
    let lastFrameTime = performance.now();
    const startTime = lastFrameTime;

    const tick = (now: number) => {
      const deltaSeconds = Math.min(
        Math.max((now - lastFrameTime) / 1000, 0),
        CONTROL_TILE_ICON_SWAP_MAX_STEP_SECONDS,
      );
      lastFrameTime = now;

      const nextValue = spring.step(deltaSeconds);
      valueRef.current = nextValue;
      setValue(nextValue);

      if (
        now - startTime < CONTROL_TILE_ICON_SWAP_MAX_DURATION_MS &&
        !spring.isAtEquilibrium(startValue, targetValue)
      ) {
        animationFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        valueRef.current = targetValue;
        setValue(targetValue);
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current != null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [animated, targetValue]);

  return value;
}

/**
 * Render-only portion of ControlTile's view hierarchy.
 * ControlTile owns behavior; this component owns the icon, progress, and
 * title/slider frame so the layout can be validated independently.
 */
export const ControlTileContent = memo(function ControlTileContent({
  title,
  titleMaxLines,
  icon,
  iconAnimationKey,
  animateIconChanges = false,
  animateProgressChanges = false,
  progress,
  showCircularProgress,
  showHorizontalProgress,
  iconBackgroundStyle,
  iconTintColor,
  iconContainerMaterial,
  checked,
  checkedIconContainerMaterial,
  iconSize,
  iconScale,
  sliderBarState,
}: ControlTileContentProps) {
  const [displayedIcon, setDisplayedIcon] = useState(icon);
  const [iconSwapProgress, setIconSwapProgress] = useState(1);
  const displayedIconKeyRef = useRef(iconAnimationKey);
  const iconSwapAnimationFrameRef = useRef<number | null>(null);
  const iconSwapProgressRef = useRef(1);

  useEffect(() => {
    if (iconSwapAnimationFrameRef.current != null) {
      window.cancelAnimationFrame(iconSwapAnimationFrameRef.current);
      iconSwapAnimationFrameRef.current = null;
    }

    if (!animateIconChanges || iconAnimationKey == null) {
      displayedIconKeyRef.current = iconAnimationKey;
      setDisplayedIcon(icon);
      iconSwapProgressRef.current = 1;
      setIconSwapProgress(1);
      return undefined;
    }

    if (displayedIconKeyRef.current === iconAnimationKey) {
      setDisplayedIcon(icon);
      iconSwapProgressRef.current = 1;
      setIconSwapProgress(1);
      return undefined;
    }

    const startAlpha = getSwapAlpha(iconSwapProgressRef.current);
    const startProgress = getRestartProgressFromSwapAlpha(startAlpha);
    const spring = new SpringIntegrator(SpringConfigs.CONTROL_TILE_ICON_SWAP);
    spring.setTarget(1, startProgress);
    let hasSwappedIcon = startProgress >= 0.5;
    let lastFrameTime = performance.now();
    const startTime = lastFrameTime;
    iconSwapProgressRef.current = startProgress;
    setIconSwapProgress(startProgress);
    if (hasSwappedIcon) {
      displayedIconKeyRef.current = iconAnimationKey;
      setDisplayedIcon(icon);
    }

    const tick = (now: number) => {
      const deltaSeconds = Math.min(
        Math.max((now - lastFrameTime) / 1000, 0),
        CONTROL_TILE_ICON_SWAP_MAX_STEP_SECONDS,
      );
      lastFrameTime = now;

      const nextProgress = spring.step(deltaSeconds);
      iconSwapProgressRef.current = nextProgress;

      if (!hasSwappedIcon && nextProgress >= 0.5) {
        hasSwappedIcon = true;
        displayedIconKeyRef.current = iconAnimationKey;
        setDisplayedIcon(icon);
      }

      setIconSwapProgress(nextProgress);

      if (
        now - startTime < CONTROL_TILE_ICON_SWAP_MAX_DURATION_MS &&
        !spring.isAtEquilibrium(startProgress, 1)
      ) {
        iconSwapAnimationFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        if (!hasSwappedIcon) {
          displayedIconKeyRef.current = iconAnimationKey;
          setDisplayedIcon(icon);
        }
        iconSwapProgressRef.current = 1;
        setIconSwapProgress(1);
        iconSwapAnimationFrameRef.current = null;
      }
    };

    iconSwapAnimationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (iconSwapAnimationFrameRef.current != null) {
        window.cancelAnimationFrame(iconSwapAnimationFrameRef.current);
        iconSwapAnimationFrameRef.current = null;
      }
    };
  }, [animateIconChanges, icon, iconAnimationKey]);

  const horizontalProgress = useControlTileSpringValue(
    showHorizontalProgress ? 1 : 0,
    animateProgressChanges,
  );
  const circularProgressVisibility = useControlTileSpringValue(
    showCircularProgress ? 1 : 0,
    animateProgressChanges,
  );
  const animatedIconScale = useControlTileSpringValue(
    iconScale,
    animateProgressChanges,
  );
  const nonHorizontalAlpha = getAnimatedViewAlpha(1 - horizontalProgress);
  const horizontalAlpha = getAnimatedViewAlpha(horizontalProgress);
  const circularProgressAlpha =
    getAnimatedViewAlpha(circularProgressVisibility);
  const checkedProgress = checked === true ? 1 : 0;
  const normalBackgroundOpacity = checkedIconContainerMaterial != null
    ? 1 - checkedProgress
    : 1;
  const iconBaseBackgroundStyle = useMemo<CSSProperties>(
    () => ({
      opacity: nonHorizontalAlpha,
      pointerEvents: nonHorizontalAlpha > 0 ? undefined : 'none',
    }),
    [nonHorizontalAlpha],
  );
  const iconOverlayBackgroundStyle = useMemo<CSSProperties>(
    () => ({
      ...iconBackgroundStyle,
      opacity:
        multiplyOpacity(iconBackgroundStyle.opacity, nonHorizontalAlpha) *
        normalBackgroundOpacity,
      transition: iconBackgroundStyle.transition,
    }),
    [iconBackgroundStyle, nonHorizontalAlpha, normalBackgroundOpacity],
  );
  const iconMaterialBackgroundStyle = useMemo<CSSProperties>(
    () => ({
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      overflow: 'hidden',
      opacity: nonHorizontalAlpha * normalBackgroundOpacity,
      pointerEvents: nonHorizontalAlpha > 0 ? undefined : 'none',
      transition: iconBackgroundStyle.transition,
    }),
    [iconBackgroundStyle.transition, nonHorizontalAlpha, normalBackgroundOpacity],
  );
  const checkedIconMaterialBackgroundStyle = useMemo<CSSProperties>(
    () => ({
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      overflow: 'hidden',
      opacity: nonHorizontalAlpha * checkedProgress,
      pointerEvents: nonHorizontalAlpha > 0 ? undefined : 'none',
      transition: iconBackgroundStyle.transition,
    }),
    [checkedProgress, iconBackgroundStyle.transition, nonHorizontalAlpha],
  );
  const iconSwapAlpha = animateIconChanges
    ? getSwapAlpha(iconSwapProgress)
    : 1;
  const iconSwapOpacity = Math.max(0, Math.min(iconSwapAlpha, 1));
  const iconSwapScale = CONTROL_TILE_ICON_SWAP_MIN_SCALE + iconSwapAlpha / 2;
  const iconImageStyle = useMemo<CSSProperties>(
    () => {
      const tint = iconTintColor ?? IconTintColor.PRIMARY;
      return {
        color: getIconTintCSSVariable(tint),
        mixBlendMode: getIconTintBlendMode(tint),
        opacity: iconSwapOpacity,
        width: iconSize,
        height: iconSize,
        transform: `scale(${animatedIconScale * iconSwapScale})`,
      };
    },
    [
      animatedIconScale,
      iconSize,
      iconSwapOpacity,
      iconSwapScale,
      iconTintColor,
    ],
  );
  const titleStyle = useMemo<CSSProperties>(
    () => ({
      opacity: nonHorizontalAlpha,
      pointerEvents: nonHorizontalAlpha > 0 ? undefined : 'none',
      WebkitLineClamp: titleMaxLines,
    }),
    [nonHorizontalAlpha, titleMaxLines],
  );
  const circularProgressStyle = useMemo<CSSProperties>(
    () => ({
      ...CIRCULAR_PROGRESS_WRAPPER_STYLE,
      opacity: circularProgressAlpha,
      pointerEvents: circularProgressAlpha > 0 ? undefined : 'none',
    }),
    [circularProgressAlpha],
  );
  const sliderContainerStyle = useMemo<CSSProperties>(
    () => ({
      opacity: horizontalAlpha,
      pointerEvents: horizontalAlpha > 0 ? undefined : 'none',
    }),
    [horizontalAlpha],
  );
  const progressAccessibleLabel = title?.trim() || 'Progress';
  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <div
          className={styles.iconContainerBackground}
          style={ICON_CONTAINER_BACKGROUND_STYLE}
        >
          <div
            className={styles.iconBaseBackground}
            style={iconBaseBackgroundStyle}
          />
          {iconContainerMaterial != null ? (
            <Container
              className={styles.iconMaterialBackground}
              material={iconContainerMaterial}
              shapeProvider={CONTROL_TILE_ICON_SHAPE_PROVIDER}
              visualStateOverride={VisualState.FOCUSED}
              width="100%"
              height="100%"
              interactive={false}
              focusable={false}
              pressable={false}
              clickable={false}
              tabIndex={-1}
              contentScaleForStateFn={CONTROL_TILE_ICON_MATERIAL_SCALE}
              style={iconMaterialBackgroundStyle}
            />
          ) : (
            <div
              className={styles.iconOverlayBackground}
              style={iconOverlayBackgroundStyle}
            />
          )}
          {checkedIconContainerMaterial != null && (
            <Container
              className={styles.iconMaterialBackground}
              material={checkedIconContainerMaterial}
              shapeProvider={CONTROL_TILE_ICON_SHAPE_PROVIDER}
              visualStateOverride={VisualState.FOCUSED}
              width="100%"
              height="100%"
              interactive={false}
              focusable={false}
              pressable={false}
              clickable={false}
              tabIndex={-1}
              contentScaleForStateFn={CONTROL_TILE_ICON_MATERIAL_SCALE}
              style={checkedIconMaterialBackgroundStyle}
            />
          )}
          {progress != null && (
            <div
              className={styles.circularProgressWrapper}
              style={circularProgressStyle}
              aria-hidden={circularProgressAlpha === 0}
            >
              <CircularProgressBar
                progress={progress}
                size={
                  CONTROL_TILE_ICON_CONTAINER_SIZE -
                  CONTROL_TILE_CIRCULAR_PROGRESS_MARGIN * 2
                }
                strokeWidthPx={CONTROL_TILE_CIRCULAR_PROGRESS_STROKE_WIDTH}
              />
            </div>
          )}
          {displayedIcon != null && (
            <div
              className={styles.iconImageView}
              style={iconImageStyle}
            >
              <IconImage source={displayedIcon} />
            </div>
          )}
        </div>

        <div className={styles.contentRight}>
          {title && (
            <div
              className={styles.titleText}
              style={titleStyle}
            >
              {title}
            </div>
          )}

          {progress != null && (
            <div
              className={styles.sliderBarContainer}
              style={sliderContainerStyle}
              role="slider"
              aria-label={progressAccessibleLabel}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-hidden={horizontalAlpha === 0}
            >
              <SliderBarInternal
                value={progress}
                state={sliderBarState}
                presentational
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
