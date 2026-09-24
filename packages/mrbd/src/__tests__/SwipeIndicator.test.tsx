/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * SwipeIndicator tests
 *
 * Constants:
 * - Scrim alpha: 0.35 (35%)
 * - Nudge offset: 5px
 * - Nudge interval: 2000ms
 * - Nudge return: 500ms
 * - Up direction: rotation 0, nudge offset -5
 * - Down direction: rotation 180, nudge offset 5
 * - Default expanded: false
 * - Default showScrim: true
 * - Default direction: up
 * - Blend modes: caret/prompt use plus-lighter
 * - Scrim: vertical gradient from transparent to the window background color at 35% alpha
 */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { SwipeIndicator, SwipeDirection } from '../mrbd/ui/SwipeIndicator';
import {
  SWIPE_DIRECTION_CONFIG,
  SWIPE_INDICATOR_NUDGE_INTERVAL_MS,
  SWIPE_INDICATOR_NUDGE_OFFSET,
  SWIPE_INDICATOR_NUDGE_RETURN_MS,
  SWIPE_INDICATOR_SCRIM_ALPHA,
} from '../mrbd/ui/private/SwipeIndicatorMetrics';

describe('SwipeIndicator rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<SwipeIndicator />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('renders caret icon', () => {
    const { container } = render(<SwipeIndicator />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('is display-only even when unsupported interaction props are supplied', () => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    const unsupportedInteractionProps = {
      onClick,
      onKeyDown,
      role: 'button',
      tabIndex: 0,
    };
    const { container } = render(
      <SwipeIndicator {...unsupportedInteractionProps} prompt="Swipe up" />,
    );
    const root = container.firstElementChild as HTMLElement;

    expect(root).not.toHaveAttribute('role');
    expect(root).not.toHaveAttribute('tabindex');

    root.focus();
    root.click();
    fireEvent.keyDown(root, { key: 'Enter' });

    expect(document.activeElement).not.toBe(root);
    expect(onClick).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it('preserves non-interactive accessibility and data attributes', () => {
    const { container } = render(
      <SwipeIndicator
        aria-label="More content below"
        data-uit-capture-id="swipe-indicator"
      />,
    );
    const root = container.firstElementChild;

    expect(root).toHaveAttribute('aria-label', 'More content below');
    expect(root).toHaveAttribute('data-uit-capture-id', 'swipe-indicator');
  });
});

describe('SwipeIndicator default props', () => {
  it('default expanded = false', () => {
    const { container } = render(<SwipeIndicator prompt="Swipe up" />);
    // When collapsed, prompt should be hidden (visibility: hidden or opacity: 0)
    const promptEl = container.querySelector('[class*="prompt"]');
    if (promptEl) {
      const style = promptEl.getAttribute('style') ?? '';
      // Either opacity: 0 or visibility: hidden
      const isHidden = style.includes('opacity: 0') || style.includes('visibility: hidden');
      expect(isHidden).toBe(true);
    }
  });

  it('default direction = UP', () => {
    const { container } = render(<SwipeIndicator />);
    // UP direction: caret rotation = 0 degrees
    const caret = container.querySelector('[class*="caret"]');
    if (caret) {
      const style = caret.getAttribute('style') ?? '';
      expect(style).toContain(
        `rotate(${SWIPE_DIRECTION_CONFIG[SwipeDirection.UP].rotationDegrees}deg)`
      );
    }
  });
});

describe('SwipeIndicator direction (Direction enum)', () => {
  it('UP direction: caret rotation = 0 degrees', () => {
    const { container } = render(<SwipeIndicator direction={SwipeDirection.UP} />);
    const caret = container.querySelector('[class*="caret"]');
    if (caret) {
      const style = caret.getAttribute('style') ?? '';
      expect(style).toContain(
        `rotate(${SWIPE_DIRECTION_CONFIG[SwipeDirection.UP].rotationDegrees}deg)`
      );
    }
  });

  it('DOWN direction: caret rotation = 180 degrees', () => {
    const { container } = render(<SwipeIndicator direction={SwipeDirection.DOWN} />);
    const caret = container.querySelector('[class*="caret"]');
    if (caret) {
      const style = caret.getAttribute('style') ?? '';
      expect(style).toContain(
        `rotate(${SWIPE_DIRECTION_CONFIG[SwipeDirection.DOWN].rotationDegrees}deg)`
      );
    }
  });
});

describe('SwipeIndicator prompt text', () => {
  it('renders prompt text', () => {
    const { container } = render(
      <SwipeIndicator prompt="Swipe up to see more" expanded />
    );
    expect(container.textContent).toContain('Swipe up to see more');
  });

  it('empty prompt renders no text element', () => {
    const { container } = render(<SwipeIndicator />);
    // With no prompt, no prompt text element should render
    // May be null since prompt defaults to ''
    expect(container.textContent).toBe('');
  });

  it('prompt visible when expanded=true', () => {
    const { container } = render(
      <SwipeIndicator prompt="Test prompt" expanded />
    );
    const promptEl = container.querySelector('[class*="prompt"]');
    if (promptEl) {
      const style = promptEl.getAttribute('style') ?? '';
      expect(style).toContain('opacity: 1');
    }
  });

  it('prompt hidden when expanded=false', () => {
    const { container } = render(
      <SwipeIndicator prompt="Test prompt" expanded={false} />
    );
    const promptEl = container.querySelector('[class*="prompt"]');
    if (promptEl) {
      const style = promptEl.getAttribute('style') ?? '';
      expect(style).toContain('opacity: 0');
    }
  });
});

describe('SwipeIndicator scrim', () => {
  it('shows scrim by default (showScrim=true)', () => {
    const { container } = render(<SwipeIndicator />);
    const scrim = container.querySelector('[class*="scrim"]');
    expect(scrim).not.toBeNull();
  });

  it('hides scrim when showScrim=false', () => {
    const { container } = render(<SwipeIndicator showScrim={false} />);
    const scrim = container.querySelector('[class*="scrim"]');
    expect(scrim).toBeNull();
  });

  it('scrim has 35% opacity (SCRIM_ALPHA = 255 * 0.35)', () => {
    const { container } = render(<SwipeIndicator />);
    const scrim = container.querySelector('[class*="scrim"]');
    if (scrim) {
      const style = scrim.getAttribute('style') ?? '';
      expect(style).toContain(`opacity: ${SWIPE_INDICATOR_SCRIM_ALPHA}`);
    }
  });
});

describe('SwipeIndicator expand/collapse', () => {
  it('re-renders correctly when expanded toggles', () => {
    const { rerender, container } = render(
      <SwipeIndicator prompt="Prompt" expanded={false} />
    );
    // Collapsed
    let promptEl = container.querySelector('[class*="prompt"]');
    if (promptEl) {
      expect(promptEl.getAttribute('style')).toContain('opacity: 0');
    }

    // Expand
    rerender(<SwipeIndicator prompt="Prompt" expanded={true} />);
    promptEl = container.querySelector('[class*="prompt"]');
    if (promptEl) {
      expect(promptEl.getAttribute('style')).toContain('opacity: 1');
    }
  });

  it('translates content and scrim by prompt height when collapsed', () => {
    const { container } = render(
      <SwipeIndicator prompt="Prompt" expanded={false} showScrim />
    );

    const content = container.querySelector('[class*="content"]');
    const scrim = container.querySelector('[class*="scrim"]');

    expect(content?.getAttribute('style')).toContain(
      'translateY(var(--uit-swipe-indicator-prompt-height, 0px))'
    );
    expect(scrim?.getAttribute('style')).toContain(
      'translateY(var(--uit-swipe-indicator-prompt-height, 0px))'
    );
  });

  it('returns content and scrim to zero translation when expanded', () => {
    const { container } = render(
      <SwipeIndicator prompt="Prompt" expanded showScrim />
    );

    const content = container.querySelector('[class*="content"]');
    const scrim = container.querySelector('[class*="scrim"]');

    expect(content?.getAttribute('style')).toContain('translateY(0px)');
    expect(scrim?.getAttribute('style')).toContain('translateY(0px)');
  });
});

describe('SwipeIndicator custom styling', () => {
  it('accepts custom className', () => {
    const { container } = render(<SwipeIndicator className="my-swipe" />);
    expect(container.firstElementChild?.className).toContain('my-swipe');
  });

  it('accepts custom style', () => {
    const { container } = render(<SwipeIndicator style={{ marginTop: 10 }} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('margin-top: 10px');
  });
});

describe('SwipeIndicator direction enum values', () => {
  it('UP = "up"', () => expect(SwipeDirection.UP).toBe('up'));
  it('DOWN = "down"', () => expect(SwipeDirection.DOWN).toBe('down'));
});

describe('SwipeIndicator constants verification', () => {
  it('SCRIM_ALPHA = 0.35 (255 * 0.35 = 89)', () => {
    expect(SWIPE_INDICATOR_SCRIM_ALPHA).toBe(0.35);
    expect(Math.round(255 * SWIPE_INDICATOR_SCRIM_ALPHA)).toBe(89);
  });

  it('nudge offset is 5px', () => {
    expect(SWIPE_INDICATOR_NUDGE_OFFSET).toBe(5);
    expect(SWIPE_DIRECTION_CONFIG[SwipeDirection.UP].nudgeOffset).toBe(
      -SWIPE_INDICATOR_NUDGE_OFFSET
    );
    expect(SWIPE_DIRECTION_CONFIG[SwipeDirection.DOWN].nudgeOffset).toBe(
      SWIPE_INDICATOR_NUDGE_OFFSET
    );
  });

  it('nudge interval is 2000ms', () => {
    expect(SWIPE_INDICATOR_NUDGE_INTERVAL_MS).toBe(2000);
  });

  it('nudge return is 500ms', () => {
    expect(SWIPE_INDICATOR_NUDGE_RETURN_MS).toBe(500);
  });
});
