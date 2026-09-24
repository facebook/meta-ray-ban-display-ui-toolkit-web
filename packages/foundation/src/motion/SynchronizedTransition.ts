/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface SynchronizedTransitionFrame {
  elapsedMs: number;
  linearProgress: number;
  easedProgress: number;
}

export interface SynchronizedTransitionParticipant {
  durationMs: number;
  startDelayMs?: number;
  easing?: (linearProgress: number) => number;
  onStart?: () => void;
  onFrame: (frame: SynchronizedTransitionFrame) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export interface SynchronizedTransitionHandle {
  cancel: (complete?: boolean) => void;
  isActive: () => boolean;
}

export interface StartSynchronizedTransitionOptions {
  participants: SynchronizedTransitionParticipant[];
  applyInitialFrame?: boolean;
  completionPaddingMs?: number;
}

const DEFAULT_COMPLETION_PADDING_MS = 100;

function getPerformanceNow(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function getParticipantEndTime(
  participant: SynchronizedTransitionParticipant,
): number {
  return Math.max(0, participant.startDelayMs ?? 0) +
    Math.max(0, participant.durationMs);
}

export function startSynchronizedTransition({
  participants,
  applyInitialFrame = true,
  completionPaddingMs = DEFAULT_COMPLETION_PADDING_MS,
}: StartSynchronizedTransitionOptions): SynchronizedTransitionHandle {
  const activeParticipants = participants.filter(
    (participant) => participant.durationMs >= 0,
  );

  if (activeParticipants.length === 0) {
    return {
      cancel: () => {},
      isActive: () => false,
    };
  }

  let active = true;
  let frameId: number | null = null;
  let fallbackTimer: ReturnType<typeof window.setTimeout> | null = null;
  const startTime = getPerformanceNow();
  const totalDurationMs = Math.max(...activeParticipants.map(getParticipantEndTime));

  const clearScheduledWork = () => {
    if (frameId != null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }
    if (fallbackTimer != null) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  };

  const applyFrame = (
    now: number,
    forceComplete: boolean,
  ): boolean => {
    let allComplete = true;

    activeParticipants.forEach((participant) => {
      const startDelayMs = Math.max(0, participant.startDelayMs ?? 0);
      const durationMs = Math.max(0, participant.durationMs);
      const elapsedMs = now - startTime - startDelayMs;

      if (!forceComplete && elapsedMs < 0) {
        allComplete = false;
        return;
      }

      const linearProgress = forceComplete || durationMs === 0
        ? 1
        : Math.min(Math.max(elapsedMs / durationMs, 0), 1);
      const easedProgress = participant.easing
        ? participant.easing(linearProgress)
        : linearProgress;

      participant.onFrame({
        easedProgress,
        elapsedMs: Math.max(0, elapsedMs),
        linearProgress,
      });

      if (linearProgress < 1) {
        allComplete = false;
      }
    });

    return allComplete;
  };

  const finish = () => {
    if (!active) {
      return;
    }

    active = false;
    clearScheduledWork();
    applyFrame(startTime + totalDurationMs, true);
    activeParticipants.forEach((participant) => {
      participant.onComplete?.();
    });
  };

  const tick = (now: number) => {
    if (!active) {
      return;
    }

    if (applyFrame(now, false)) {
      finish();
      return;
    }

    frameId = window.requestAnimationFrame(tick);
  };

  activeParticipants.forEach((participant) => {
    participant.onStart?.();
  });

  if (totalDurationMs <= 0 || typeof window.requestAnimationFrame !== 'function') {
    finish();
  } else {
    if (applyInitialFrame) {
      applyFrame(startTime, false);
    }
    frameId = window.requestAnimationFrame(tick);
    fallbackTimer = window.setTimeout(
      finish,
      totalDurationMs + completionPaddingMs,
    );
  }

  return {
    cancel: (complete = false) => {
      if (!active) {
        return;
      }

      if (complete) {
        finish();
        return;
      }

      active = false;
      clearScheduledWork();
      activeParticipants.forEach((participant) => {
        participant.onCancel?.();
      });
    },
    isActive: () => active,
  };
}
