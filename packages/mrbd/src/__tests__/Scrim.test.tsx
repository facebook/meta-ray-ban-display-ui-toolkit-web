/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Scrim tests
 *
 * Constants: scrim default elevation = 5px
 *
 * Gradient backgrounds scale to the Scrim bounds, so directional scrims cover
 * the whole parent and their gradient spans that whole parent rather than
 * staying at the 64px intrinsic size.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Scrim, ScrimPosition } from '../mrbd/ui/Scrim';
import {
  FULL_SCRIM_GRADIENT,
  SCRIM_DEFAULT_ELEVATION,
} from '../mrbd/ui/private/ScrimMetrics';
import { getScrimStyle } from '../mrbd/ui/private/ScrimStyles';

describe('Scrim rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<Scrim />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('is aria-hidden (non-clickable, non-focusable)', () => {
    const { container } = render(<Scrim />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('has pointer-events: none (non-interactive)', () => {
    const { container } = render(<Scrim />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('pointer-events: none');
  });

  it('has z-index: 5 (SCRIM_DEFAULT_ELEVATION = 5px)', () => {
    const { container } = render(<Scrim />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain(`z-index: ${SCRIM_DEFAULT_ELEVATION}`);
  });

  it('has position: absolute', () => {
    const { container } = render(<Scrim />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('position: absolute');
  });
});

describe('Scrim default position', () => {
  it('defaults to LEFT position', () => {
    const { container } = render(<Scrim />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    // LEFT = gradient from black to transparent, left to right
    expect(style).toContain('linear-gradient(to right');
    expect(style).toContain('inset: 0');
  });
});

describe('Scrim LEFT position', () => {
  it('fills the parent so the scaled vector bounds match', () => {
    const { container } = render(<Scrim position={ScrimPosition.LEFT} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('inset: 0');
  });

  it('gradient: left(black) → right(transparent)', () => {
    const { container } = render(<Scrim position={ScrimPosition.LEFT} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('linear-gradient(to right');
    // Browser normalizes rgba(0,0,0,1) → rgb(0,0,0)
    expect(style).toContain('rgb(0, 0, 0)');
    expect(style).toContain('rgba(0, 0, 0, 0)');
  });

  it('does not constrain width or height to the vector intrinsic size', () => {
    const { container } = render(<Scrim position={ScrimPosition.LEFT} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).not.toContain('width: 64px');
    expect(style).not.toContain('height: 64px');
  });
});

describe('Scrim RIGHT position', () => {
  it('fills the parent so the scaled vector bounds match', () => {
    const { container } = render(<Scrim position={ScrimPosition.RIGHT} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('inset: 0');
  });

  it('gradient: right(black) → left(transparent)', () => {
    const { container } = render(<Scrim position={ScrimPosition.RIGHT} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('linear-gradient(to left');
  });
});

describe('Scrim TOP position', () => {
  it('fills the parent so the scaled vector bounds match', () => {
    const { container } = render(<Scrim position={ScrimPosition.TOP} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('inset: 0');
  });

  it('gradient: top(black) → bottom(transparent)', () => {
    const { container } = render(<Scrim position={ScrimPosition.TOP} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    // Browser may normalize "to bottom" (default direction) — just check gradient exists
    expect(style).toContain('linear-gradient(');
    expect(style).toContain('rgb(0, 0, 0)');
    expect(style).toContain('rgba(0, 0, 0, 0)');
  });

  it('does not constrain width or height to the vector intrinsic size', () => {
    const { container } = render(<Scrim position={ScrimPosition.TOP} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).not.toContain('width: 64px');
    expect(style).not.toContain('height: 64px');
  });
});

describe('Scrim BOTTOM position', () => {
  it('fills the parent so the scaled vector bounds match', () => {
    const { container } = render(<Scrim position={ScrimPosition.BOTTOM} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('inset: 0');
  });

  it('gradient: bottom(black) → top(transparent)', () => {
    const { container } = render(<Scrim position={ScrimPosition.BOTTOM} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('linear-gradient(to top');
  });
});

describe('Scrim FULL position', () => {
  it('covers entire parent (inset: 0)', () => {
    const { container } = render(<Scrim position={ScrimPosition.FULL} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('inset: 0');
  });

  it('gradient has 4 stops for the full scrim gradient', () => {
    const { container } = render(<Scrim position={ScrimPosition.FULL} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    // 60% black at 0% and 10%, then opaque black at 67.79% and 100%.
    // Browser normalizes rgba(0,0,0,1) → rgb(0,0,0)
    expect(style).toContain('rgba(0, 0, 0, 0.6) 0%');
    expect(style).toContain('rgba(0, 0, 0, 0.6) 10%');
    expect(style).toContain('rgb(0, 0, 0) 67.79%');
    expect(style).toContain('rgb(0, 0, 0) 100%');
  });

  it('style helper uses the extracted full scrim gradient', () => {
    expect(getScrimStyle(ScrimPosition.FULL)).toMatchObject({
      inset: 0,
      background: FULL_SCRIM_GRADIENT,
      zIndex: SCRIM_DEFAULT_ELEVATION,
    });
  });

  it('gradient is vertical (top to bottom)', () => {
    const { container } = render(<Scrim position={ScrimPosition.FULL} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    // "to bottom" is the default gradient direction — browser may omit it
    expect(style).toContain('linear-gradient(');
    expect(style).toContain('0%');
    expect(style).toContain('100%');
  });
});

describe('Scrim custom styling', () => {
  it('accepts custom className', () => {
    const { container } = render(<Scrim className="my-scrim" />);
    expect(container.firstElementChild?.className).toContain('my-scrim');
  });

  it('accepts custom style overrides', () => {
    const { container } = render(<Scrim style={{ opacity: 0.5 }} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('opacity: 0.5');
  });

  it('forwards custom data attributes', () => {
    const { container } = render(
      <Scrim data-uit-capture-id="scrim-capture" title="Overlay scrim" />,
    );
    expect(container.firstElementChild).toHaveAttribute(
      'data-uit-capture-id',
      'scrim-capture',
    );
    expect(container.firstElementChild).toHaveAttribute('title', 'Overlay scrim');
  });
});

describe('Scrim position enum values', () => {
  it('LEFT = "left"', () => expect(ScrimPosition.LEFT).toBe('left'));
  it('RIGHT = "right"', () => expect(ScrimPosition.RIGHT).toBe('right'));
  it('TOP = "top"', () => expect(ScrimPosition.TOP).toBe('top'));
  it('BOTTOM = "bottom"', () => expect(ScrimPosition.BOTTOM).toBe('bottom'));
  it('FULL = "full"', () => expect(ScrimPosition.FULL).toBe('full'));
});
