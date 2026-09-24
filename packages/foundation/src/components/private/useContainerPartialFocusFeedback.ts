/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import type {
  InvalidFocusDirection,
  PartialFocusHandoffDetail,
  PartialFocusHandoffRect,
} from '../../base/InteractableBase';
import { PartialFocusSupportedAxis } from '../../base/InteractableBase';
import type { PartialFocusPosition } from '../../material/ContainerMaterial';
import {
  SpringConfigs,
  SpringIntegrator,
  cubicBezierY,
} from '../../motion/Animations';

export interface UseContainerPartialFocusFeedbackParams {
  containerRef: RefObject<HTMLElement | null>;
  onPartialFocusHandoff?: (detail: PartialFocusHandoffDetail) => void;
  partialFocusSupportedAxis: PartialFocusSupportedAxis;
  isRubberbandTranslationEnabled: boolean;
}

export interface ContainerPartialFocusFeedback {
  partialFocusPosition: PartialFocusPosition;
  partialFocusTranslationX: number;
  partialFocusTranslationY: number;
  handlePartialFocusHandoff: (detail: PartialFocusHandoffDetail) => void;
  startRubberbandAnimation: (direction: InvalidFocusDirection) => void;
}

const MAX_HORIZONTAL_PARTIAL_FOCUS_OFFSET = 8;
const MAX_VERTICAL_PARTIAL_FOCUS_OFFSET = 4;
const PARTIAL_FOCUS_RUBBERBAND_SCALE = 0.5;
const RUBBERBAND_STAGE_DURATION_MS = 150;
const RUBBERBAND_STAGE_ONE_POINTS = [0.33, 1, 0.68, 1] as const;
const RUBBERBAND_STAGE_TWO_POINTS = [0.11, 0, 0.5, 0] as const;
const PARTIAL_FOCUS_HANDOFF_MAX_DURATION_MS = 750;
const PARTIAL_FOCUS_HANDOFF_MAX_STEP_SECONDS = 1 / 30;

export const ZERO_PARTIAL_FOCUS_POSITION: PartialFocusPosition = { x: 0, y: 0 };

function supportsPartialFocusXAxis(axis: PartialFocusSupportedAxis): boolean {
  return axis === PartialFocusSupportedAxis.XY || axis === PartialFocusSupportedAxis.X;
}

function supportsPartialFocusYAxis(axis: PartialFocusSupportedAxis): boolean {
  return axis === PartialFocusSupportedAxis.XY || axis === PartialFocusSupportedAxis.Y;
}

function isRubberbandDirectionSupported(
  axis: PartialFocusSupportedAxis,
  direction: InvalidFocusDirection,
): boolean {
  return direction === 'left' || direction === 'right'
    ? supportsPartialFocusXAxis(axis)
    : supportsPartialFocusYAxis(axis);
}

function constrainPartialFocusPositionForAxis(
  position: PartialFocusPosition,
  axis: PartialFocusSupportedAxis,
): PartialFocusPosition {
  return {
    x: supportsPartialFocusXAxis(axis) ? position.x : 0,
    y: supportsPartialFocusYAxis(axis) ? position.y : 0,
  };
}

function clampPartialFocusOffset(value: number): number {
  return Math.max(-0.5, Math.min(0.5, value));
}

function rectCenterX(rect: PartialFocusHandoffRect | DOMRect): number {
  return rect.left + rect.width / 2;
}

function rectCenterY(rect: PartialFocusHandoffRect | DOMRect): number {
  return rect.top + rect.height / 2;
}

function rubberbandDestinationForDirection(
  direction: InvalidFocusDirection,
): PartialFocusPosition {
  switch (direction) {
    case 'up':
      return {
        x: 0,
        y:
          (-4 / MAX_VERTICAL_PARTIAL_FOCUS_OFFSET) *
          PARTIAL_FOCUS_RUBBERBAND_SCALE,
      };
    case 'down':
      return {
        x: 0,
        y:
          (4 / MAX_VERTICAL_PARTIAL_FOCUS_OFFSET) *
          PARTIAL_FOCUS_RUBBERBAND_SCALE,
      };
    case 'left':
      return {
        x:
          (-4 / MAX_HORIZONTAL_PARTIAL_FOCUS_OFFSET) *
          PARTIAL_FOCUS_RUBBERBAND_SCALE,
        y: 0,
      };
    case 'right':
      return {
        x:
          (4 / MAX_HORIZONTAL_PARTIAL_FOCUS_OFFSET) *
          PARTIAL_FOCUS_RUBBERBAND_SCALE,
        y: 0,
      };
  }
}

function offsetTowardRect(
  selfRect: DOMRect,
  otherRect: PartialFocusHandoffRect,
  partialFocusSupportedAxis: PartialFocusSupportedAxis,
): PartialFocusPosition {
  if (selfRect.width <= 0 || selfRect.height <= 0) {
    return ZERO_PARTIAL_FOCUS_POSITION;
  }

  const focusCenterX = rectCenterX(selfRect);
  const focusCenterY = rectCenterY(selfRect);
  const directionX = rectCenterX(otherRect) - focusCenterX;
  const directionY = rectCenterY(otherRect) - focusCenterY;
  const halfWidth = selfRect.width / 2;
  const halfHeight = selfRect.height / 2;
  const scaleX = directionX === 0 ? Number.MAX_VALUE : halfWidth / Math.abs(directionX);
  const scaleY = directionY === 0 ? Number.MAX_VALUE : halfHeight / Math.abs(directionY);
  const scale = Math.min(scaleX, scaleY, 1);
  const localX = halfWidth + directionX * scale;
  const localY = halfHeight + directionY * scale;

  return constrainPartialFocusPositionForAxis(
    {
      x: clampPartialFocusOffset((localX - halfWidth) / selfRect.width),
      y: clampPartialFocusOffset((localY - halfHeight) / selfRect.height),
    },
    partialFocusSupportedAxis,
  );
}

export function useContainerPartialFocusFeedback({
  containerRef,
  onPartialFocusHandoff,
  partialFocusSupportedAxis,
  isRubberbandTranslationEnabled,
}: UseContainerPartialFocusFeedbackParams): ContainerPartialFocusFeedback {
  const rubberbandAnimationFrameRef = useRef<number | null>(null);
  const partialFocusHandoffAnimationFrameRef = useRef<number | null>(null);
  const rubberbandRunningRef = useRef(false);
  const [partialFocusPosition, setPartialFocusPosition] =
    useState<PartialFocusPosition>(ZERO_PARTIAL_FOCUS_POSITION);
  const partialFocusPositionRef = useRef<PartialFocusPosition>(ZERO_PARTIAL_FOCUS_POSITION);
  const [partialFocusAppliesTranslation, setPartialFocusAppliesTranslation] = useState(false);

  useEffect(() => {
    return () => {
      if (rubberbandAnimationFrameRef.current != null) {
        window.cancelAnimationFrame(rubberbandAnimationFrameRef.current);
      }
      if (partialFocusHandoffAnimationFrameRef.current != null) {
        window.cancelAnimationFrame(partialFocusHandoffAnimationFrameRef.current);
      }
    };
  }, []);

  const updatePartialFocusPosition = useCallback((
    nextPosition: PartialFocusPosition,
  ) => {
    partialFocusPositionRef.current = nextPosition;
    setPartialFocusPosition(current =>
      current.x === nextPosition.x && current.y === nextPosition.y ? current : nextPosition,
    );
  }, []);

  const cancelPartialFocusHandoffAnimation = useCallback(() => {
    if (partialFocusHandoffAnimationFrameRef.current != null) {
      window.cancelAnimationFrame(partialFocusHandoffAnimationFrameRef.current);
      partialFocusHandoffAnimationFrameRef.current = null;
    }
  }, []);

  const animatePartialFocusPosition = useCallback((
    from: PartialFocusPosition,
    to: PartialFocusPosition,
  ) => {
    cancelPartialFocusHandoffAnimation();

    if (from.x === to.x && from.y === to.y) {
      updatePartialFocusPosition(to);
      return;
    }

    const xSpring = new SpringIntegrator(SpringConfigs.PARTIAL_FOCUS_HANDOFF);
    const ySpring = new SpringIntegrator(SpringConfigs.PARTIAL_FOCUS_HANDOFF);
    xSpring.setTarget(to.x, from.x);
    ySpring.setTarget(to.y, from.y);

    let lastFrameTime = performance.now();
    const startTime = lastFrameTime;

    const tick = (now: number) => {
      const deltaSeconds = Math.min(
        Math.max((now - lastFrameTime) / 1000, 0),
        PARTIAL_FOCUS_HANDOFF_MAX_STEP_SECONDS,
      );
      lastFrameTime = now;

      const nextPosition = {
        x: xSpring.step(deltaSeconds),
        y: ySpring.step(deltaSeconds),
      };
      updatePartialFocusPosition(nextPosition);

      if (
        now - startTime < PARTIAL_FOCUS_HANDOFF_MAX_DURATION_MS &&
        (!xSpring.isAtRest() || !ySpring.isAtRest())
      ) {
        partialFocusHandoffAnimationFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        partialFocusHandoffAnimationFrameRef.current = null;
        updatePartialFocusPosition(to);
      }
    };

    partialFocusHandoffAnimationFrameRef.current = window.requestAnimationFrame(tick);
  }, [cancelPartialFocusHandoffAnimation, updatePartialFocusPosition]);

  useEffect(() => {
    if (partialFocusSupportedAxis !== PartialFocusSupportedAxis.None) {
      updatePartialFocusPosition(
        constrainPartialFocusPositionForAxis(
          partialFocusPositionRef.current,
          partialFocusSupportedAxis,
        ),
      );
      return;
    }

    if (rubberbandAnimationFrameRef.current != null) {
      window.cancelAnimationFrame(rubberbandAnimationFrameRef.current);
      rubberbandAnimationFrameRef.current = null;
    }
    cancelPartialFocusHandoffAnimation();
    rubberbandRunningRef.current = false;
    setPartialFocusAppliesTranslation(false);
    updatePartialFocusPosition(ZERO_PARTIAL_FOCUS_POSITION);
  }, [
    cancelPartialFocusHandoffAnimation,
    partialFocusSupportedAxis,
    updatePartialFocusPosition,
  ]);

  const handlePartialFocusHandoff = useCallback((
    detail: PartialFocusHandoffDetail,
  ) => {
    onPartialFocusHandoff?.(detail);

    setPartialFocusAppliesTranslation(false);

    const self = containerRef.current;
    const otherRect = detail.otherRect;
    if (
      partialFocusSupportedAxis === PartialFocusSupportedAxis.None ||
      self == null ||
      otherRect == null ||
      detail.phase === 'reset'
    ) {
      if (detail.animated === false) {
        cancelPartialFocusHandoffAnimation();
        updatePartialFocusPosition(ZERO_PARTIAL_FOCUS_POSITION);
      } else {
        animatePartialFocusPosition(
          partialFocusPositionRef.current,
          ZERO_PARTIAL_FOCUS_POSITION,
        );
      }
      return;
    }

    const destination = offsetTowardRect(
      self.getBoundingClientRect(),
      otherRect,
      partialFocusSupportedAxis,
    );
    if (detail.phase === 'incoming') {
      cancelPartialFocusHandoffAnimation();
      updatePartialFocusPosition(destination);
      animatePartialFocusPosition(destination, ZERO_PARTIAL_FOCUS_POSITION);
    } else {
      animatePartialFocusPosition(partialFocusPositionRef.current, destination);
    }
  }, [
    animatePartialFocusPosition,
    cancelPartialFocusHandoffAnimation,
    containerRef,
    onPartialFocusHandoff,
    partialFocusSupportedAxis,
    updatePartialFocusPosition,
  ]);

  const startRubberbandAnimation = useCallback((
    direction: InvalidFocusDirection,
  ) => {
    if (
      rubberbandRunningRef.current ||
      !isRubberbandDirectionSupported(partialFocusSupportedAxis, direction)
    ) {
      return;
    }

    cancelPartialFocusHandoffAnimation();
    setPartialFocusAppliesTranslation(true);

    if (rubberbandAnimationFrameRef.current != null) {
      window.cancelAnimationFrame(rubberbandAnimationFrameRef.current);
      rubberbandAnimationFrameRef.current = null;
    }

    const destination = rubberbandDestinationForDirection(direction);
    rubberbandRunningRef.current = true;

    const animateStage = (
      from: PartialFocusPosition,
      to: PartialFocusPosition,
      points: readonly [number, number, number, number],
      onComplete: () => void,
    ) => {
      const startTime = performance.now();
      const tick = (now: number) => {
        const linearProgress = Math.min(
          (now - startTime) / RUBBERBAND_STAGE_DURATION_MS,
          1,
        );
        const easedProgress = cubicBezierY(
          points[0],
          points[1],
          points[2],
          points[3],
          linearProgress,
        );

        updatePartialFocusPosition({
          x: from.x + (to.x - from.x) * easedProgress,
          y: from.y + (to.y - from.y) * easedProgress,
        });

        if (linearProgress < 1) {
          rubberbandAnimationFrameRef.current = window.requestAnimationFrame(tick);
        } else {
          onComplete();
        }
      };

      rubberbandAnimationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animateStage(
      ZERO_PARTIAL_FOCUS_POSITION,
      destination,
      RUBBERBAND_STAGE_ONE_POINTS,
      () => {
        animateStage(
          destination,
          ZERO_PARTIAL_FOCUS_POSITION,
          RUBBERBAND_STAGE_TWO_POINTS,
          () => {
            rubberbandAnimationFrameRef.current = null;
            rubberbandRunningRef.current = false;
            updatePartialFocusPosition(ZERO_PARTIAL_FOCUS_POSITION);
            setPartialFocusAppliesTranslation(false);
          },
        );
      },
    );
  }, [
    cancelPartialFocusHandoffAnimation,
    partialFocusSupportedAxis,
    updatePartialFocusPosition,
  ]);

  return {
    partialFocusPosition,
    partialFocusTranslationX: partialFocusAppliesTranslation && isRubberbandTranslationEnabled
      ? partialFocusPosition.x * MAX_HORIZONTAL_PARTIAL_FOCUS_OFFSET * 2
      : 0,
    partialFocusTranslationY: partialFocusAppliesTranslation && isRubberbandTranslationEnabled
      ? partialFocusPosition.y * MAX_VERTICAL_PARTIAL_FOCUS_OFFSET * 2
      : 0,
    handlePartialFocusHandoff,
    startRubberbandAnimation,
  };
}
