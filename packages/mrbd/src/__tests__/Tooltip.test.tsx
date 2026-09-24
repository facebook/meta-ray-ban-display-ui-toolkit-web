/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Tooltip placement regression tests.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import {
  Tooltip,
  TooltipPosition,
} from '../mrbd/ui/Tooltip';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import { preserveFocusedInteractableDuringNavigation } from '@wearables-ui-toolkit/foundation/navigation/FocusRetention';
import { shouldAutoDismissTooltip } from '../mrbd/ui/private/TooltipLayout';
import { TOOLTIP_AUTO_HIDE_DELAY } from '../mrbd/ui/private/TooltipMetrics';
import { chooseAnchoredTooltipPosition } from '@wearables-ui-toolkit/foundation/base/TooltipPositioning';

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

function TooltipHarness({
  position,
}: {
  position: TooltipPosition;
}) {
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <div data-testid="boundary" data-uit-tooltip-boundary>
      <button ref={anchorRef} data-testid="anchor">
        Anchor
      </button>
      <Tooltip
        anchorRef={anchorRef}
        isVisible
        text="A tooltip that should stay readable"
        position={position}
        shouldAutoDismiss={false}
      />
    </div>
  );
}

function FocusableTooltipHarness() {
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <div data-uit-tooltip-boundary>
      <Container ref={anchorRef} onClick={() => {}}>
        Anchor control
      </Container>
      <Tooltip
        anchorRef={anchorRef}
        content={<button type="button">Tooltip action</button>}
        contentDescription="Tooltip actions"
        isFocusable
        isVisible
        shouldAutoDismiss={false}
      />
    </div>
  );
}

describe('Tooltip placement', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the app page boundary instead of the full browser window', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.dataset.testid === 'boundary') {
        return rect(100, 100, 600, 600);
      }
      if (this.dataset.testid === 'anchor') {
        return rect(112, 240, 50, 40);
      }
      if (this.getAttribute('role') === 'tooltip') {
        return rect(0, 0, 260, 80);
      }
      return rect(0, 0, 0, 0);
    });

    render(<TooltipHarness position={TooltipPosition.ANCHORED} />);

    const tooltip = await screen.findByRole('tooltip');

    await waitFor(() => {
      // Edge clamp uses the 2px edge spacing (TOOLTIP_EDGE_SPACING).
      expect(tooltip.style.left).toBe('2px');
    });
    expect(tooltip.parentElement).toHaveStyle({
      left: '100px',
      top: '100px',
      width: '600px',
      height: '600px',
    });
  });

  it('keeps a built-in tooltip in its requested direction (no auto-flip)', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.dataset.testid === 'boundary') {
        return rect(100, 100, 600, 600);
      }
      if (this.dataset.testid === 'anchor') {
        return rect(340, 650, 80, 40);
      }
      if (this.getAttribute('role') === 'tooltip') {
        return rect(0, 0, 220, 80);
      }
      return rect(0, 0, 0, 0);
    });

    render(<TooltipHarness position={TooltipPosition.ANCHORED_BOTTOM} />);

    const tooltip = await screen.findByRole('tooltip');

    await waitFor(() => {
      // Built-in tooltips never auto-flip (only context-menu-style content does),
      // so an ANCHORED_BOTTOM tooltip near the bottom edge stays below the
      // anchor instead of flipping above.
      expect(Number.parseFloat(tooltip.style.top)).toBeGreaterThan(550);
    });
  });

  it('follows an anchor moved by a transform without a resize event', async () => {
    let anchorLeft = 300;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.dataset.testid === 'boundary') {
        return rect(0, 0, 600, 600);
      }
      if (this.dataset.testid === 'anchor') {
        return rect(anchorLeft, 240, 80, 80);
      }
      if (this.getAttribute('role') === 'tooltip') {
        return rect(0, 0, 120, 80);
      }
      return rect(0, 0, 0, 0);
    });

    render(<TooltipHarness position={TooltipPosition.ANCHORED_BOTTOM} />);
    const tooltip = await screen.findByRole('tooltip');
    await waitFor(() => expect(tooltip.style.left).toBe('280px'));

    anchorLeft = 240;

    await waitFor(() => expect(tooltip.style.left).toBe('220px'));
  });
});

describe('Tooltip focus retention', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not reclaim focus from native content in a focusable tooltip', async () => {
    render(<FocusableTooltipHarness />);
    const anchor = screen.getByRole('button', { name: 'Anchor control' });
    const tooltipAction = await screen.findByRole('button', {
      name: 'Tooltip action',
    });
    let stopPreservingFocus: (() => void) | null = null;

    try {
      await act(async () => {
        anchor.focus();
        stopPreservingFocus =
          preserveFocusedInteractableDuringNavigation(anchor);
        tooltipAction.focus();
        await Promise.resolve();
      });

      expect(document.activeElement).toBe(tooltipAction);
    } finally {
      stopPreservingFocus?.();
    }
  });
});

describe('Tooltip content emptied while visible', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function EmptyContentHarness({ text }: { text: string }) {
    const anchorRef = useRef<HTMLButtonElement>(null);
    return (
      <div data-testid="boundary" data-uit-tooltip-boundary>
        <button ref={anchorRef} data-testid="anchor">
          Anchor
        </button>
        <Tooltip
          anchorRef={anchorRef}
          isVisible
          text={text}
          shouldAutoDismiss={false}
        />
      </div>
    );
  }

  it('hides the tooltip when its content is emptied while still visible', async () => {
    const { rerender } = render(<EmptyContentHarness text="Hello" />);
    await screen.findByRole('tooltip');

    // Content cleared without toggling isVisible — clearing the text hides the
    // tooltip rather than silently keeping the empty one visible.
    rerender(<EmptyContentHarness text="" />);
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });
});

describe('Tooltip content updates while visible', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function UpdatingContentHarness({ text }: { text: string }) {
    const anchorRef = useRef<HTMLButtonElement>(null);
    return (
      <div data-testid="boundary" data-uit-tooltip-boundary>
        <button ref={anchorRef} data-testid="anchor">
          Anchor
        </button>
        <Tooltip
          anchorRef={anchorRef}
          isVisible
          text={text}
          tracksAnchorScale
          shouldAutoDismiss={false}
        />
      </div>
    );
  }

  it('preserves the positioned tooltip instead of restarting presentation', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.dataset.testid === 'boundary') {
        return rect(0, 0, 600, 600);
      }
      if (this.dataset.testid === 'anchor') {
        return rect(240, 300, 48, 48);
      }
      if (this.getAttribute('role') === 'tooltip') {
        return rect(0, 0, 120, 64);
      }
      return rect(0, 0, 0, 0);
    });

    const view = render(<UpdatingContentHarness text="00:35" />);
    const tooltip = await screen.findByRole('tooltip');
    await waitFor(() => expect(tooltip.style.visibility).toBe('visible'));

    view.rerender(<UpdatingContentHarness text="00:36" />);

    expect(screen.getByRole('tooltip')).toBe(tooltip);
    expect(tooltip).toHaveTextContent('00:36');
    expect(tooltip.style.visibility).toBe('visible');
  });
});

describe('chooseAnchoredTooltipPosition (required-space flip)', () => {
  const boundary = {
    top: 0,
    bottom: 600,
    left: 0,
    right: 400,
    width: 400,
    height: 600,
  };
  const HEIGHT = 100;

  it('ANCHORED flips to ANCHORED_BOTTOM when it does not fit above and below has more room', () => {
    const anchor = rect(100, 20, 80, 40); // near the top
    expect(
      chooseAnchoredTooltipPosition(
        TooltipPosition.ANCHORED,
        anchor,
        HEIGHT,
        boundary,
        -50, // aboveY < boundary.top -> does not fit above
        70, // belowY fits
      ),
    ).toBe(TooltipPosition.ANCHORED_BOTTOM);
  });

  it('ANCHORED stays when it fits above', () => {
    const anchor = rect(100, 400, 80, 40);
    expect(
      chooseAnchoredTooltipPosition(
        TooltipPosition.ANCHORED,
        anchor,
        HEIGHT,
        boundary,
        290, // aboveY >= boundary.top -> fits above
        450,
      ),
    ).toBe(TooltipPosition.ANCHORED);
  });

  it('ANCHORED_BOTTOM flips to ANCHORED when it does not fit below and above has more room', () => {
    const anchor = rect(100, 540, 80, 40); // near the bottom
    expect(
      chooseAnchoredTooltipPosition(
        TooltipPosition.ANCHORED_BOTTOM,
        anchor,
        HEIGHT,
        boundary,
        430,
        600, // belowY + HEIGHT > boundary.bottom -> does not fit below
      ),
    ).toBe(TooltipPosition.ANCHORED);
  });

  it('ANCHORED_BOTTOM stays when it fits below', () => {
    const anchor = rect(100, 100, 80, 40);
    expect(
      chooseAnchoredTooltipPosition(
        TooltipPosition.ANCHORED_BOTTOM,
        anchor,
        HEIGHT,
        boundary,
        -10,
        150, // belowY + HEIGHT <= boundary.bottom -> fits below
      ),
    ).toBe(TooltipPosition.ANCHORED_BOTTOM);
  });
});

function DefaultDismissHarness() {
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <div data-testid="boundary" data-uit-tooltip-boundary>
      <button ref={anchorRef} data-testid="anchor">
        Anchor
      </button>
      <Tooltip
        anchorRef={anchorRef}
        isVisible
        text="A tooltip that should persist by default"
      />
    </div>
  );
}

describe('Tooltip shouldAutoDismiss default', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves an unset shouldAutoDismiss to false by default', () => {
    expect(shouldAutoDismissTooltip({})).toBe(false);
    expect(shouldAutoDismissTooltip({ shouldAutoDismiss: true })).toBe(true);
    expect(shouldAutoDismissTooltip({ shouldAutoDismiss: false })).toBe(false);
  });

  it('does not auto-dismiss the declarative tooltip when shouldAutoDismiss is omitted', async () => {
    vi.useFakeTimers();
    try {
      render(<DefaultDismissHarness />);

      const tooltip = await vi.waitFor(() => screen.getByRole('tooltip'));

      act(() => {
        vi.advanceTimersByTime(TOOLTIP_AUTO_HIDE_DELAY + 1000);
      });

      expect(tooltip).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
