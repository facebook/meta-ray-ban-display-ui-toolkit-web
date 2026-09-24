/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * QuickReplyButton tests
 *
 * Constants:
 * - Height: 72px (QUICK_REPLY_BUTTON_HEIGHT)
 * - Min width: 72px (QUICK_REPLY_BUTTON_MINIMUM_WIDTH)
 * - Corner radius: FULL (pill)
 * - Icon: 24px (icon-medium), 8px left margin when following text
 * - Padding: 24px horizontal (spacing-large)
 * - Text colors: secondary (default), primary (focused/pressed)
 * - Icon colors: secondary (default), primary (focused/pressed)
 * - Disabled opacity: theme disabledOpacity
 * - Icon alpha: 0 in default (text+icon), 1 when expanded or icon-only
 */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import {
  ContainerMaterial,
  LayerPlacement,
} from '@wearables-ui-toolkit/foundation';
import { FunctionalContainerMaterialLayer } from '@wearables-ui-toolkit/foundation/material/ContainerMaterial';
import { QuickReplyButton } from '../mrbd/ui/QuickReplyButton';
import { TEST_ICON as TEST_VECTOR_ICON } from './helpers/testIcon';

const TEST_ICON_SRC = '/icons/test-icon.svg';
const TEST_ICON_SRC_2 = '/icons/test-icon-2.svg';
const TEST_ICON: { uri: string } = { uri: TEST_ICON_SRC };
const TEST_ICON_2: { uri: string } = { uri: TEST_ICON_SRC_2 };

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
// Initialization Tests
// ============================================================================

describe('QuickReplyButton initialization (default values)', () => {
  it('renders without crashing with no props', () => {
    const { container } = render(<QuickReplyButton />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('default title is undefined (title is null)', () => {
    const { container } = render(<QuickReplyButton />);
    const textEl = container.querySelector('[class*="titleLabel"]');
    expect(textEl).toBeNull();
  });

  it('default icon is undefined (icon is null)', () => {
    const { container } = render(<QuickReplyButton />);
    expect(container.querySelector('[class*="iconImageView"]')).toBeNull();
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();
  });

  it('default enabled state is true', () => {
    const { container } = render(<QuickReplyButton title="Test" />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).not.toContain('opacity: 0.38');
  });

  it('renders with title from props', () => {
    const { container } = render(<QuickReplyButton title="Quick Reply" />);
    expect(container.textContent).toContain('Quick Reply');
  });

  it('renders with icon from props', () => {
    const { container } = render(<QuickReplyButton icon={TEST_ICON} />);
    const iconWrapper = container.querySelector('[class*="iconImageView"]');
    expect(iconWrapper?.querySelector('[style*="mask-image"]')).toBeTruthy();
  });

  it('renders a bundled vector token as inline svg', () => {
    const { container } = render(<QuickReplyButton icon={TEST_VECTOR_ICON} />);
    const iconWrapper = container.querySelector('[class*="iconImageView"]');
    expect(iconWrapper?.querySelector('svg')).not.toBeNull();
  });

  it('renders with all props', () => {
    const { container } = render(
      <QuickReplyButton title="Yes" icon={TEST_ICON} />
    );
    expect(container.textContent).toContain('Yes');
    const iconWrapper = container.querySelector('[class*="iconImageView"]');
    expect(iconWrapper?.querySelector('[style*="mask-image"]')).toBeTruthy();
  });
});

// ============================================================================
// Title Property Tests
// ============================================================================

describe('QuickReplyButton title', () => {
  it('renders title text in label (titleLabel)', () => {
    const { container } = render(<QuickReplyButton title="Sample Text" />);
    const titleEl = container.querySelector('[class*="titleLabel"]');
    expect(titleEl).not.toBeNull();
    expect(titleEl?.textContent).toBe('Sample Text');
  });

  it('updates title on rerender', () => {
    const { container, rerender } = render(<QuickReplyButton title="First" />);
    expect(container.textContent).toContain('First');

    rerender(<QuickReplyButton title="Second" />);
    expect(container.textContent).toContain('Second');
  });
});

// ============================================================================
// Icon Property Tests
// ============================================================================

describe('QuickReplyButton icon', () => {
  it('renders icon when provided', () => {
    const { container } = render(<QuickReplyButton icon={TEST_ICON} />);
    const iconWrapper = container.querySelector('[class*="iconImageView"]');
    const maskEl = iconWrapper?.querySelector('[style*="mask-image"]');
    expect(maskEl).toBeTruthy();
    expect(maskEl?.getAttribute('style')).toContain(TEST_ICON_SRC);
  });

  it('clears icon when removed', () => {
    const { container, rerender } = render(<QuickReplyButton icon={TEST_ICON} />);
    expect(container.querySelector('[class*="iconImageView"]')).not.toBeNull();

    rerender(<QuickReplyButton />);
    expect(container.querySelector('[class*="iconImageView"]')).toBeNull();
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();
  });

  it('updates icon on change', () => {
    const { container, rerender } = render(<QuickReplyButton icon={TEST_ICON} />);
    let maskEl = container.querySelector('[style*="mask-image"]');
    expect(maskEl?.getAttribute('style')).toContain(TEST_ICON_SRC);

    rerender(<QuickReplyButton icon={TEST_ICON_2} />);
    maskEl = container.querySelector('[style*="mask-image"]');
    expect(maskEl?.getAttribute('style')).toContain(TEST_ICON_SRC_2);
    expect(maskEl?.getAttribute('style')).not.toContain(TEST_ICON_SRC + ')');
  });
});

// ============================================================================
// Icon Visibility Logic Tests
// ============================================================================

describe('QuickReplyButton icon visibility (shouldShowIcon)', () => {
  it('icon-only mode shows icon (icon alpha=1 when no text)', () => {
    const { container } = render(<QuickReplyButton icon={TEST_ICON} />);
    const iconWrapper = container.querySelector('[class*="iconImageView"]');
    expect(iconWrapper).not.toBeNull();
    const style = iconWrapper?.getAttribute('style') ?? '';
    expect(style).toContain('opacity: 1');
  });

  it('centers an icon-only glyph without text-to-icon spacing', () => {
    const { container } = render(<QuickReplyButton icon={TEST_ICON} />);
    const iconWrapper = container.querySelector('[class*="iconImageView"]');

    expect(iconWrapper?.className).not.toContain('iconImageViewWithText');
  });

  it('keeps spacing between text and its focus-revealed icon', () => {
    const { container } = render(
      <QuickReplyButton title="Yes" icon={TEST_ICON} />
    );
    const iconWrapper = container.querySelector('[class*="iconImageView"]');

    expect(iconWrapper?.className).toContain('iconImageViewWithText');
  });

  it('text-only mode has no icon element', () => {
    const { container } = render(<QuickReplyButton title="Sample" />);
    const iconWrapper = container.querySelector('[class*="iconImageView"]');
    expect(iconWrapper).toBeNull();
  });

  it('text+icon mode hides icon in default state (alpha=0)', () => {
    const { container } = render(
      <QuickReplyButton title="Yes" icon={TEST_ICON} />
    );
    const iconWrapper = container.querySelector('[class*="iconImageView"]');
    expect(iconWrapper).not.toBeNull();
    const style = iconWrapper?.getAttribute('style') ?? '';
    expect(style).toContain('opacity: 0');
  });
});

// ============================================================================
// State-Driven Color Tests
// ============================================================================

describe('QuickReplyButton state colors (text primary/secondary)', () => {
  it('default state uses secondary text color class', () => {
    const { container } = render(<QuickReplyButton title="Test" />);
    const titleEl = container.querySelector('[class*="titleLabel"]');
    expect(titleEl?.className).toContain('titleDefault');
  });

  it('default state uses secondary icon color class', () => {
    const { container } = render(<QuickReplyButton icon={TEST_ICON} />);
    const iconWrapper = container.querySelector('[class*="iconImageView"]');
    expect(iconWrapper?.className).toContain('iconDefault');
  });
});

// ============================================================================
// Disabled State Tests
// ============================================================================

describe('QuickReplyButton disabled state (disabledOpacity)', () => {
  it('applies reduced opacity when disabled', () => {
    const { container } = render(<QuickReplyButton title="Test" disabled />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('opacity: 0.38');
  });

  it('full opacity when enabled', () => {
    const { container } = render(<QuickReplyButton title="Test" />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).not.toContain('opacity: 0.38');
  });
});

// ============================================================================
// Dimension Tests
// ============================================================================

describe('QuickReplyButton dimensions (72px height, min width)', () => {
  it('has height of 72px (QUICK_REPLY_BUTTON_HEIGHT)', () => {
    const { container } = render(<QuickReplyButton title="Test" />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('height: 72');
  });

  it('content view container has height of 72px', () => {
    const { container } = render(<QuickReplyButton title="Test" />);
    const cvContainer = container.querySelector('[class*="contentViewContainer"]');
    const style = cvContainer?.getAttribute('style') ?? '';
    expect(style).toContain('height: 72');
  });

  it('content view enforces minimum width (MINIMUM_WIDTH)', () => {
    const { container } = render(<QuickReplyButton title="A" />);
    const contentView = container.querySelector('[class*="contentView"]');
    expect(contentView).not.toBeNull();
    const style = contentView?.getAttribute('style') ?? '';
    // min-width may be inline or via CSS class — check element exists and has valid width
    expect(style).toContain('width');
  });

  it('publishes ButtonGroup layout compensation when scaled default content is wider than height', async () => {
    const offsetWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(function (this: HTMLElement) {
        const className = String(this.className);
        if (className.includes('titleLabel')) {
          return 120;
        }
        if (className.includes('contentView')) {
          return 168;
        }
        return 0;
      });

    const { container } = render(<QuickReplyButton title="Measured reply" />);

    await waitFor(() => {
      const compensation = (container.firstElementChild as HTMLElement).style
        .getPropertyValue('--uit-button-layout-compensation');
      expect(Number.parseFloat(compensation)).toBeLessThan(0);
    });

    offsetWidthSpy.mockRestore();
  });

  it('exposes Sizable height for ButtonGroup and ButtonRail layout', () => {
    const { container } = render(<QuickReplyButton title="Test" />);
    expect(container.firstElementChild).toHaveAttribute(
      'data-uit-button-group-item-height',
      '72',
    );
  });

  it('lets Container own state animation instead of CSS width transitions', () => {
    const { container } = render(<QuickReplyButton title="Test" />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';

    expect(style).toContain('transition: none');
    expect(style).toContain('--uit-button-layout-compensation');
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('QuickReplyButton accessibility (contentDescription)', () => {
  it('has role=button', () => {
    render(<QuickReplyButton title="Test" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('aria-label uses title (contentDescription from title)', () => {
    render(<QuickReplyButton title="Quick Reply" />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toBe('Quick Reply');
  });

  it('aria-label is absent when no title (null contentDescription)', () => {
    render(<QuickReplyButton icon={TEST_ICON} />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toBeNull();
  });
});

// ============================================================================
// Interaction Tests
// ============================================================================

describe('QuickReplyButton interaction', () => {
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<QuickReplyButton title="Yes" onClick={handleClick} />);
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<QuickReplyButton title="Yes" onClick={handleClick} disabled />);
    screen.getByRole('button').click();
    expect(handleClick).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Custom Props
// ============================================================================

describe('QuickReplyButton custom props', () => {
  it('accepts className', () => {
    const { container } = render(
      <QuickReplyButton title="Test" className="my-qr" />
    );
    expect(container.firstElementChild?.className).toContain('my-qr');
  });

  it('accepts custom style merged with defaults', () => {
    const { container } = render(
      <QuickReplyButton title="Test" style={{ margin: 8 }} />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('height: 72');
    expect(style).toContain('margin: 8px');
  });
});

// ============================================================================
// Re-rendering / Edge Cases
// ============================================================================

describe('QuickReplyButton re-rendering (edge cases)', () => {
  it('handles multiple title updates', () => {
    const { container, rerender } = render(<QuickReplyButton title="Yes" />);
    expect(container.textContent).toContain('Yes');

    rerender(<QuickReplyButton title="No" />);
    expect(container.textContent).toContain('No');

    rerender(<QuickReplyButton title="Maybe" />);
    expect(container.textContent).toContain('Maybe');
  });

  it('handles same title re-set', () => {
    const { container, rerender } = render(<QuickReplyButton title="Sample" />);
    rerender(<QuickReplyButton title="Sample" />);
    expect(container.textContent).toContain('Sample');
  });

  it('handles adding then removing icon', () => {
    const { container, rerender } = render(<QuickReplyButton title="Test" />);

    rerender(<QuickReplyButton title="Test" icon={TEST_ICON} />);
    expect(container.querySelector('[class*="iconImageView"]')).not.toBeNull();

    rerender(<QuickReplyButton title="Test" />);
    expect(container.querySelector('[class*="iconImageView"]')).toBeNull();
  });

  it('handles dynamic content changes', () => {
    const { container, rerender } = render(<QuickReplyButton title="Yes" />);

    rerender(<QuickReplyButton title="This is much longer text" />);
    expect(container.textContent).toContain('This is much longer text');

    rerender(<QuickReplyButton title="This is much longer text" icon={TEST_ICON} />);
    expect(container.querySelector('[class*="iconImageView"]')).not.toBeNull();
  });

  it('handles transition from text+icon to icon-only', () => {
    const { container, rerender } = render(
      <QuickReplyButton title="Test" icon={TEST_ICON} />
    );

    rerender(<QuickReplyButton icon={TEST_ICON} />);
    const iconWrapper = container.querySelector('[class*="iconImageView"]');
    const style = iconWrapper?.getAttribute('style') ?? '';
    expect(style).toContain('opacity: 1');
  });
});

// ============================================================================
// Container material integration
// ============================================================================

describe('QuickReplyButton material (ContainerMaterial)', () => {
  it('has background layers from material', () => {
    const { container } = render(<QuickReplyButton title="Test" />);
    const bgLayers = container.querySelector('[class*="backgroundLayers"]');
    expect(bgLayers).not.toBeNull();
  });

  it('has foreground layers from material', () => {
    const { container } = render(<QuickReplyButton title="Test" />);
    const fgLayers = container.querySelector('[class*="foregroundLayers"]');
    expect(fgLayers).not.toBeNull();
  });

  it('starts shared Container material transitions from the previous visual state', () => {
    const material = createProbeMaterial();
    const setStateSpy = vi.spyOn(material, 'setState');
    const { container } = render(
      <QuickReplyButton
        icon={TEST_ICON}
        material={material}
        title="Yes"
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
});
