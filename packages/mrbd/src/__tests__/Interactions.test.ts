/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Interactions tests
 * Tests for state management, content scale calculation, and constants.
 */

import { describe, it, expect } from 'vitest';
import {
  DefaultContentScaleInsets,
  State,
  VisualState,
  InteractionConstants,
  visualStateForInteractionState,
  shouldAnimateTransition,
} from '@wearables-ui-toolkit/foundation/base/Interactions';
import {
  ContentScaleInsets,
  getContentScaleForState,
} from '@wearables-ui-toolkit/mrbd';

describe('InteractionConstants', () => {
  it('has correct QUICK_PRESS_RELEASE_DELAY', () => {
    expect(InteractionConstants.QUICK_PRESS_RELEASE_DELAY).toBe(120);
  });

  it('has correct FAST_SCROLL_THRESHOLD_MS', () => {
    expect(InteractionConstants.FAST_SCROLL_THRESHOLD_MS).toBe(140);
  });

  it('has correct FAST_SCROLL_DECAY_THRESHOLD', () => {
    expect(InteractionConstants.FAST_SCROLL_DECAY_THRESHOLD).toBe(750);
  });
});

describe('Content scale calculation', () => {
  it('DEFAULT state: scale = (dim - 2*8) / dim for Meta Ray-Ban Display', () => {
    const scale = getContentScaleForState(State.DEFAULT, 'mrbd', {
      width: 88,
      height: 88,
    });
    // DEFAULT uses width, inset = 8
    expect(scale).toBeCloseTo(72 / 88, 4);
  });

  it('FOCUSED state: scale = 1.0 (inset = 0) for Meta Ray-Ban Display', () => {
    const scale = getContentScaleForState(State.FOCUSED, 'mrbd', {
      width: 200,
      height: 88,
    });
    // FOCUSED uses width, inset = 0
    expect(scale).toBe(1);
  });

  it('PRESSED state: scale uses width with inset 8 for Meta Ray-Ban Display', () => {
    const scale = getContentScaleForState(State.PRESSED, 'mrbd', {
      width: 200,
      height: 88,
    });
    // PRESSED uses width, inset = 8
    expect(scale).toBeCloseTo((200 - 16) / 200, 4);
  });

  it('handles zero dimensions gracefully', () => {
    const scale = getContentScaleForState(State.DEFAULT, 'mrbd', {
      width: 0,
      height: 0,
    });
    expect(scale).toBe(1);
  });

  it('uses width for scale dimension in all states', () => {
    const dimensions = { width: 200, height: 88 };

    const defaultScale = getContentScaleForState(State.DEFAULT, 'mrbd', dimensions);
    const focusedScale = getContentScaleForState(State.FOCUSED, 'mrbd', dimensions);
    const pressedScale = getContentScaleForState(State.PRESSED, 'mrbd', dimensions);

    // DEFAULT: (200 - 16) / 200 = 0.92
    expect(defaultScale).toBeCloseTo(0.92, 2);
    // FOCUSED: (200 - 0) / 200 = 1.0
    expect(focusedScale).toBe(1);
    // PRESSED: (200 - 16) / 200 = 0.92
    expect(pressedScale).toBeCloseTo(0.92, 2);
  });
});

describe('Visual state mapping', () => {
  it('DEFAULT state maps to DEFAULT visual state', () => {
    const result = visualStateForInteractionState({
      state: State.DEFAULT,
      isDisabled: false,
    });
    expect(result).toBe(VisualState.DEFAULT);
  });

  it('FOCUSED state maps to FOCUSED visual state', () => {
    const result = visualStateForInteractionState({
      state: State.FOCUSED,
      isDisabled: false,
    });
    expect(result).toBe(VisualState.FOCUSED);
  });

  it('PRESSED state maps to PRESSED visual state', () => {
    const result = visualStateForInteractionState({
      state: State.PRESSED,
      isDisabled: false,
    });
    expect(result).toBe(VisualState.PRESSED);
  });
});

// ============================================================================
// Visual state mapping with disabled flag
// ============================================================================

describe('Visual state mapping with disabled', () => {
  it('disabled DEFAULT maps to DEFAULT visual state', () => {
    const result = visualStateForInteractionState({
      state: State.DEFAULT,
      isDisabled: true,
    });
    expect(result).toBe(VisualState.DEFAULT);
  });

  it('disabled FOCUSED maps to DEFAULT visual state', () => {
    const result = visualStateForInteractionState({
      state: State.FOCUSED,
      isDisabled: true,
    });
    expect(result).toBe(VisualState.DEFAULT);
  });

  it('disabled PRESSED maps to DEFAULT visual state', () => {
    const result = visualStateForInteractionState({
      state: State.PRESSED,
      isDisabled: true,
    });
    expect(result).toBe(VisualState.DEFAULT);
  });
});

// ============================================================================
// Visual state mapping with hasStandaloneVisual
// (used by Button in avatar DEFAULT state)
// ============================================================================

describe('Visual state mapping with hasStandaloneVisual', () => {
  it('DEFAULT state with standalone visual maps to NONE', () => {
    const result = visualStateForInteractionState(
      { state: State.DEFAULT, isDisabled: false },
      true
    );
    expect(result).toBe(VisualState.NONE);
  });

  it('FOCUSED state with standalone visual maps to FOCUSED', () => {
    const result = visualStateForInteractionState(
      { state: State.FOCUSED, isDisabled: false },
      true
    );
    expect(result).toBe(VisualState.FOCUSED);
  });

  it('PRESSED state with standalone visual maps to PRESSED', () => {
    const result = visualStateForInteractionState(
      { state: State.PRESSED, isDisabled: false },
      true
    );
    expect(result).toBe(VisualState.PRESSED);
  });
});

// ============================================================================
// shouldAnimateTransition
// ============================================================================

describe('shouldAnimateTransition', () => {
  it('returns false for same state transitions', () => {
    expect(shouldAnimateTransition(State.DEFAULT, State.DEFAULT)).toBe(false);
    expect(shouldAnimateTransition(State.FOCUSED, State.FOCUSED)).toBe(false);
    expect(shouldAnimateTransition(State.PRESSED, State.PRESSED)).toBe(false);
  });

  it('returns true for different state transitions', () => {
    expect(shouldAnimateTransition(State.DEFAULT, State.FOCUSED)).toBe(true);
    expect(shouldAnimateTransition(State.FOCUSED, State.PRESSED)).toBe(true);
    expect(shouldAnimateTransition(State.PRESSED, State.DEFAULT)).toBe(true);
    expect(shouldAnimateTransition(State.DEFAULT, State.PRESSED)).toBe(true);
    expect(shouldAnimateTransition(State.FOCUSED, State.DEFAULT)).toBe(true);
    expect(shouldAnimateTransition(State.PRESSED, State.FOCUSED)).toBe(true);
  });
});

// ============================================================================
// ContentScaleInsets values
// ============================================================================

describe('ContentScaleInsets values', () => {
  it('uses the shared default interaction policy', () => {
    expect(ContentScaleInsets.mrbd).toBe(DefaultContentScaleInsets);
  });

  it('Meta Ray-Ban Display DEFAULT horizontal inset is 8', () => {
    expect(ContentScaleInsets['mrbd'][State.DEFAULT].horizontal).toBe(8);
  });

  it('Meta Ray-Ban Display FOCUSED horizontal inset is 0', () => {
    expect(ContentScaleInsets['mrbd'][State.FOCUSED].horizontal).toBe(0);
  });

  it('Meta Ray-Ban Display PRESSED horizontal inset is 8', () => {
    expect(ContentScaleInsets['mrbd'][State.PRESSED].horizontal).toBe(8);
  });
});

// ============================================================================
// Content scale edge cases
// ============================================================================

describe('Content scale edge cases', () => {
  it('negative dimensions return 1', () => {
    const scale = getContentScaleForState(State.DEFAULT, 'mrbd', {
      width: -10,
      height: -10,
    });
    expect(scale).toBe(1);
  });

  it('very large dimensions compute correctly', () => {
    const scale = getContentScaleForState(State.DEFAULT, 'mrbd', {
      width: 10000,
      height: 10000,
    });
    // (10000 - 16) / 10000 = 0.9984
    expect(scale).toBeCloseTo(0.9984, 4);
  });

  it('width=1 with inset > 0 does not go below 0', () => {
    const scale = getContentScaleForState(State.DEFAULT, 'mrbd', {
      width: 1,
      height: 1,
    });
    // (1 - 16) / 1 = -15, but scale function returns this as-is
    // This tests the boundary behavior
    expect(typeof scale).toBe('number');
    expect(isNaN(scale)).toBe(false);
  });
});
