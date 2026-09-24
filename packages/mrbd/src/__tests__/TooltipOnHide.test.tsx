/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Tests for the Tooltip onHide notification (hook + declarative paths).
 *
 * The onHide listener is invoked in `hide()` regardless of how the tooltip was
 * shown. onHide must fire exactly once per hide for both the imperative
 * `useTooltip()` hook and the declarative `<Tooltip>` component.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useRef, useState } from 'react';
import { Tooltip, useTooltip } from '../mrbd/ui/Tooltip';
import { TOOLTIP_ANIMATION_DURATION, TOOLTIP_AUTO_HIDE_DELAY } from '../mrbd/ui/private/TooltipMetrics';

function makeAnchor(): HTMLElement {
  const el = document.createElement('button');
  document.body.appendChild(el);
  return el;
}

describe('useTooltip onHide', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('fires onHide exactly once on an explicit animated hide()', () => {
    vi.useFakeTimers();
    const onHide = vi.fn();
    const anchor = makeAnchor();
    const { result } = renderHook(() => useTooltip());

    act(() => {
      result.current.show(anchor, { text: 'Hello', onHide });
    });
    expect(onHide).not.toHaveBeenCalled();

    act(() => {
      result.current.hide(true);
    });
    // onHide fires only after the fade-out timer completes.
    expect(onHide).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(TOOLTIP_ANIMATION_DURATION);
    });
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('fires onHide exactly once on an immediate (non-animated) hide()', () => {
    const onHide = vi.fn();
    const anchor = makeAnchor();
    const { result } = renderHook(() => useTooltip());

    act(() => {
      result.current.show(anchor, { text: 'Hello', onHide });
    });

    act(() => {
      result.current.hide(false);
    });
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('fires onHide exactly once when auto-dismiss completes', () => {
    vi.useFakeTimers();
    const onHide = vi.fn();
    const anchor = makeAnchor();
    const { result } = renderHook(() => useTooltip());

    act(() => {
      result.current.show(anchor, {
        text: 'Hello',
        shouldAutoDismiss: true,
        onHide,
      });
    });
    expect(onHide).not.toHaveBeenCalled();

    // Auto-dismiss timer fires, then the fade-out timer completes the hide.
    act(() => {
      vi.advanceTimersByTime(TOOLTIP_AUTO_HIDE_DELAY);
    });
    act(() => {
      vi.advanceTimersByTime(TOOLTIP_ANIMATION_DURATION);
    });
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('does not double-fire when hide() is called multiple times', () => {
    vi.useFakeTimers();
    const onHide = vi.fn();
    const anchor = makeAnchor();
    const { result } = renderHook(() => useTooltip());

    act(() => {
      result.current.show(anchor, { text: 'Hello', onHide });
    });

    act(() => {
      result.current.hide(true);
      result.current.hide(true);
    });
    act(() => {
      vi.advanceTimersByTime(TOOLTIP_ANIMATION_DURATION);
    });
    // hide() while already dismissing is a no-op terminal path; onHide fires once.
    expect(onHide).toHaveBeenCalledTimes(1);

    // A subsequent hide() with nothing shown must not re-fire.
    act(() => {
      result.current.hide(true);
      vi.advanceTimersByTime(TOOLTIP_ANIMATION_DURATION);
    });
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('fires the previous tooltip onHide once when re-shown with a new onHide', () => {
    const firstOnHide = vi.fn();
    const secondOnHide = vi.fn();
    const anchor = makeAnchor();
    const { result } = renderHook(() => useTooltip());

    act(() => {
      result.current.show(anchor, { text: 'First', onHide: firstOnHide });
    });
    act(() => {
      result.current.show(anchor, { text: 'Second', onHide: secondOnHide });
    });
    // Replacing the active tooltip is a hide of the first one.
    expect(firstOnHide).toHaveBeenCalledTimes(1);
    expect(secondOnHide).not.toHaveBeenCalled();

    act(() => {
      result.current.hide(false);
    });
    expect(firstOnHide).toHaveBeenCalledTimes(1);
    expect(secondOnHide).toHaveBeenCalledTimes(1);
  });
});

function DeclarativeHarness({ onHide }: { onHide: () => void }) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(true);

  return (
    <div data-uit-tooltip-boundary>
      <button ref={anchorRef} data-testid="anchor">
        Anchor
      </button>
      <button data-testid="hide" onClick={() => setVisible(false)}>
        Hide
      </button>
      <Tooltip
        anchorRef={anchorRef}
        isVisible={visible}
        text="Declarative tooltip"
        onHide={onHide}
      />
    </div>
  );
}

describe('Tooltip declarative onHide', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('fires onHide exactly once when isVisible flips to false', async () => {
    vi.useFakeTimers();
    const onHide = vi.fn();
    render(<DeclarativeHarness onHide={onHide} />);

    await act(async () => {
      vi.advanceTimersByTime(TOOLTIP_ANIMATION_DURATION);
    });
    expect(onHide).not.toHaveBeenCalled();

    act(() => {
      screen.getByTestId('hide').click();
    });
    act(() => {
      vi.advanceTimersByTime(TOOLTIP_ANIMATION_DURATION);
    });

    expect(onHide).toHaveBeenCalledTimes(1);
  });
});
