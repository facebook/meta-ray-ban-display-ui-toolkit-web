/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Surface component
 */

import {
  forwardRef,
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { usePlatform } from '../app/PlatformContext';
import { InteractableBase } from '../base/InteractableBase';
import { FastScrollTracker } from '../base/InteractableFastScrollTracker';
import {
  InteractionState,
  State,
  type StateTransition,
} from '../base/Interactions';
import {
  createTransition,
  getAnimationConfigForStateChange,
} from '../motion/Animations';
import {
  useMeasuredElementDimensions,
  type MeasuredElementDimensions,
} from '../utils/useMeasuredElementDimensions';
import { useComposedRef } from '../utils/useComposedRef';
import {
  getSurfaceContentScale,
  getSurfaceInnerShadowAlpha,
  resolveSurfaceSize,
} from './private/SurfaceLayout';
import {
  SurfaceCornerRadius,
  getSurfaceCornerRadiusPx,
  type SurfaceProps,
} from './Surface.types';
import styles from './Surface.module.css';

export {
  SurfaceCornerRadius,
  getSurfaceCornerRadiusPx,
} from './Surface.types';
export type { SurfaceProps } from './Surface.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * Surface component
 * Interactive control basis with smooth corners, background, and inner shadow effects.
 */
export const Surface = memo(forwardRef<HTMLDivElement, SurfaceProps>(
  function Surface(
    {
      children,
      cornerRadius = SurfaceCornerRadius.XSMALL,
      drawBackground = true,
      width = 'auto',
      height = 'auto',
      contentScaleForStateFn,
      disabled = false,
      style = DEFAULT_STYLE,
      className = '',
      onStateChange,
      ...interactableProps
    },
    ref,
  ) {
    const platform = usePlatform();
    const [currentState, setCurrentState] = useState<State>(State.DEFAULT);
    const [transition, setTransition] = useState<StateTransition | null>(null);

    // Measure the real rendered size so the content "breathing" scale tracks the
    // actual element width for auto/percentage sizes, instead of a fabricated
    // fallback. The forwarded ref is merged in below.
    const measureRef = useRef<HTMLDivElement>(null);
    const measured = useMeasuredElementDimensions(measureRef);
    // The measured size resolves asynchronously (initial layout, font settling,
    // ResizeObserver) after mount, which shifts the resting content scale. That
    // shift must be applied instantly: it is a size resolution, not a user
    // interaction, so it must never ride the state-change transition (otherwise a
    // component visibly animate-expands from its unmeasured scale to its resting
    // scale on first appearance). This ref lets the scale transition be forced
    // off on any render whose scale change is measurement-driven.
    //
    // The previously-committed measured size is tracked in a ref updated ONLY in
    // a commit-phase effect (never during render). A render-phase ref write would
    // be corrupted by StrictMode/concurrent double or discarded renders — the
    // discarded render would advance the ref so the committed render sees a stale
    // value and misses the measurement change. Comparing against the last
    // committed value guarantees the committed render after a measured-size change
    // always reports isMeasurementDrivenRender=true.
    const prevCommittedMeasuredRef = useRef<MeasuredElementDimensions | null>(null);
    const isMeasurementDrivenRender =
      prevCommittedMeasuredRef.current?.w !== measured?.w ||
      prevCommittedMeasuredRef.current?.h !== measured?.h;
    useLayoutEffect(() => {
      prevCommittedMeasuredRef.current = measured;
    }, [measured]);
    const setRefs = useComposedRef(ref, measureRef);

    const handleStateChange = useCallback(
      (prevInteraction: InteractionState, newInteraction: InteractionState): void => {
        setCurrentState(newInteraction.state);
        setTransition({
          from: prevInteraction.state,
          to: newInteraction.state,
          isFastScrolling: FastScrollTracker.isCurrentlyFastScrolling,
        });
        onStateChange?.(prevInteraction, newInteraction);
      },
      [onStateChange],
    );

    const containerSize = useMemo(
      () => resolveSurfaceSize(width, height, measured),
      [height, width, measured],
    );

    const contentScale = useMemo(
      () => getSurfaceContentScale(
        platform,
        currentState,
        containerSize,
        contentScaleForStateFn,
      ),
      [containerSize, contentScaleForStateFn, currentState, platform],
    );

    const innerShadowAlpha = useMemo(
      () => getSurfaceInnerShadowAlpha(currentState),
      [currentState],
    );

    // The duration + interpolator are chosen per transition (press-in 80ms,
    // press-out 100ms, otherwise 300ms) and the same timing is applied to both
    // the scale and the inner-shadow alpha.
    const { scaleTransition, opacityTransition } = useMemo(() => {
      if (transition == null) {
        return { scaleTransition: 'none', opacityTransition: 'none' };
      }
      const { duration, interpolator } = getAnimationConfigForStateChange(transition);
      return {
        scaleTransition: createTransition('transform', duration, interpolator),
        opacityTransition: createTransition('opacity', duration, interpolator),
      };
    }, [transition]);

    // A measurement-driven scale change (resting content scale shifting as the
    // real size resolves) is applied instantly, never animated. Only an
    // interaction state change may animate the scale.
    const effectiveScaleTransition = isMeasurementDrivenRender
      ? 'none'
      : scaleTransition;

    const borderRadiusPx = `${getSurfaceCornerRadiusPx(cornerRadius)}px`;

    const surfaceStyle = useMemo<CSSProperties>(
      () => ({
        position: 'relative',
        width,
        height,
        borderRadius: borderRadiusPx,
        overflow: 'hidden',
        opacity: disabled
          ? 'var(--uit-disabled-opacity)'
          : 'var(--uit-enabled-opacity)',
        transform: `scale(${contentScale})`,
        transition: effectiveScaleTransition,
        ...style,
      }),
      [
        borderRadiusPx,
        contentScale,
        disabled,
        effectiveScaleTransition,
        height,
        style,
        width,
      ],
    );

    const backgroundLayerStyle = useMemo<CSSProperties>(
      () => ({
        borderRadius: borderRadiusPx,
        display: drawBackground ? undefined : 'none',
      }),
      [borderRadiusPx, drawBackground],
    );

    const innerShadowFocusedStyle = useMemo<CSSProperties>(
      () => ({
        borderRadius: borderRadiusPx,
        opacity: innerShadowAlpha.focused,
        transition: opacityTransition,
      }),
      [borderRadiusPx, innerShadowAlpha.focused, opacityTransition],
    );

    const innerShadowPressedStyle = useMemo<CSSProperties>(
      () => ({
        borderRadius: borderRadiusPx,
        opacity: innerShadowAlpha.pressed,
        transition: opacityTransition,
      }),
      [borderRadiusPx, innerShadowAlpha.pressed, opacityTransition],
    );

    const surfaceClassName = useMemo(
      () => `${styles.surface} ${className}`,
      [className],
    );

    return (
      <InteractableBase
        ref={setRefs}
        className={surfaceClassName}
        style={surfaceStyle}
        disabled={disabled}
        onStateChange={handleStateChange}
        {...interactableProps}
      >
        <div
          className={styles.backgroundLayer}
          style={backgroundLayerStyle}
          aria-hidden="true"
        />

        <div className={styles.contentWrapper}>
          {children}
        </div>

        <div
          className={styles.innerShadowFocused}
          style={innerShadowFocusedStyle}
          aria-hidden="true"
        />

        <div
          className={styles.innerShadowPressed}
          style={innerShadowPressedStyle}
          aria-hidden="true"
        />
      </InteractableBase>
    );
  },
));
