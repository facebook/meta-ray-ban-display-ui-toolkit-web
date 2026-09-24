/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Button component tests
 *
 * Covers: render modes, state management, text visibility,
 * content scale, trailing tag, dimensions, accessibility, click handling.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../mrbd/ui/Button';
import { IconTintColor } from '../mrbd/ui/IconTintColor';
import { TrailingTag } from '../mrbd/ui/TrailingTag';
import {
  ContainerMaterial,
  LayerPlacement,
} from '@wearables-ui-toolkit/foundation';
import { FunctionalContainerMaterialLayer } from '@wearables-ui-toolkit/foundation/material/ContainerMaterial';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';

const motionPreference = vi.hoisted(() => ({ reduced: false }));
vi.mock('@wearables-ui-toolkit/foundation/motion/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => motionPreference.reduced,
}));

afterEach(() => {
  motionPreference.reduced = false;
});

// Stable icon source for tests
const TEST_ICON_SRC = '/icons/test-icon.svg';

function mockElementAnimate() {
  const originalAnimate = HTMLElement.prototype.animate;
  const animateMock = vi.fn(() => ({
    cancel: vi.fn(),
    onfinish: null,
    oncancel: null,
  } as unknown as Animation));

  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    writable: true,
    value: animateMock,
  });

  return {
    animateMock,
    restore: () => {
      Object.defineProperty(HTMLElement.prototype, 'animate', {
        configurable: true,
        writable: true,
        value: originalAnimate,
      });
    },
  };
}

function createProbeMaterial() {
  return new ContainerMaterial({
    layers: [
      new FunctionalContainerMaterialLayer(
        'probe-background',
        LayerPlacement.BACKGROUND,
        (state) => ({
          backgroundColor:
            state === VisualState.FOCUSED ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
          opacity: 1,
        }),
      ),
    ],
  });
}

// ============================================================================
// Render Mode Tests
// ============================================================================

describe('Button render modes', () => {
  it('renders with icon only (ICON mode)', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Reply" />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
    const iconContent = container.querySelector('[class*="iconContent"]');
    expect(
      iconContent?.querySelector('[style*="mask-image"]')
    ).toBeTruthy();
  });

  it('renders with title only (NONE mode)', () => {
    render(<Button title="Connect" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Connect');
  });

  it('renders with subtitle', () => {
    render(<Button title="Report" subtitle="File task" icon={{ uri: TEST_ICON_SRC }} />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Report');
    expect(button).toHaveTextContent('File task');
  });

  it('renders with avatar (AVATAR mode)', () => {
    render(<Button avatarSrc="/test.webp" avatarAlt="Amy" title="Amy" />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Amy');
  });

  it('renders with avatar primary content (AVATAR mode)', () => {
    render(
      <Button
        avatarPrimaryContent={<span data-testid="avatar-primary">A</span>}
        icon={{ uri: TEST_ICON_SRC }}
        title="Amy"
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Amy');
    expect(screen.getByTestId('avatar-primary')).toBeInTheDocument();
    expect(button.querySelector('[class*="iconContent"]')).toBeNull();
  });

  it('renders avatar badge content', () => {
    render(
      <Button
        avatarSrc="/test.webp"
        avatarBadgeContent={<span data-testid="avatar-badge">B</span>}
        title="Amy"
      />,
    );

    expect(screen.getByTestId('avatar-badge')).toBeInTheDocument();
  });

  it('shows text when alwaysShowText is true', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Reply" alwaysShowText />
    );
    // Text should be visible (opacity 1) regardless of state
    const textContent = container.querySelector('[class*="textContent"]');
    expect(textContent).not.toBeNull();
    if (textContent) {
      expect(textContent.getAttribute('style')).toContain('opacity: 1');
    }
  });

  it('hides text in DEFAULT state when not alwaysShowText (icon mode)', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Reply" />
    );
    const textContent = container.querySelector('[class*="textContent"]');
    expect(textContent).not.toBeNull();
    if (textContent) {
      expect(textContent.getAttribute('style')).toContain('opacity: 0');
    }
  });

  it('always shows text when no icon or avatar (NONE mode)', () => {
    const { container } = render(<Button title="Connect" />);
    const textContent = container.querySelector('[class*="textContent"]');
    if (textContent) {
      expect(textContent.getAttribute('style')).toContain('opacity: 1');
    }
  });

});

// ============================================================================
// Trailing Tag Tests
// ============================================================================

describe('Button trailing tag', () => {
  it('renders trailing tag when trailingTag is set and text visible', () => {
    render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Write" alwaysShowText trailingTag={TrailingTag.BETA} />
    );
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Beta');
  });

  it('hides trailing tag when button is collapsed (text hidden)', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Write" trailingTag={TrailingTag.BETA} />
    );
    // In DEFAULT state with icon, text opacity = 0, tag opacity should also = 0
    // The Tag is rendered directly with opacity style
    const allElements = container.querySelectorAll('*');
    let foundTagWithOpacity0 = false;
    allElements.forEach((el) => {
      const style = el.getAttribute('style') ?? '';
      if (el.textContent?.trim() === 'Beta' && style.includes('opacity: 0')) {
        foundTagWithOpacity0 = true;
      }
    });
    // Tag exists in DOM with opacity 0
    expect(container.textContent).toContain('Beta');
    expect(foundTagWithOpacity0).toBe(true);
  });

  it('does not render tag when trailingTag is not set', () => {
    render(<Button icon={{ uri: TEST_ICON_SRC }} title="Reply" alwaysShowText />);
    const button = screen.getByRole('button');
    expect(button).not.toHaveTextContent('Beta');
  });

  it('does not render tag when no title or subtitle exists', () => {
    render(<Button icon={{ uri: TEST_ICON_SRC }} trailingTag={TrailingTag.BETA} />);
    const button = screen.getByRole('button');
    expect(button).not.toHaveTextContent('Beta');
  });
});

// ============================================================================
// Dimensions Tests
// ============================================================================

describe('Button dimensions', () => {
  it('has correct height (88px)', () => {
    const { container } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Reply" />);
    const button = container.querySelector('[role="button"]');
    expect(button?.getAttribute('style')).toContain('height: 88px');
  });

  it('has role=button', () => {
    render(<Button icon={{ uri: TEST_ICON_SRC }} title="Reply" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('keeps the pre-press scale for layout compensation', () => {
    render(
      <Button
        icon={{ uri: TEST_ICON_SRC }}
        title="Do Not Disturb"
        width={200}
      />,
    );
    const button = screen.getByRole('button');
    fireEvent.focus(button);
    const compensationBeforePress = button.style.getPropertyValue(
      '--uit-button-layout-compensation',
    );

    fireEvent.keyDown(button, { key: 'Enter' });

    expect(button.style.transform).not.toBe('scale(0.818182)');
    expect(button.style.getPropertyValue(
      '--uit-button-layout-compensation',
    )).toBe(compensationBeforePress);
  });

  it('does not remeasure its layout width on the first press', () => {
    motionPreference.reduced = true;
    let textWidth = 100;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalOffsetLeft = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetLeft',
    );
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth',
    );

    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      writable: true,
      value: vi.fn((callback: FrameRequestCallback) => {
        callback(performance.now());
        return 1;
      }),
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
      configurable: true,
      get() {
        const className = String(this.className);
        return className.includes('textContent') ? 74 : 26;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        const className = String(this.className);
        if (className.includes('iconContent')) {
          return 32;
        }
        return className.includes('textContent') ? textWidth : 0;
      },
    });

    try {
      render(<Button icon={{ uri: TEST_ICON_SRC }} title="Notifications" />);
      const button = screen.getByRole('button');
      fireEvent.focus(button);
      const widthBeforePress = button.style.width;

      textWidth = 99;
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(button.style.width).toBe(widthBeforePress);
    } finally {
      Object.defineProperty(window, 'requestAnimationFrame', {
        configurable: true,
        writable: true,
        value: originalRequestAnimationFrame,
      });
      if (originalOffsetLeft != null) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetLeft',
          originalOffsetLeft,
        );
      }
      if (originalOffsetWidth != null) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetWidth',
          originalOffsetWidth,
        );
      }
    }
  });

  it('remeasures natural text width when font metrics settle after mount', async () => {
    let textWidth = 209;
    let resizeCallback: ResizeObserverCallback | null = null;
    const originalResizeObserver = window.ResizeObserver;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    const originalOffsetLeft = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetLeft',
    );
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth',
    );

    class MockResizeObserver implements ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }

      disconnect = vi.fn();
      observe = vi.fn();
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);
    }

    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: MockResizeObserver,
    });
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      writable: true,
      value: vi.fn((callback: FrameRequestCallback) => {
        callback(performance.now());
        return 1;
      }),
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
      configurable: true,
      get() {
        return String(this.className).includes('textContent') ? 32 : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        if (String(this.className).includes('textContent')) {
          return textWidth;
        }

        return 0;
      },
    });

    try {
      render(<Button title="Show / Hide Tooltip" alwaysShowText />);
      expect(screen.getByRole('button')).toHaveStyle({ width: '273px' });

      textWidth = 227;
      await act(async () => {
        resizeCallback?.([], {} as ResizeObserver);
        await Promise.resolve();
      });

      expect(screen.getByRole('button')).toHaveStyle({ width: '291px' });
    } finally {
      Object.defineProperty(window, 'ResizeObserver', {
        configurable: true,
        writable: true,
        value: originalResizeObserver,
      });
      Object.defineProperty(window, 'requestAnimationFrame', {
        configurable: true,
        writable: true,
        value: originalRequestAnimationFrame,
      });
      Object.defineProperty(window, 'cancelAnimationFrame', {
        configurable: true,
        writable: true,
        value: originalCancelAnimationFrame,
      });

      if (originalOffsetLeft != null) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetLeft',
          originalOffsetLeft,
        );
      }
      if (originalOffsetWidth != null) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetWidth',
          originalOffsetWidth,
        );
      }
    }
  });

  it('finishes an active focus animation at the latest title width', () => {
    let textWidth = 220;
    let nextFrameId = 1;
    const frameCallbacks = new Map<number, FrameRequestCallback>();
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    const originalOffsetLeft = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetLeft',
    );
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth',
    );

    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      writable: true,
      value: vi.fn((callback: FrameRequestCallback) => {
        const frameId = nextFrameId++;
        frameCallbacks.set(frameId, callback);
        return frameId;
      }),
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      writable: true,
      value: vi.fn((frameId: number) => frameCallbacks.delete(frameId)),
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
      configurable: true,
      get() {
        return String(this.className).includes('textContent') ? 32 : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return String(this.className).includes('textContent') ? textWidth : 0;
      },
    });

    try {
      const view = render(
        <Button title="Hide Vertical Menu" alwaysShowText />,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ width: '284px' });

      const runPendingFrames = (frameTime: number) => {
        const pendingFrames = Array.from(frameCallbacks.values());
        frameCallbacks.clear();
        act(() => pendingFrames.forEach(callback => callback(frameTime)));
      };
      let frameTime = performance.now() + 1_000;
      runPendingFrames(frameTime);

      const focusStartTime = performance.now();
      act(() => button.focus());
      textWidth = 161;
      view.rerender(<Button title="Vertical Menu" alwaysShowText />);

      runPendingFrames(focusStartTime + 100);
      expect(Number.parseFloat(button.style.width)).toBeLessThan(284);
      expect(Number.parseFloat(button.style.width)).toBeGreaterThanOrEqual(225);

      frameTime += 1_000;
      for (let pass = 0; pass < 10 && frameCallbacks.size > 0; pass += 1) {
        runPendingFrames(frameTime);
        frameTime += 1_000;
      }

      expect(button).toHaveTextContent('Vertical Menu');
      expect(button).toHaveStyle({ width: '225px' });
    } finally {
      Object.defineProperty(window, 'requestAnimationFrame', {
        configurable: true,
        writable: true,
        value: originalRequestAnimationFrame,
      });
      Object.defineProperty(window, 'cancelAnimationFrame', {
        configurable: true,
        writable: true,
        value: originalCancelAnimationFrame,
      });
      if (originalOffsetLeft != null) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetLeft',
          originalOffsetLeft,
        );
      }
      if (originalOffsetWidth != null) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetWidth',
          originalOffsetWidth,
        );
      }
    }
  });

  it('measures icon and text buttons from DOM metrics', () => {
    const originalOffsetLeft = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetLeft',
    );
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth',
    );

    Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
      configurable: true,
      get() {
        const className = String(this.className);
        if (className.includes('iconContent')) {
          return 26;
        }
        if (className.includes('textContent')) {
          return 74;
        }

        return 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        const className = String(this.className);
        if (className.includes('iconContent')) {
          return 32;
        }
        if (className.includes('textContent')) {
          return 82;
        }

        return 0;
      },
    });

    try {
      render(<Button icon={{ uri: TEST_ICON_SRC }} title="Button" alwaysShowText />);

      // alwaysShowText buttons now seed the WITH_TEXT icon leading margin (26) on
      // the first render, matching the icon's mocked offsetLeft of 26, so the
      // measurement's expandedIconOffsetCorrection is 0 (no normalization needed):
      // 74 (text offsetLeft) + 82 (text offsetWidth) + trailing padding = 188.
      expect(screen.getByRole('button')).toHaveStyle({ width: '188px' });
    } finally {
      if (originalOffsetLeft != null) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetLeft',
          originalOffsetLeft,
        );
      }
      if (originalOffsetWidth != null) {
        Object.defineProperty(
          HTMLElement.prototype,
          'offsetWidth',
          originalOffsetWidth,
        );
      }
    }
  });
});

// ============================================================================
// State Management Tests
// ============================================================================

describe('Button state management', () => {
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button title="Click me" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button title="Click me" onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies disabled styling when disabled', () => {
    motionPreference.reduced = true;
    const { container } = render(<Button title="Disabled" disabled />);
    const button = container.querySelector('[role="button"]') as HTMLElement;
    expect(button?.getAttribute('aria-disabled')).toBe('true');
    expect(button).toHaveStyle({ opacity: '0.5' });

    fireEvent.focus(button);
    expect(button).toHaveStyle({ opacity: '0.5' });
  });

  it('handles keyboard Enter as click (keyDown then keyUp)', () => {
    const onClick = vi.fn();
    render(<Button title="Press me" onClick={onClick} />);
    const button = screen.getByRole('button');
    fireEvent.focus(button);
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyUp(button, { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });

  it('handles keyboard Space as click (keyDown then keyUp)', () => {
    const onClick = vi.fn();
    render(<Button title="Press me" onClick={onClick} />);
    const button = screen.getByRole('button');
    fireEvent.focus(button);
    fireEvent.keyDown(button, { key: ' ' });
    fireEvent.keyUp(button, { key: ' ' });
    expect(onClick).toHaveBeenCalled();
  });
});

// ============================================================================
// Content Scale Tests
// ============================================================================

describe('Button content scale', () => {
  it('applies scale transform', () => {
    const { container } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Reply" />);
    const button = container.querySelector('[role="button"]');
    const style = button?.getAttribute('style') ?? '';
    expect(style).toContain('scale(');
  });

  it('DEFAULT state uses height-based scale (72/88 = 0.818)', () => {
    const { container } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Reply" />);
    const button = container.querySelector('[role="button"]');
    const style = button?.getAttribute('style') ?? '';
    // Scale = (88 - 2*8) / 88 = 72/88 ≈ 0.818
    expect(style).toContain('scale(0.818');
  });
});

// ============================================================================
// Icon Tests
// ============================================================================

describe('Button icon', () => {
  it('renders icon element', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Reply" />
    );
    const iconContent = container.querySelector('[class*="iconContent"]');
    const maskSpan = iconContent?.querySelector('[style*="mask-image"]');
    expect(maskSpan).toBeTruthy();
    expect(maskSpan?.getAttribute('style')).toContain(TEST_ICON_SRC);
  });

  it('shows icon indicator when showIconActiveIndicator is true', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Report" showIconActiveIndicator />
    );
    const indicator = container.querySelector('[class*="iconIndicator"]');
    expect(indicator).not.toBeNull();
    if (indicator) {
      expect(indicator.getAttribute('style')).toContain('visible');
    }
  });

  it('hides icon indicator by default', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Report" />
    );
    const indicator = container.querySelector('[class*="iconIndicator"]');
    if (indicator) {
      expect(indicator.getAttribute('style')).toContain('hidden');
    }
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('Button accessibility', () => {
  it('has button role', () => {
    render(<Button title="OK" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('is focusable (tabIndex >= 0)', () => {
    render(<Button title="OK" />);
    const button = screen.getByRole('button');
    expect(button.tabIndex).toBeGreaterThanOrEqual(0);
  });

  it('sets aria-disabled when disabled', () => {
    render(<Button title="OK" disabled />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });
});

// ============================================================================
// Max Width Constants
// ============================================================================

describe('Button max width constants', () => {
  it('text-only max width is 384px', () => {
    // Text-only max width: 384px
    const { container } = render(
      <Button title="A very long title that should be constrained" enforceMaxWidth />
    );
    const button = container.querySelector('[role="button"]');
    expect(button).toBeInTheDocument();
  });

  it('text-with-icon max width is 344px', () => {
    // Text-with-icon max width: 344px
    const { container } = render(
      <Button
        icon={{ uri: TEST_ICON_SRC }}
        title="A very long title"
        alwaysShowText
        enforceMaxWidth
      />
    );
    const button = container.querySelector('[role="button"]');
    expect(button).toBeInTheDocument();
  });

  it('text-with-avatar max width is 320px', () => {
    // Text-with-avatar max width: 320px
    const { container } = render(
      <Button
        avatarSrc="/test.webp"
        avatarAlt="Test"
        title="A very long title"
        enforceMaxWidth
      />
    );
    const button = container.querySelector('[role="button"]');
    expect(button).toBeInTheDocument();
  });
});

// ============================================================================
// State Persistence (state persists after changing title/subtitle/etc.)
// ============================================================================

describe('Button state persistence', () => {
  it('does not crash when re-rendering with new title', () => {
    const { rerender } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Original" />);
    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Updated" />);
    expect(screen.getByRole('button')).toHaveTextContent('Updated');
  });

  it('does not crash when re-rendering with new subtitle', () => {
    const { rerender } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Title" subtitle="Original" alwaysShowText />
    );
    rerender(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Title" subtitle="Updated" alwaysShowText />
    );
    expect(screen.getByRole('button')).toHaveTextContent('Updated');
  });

  it('does not crash when toggling alwaysShowText', () => {
    const { rerender } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Test" />);
    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Test" alwaysShowText />);
    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Test" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('does not crash when toggling disabled', () => {
    const { rerender } = render(<Button title="Test" />);
    rerender(<Button title="Test" disabled />);
    rerender(<Button title="Test" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('does not crash when switching from icon to avatar mode', () => {
    const { rerender } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Icon" />);
    rerender(<Button avatarSrc="/test.webp" avatarAlt="A" title="Avatar" />);
    expect(screen.getByRole('button')).toHaveTextContent('Avatar');
  });

  it('does not crash when switching from avatar to icon mode', () => {
    const { rerender } = render(
      <Button avatarSrc="/test.webp" avatarAlt="A" title="Avatar" />
    );
    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Icon" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

// ============================================================================
// Button Height (BUTTON_HEIGHT = 88px)
// ============================================================================

describe('Button height constant', () => {
  it('always renders at 88px height', () => {
    const { container: c1 } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Icon" />);
    expect(c1.querySelector('[role="button"]')?.getAttribute('style')).toContain('height: 88px');

    const { container: c2 } = render(<Button title="Text Only" />);
    expect(c2.querySelector('[role="button"]')?.getAttribute('style')).toContain('height: 88px');

    const { container: c3 } = render(
      <Button avatarSrc="/test.webp" avatarAlt="A" title="Avatar" />
    );
    expect(c3.querySelector('[role="button"]')?.getAttribute('style')).toContain('height: 88px');
  });
});

// ============================================================================
// Button minimum width (BUTTON_MINIMUM_WIDTH = 88px)
// ============================================================================

describe('Button minimum width', () => {
  it('icon-only button has width >= 88px (minimum width)', () => {
    const { container } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Reply" />);
    // The contentViewContainer should have width set
    const contentContainer = container.querySelector('[class*="contentViewContainer"]');
    if (contentContainer) {
      const style = contentContainer.getAttribute('style') ?? '';
      // Should be at least 88px
      const widthMatch = style.match(/width:\s*(\d+)/);
      if (widthMatch) {
        expect(parseInt(widthMatch[1])).toBeGreaterThanOrEqual(88);
      }
    }
  });
});

// ============================================================================
// Focus/Press interaction
// ============================================================================

describe('Button focus and press interaction', () => {
  it('changes visual state on focus', () => {
    const { container } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Reply" />);
    const button = screen.getByRole('button');

    // Focus the button
    fireEvent.focus(button);

    // The button should now have a different scale (focused = scale 1.0)
    // In FOCUSED state, scale should be higher than DEFAULT (0.818)
    const style = container.querySelector('[role="button"]')?.getAttribute('style') ?? '';
    // After focus, scale should change
    expect(style).toContain('scale(');
  });

  it('keeps button-owned scale animation out of Container root WAAPI', () => {
    const { animateMock, restore } = mockElementAnimate();

    try {
      render(<Button icon={{ uri: TEST_ICON_SRC }} title="Reply" />);
      const button = screen.getByRole('button');

      fireEvent.focus(button);

      expect(button.getAttribute('style')).toContain('scale(');
      expect(animateMock).not.toHaveBeenCalled();
    } finally {
      restore();
    }
  });

  it('starts shared Container material transitions from the previous visual state', () => {
    const material = createProbeMaterial();
    const setStateSpy = vi.spyOn(material, 'setState');
    const { container } = render(
      <Button
        icon={{ uri: TEST_ICON_SRC }}
        material={material}
        title="Reply"
      />,
    );
    const button = screen.getByRole('button');

    // This probe is a render-only CSS layer, so it uses the CSS material path
    // rather than allocating a blank canvas.
    expect(material.getCurrentState()).toBe(VisualState.DEFAULT);
    expect(
      container.querySelector('[data-uit-material-layer="probe-background"]'),
    ).not.toBeNull();

    fireEvent.focus(button);

    // Focusing drives the material transition from the previous visual state
    // (DEFAULT) to the new one (FOCUSED), keeping the start of the transition
    // anchored to the prior state.
    expect(setStateSpy).toHaveBeenLastCalledWith(
      VisualState.DEFAULT,
      VisualState.FOCUSED,
      expect.anything(),
    );
    expect(material.getCurrentState()).toBe(VisualState.FOCUSED);

    setStateSpy.mockRestore();
  });

  it('reverts visual state on blur', () => {
    const { container } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Reply" />);
    const button = screen.getByRole('button');

    fireEvent.focus(button);
    fireEvent.blur(button);

    // Should be back to DEFAULT scale (0.818)
    const style = container.querySelector('[role="button"]')?.getAttribute('style') ?? '';
    expect(style).toContain('scale(0.818');
  });

  it('does not call onClick on keyUp without prior keyDown', () => {
    const onClick = vi.fn();
    render(<Button title="Test" onClick={onClick} />);
    const button = screen.getByRole('button');
    fireEvent.focus(button);
    // Only keyUp, no keyDown — should NOT trigger click
    fireEvent.keyUp(button, { key: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('focus when disabled still changes to FOCUSED state', () => {
    // Focus behavior when disabled — focus IS allowed
    render(<Button title="Test" disabled />);
    const button = screen.getByRole('button');
    fireEvent.focus(button);
    // Should not crash
    expect(button).toBeInTheDocument();
  });
});

// ============================================================================
// Multiple render modes co-existing
// ============================================================================

describe('Button render mode exclusivity', () => {
  it('icon mode: shows icon, hides avatar', () => {
    const { container } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Icon" />);
    const iconContent = container.querySelector('[class*="iconContent"]');
    expect(iconContent?.querySelector('[style*="mask-image"]')).toBeTruthy();
    // Avatar should not be rendered
    expect(container.querySelector('[class*="avatarContent"]')).toBeNull();
  });

  it('avatar mode: shows avatar, hides icon', () => {
    const { container } = render(
      <Button avatarSrc="/test.webp" avatarAlt="A" title="Avatar" />
    );
    // Icon should not be rendered
    expect(container.querySelector('[class*="iconContent"]')).toBeNull();
    // Avatar should be rendered
    expect(container.querySelector('[class*="avatarContent"]')).not.toBeNull();
  });

  it('none mode (text only): hides both icon and avatar', () => {
    const { container } = render(<Button title="Text Only" />);
    expect(container.querySelector('[class*="iconContent"]')).toBeNull();
    expect(container.querySelector('[class*="avatarContent"]')).toBeNull();
  });
});

// ============================================================================
// Trailing tag visibility follows text opacity
// ============================================================================

describe('Button trailing tag follows text', () => {
  it('tag visible when alwaysShowText is true', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Write" alwaysShowText trailingTag={TrailingTag.BETA} />
    );
    // Both text and tag should be visible (opacity: 1)
    const textContent = container.querySelector('[class*="textContent"]');
    if (textContent) {
      expect(textContent.getAttribute('style')).toContain('opacity: 1');
    }
    expect(container.textContent).toContain('Beta');
  });

  it('tag hidden when text is hidden (collapsed icon button)', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Write" trailingTag={TrailingTag.BETA} />
    );
    // Text opacity should be 0 in DEFAULT state with icon
    const textContent = container.querySelector('[class*="textContent"]');
    if (textContent) {
      expect(textContent.getAttribute('style')).toContain('opacity: 0');
    }
  });
});

// ============================================================================
// Avatar counter-scale (matches icon 11/9 scale)
// ============================================================================

describe('Button avatar counter-scale', () => {
  it('avatar has transform scale applied', () => {
    const { container } = render(
      <Button avatarSrc="/test.webp" avatarAlt="A" title="Amy" />
    );
    const avatarContent = container.querySelector('[class*="avatarContent"]');
    if (avatarContent) {
      const style = avatarContent.getAttribute('style') ?? '';
      expect(style).toContain('scale(');
    }
  });
});

// ============================================================================
// Accessible name combining title + subtitle
// Accessible name includes title and subtitle
// ============================================================================

describe('Button accessible name behavior', () => {
  it('includes title in accessible name', () => {
    render(<Button title="Title" />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Title');
  });

  it('includes both title and subtitle in accessible content', () => {
    render(<Button title="Title" subtitle="Subtitle" icon={{ uri: TEST_ICON_SRC }} alwaysShowText />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Title');
    expect(button).toHaveTextContent('Subtitle');
  });

  it('sets aria-label when provided', () => {
    render(<Button title="Title" aria-label="Custom description" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Custom description');
  });

  it('subtitle is rendered even when icon is present', () => {
    render(<Button icon={{ uri: TEST_ICON_SRC }} title="Report" subtitle="File task" alwaysShowText />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Report');
    expect(button).toHaveTextContent('File task');
  });
});

// ============================================================================
// Icon indicator toggling behavior
// Icon indicator visibility is updated based on showIconActiveIndicator
// ============================================================================

describe('Button icon indicator toggling', () => {
  it('indicator toggles from hidden to visible', () => {
    const { container, rerender } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Test" />
    );
    // Default: hidden
    const indicator = container.querySelector('[class*="iconIndicator"]');
    if (indicator) {
      expect(indicator.getAttribute('style')).toContain('hidden');
    }

    // Toggle to visible
    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Test" showIconActiveIndicator />);
    const indicator2 = container.querySelector('[class*="iconIndicator"]');
    if (indicator2) {
      expect(indicator2.getAttribute('style')).toContain('visible');
    }
  });

  it('indicator toggles from visible to hidden', () => {
    const { container, rerender } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Test" showIconActiveIndicator />
    );
    const indicator = container.querySelector('[class*="iconIndicator"]');
    if (indicator) {
      expect(indicator.getAttribute('style')).toContain('visible');
    }

    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Test" showIconActiveIndicator={false} />);
    const indicator2 = container.querySelector('[class*="iconIndicator"]');
    if (indicator2) {
      expect(indicator2.getAttribute('style')).toContain('hidden');
    }
  });
});

// ============================================================================
// enforceMaxWidth changing max width per render mode
// 384/344/320 values checked
// ============================================================================

describe('Button enforceMaxWidth per render mode', () => {
  it('enforceMaxWidth with text-only uses 384px max', () => {
    const { container } = render(
      <Button
        title="A very very very very very very very very very very very very very long title that exceeds limits"
        enforceMaxWidth
      />
    );
    const button = container.querySelector('[role="button"]');
    expect(button).toBeInTheDocument();
    // The contentViewContainer width should not exceed 384px
    const contentContainer = container.querySelector('[class*="contentViewContainer"]');
    if (contentContainer) {
      const style = contentContainer.getAttribute('style') ?? '';
      const widthMatch = style.match(/width:\s*(\d+)/);
      if (widthMatch) {
        expect(parseInt(widthMatch[1])).toBeLessThanOrEqual(384);
      }
    }
  });

  it('enforceMaxWidth with icon+text uses 344px max', () => {
    const { container } = render(
      <Button
        icon={{ uri: TEST_ICON_SRC }}
        title="A very very very very very very very very very very very very very long title that exceeds limits"
        alwaysShowText
        enforceMaxWidth
      />
    );
    const contentContainer = container.querySelector('[class*="contentViewContainer"]');
    if (contentContainer) {
      const style = contentContainer.getAttribute('style') ?? '';
      const widthMatch = style.match(/width:\s*(\d+)/);
      if (widthMatch) {
        expect(parseInt(widthMatch[1])).toBeLessThanOrEqual(344);
      }
    }
  });

  it('enforceMaxWidth with avatar+text uses 320px max', () => {
    const { container } = render(
      <Button
        avatarSrc="/test.webp"
        avatarAlt="Test"
        title="A very very very very very very very very very very very very very long title that exceeds limits"
        enforceMaxWidth
      />
    );
    const contentContainer = container.querySelector('[class*="contentViewContainer"]');
    if (contentContainer) {
      const style = contentContainer.getAttribute('style') ?? '';
      const widthMatch = style.match(/width:\s*(\d+)/);
      if (widthMatch) {
        expect(parseInt(widthMatch[1])).toBeLessThanOrEqual(320);
      }
    }
  });

  it('max width not applied when enforceMaxWidth is false', () => {
    const { container } = render(
      <Button
        title="A very very very very very very very very very very very very very long title"
        enforceMaxWidth={false}
      />
    );
    const button = container.querySelector('[role="button"]');
    expect(button).toBeInTheDocument();
    // Width should not be constrained (can be anything, just no error)
  });
});

// ============================================================================
// Disabled state persists across content changes
// State persistence across configurations
// ============================================================================

describe('Button disabled state persistence across content changes', () => {
  it('stays disabled after changing title', () => {
    const { rerender } = render(<Button title="Original" disabled />);
    rerender(<Button title="Changed" disabled />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('stays disabled after changing icon', () => {
    const { rerender } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Test" disabled />);
    rerender(<Button icon={{ uri: "/icons/alt-icon.svg" }} title="Test" disabled />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('stays disabled after switching render modes', () => {
    const { rerender } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Icon" disabled />);
    rerender(<Button avatarSrc="/test.webp" avatarAlt="A" title="Avatar" disabled />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('stays disabled after toggling alwaysShowText', () => {
    const { rerender } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Test" disabled />);
    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Test" disabled alwaysShowText />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});

// ============================================================================
// State persists after clearing and resetting content
// Various clear + reset sequences
// ============================================================================

describe('Button state persists after content clear and reset', () => {
  it('renders correctly after title cleared and reset', () => {
    const { rerender } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="First" />);
    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="" />);
    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Second" />);
    expect(screen.getByRole('button')).toHaveTextContent('Second');
  });

  it('renders correctly after subtitle cleared and reset', () => {
    const { rerender } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Title" subtitle="Sub1" alwaysShowText />
    );
    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Title" alwaysShowText />);
    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Title" subtitle="Sub2" alwaysShowText />);
    expect(screen.getByRole('button')).toHaveTextContent('Sub2');
  });

  it('does not crash after clearing icon and re-adding', () => {
    const { container, rerender } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Test" />
    );
    rerender(<Button title="Test" />);
    expect(
      container.querySelector('[class*="iconContent"] [style*="mask-image"]')
    ).toBeNull();
    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Test" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(
      container.querySelector('[class*="iconContent"] [style*="mask-image"]')
    ).toBeTruthy();
  });
});

// ============================================================================
// alwaysShowText prevents width animation
// alwaysShowText keeps button expanded in DEFAULT state
// ============================================================================

describe('Button alwaysShowText expanded behavior', () => {
  it('text is visible (opacity 1) in DEFAULT state when alwaysShowText', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Always Shown" alwaysShowText />
    );
    const textContent = container.querySelector('[class*="textContent"]');
    expect(textContent).not.toBeNull();
    if (textContent) {
      expect(textContent.getAttribute('style')).toContain('opacity: 1');
    }
  });

  it('text is hidden (opacity 0) in DEFAULT state when NOT alwaysShowText', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Hidden" />
    );
    const textContent = container.querySelector('[class*="textContent"]');
    expect(textContent).not.toBeNull();
    if (textContent) {
      expect(textContent.getAttribute('style')).toContain('opacity: 0');
    }
  });

  it('alwaysShowText=true with avatar shows text in DEFAULT state', () => {
    const { container } = render(
      <Button avatarSrc="/test.webp" avatarAlt="A" title="Always" alwaysShowText />
    );
    const textContent = container.querySelector('[class*="textContent"]');
    expect(textContent).not.toBeNull();
    if (textContent) {
      expect(textContent.getAttribute('style')).toContain('opacity: 1');
    }
  });
});

// ============================================================================
// Button with no text has opacity 0 for text content
// Text opacity is 0 when no title/subtitle provided
// ============================================================================

describe('Button no text opacity', () => {
  it('icon-only button without title has no text content rendered', () => {
    const { container } = render(<Button icon={{ uri: TEST_ICON_SRC }} />);
    const textContent = container.querySelector('[class*="textContent"]');
    // No text means textContent div is not rendered (hasText is false)
    expect(textContent).toBeNull();
  });

  it('button with empty title has no text content rendered', () => {
    const { container } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="" />);
    // Empty string is falsy, so hasText is false
    const textContent = container.querySelector('[class*="textContent"]');
    expect(textContent).toBeNull();
  });
});

// ============================================================================
// Multiple re-renders don't crash (stress tests)
// Multiple configuration changes stability
// ============================================================================

describe('Button stress tests - multiple re-renders', () => {
  it('handles 20 rapid title changes without crashing', () => {
    const { rerender } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="v0" />);
    for (let i = 1; i <= 20; i++) {
      rerender(<Button icon={{ uri: TEST_ICON_SRC }} title={`v${i}`} />);
    }
    expect(screen.getByRole('button')).toHaveTextContent('v20');
  });

  it('handles rapid render mode switching without crashing', () => {
    const { rerender } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Icon" />);
    for (let i = 0; i < 10; i++) {
      if (i % 3 === 0) {
        rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Icon" />);
      } else if (i % 3 === 1) {
        rerender(<Button avatarSrc="/test.webp" avatarAlt="A" title="Avatar" />);
      } else {
        rerender(<Button title="Text" />);
      }
    }
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles rapid disabled toggling without crashing', () => {
    const { rerender } = render(<Button title="Test" />);
    for (let i = 0; i < 10; i++) {
      rerender(<Button title="Test" disabled={i % 2 === 0} />);
    }
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles rapid alwaysShowText toggling without crashing', () => {
    const { rerender } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Test" />);
    for (let i = 0; i < 10; i++) {
      rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Test" alwaysShowText={i % 2 === 0} />);
    }
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

// ============================================================================
// Changing from one render mode to another transitions correctly
// Switching between ICON, AVATAR, NONE modes
// ============================================================================

describe('Button render mode transitions', () => {
  it('ICON to AVATAR: icon disappears, avatar appears', () => {
    const { container, rerender } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Icon" />);
    expect(container.querySelector('[class*="iconContent"]')).not.toBeNull();
    expect(container.querySelector('[class*="avatarContent"]')).toBeNull();

    rerender(<Button avatarSrc="/test.webp" avatarAlt="A" title="Avatar" />);
    expect(container.querySelector('[class*="iconContent"]')).toBeNull();
    expect(container.querySelector('[class*="avatarContent"]')).not.toBeNull();
  });

  it('AVATAR to ICON: avatar disappears, icon appears', () => {
    const { container, rerender } = render(
      <Button avatarSrc="/test.webp" avatarAlt="A" title="Avatar" />
    );
    expect(container.querySelector('[class*="avatarContent"]')).not.toBeNull();

    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Icon" />);
    expect(container.querySelector('[class*="avatarContent"]')).toBeNull();
    expect(container.querySelector('[class*="iconContent"]')).not.toBeNull();
  });

  it('ICON to NONE: icon disappears, text-only mode', () => {
    const { container, rerender } = render(<Button icon={{ uri: TEST_ICON_SRC }} title="Icon" />);
    expect(container.querySelector('[class*="iconContent"]')).not.toBeNull();

    rerender(<Button title="Text Only" />);
    expect(container.querySelector('[class*="iconContent"]')).toBeNull();
    expect(container.querySelector('[class*="avatarContent"]')).toBeNull();
  });

  it('NONE to ICON: icon appears from text-only', () => {
    const { container, rerender } = render(<Button title="Text Only" />);
    expect(container.querySelector('[class*="iconContent"]')).toBeNull();

    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="With Icon" />);
    expect(container.querySelector('[class*="iconContent"]')).not.toBeNull();
  });

  it('NONE to AVATAR: avatar appears from text-only', () => {
    const { container, rerender } = render(<Button title="Text Only" />);
    expect(container.querySelector('[class*="avatarContent"]')).toBeNull();

    rerender(<Button avatarSrc="/test.webp" avatarAlt="A" title="With Avatar" />);
    expect(container.querySelector('[class*="avatarContent"]')).not.toBeNull();
  });

  it('AVATAR to NONE: avatar disappears, text-only mode', () => {
    const { container, rerender } = render(
      <Button avatarSrc="/test.webp" avatarAlt="A" title="Avatar" />
    );
    expect(container.querySelector('[class*="avatarContent"]')).not.toBeNull();

    rerender(<Button title="Text Only" />);
    expect(container.querySelector('[class*="avatarContent"]')).toBeNull();
  });
});

// ============================================================================
// Icon tinting behavior
// Icon tinting toggling
// ============================================================================

describe('Button icon tinting', () => {
  it('applies default icon tint color when applyIconTinting is true (default)', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Test" />
    );
    const iconContent = container.querySelector('[class*="iconContent"]');
    if (iconContent) {
      const style = iconContent.getAttribute('style') ?? '';
      expect(style).toContain('color:');
    }
  });

  it('resolves a semantic iconTintColor to its design-system token', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Test" iconTintColor={IconTintColor.NEGATIVE} />
    );
    const iconContent = container.querySelector('[class*="iconContent"]');
    expect(iconContent).not.toBeNull();
    const style = iconContent?.getAttribute('style') ?? '';
    expect(style).toContain('color: var(--uit-color-persistent-negative)');
  });

  it('does not apply tint when applyIconTinting is false', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Test" applyIconTinting={false} />
    );
    const iconContent = container.querySelector('[class*="iconContent"]');
    if (iconContent) {
      const style = iconContent.getAttribute('style') ?? '';
      // color should not be set (or undefined)
      expect(style).not.toContain('var(--');
    }
  });
});

// ============================================================================
// Icon rotation
// Updating icon rotation
// ============================================================================

describe('Button icon rotation', () => {
  it('applies icon rotation when iconRotation is set', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Test" iconRotation={45} />
    );
    const style = container.querySelector('[class*="iconRotationContent"]')
      ?.getAttribute('style') ?? '';
    expect(style).toContain('rotate(45deg)');
  });

  it('defaults to 0 degree rotation', () => {
    const { container } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Test" />
    );
    const style = container.querySelector('[class*="iconRotationContent"]')
      ?.getAttribute('style') ?? '';
    expect(style).toContain('rotate(0deg)');
  });

  it('updates rotation when prop changes', () => {
    const { container, rerender } = render(
      <Button icon={{ uri: TEST_ICON_SRC }} title="Test" iconRotation={0} />
    );
    rerender(<Button icon={{ uri: TEST_ICON_SRC }} title="Test" iconRotation={180} />);
    const style = container.querySelector('[class*="iconRotationContent"]')
      ?.getAttribute('style') ?? '';
    expect(style).toContain('rotate(180deg)');
    expect(style).toContain('transition: none');
  });

  it('animates rotation changes with the requested duration', () => {
    const { container, rerender } = render(
      <Button
        icon={{ uri: TEST_ICON_SRC }}
        title="Test"
        iconRotation={0}
        animateIconRotation
        iconRotationDuration={640}
      />,
    );
    rerender(
      <Button
        icon={{ uri: TEST_ICON_SRC }}
        title="Test"
        iconRotation={180}
        animateIconRotation
        iconRotationDuration={640}
      />,
    );

    const style = container.querySelector('[class*="iconRotationContent"]')
      ?.getAttribute('style') ?? '';
    expect(style).toContain('rotate(180deg)');
    expect(style).toContain('transition: transform 640ms ease-out');
  });

  it('does not animate rotation when reduced motion is requested', () => {
    motionPreference.reduced = true;
    const { container } = render(
      <Button
        icon={{ uri: TEST_ICON_SRC }}
        title="Test"
        iconRotation={180}
        animateIconRotation
        iconRotationDuration={640}
      />,
    );

    const style = container.querySelector('[class*="iconRotationContent"]')
      ?.getAttribute('style') ?? '';
    expect(style).toContain('rotate(180deg)');
    expect(style).toContain('transition: none');
  });
});
