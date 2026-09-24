/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { PREPARING_ENTER_PHASE_SELECTOR } from '../navigation/PageTransitionPhase';

const FALLBACK_STABILIZATION_FRAMES = 10;
const SIZE_ANIMATION_PROPERTIES = ['width', 'height', 'inlineSize', 'blockSize'];
export const MANAGED_LAYOUT_TRANSITION_COMPLETE_EVENT =
  'uit-managed-layout-transition-complete';

interface StabilizationTask {
  remainingFrames: number;
  update: () => void;
}

const stabilizationTasks = new Map<object, StabilizationTask>();
let sharedStabilizationFrame = 0;

function runStabilizationFrame(): void {
  sharedStabilizationFrame = 0;
  stabilizationTasks.forEach((task, key) => {
    task.update();
    task.remainingFrames -= 1;
    if (task.remainingFrames <= 0) {
      stabilizationTasks.delete(key);
    }
  });

  if (stabilizationTasks.size > 0) {
    sharedStabilizationFrame = window.requestAnimationFrame(
      runStabilizationFrame,
    );
  }
}

function scheduleStabilization(key: object, update: () => void): void {
  stabilizationTasks.set(key, {
    remainingFrames: FALLBACK_STABILIZATION_FRAMES,
    update,
  });
  if (sharedStabilizationFrame === 0) {
    sharedStabilizationFrame = window.requestAnimationFrame(
      runStabilizationFrame,
    );
  }
}

function cancelStabilization(key: object): void {
  stabilizationTasks.delete(key);
  if (stabilizationTasks.size === 0 && sharedStabilizationFrame !== 0) {
    window.cancelAnimationFrame(sharedStabilizationFrame);
    sharedStabilizationFrame = 0;
  }
}

export interface MeasuredElementDimensions {
  w: number;
  h: number;
}

function getResizeObserverBorderBox(
  entry: ResizeObserverEntry | undefined,
): MeasuredElementDimensions | null {
  const borderBoxSize = entry?.borderBoxSize;
  if (borderBoxSize == null) {
    return null;
  }

  const box = Array.isArray(borderBoxSize) ? borderBoxSize[0] : borderBoxSize;
  if (box == null || box.inlineSize <= 0 || box.blockSize <= 0) {
    return null;
  }

  return {
    w: box.inlineSize,
    h: box.blockSize,
  };
}

function measureUntransformedBorderBox(
  el: HTMLElement,
  entry?: ResizeObserverEntry,
): MeasuredElementDimensions | null {
  const observerSize = getResizeObserverBorderBox(entry);
  if (observerSize != null) {
    return observerSize;
  }

  // Material paths are generated from layout bounds before view scale.
  // offsetWidth/Height match that untransformed border box; getBoundingClientRect
  // is only a fallback because it includes CSS transforms.
  if (el.offsetWidth > 0 && el.offsetHeight > 0) {
    return {
      w: el.offsetWidth,
      h: el.offsetHeight,
    };
  }

  const rect = el.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    return {
      w: rect.width,
      h: rect.height,
    };
  }

  return null;
}

function animationAffectsElementSize(animation: Animation): boolean {
  if (animation.playState === 'idle' || animation.playState === 'finished') {
    return false;
  }

  const effect = animation.effect as KeyframeEffect | null;
  if (effect == null || typeof effect.getKeyframes !== 'function') {
    return false;
  }

  return effect.getKeyframes().some((frame) =>
    SIZE_ANIMATION_PROPERTIES.some((property) =>
      Object.prototype.hasOwnProperty.call(frame, property),
    ),
  );
}

function getActiveSizeAnimations(el: HTMLElement): Animation[] {
  if (typeof el.getAnimations !== 'function') {
    return [];
  }

  return el.getAnimations().filter(animationAffectsElementSize);
}

function hasManagedLayoutTransition(el: HTMLElement): boolean {
  return el.dataset.uitLayoutTransitionActive === 'true';
}

function parsePx(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const match = value.trim().match(/^([0-9.]+)px$/);
  if (match == null) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getAnimationTargetDimensions(
  animation: Animation,
  fallback: MeasuredElementDimensions,
): MeasuredElementDimensions | null {
  const effect = animation.effect as KeyframeEffect | null;
  const keyframes = effect?.getKeyframes();
  const lastKeyframe = keyframes?.[keyframes.length - 1];
  if (lastKeyframe == null) {
    return null;
  }

  const width =
    parsePx(lastKeyframe.width) ??
    parsePx(lastKeyframe.inlineSize) ??
    fallback.w;
  const height =
    parsePx(lastKeyframe.height) ??
    parsePx(lastKeyframe.blockSize) ??
    fallback.h;

  return width > 0 && height > 0
    ? { w: width, h: height }
    : null;
}

function getActiveSizeAnimationTargetDimensions(
  el: HTMLElement,
  fallback: MeasuredElementDimensions,
): MeasuredElementDimensions | null {
  const animations = getActiveSizeAnimations(el);
  if (animations.length === 0) {
    return null;
  }

  for (let index = animations.length - 1; index >= 0; index -= 1) {
    const target = getAnimationTargetDimensions(animations[index], fallback);
    if (target != null) {
      return target;
    }
  }

  return null;
}

export function useMeasuredElementDimensions<T extends HTMLElement>(
  elementRef: RefObject<T | null>,
): MeasuredElementDimensions | null {
  const [measuredDims, setMeasuredDims] = useState<MeasuredElementDimensions | null>(null);
  const measuredDimsRef = useRef<MeasuredElementDimensions | null>(null);

  useLayoutEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    const element = el;

    let animationFrame = 0;
    let disposed = false;
    let observerHasReported = false;
    const stabilizationKey = {};

    function commitSize(size: MeasuredElementDimensions): void {
      const prev = measuredDimsRef.current;
      if (prev?.w === size.w && prev?.h === size.h) {
        return;
      }

      measuredDimsRef.current = size;
      setMeasuredDims(size);
    }

    function scheduleUpdateSize(entry?: ResizeObserverEntry) {
      if (hasManagedLayoutTransition(element)) {
        return;
      }

      const observerSize = getResizeObserverBorderBox(entry);
      const activeAnimationTarget = observerSize == null
        ? null
        : getActiveSizeAnimationTargetDimensions(element, observerSize);
      if (activeAnimationTarget != null) {
        commitSize(activeAnimationTarget);
        return;
      }

      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => updateSize(entry));
    }
    function updateSize(entry?: ResizeObserverEntry) {
      if (hasManagedLayoutTransition(element)) {
        return;
      }

      const size = measureUntransformedBorderBox(element, entry);
      if (size != null) {
        commitSize(getActiveSizeAnimationTargetDimensions(element, size) ?? size);
      }
    }
    const handleManagedLayoutTransitionComplete = () => {
      window.cancelAnimationFrame(animationFrame);
      updateSize();
    };

    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver((entries) => {
          observerHasReported = true;
          cancelStabilization(stabilizationKey);
          scheduleUpdateSize(entries[0]);
        });
    observer?.observe(element, { box: 'border-box' });
    element.addEventListener(
      MANAGED_LAYOUT_TRANSITION_COMPLETE_EVENT,
      handleManagedLayoutTransitionComplete,
    );
    // Incoming PageTransition content starts at a raster-warm near-zero opacity
    // and cannot animate visibly until PageTransition's later preparation frame.
    // The shared stabilization frame remains scheduled when the phase advances;
    // if the page unmounts first, cleanup cancels it because no surface remains.
    // This moves forced layout out of the route-mount task without exposing an
    // unmeasured material during the visible transition.
    if (element.closest(PREPARING_ENTER_PHASE_SELECTOR) == null) {
      updateSize();
    }
    scheduleStabilization(stabilizationKey, updateSize);
    void document.fonts?.ready.then(() => {
      if (!disposed) {
        // Fonts can resolve while the page is still hidden in its preparation
        // phase. Forcing layout here would reintroduce exactly the work the
        // deferral above removes from those frames, so stay deferred and let
        // the stabilization frame measure once the phase advances. Once the
        // observer has reported, the element is live and a font-driven remeasure
        // is worth doing immediately.
        if (
          observerHasReported ||
          element.closest(PREPARING_ENTER_PHASE_SELECTOR) == null
        ) {
          scheduleUpdateSize();
        }
        if (!observerHasReported) {
          scheduleStabilization(stabilizationKey, updateSize);
        }
      }
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      cancelStabilization(stabilizationKey);
      element.removeEventListener(
        MANAGED_LAYOUT_TRANSITION_COMPLETE_EVENT,
        handleManagedLayoutTransitionComplete,
      );
      observer?.disconnect();
    };
  }, [elementRef]);

  return measuredDims;
}
