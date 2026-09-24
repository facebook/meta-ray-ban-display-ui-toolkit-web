/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect } from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Interpolators } from '@wearables-ui-toolkit/foundation/motion/Animations';
import { ChipAvatarSize } from '../mrbd/ui/Chip.types';
import {
  CHIP_LAYOUT_TRANSITION_FALLBACK_PADDING_MS,
  CHIP_LEADING_TRANSITION_DURATION_MS,
  CHIP_LAYOUT_TRANSITION_DURATION_MS,
  type ChipLeadingSnapshot,
  type ChipLeadingTransitionState,
  useChipLeadingTransition,
} from '../mrbd/ui/private/ChipAnimation';

function iconSnapshot(signature: string): ChipLeadingSnapshot {
  return {
    avatarAlt: 'Avatar',
    avatarSize: ChipAvatarSize.SMALL,
    kind: 'icon',
    signature,
  };
}

function avatarSnapshot(
  avatarSize: ChipAvatarSize,
): ChipLeadingSnapshot {
  return {
    avatarAlt: 'Avatar',
    avatarSize,
    avatarSrc: 'avatar.png',
    kind: 'avatar',
    signature: `avatar:${avatarSize}`,
  };
}

function loaderSnapshot(): ChipLeadingSnapshot {
  return {
    avatarAlt: 'Avatar',
    avatarSize: ChipAvatarSize.SMALL,
    kind: 'loader',
    signature: 'loader',
  };
}

function TransitionHarness({
  targetLeading,
  onState,
}: {
  targetLeading: ChipLeadingSnapshot | null;
  onState: (state: ChipLeadingTransitionState) => void;
}) {
  const state = useChipLeadingTransition(targetLeading);

  useEffect(() => {
    onState(state);
  }, [onState, state]);

  return null;
}

function getLastState(
  states: ChipLeadingTransitionState[],
): ChipLeadingTransitionState | undefined {
  return states[states.length - 1];
}

describe('ChipAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the icon/avatar interpolator for chip bounds transitions', () => {
    expect(Interpolators.ICON_AVATAR).toBe(
      'cubic-bezier(0, 0.45, 0.46, 0.94)',
    );
  });

  it('does not request a bounds animation for same-slot icon swaps', () => {
    const states: ChipLeadingTransitionState[] = [];
    const onState = vi.fn((nextState: ChipLeadingTransitionState) => {
      states.push(nextState);
    });
    const { rerender } = render(
      <TransitionHarness
        targetLeading={iconSnapshot('bell')}
        onState={onState}
      />,
    );

    rerender(
      <TransitionHarness
        targetLeading={iconSnapshot('clockwise')}
        onState={onState}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(CHIP_LEADING_TRANSITION_DURATION_MS + 20);
    });

    expect(getLastState(states)?.layoutAnimationToken).toBe(0);
    expect(onState).toHaveBeenCalled();
  });

  it('uses the latest leading target after rapid prop changes', () => {
    const states: ChipLeadingTransitionState[] = [];
    const onState = (nextState: ChipLeadingTransitionState) => {
      states.push(nextState);
    };
    const { rerender } = render(
      <TransitionHarness
        targetLeading={iconSnapshot('bell')}
        onState={onState}
      />,
    );

    rerender(
      <TransitionHarness
        targetLeading={loaderSnapshot()}
        onState={onState}
      />,
    );
    rerender(
      <TransitionHarness
        targetLeading={iconSnapshot('clockwise')}
        onState={onState}
      />,
    );

    act(() => {
      vi.runAllTimers();
    });

    expect(getLastState(states)?.displayedLeading?.signature).toBe('clockwise');
    expect(getLastState(states)?.phase).toBe('visible');
  });

  it('does not request a bounds animation for icon to small avatar', () => {
    const states: ChipLeadingTransitionState[] = [];
    const { rerender } = render(
      <TransitionHarness
        targetLeading={iconSnapshot('bell')}
        onState={nextState => {
          states.push(nextState);
        }}
      />,
    );

    rerender(
      <TransitionHarness
        targetLeading={avatarSnapshot(ChipAvatarSize.SMALL)}
        onState={nextState => {
          states.push(nextState);
        }}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(CHIP_LEADING_TRANSITION_DURATION_MS + 20);
    });

    expect(getLastState(states)?.layoutAnimationToken).toBe(0);
  });

  it('requests one staged bounds animation for transitions involving a large avatar', () => {
    const states: ChipLeadingTransitionState[] = [];
    const { rerender } = render(
      <TransitionHarness
        targetLeading={iconSnapshot('bell')}
        onState={nextState => {
          states.push(nextState);
        }}
      />,
    );

    rerender(
      <TransitionHarness
        targetLeading={avatarSnapshot(ChipAvatarSize.LARGE)}
        onState={nextState => {
          states.push(nextState);
        }}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(CHIP_LEADING_TRANSITION_DURATION_MS + 20);
    });

    expect(getLastState(states)?.layoutAnimationToken).toBe(1);
    expect(getLastState(states)?.phase).toBe('layout');
  });

  it('requests a bounds animation for direct empty state changes', () => {
    const states: ChipLeadingTransitionState[] = [];
    const { rerender } = render(
      <TransitionHarness
        targetLeading={iconSnapshot('bell')}
        onState={nextState => {
          states.push(nextState);
        }}
      />,
    );

    rerender(
      <TransitionHarness
        targetLeading={null}
        onState={nextState => {
          states.push(nextState);
        }}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(CHIP_LEADING_TRANSITION_DURATION_MS + 20);
    });

    expect(getLastState(states)?.layoutAnimationToken).toBe(1);
    expect(getLastState(states)?.phase).toBe('hidden');
  });

  it('animates a directly revealed loader during the bounds animation', () => {
    const states: ChipLeadingTransitionState[] = [];
    const { rerender } = render(
      <TransitionHarness
        targetLeading={null}
        onState={nextState => {
          states.push(nextState);
        }}
      />,
    );

    rerender(
      <TransitionHarness
        targetLeading={loaderSnapshot()}
        onState={nextState => {
          states.push(nextState);
        }}
      />,
    );

    const state = getLastState(states);
    expect(state?.layoutAnimationToken).toBe(1);
    expect(state?.layoutAnimationAnchor).toBe('end');
    expect(state?.isLayoutAnimating).toBe(true);
    expect(state?.phase).toBe('entering');

    act(() => {
      state?.onLayoutAnimationComplete();
    });

    expect(getLastState(states)?.phase).toBe('visible');
    expect(getLastState(states)?.isLayoutAnimating).toBe(false);
  });

  it('reveals a directly added loader if layout completion is not reported', () => {
    const states: ChipLeadingTransitionState[] = [];
    const { rerender } = render(
      <TransitionHarness
        targetLeading={null}
        onState={nextState => {
          states.push(nextState);
        }}
      />,
    );

    rerender(
      <TransitionHarness
        targetLeading={loaderSnapshot()}
        onState={nextState => {
          states.push(nextState);
        }}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(
        CHIP_LAYOUT_TRANSITION_DURATION_MS +
          CHIP_LAYOUT_TRANSITION_FALLBACK_PADDING_MS,
      );
    });

    expect(getLastState(states)?.phase).toBe('visible');
  });
});
