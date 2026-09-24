/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  AnimationDurations,
  SpringConfigs,
  createLinearTimingFunction,
  getSpringTiming,
} from '@wearables-ui-toolkit/foundation/motion/Animations';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { AvatarProps } from '../Avatar.types';
import { ChipAvatarSize } from '../Chip.types';

export const CHIP_LEADING_TRANSITION_DURATION_MS =
  AnimationDurations.CONTAINER_STATE_CHANGE;
export const CHIP_LAYOUT_TRANSITION_DURATION_MS =
  AnimationDurations.CONTAINER_STATE_CHANGE;
export const CHIP_LAYOUT_TRANSITION_FALLBACK_PADDING_MS = 80;

const CHIP_LOADING_SWAP_TIMING = getSpringTiming(
  SpringConfigs.CHIP_LOADING_SWAP,
);

export const CHIP_LOADING_SWAP_MIDPOINT_MS =
  CHIP_LOADING_SWAP_TIMING.midpointMs;
export const CHIP_LOADING_SWAP_SETTLE_MS =
  CHIP_LOADING_SWAP_TIMING.settleMs;
export const CHIP_LOADING_SWAP_ENTER_DURATION_MS =
  CHIP_LOADING_SWAP_SETTLE_MS - CHIP_LOADING_SWAP_MIDPOINT_MS;
export const CHIP_LOADING_SWAP_SEGMENT_DURATION_MS =
  CHIP_LOADING_SWAP_MIDPOINT_MS;

function createLoadingSwapPhaseTimingFunction(
  phase: 'exit' | 'enter',
): string {
  const phaseStartMs = phase === 'exit' ? 0 : CHIP_LOADING_SWAP_MIDPOINT_MS;
  const phaseDurationMs = phase === 'exit'
    ? CHIP_LOADING_SWAP_MIDPOINT_MS
    : CHIP_LOADING_SWAP_ENTER_DURATION_MS;
  const samples = CHIP_LOADING_SWAP_TIMING.samples
    .filter(({ timeMs }) => (
      timeMs >= phaseStartMs &&
      timeMs <= phaseStartMs + phaseDurationMs
    ))
    .map(({ timeMs, value }) => {
      const phaseProgress = phaseDurationMs > 0
        ? (timeMs - phaseStartMs) / phaseDurationMs
        : 1;
      const phaseValue = phase === 'exit'
        ? Math.min(value * 2, 1)
        : Math.max(value * 2 - 1, 0);
      return {
        progress: phaseProgress,
        value: phaseValue,
      };
    });

  return createLinearTimingFunction([
    { progress: 0, value: phase === 'exit' ? 0 : 0 },
    ...samples,
    { progress: 1, value: 1 },
  ]);
}

export const CHIP_LOADING_SWAP_EXIT_TIMING_FUNCTION =
  createLoadingSwapPhaseTimingFunction('exit');
export const CHIP_LOADING_SWAP_ENTER_TIMING_FUNCTION =
  createLoadingSwapPhaseTimingFunction('enter');

export type ChipLeadingKind = 'avatar' | 'icon' | 'loader';
export type ChipLeadingPhase =
  | 'hidden'
  | 'layout'
  | 'entering'
  | 'visible'
  | 'exiting';
export type ChipLeadingTransitionKind = 'content' | 'loadingSwap';
export type ChipLayoutAnimationAnchor = 'start' | 'end';

export interface ChipLeadingSnapshot {
  kind: ChipLeadingKind;
  signature: unknown;
  icon?: IconSource;
  avatarSrc?: string;
  avatarAlt?: string;
  avatarSize: ChipAvatarSize;
  avatarProps?: Pick<
    AvatarProps,
    | 'badgeContent'
    | 'badgeImageSrc'
    | 'placeholderStyle'
    | 'primaryContent'
    | 'primaryImageShape'
    | 'secondaryContent'
    | 'secondarySrc'
    | 'statusIndicator'
    | 'statusIndicatorIcon'
  >;
}

export interface ChipLeadingTransitionState {
  displayedLeading: ChipLeadingSnapshot | null;
  phase: ChipLeadingPhase;
  transitionKind: ChipLeadingTransitionKind;
  isLayoutAnimating: boolean;
  layoutAnimationAnchor: ChipLayoutAnimationAnchor;
  layoutAnimationToken: number;
  onLayoutAnimationComplete: () => void;
}

function isSameLeading(
  first: ChipLeadingSnapshot | null,
  second: ChipLeadingSnapshot | null,
): boolean {
  if (first == null || second == null) {
    return first == null && second == null;
  }

  return (
    first.kind === second.kind &&
    Object.is(first.signature, second.signature)
  );
}

function isLargeAvatar(leading: ChipLeadingSnapshot | null): boolean {
  return (
    leading?.kind === 'avatar' &&
    leading.avatarSize === ChipAvatarSize.LARGE
  );
}

function shouldStageLayoutTransition(
  currentLeading: ChipLeadingSnapshot | null,
  nextLeading: ChipLeadingSnapshot | null,
): boolean {
  return (
    currentLeading == null ||
    nextLeading == null ||
    isLargeAvatar(currentLeading) ||
    isLargeAvatar(nextLeading)
  );
}

function isLoadingSwapTransition(
  currentLeading: ChipLeadingSnapshot | null,
  nextLeading: ChipLeadingSnapshot | null,
): boolean {
  return (
    currentLeading != null &&
    nextLeading != null &&
    (currentLeading.kind === 'loader' || nextLeading.kind === 'loader')
  );
}

function getIconSignature(icon: IconSource | undefined): unknown {
  if (icon == null) {
    return undefined;
  }
  if (typeof icon === 'string') {
    return icon;
  }
  if ('uri' in icon) {
    return `uri:${icon.uri}:${icon.tinted ?? true}`;
  }
  return `vec:${icon.viewBox}:${icon.paths.map((p) => p.d).join('|')}`;
}

export function createChipLeadingSnapshot({
  hasAvatar,
  hasIcon,
  icon,
  isLoading,
  avatarSrc,
  avatarAlt,
  avatarSize,
  avatarPrimaryContent,
  avatarSecondarySrc,
  avatarSecondaryContent,
  avatarBadgeSrc,
  avatarBadgeContent,
  statusIndicator,
  statusIndicatorIcon,
  primaryImageShape,
  placeholderStyle,
}: {
  hasAvatar: boolean;
  hasIcon: boolean;
  icon?: IconSource;
  isLoading: boolean;
  avatarSrc?: string;
  avatarAlt?: string;
  avatarSize: ChipAvatarSize;
  avatarPrimaryContent?: AvatarProps['primaryContent'];
  avatarSecondarySrc?: AvatarProps['secondarySrc'];
  avatarSecondaryContent?: AvatarProps['secondaryContent'];
  avatarBadgeSrc?: AvatarProps['badgeImageSrc'];
  avatarBadgeContent?: AvatarProps['badgeContent'];
  statusIndicator?: AvatarProps['statusIndicator'];
  statusIndicatorIcon?: AvatarProps['statusIndicatorIcon'];
  primaryImageShape?: AvatarProps['primaryImageShape'];
  placeholderStyle?: AvatarProps['placeholderStyle'];
}): ChipLeadingSnapshot | null {
  if (isLoading) {
    return {
      avatarAlt,
      avatarSize,
      kind: 'loader',
      signature: 'loader',
    };
  }

  if (hasAvatar) {
    const avatarProps = {
      badgeContent: avatarBadgeContent,
      badgeImageSrc: avatarBadgeSrc,
      placeholderStyle,
      primaryContent: avatarPrimaryContent,
      primaryImageShape,
      secondaryContent: avatarSecondaryContent,
      secondarySrc: avatarSecondarySrc,
      statusIndicator,
      statusIndicatorIcon,
    };
    return {
      avatarAlt,
      avatarSize,
      avatarSrc,
      avatarProps,
      kind: 'avatar',
      signature: `avatar:${avatarSize}:${avatarSrc ?? ''}:${avatarAlt ?? ''}`,
    };
  }

  if (hasIcon) {
    return {
      avatarAlt,
      avatarSize,
      icon,
      kind: 'icon',
      signature: getIconSignature(icon),
    };
  }

  return null;
}

export function useChipLeadingTransition(
  targetLeading: ChipLeadingSnapshot | null,
): ChipLeadingTransitionState {
  const targetLeadingRef = useRef(targetLeading);
  const displayedLeadingRef = useRef(targetLeading);
  const phaseRef = useRef<ChipLeadingPhase>(
    targetLeading == null ? 'hidden' : 'visible',
  );
  const sequenceTimeoutRef =
    useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const visibleTimeoutRef =
    useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const layoutFallbackTimeoutRef =
    useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingLayoutLeadingRef =
    useRef<ChipLeadingSnapshot | null | undefined>(undefined);
  const pendingDirectLoaderRevealRef = useRef(false);
  const [displayedLeading, setDisplayedLeading] =
    useState<ChipLeadingSnapshot | null>(targetLeading);
  const [phase, setPhase] = useState<ChipLeadingPhase>(
    targetLeading == null ? 'hidden' : 'visible',
  );
  const [transitionKind, setTransitionKind] =
    useState<ChipLeadingTransitionKind>('content');
  const [isLayoutAnimating, setIsLayoutAnimating] = useState(false);
  const [layoutAnimationAnchor, setLayoutAnimationAnchor] =
    useState<ChipLayoutAnimationAnchor>('start');
  const [layoutAnimationToken, setLayoutAnimationToken] = useState(0);

  useLayoutEffect(() => {
    targetLeadingRef.current = targetLeading;
    displayedLeadingRef.current = displayedLeading;
    phaseRef.current = phase;
  }, [displayedLeading, phase, targetLeading]);

  useLayoutEffect(() => {
    const currentLeading = displayedLeadingRef.current;
    if (
      targetLeading != null &&
      currentLeading !== targetLeading &&
      isSameLeading(currentLeading, targetLeading)
    ) {
      setDisplayedLeading(targetLeading);
    }
  }, [targetLeading]);

  const scheduleVisiblePhase = useCallback((durationMs: number) => {
    if (visibleTimeoutRef.current != null) {
      window.clearTimeout(visibleTimeoutRef.current);
    }
    visibleTimeoutRef.current = window.setTimeout(() => {
      visibleTimeoutRef.current = null;
      setPhase('visible');
    }, durationMs);
  }, []);

  const animateTargetIn = useCallback(
    (
      nextLeading: ChipLeadingSnapshot | null,
      durationMs: number = CHIP_LEADING_TRANSITION_DURATION_MS,
    ) => {
      setDisplayedLeading(nextLeading);
      if (nextLeading == null) {
        setPhase('hidden');
        return;
      }

      setPhase('entering');
      scheduleVisiblePhase(durationMs);
    },
    [scheduleVisiblePhase],
  );

  const onLayoutAnimationComplete = useCallback(() => {
    if (layoutFallbackTimeoutRef.current != null) {
      window.clearTimeout(layoutFallbackTimeoutRef.current);
      layoutFallbackTimeoutRef.current = null;
    }
    setIsLayoutAnimating(false);
    setLayoutAnimationAnchor('start');

    if (pendingDirectLoaderRevealRef.current) {
      pendingDirectLoaderRevealRef.current = false;
      setPhase('visible');
    }

    const pendingLeading = pendingLayoutLeadingRef.current;
    pendingLayoutLeadingRef.current = undefined;
    if (pendingLeading !== undefined) {
      animateTargetIn(pendingLeading);
    }
  }, [animateTargetIn]);

  useEffect(() => {
    const nextTargetLeading = targetLeadingRef.current;
    const cancelScheduledWork = () => {
      pendingLayoutLeadingRef.current = undefined;
      pendingDirectLoaderRevealRef.current = false;
      if (sequenceTimeoutRef.current != null) {
        window.clearTimeout(sequenceTimeoutRef.current);
        sequenceTimeoutRef.current = null;
      }
      if (visibleTimeoutRef.current != null) {
        window.clearTimeout(visibleTimeoutRef.current);
        visibleTimeoutRef.current = null;
      }
      if (layoutFallbackTimeoutRef.current != null) {
        window.clearTimeout(layoutFallbackTimeoutRef.current);
        layoutFallbackTimeoutRef.current = null;
      }
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const schedule = (callback: () => void, delayMs: number) => {
      sequenceTimeoutRef.current = window.setTimeout(() => {
        sequenceTimeoutRef.current = null;
        callback();
      }, delayMs);
    };

    const requestLayoutAnimation = (
      anchor: ChipLayoutAnimationAnchor = 'start',
    ) => {
      if (layoutFallbackTimeoutRef.current != null) {
        window.clearTimeout(layoutFallbackTimeoutRef.current);
      }
      setLayoutAnimationAnchor(anchor);
      setIsLayoutAnimating(true);
      layoutFallbackTimeoutRef.current = window.setTimeout(
        onLayoutAnimationComplete,
        CHIP_LAYOUT_TRANSITION_DURATION_MS +
          CHIP_LAYOUT_TRANSITION_FALLBACK_PADDING_MS,
      );
      setLayoutAnimationToken(token => token + 1);
    };

    const stageTargetAfterLayout = (
      currentLeading: ChipLeadingSnapshot | null,
      nextLeading: ChipLeadingSnapshot | null,
    ) => {
      setDisplayedLeading(nextLeading);
      if (nextLeading == null) {
        setPhase('hidden');
        return;
      }

      if (shouldStageLayoutTransition(currentLeading, nextLeading)) {
        pendingLayoutLeadingRef.current = nextLeading;
        requestLayoutAnimation();
        setPhase('layout');
        return;
      }

      animateTargetIn(nextLeading);
    };

    if (isSameLeading(displayedLeadingRef.current, nextTargetLeading)) {
      if (nextTargetLeading == null) {
        setPhase('hidden');
      } else if (phaseRef.current !== 'visible') {
        setPhase('visible');
      }
      return cancelScheduledWork;
    }

    cancelScheduledWork();

    const currentLeading = displayedLeadingRef.current;
    if (nextTargetLeading == null) {
      setTransitionKind('content');
      setPhase('exiting');
      schedule(() => {
        requestLayoutAnimation('end');
        setDisplayedLeading(null);
        setPhase('hidden');
      }, CHIP_LEADING_TRANSITION_DURATION_MS);
      return cancelScheduledWork;
    }

    if (currentLeading == null) {
      setTransitionKind('content');
      requestLayoutAnimation('end');
      setDisplayedLeading(nextTargetLeading);
      if (nextTargetLeading.kind === 'loader') {
        pendingLayoutLeadingRef.current = undefined;
        pendingDirectLoaderRevealRef.current = true;
        setPhase('entering');
      } else {
        pendingLayoutLeadingRef.current = nextTargetLeading;
        setPhase('layout');
      }
      return cancelScheduledWork;
    }

    if (isLoadingSwapTransition(currentLeading, nextTargetLeading)) {
      setTransitionKind('loadingSwap');
      setPhase('exiting');
      schedule(() => {
        setDisplayedLeading(targetLeadingRef.current);
        setPhase('entering');
        scheduleVisiblePhase(CHIP_LOADING_SWAP_ENTER_DURATION_MS);
      }, CHIP_LOADING_SWAP_SEGMENT_DURATION_MS);
      return cancelScheduledWork;
    }

    setTransitionKind('content');

    setPhase('exiting');
    schedule(() => {
      stageTargetAfterLayout(currentLeading, targetLeadingRef.current);
    }, CHIP_LEADING_TRANSITION_DURATION_MS);

    return cancelScheduledWork;
  }, [
    animateTargetIn,
    onLayoutAnimationComplete,
    scheduleVisiblePhase,
    targetLeading?.kind,
    targetLeading?.signature,
  ]);

  return {
    displayedLeading,
    phase,
    transitionKind,
    isLayoutAnimating,
    layoutAnimationAnchor,
    layoutAnimationToken,
    onLayoutAnimationComplete,
  };
}
