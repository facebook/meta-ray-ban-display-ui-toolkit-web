/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  act,
  fireEvent,
  render,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';
import {
  Surface,
  SurfaceCornerRadius,
  getSurfaceCornerRadiusPx,
} from '@wearables-ui-toolkit/foundation/components/Surface';
import {
  getSurfaceContentScale,
  getSurfaceInnerShadowAlpha,
  resolveSurfaceSize,
} from '@wearables-ui-toolkit/foundation/components/private/SurfaceLayout';

function mockOffsetSize(width: number, height: number): () => void {
  const widthDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetWidth',
  );
  const heightDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetHeight',
  );
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() { return width; },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get() { return height; },
  });
  return () => {
    if (widthDescriptor) {
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', widthDescriptor);
    }
    if (heightDescriptor) {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', heightDescriptor);
    }
  };
}

function mockRaf(): {
  frames: Map<number, FrameRequestCallback>;
  restore: () => void;
} {
  let nextId = 1;
  const frames = new Map<number, FrameRequestCallback>();
  const reqSpy = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((cb: FrameRequestCallback): number => {
      const id = nextId;
      nextId += 1;
      frames.set(id, cb);
      return id;
    });
  const cancelSpy = vi
    .spyOn(window, 'cancelAnimationFrame')
    .mockImplementation((id: number) => {
      frames.delete(id);
    });
  return {
    frames,
    restore: () => {
      reqSpy.mockRestore();
      cancelSpy.mockRestore();
    },
  };
}

describe('Surface rendering', () => {
  it('renders children with the default radius and enabled opacity', () => {
    const { container } = render(<Surface>Surface</Surface>);
    const root = container.firstElementChild as HTMLElement;

    expect(container.textContent).toContain('Surface');
    expect(root.getAttribute('style')).toContain(
      `border-radius: ${getSurfaceCornerRadiusPx(SurfaceCornerRadius.XSMALL)}px`,
    );
    expect(root.getAttribute('style')).toContain('opacity: var(--uit-enabled-opacity)');
  });

  it('resolves named corner radius cases to Meta Ray-Ban Display pixel values', () => {
    expect(getSurfaceCornerRadiusPx(SurfaceCornerRadius.XXSMALL)).toBe(8);
    expect(getSurfaceCornerRadiusPx(SurfaceCornerRadius.XSMALL)).toBe(16);
    expect(getSurfaceCornerRadiusPx(SurfaceCornerRadius.SMALL)).toBe(24);
    expect(getSurfaceCornerRadiusPx(SurfaceCornerRadius.MEDIUM)).toBe(32);
    expect(getSurfaceCornerRadiusPx(SurfaceCornerRadius.LARGE)).toBe(48);
    expect(getSurfaceCornerRadiusPx(SurfaceCornerRadius.XLARGE)).toBe(56);

    const { container } = render(
      <Surface cornerRadius={SurfaceCornerRadius.LARGE}>Surface</Surface>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('style')).toContain('border-radius: 48px');
  });

  it('hides the background layer when drawBackground is false', () => {
    const { container } = render(<Surface drawBackground={false} />);
    const background = container.querySelector('[class*="backgroundLayer"]') as HTMLElement;

    expect(background.getAttribute('style')).toContain('display: none');
  });

  it('enters focused and pressed inner shadow states through the interactable base', () => {
    const { container } = render(<Surface width={104} height={72}>Surface</Surface>);
    const root = container.firstElementChild as HTMLElement;

    fireEvent.focus(root);
    const focusedShadow = container.querySelector('[class*="innerShadowFocused"]') as HTMLElement;
    const pressedShadow = container.querySelector('[class*="innerShadowPressed"]') as HTMLElement;
    expect(focusedShadow.getAttribute('style')).toContain('opacity: 1');
    expect(pressedShadow.getAttribute('style')).toContain('opacity: 0');

    fireEvent.mouseDown(root);
    expect(pressedShadow.getAttribute('style')).toContain('opacity: 1');
  });

  it('applies the resting content scale on first appearance without any transition', () => {
    // The resting breathing scale must be painted instantly on mount — no entry
    // animation from an unmeasured scale to the resting scale.
    const restore = mockOffsetSize(200, 120);
    try {
      const { container } = render(<Surface width="auto" height="auto">Surface</Surface>);
      const root = container.firstElementChild as HTMLElement;

      expect(root.style.transform).toBe('scale(0.92)');
      expect(root.style.transition).toBe('none');
    } finally {
      restore();
    }
  });

  it('uses an injected content-scale profile', () => {
    const { container } = render(
      <Surface
        width={200}
        height={120}
        contentScaleForStateFn={() => 0.75}
      >
        Surface
      </Surface>,
    );
    const root = container.firstElementChild as HTMLElement;

    expect(root.style.transform).toBe('scale(0.75)');
  });

  it('animates the scale for an interaction but never for a measurement change', () => {
    const { frames, restore: restoreRaf } = mockRaf();
    const restoreOffset = mockOffsetSize(200, 120);
    try {
      const { container } = render(<Surface width="auto" height="auto">Surface</Surface>);
      const root = container.firstElementChild as HTMLElement;

      // Interaction-driven change (focus) DOES animate the scale.
      act(() => { fireEvent.focus(root); });
      expect(root.style.transition).toContain('transform');
      expect(root.style.transition).not.toBe('none');

      // A measurement change while focused is applied instantly (no transition),
      // so a resolved/changed size never rides the interaction animation.
      restoreOffset();
      const restoreLarger = mockOffsetSize(400, 120);
      try {
        for (let pass = 0; pass < 15 && frames.size > 0; pass += 1) {
          const pending = Array.from(frames.values());
          frames.clear();
          act(() => { pending.forEach((frame) => frame(performance.now())); });
        }
        expect(root.style.transition).toBe('none');
      } finally {
        restoreLarger();
      }
    } finally {
      restoreOffset();
      restoreRaf();
    }
  });
});

describe('Surface layout helpers', () => {
  it('resolves auto-sized surfaces to 0 (no breathing) until a real size is measured', () => {
    // No fabricated fallback: an unmeasured auto/percentage surface yields 0 so
    // getSurfaceContentScale returns 1 (no breathing) rather than a made-up scale.
    expect(resolveSurfaceSize('auto', 'auto')).toEqual({
      width: 0,
      height: 0,
    });
    expect(resolveSurfaceSize('100%', 'auto', { w: 200, h: 120 })).toEqual({
      width: 200,
      height: 120,
    });

    const contentScaleForStateFn = vi.fn(() => 0.75);
    expect(getSurfaceContentScale(
      'mrbd',
      State.DEFAULT,
      { width: 0, height: 0 },
      contentScaleForStateFn,
    )).toBe(1);
    expect(contentScaleForStateFn).not.toHaveBeenCalled();
  });

  it('uses explicit numeric width/height over any measured size', () => {
    expect(resolveSurfaceSize(64, 48, { w: 200, h: 120 })).toEqual({
      width: 64,
      height: 48,
    });
  });

  it('computes content scale from the default interaction profile', () => {
    expect(getSurfaceContentScale('mrbd', State.DEFAULT, {
      width: 100,
      height: 72,
    })).toBeCloseTo(0.84);
  });

  it('accepts an injected content-scale profile', () => {
    expect(getSurfaceContentScale(
      'mrbd',
      State.PRESSED,
      { width: 100, height: 72 },
      () => 0.75,
    )).toBe(0.75);
  });

  it('computes focused and pressed inner shadow alphas', () => {
    expect(getSurfaceInnerShadowAlpha(State.DEFAULT)).toEqual({
      focused: 0,
      pressed: 0,
    });
    expect(getSurfaceInnerShadowAlpha(State.FOCUSED)).toEqual({
      focused: 1,
      pressed: 0,
    });
    expect(getSurfaceInnerShadowAlpha(State.PRESSED)).toEqual({
      focused: 1,
      pressed: 1,
    });
  });
});
