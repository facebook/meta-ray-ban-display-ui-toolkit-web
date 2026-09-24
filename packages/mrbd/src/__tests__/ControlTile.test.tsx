/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ControlTile tests
 *
 * Constants:
 * - Min height: 120px
 * - Icon container: 72x72px
 * - Icon size: 32px (no progress), 24px (with progress)
 * - Corner radius: MEDIUM (32px)
 * - Checked: toggle switch behavior
 * - Progress: horizontal SliderBar, DPAD left/right
 */

import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import { ControlTile } from '../mrbd/ui/ControlTile';
import {
  CONTROL_TILE_DEFAULT_TITLE_MAX_LINES,
  CONTROL_TILE_ICON_CONTAINER_SIZE,
  CONTROL_TILE_ICON_SCALE_HORIZONTAL_PROGRESS,
  CONTROL_TILE_ICON_SIZE_LARGE,
  CONTROL_TILE_ICON_SIZE_MEDIUM,
} from '../mrbd/ui/private/ControlTileMetrics';
import {
  getControlTileAriaState,
  getControlTileIconScale,
  getControlTileIconSize,
  getControlTileProgressMode,
  shouldHandleControlTileProgressKey,
  shouldShowControlTileIconBackground,
} from '../mrbd/ui/private/ControlTileLayout';
import {
  CONTROL_TILE_DEFAULT_ICON_OVERLAY_BACKGROUND,
  getControlTileIconOverlayStyle,
  getControlTileIconTintColor,
} from '../mrbd/ui/private/ControlTileMaterials';
import { IconTintColor } from '../mrbd/ui/IconTintColor';
import {
  State,
  VisualState,
} from '@wearables-ui-toolkit/foundation/base/Interactions';
import { MaterialColors } from '@wearables-ui-toolkit/foundation/colors/Colors';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import { preserveFocusedInteractableDuringNavigation } from '@wearables-ui-toolkit/foundation/navigation/FocusRetention';
import { drawLayer } from './helpers/canvasRecorder';

const TEST_ICON_SRC = '/icons/test-icon.svg';
const TEST_ICON: IconSource = { uri: TEST_ICON_SRC };

function getFocusableSlider() {
  const slider = screen
    .getAllByRole('slider')
    .find((element) => element.getAttribute('tabindex') === '0');
  expect(slider).toBeDefined();
  return slider!;
}

// ============================================================================
// Initialization (default values)
// ============================================================================

describe('ControlTile initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<ControlTile />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('renders with title', () => {
    const { container } = render(<ControlTile title="Wi-Fi" />);
    expect(container.textContent).toContain('Wi-Fi');
  });

  it('renders with icon', () => {
    const { container } = render(
      <ControlTile title="Setting" icon={TEST_ICON} />
    );
    const maskSpan = container.querySelector('[style*="mask-image"]');
    expect(maskSpan).not.toBeNull();
    expect(maskSpan?.getAttribute('style')).toContain(TEST_ICON_SRC);
  });
});

// ============================================================================
// Title / Icon visibility (title/icon setting)
// ============================================================================

describe('ControlTile title and icon', () => {
  it('title text is displayed', () => {
    const { container } = render(<ControlTile title="Bluetooth" />);
    const titleEl = container.querySelector('[class*="titleText"]');
    expect(titleEl).not.toBeNull();
    expect(titleEl?.textContent).toBe('Bluetooth');
  });

  it('icon is rendered in icon container', () => {
    const { container } = render(<ControlTile icon={TEST_ICON} />);
    const iconView = container.querySelector('[class*="iconImageView"]');
    expect(iconView).not.toBeNull();
    const maskSpan = iconView?.querySelector('[style*="mask-image"]');
    expect(maskSpan).not.toBeNull();
    expect(maskSpan?.getAttribute('style')).toContain(TEST_ICON_SRC);
  });

  it('hides icon when not provided', () => {
    const { container } = render(<ControlTile title="No Icon" />);
    expect(container.querySelector('[class*="iconImageView"]')).toBeNull();
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();
  });

  it('title updates on rerender', () => {
    const { container, rerender } = render(<ControlTile title="First" />);
    expect(container.textContent).toContain('First');
    rerender(<ControlTile title="Second" />);
    expect(container.textContent).toContain('Second');
  });

  it('titleMaxLines defaults to 2', () => {
    const { container } = render(<ControlTile title="Long text here" />);
    const titleEl = container.querySelector('[class*="titleText"]');
    const style = titleEl?.getAttribute('style') ?? '';
    expect(style).toContain(`-webkit-line-clamp: ${CONTROL_TILE_DEFAULT_TITLE_MAX_LINES}`);
  });

  it('titleMaxLines can be customized', () => {
    const { container } = render(<ControlTile title="Long" titleMaxLines={1} />);
    const titleEl = container.querySelector('[class*="titleText"]');
    const style = titleEl?.getAttribute('style') ?? '';
    expect(style).toContain('-webkit-line-clamp: 1');
  });
});

// ============================================================================
// Checked / Toggle state (checked property, accessibility)
// ============================================================================

describe('ControlTile checked state', () => {
  it('has role=button by default (no toggle)', () => {
    render(<ControlTile title="Test" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has role=switch when checked is boolean', () => {
    render(<ControlTile title="Test" checked={false} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('checked=true shows as checked', () => {
    render(<ControlTile title="Wi-Fi" checked={true} />);
    const el = screen.getByRole('switch');
    expect(el).toBeInTheDocument();
    expect(el.getAttribute('aria-checked')).toBe('true');
  });

  it('checked=false shows as unchecked', () => {
    render(<ControlTile title="Wi-Fi" checked={false} />);
    const el = screen.getByRole('switch');
    expect(el).toBeInTheDocument();
    expect(el.getAttribute('aria-checked')).toBe('false');
  });
});

// ============================================================================
// Progress bar (circular/horizontal progress, mutual exclusivity)
// ============================================================================

describe('ControlTile progress bar', () => {
  it('shows horizontal progress bar when enabled', () => {
    const { container } = render(
      <ControlTile title="Volume" showHorizontalProgressBar progress={0.5} icon={TEST_ICON} />
    );
    const slider = container.querySelector('[class*="sliderBarContainer"]');
    expect(slider).not.toBeNull();
  });

  it('hides progress bar by default', () => {
    const { container } = render(<ControlTile title="Test" />);
    const slider = container.querySelector('[class*="sliderBarContainer"]');
    expect(slider).toBeNull();
  });

  it('progress value is passed to SliderBar', () => {
    const { container } = render(
      <ControlTile showHorizontalProgressBar progress={0.75} icon={TEST_ICON} />
    );
    const slider = container.querySelector('[class*="sliderBarContainer"]');
    expect(slider).not.toBeNull();
  });
});

// ============================================================================
// Circular progress bar (showCircularProgressBar)
// ============================================================================

describe('ControlTile circular progress bar', () => {
  it('renders circular progress when enabled', () => {
    const { container } = render(
      <ControlTile title="Volume" showCircularProgressBar progress={0.7} icon={TEST_ICON} />
    );
    const circular = container.querySelector('[class*="circularProgress"]');
    expect(circular).not.toBeNull();
  });

  it('title stays visible with circular progress (unlike horizontal)', () => {
    const { container } = render(
      <ControlTile title="Volume" showCircularProgressBar progress={0.5} icon={TEST_ICON} />
    );
    expect(container.textContent).toContain('Volume');
  });

  it('title fades out with horizontal progress', () => {
    const { container } = render(
      <ControlTile title="Volume" showHorizontalProgressBar progress={0.5} icon={TEST_ICON} />
    );
    const title = container.querySelector('[class*="titleText"]');
    expect(title).toHaveStyle({
      opacity: '0',
      pointerEvents: 'none',
    });
  });

  it('circular and horizontal are mutually exclusive', () => {
    const { container } = render(
      <ControlTile
        showCircularProgressBar
        showHorizontalProgressBar
        progress={0.5}
        icon={TEST_ICON}
      />
    );
    const slider = container.querySelector('[class*="sliderBarContainer"]');
    const circular = container.querySelector('[class*="circularProgress"]');
    expect(slider).not.toBeNull();
    expect(circular).toHaveStyle({
      opacity: '0',
      pointerEvents: 'none',
    });
  });

  it('ArrowRight is ignored with circular progress', () => {
    const handleIncrement = vi.fn();
    render(
      <ControlTile
        showCircularProgressBar
        progress={0.5}
        onIncrement={handleIncrement}
        icon={TEST_ICON}
      />
    );
    const tile = getFocusableSlider();
    fireEvent.keyDown(tile, { key: 'ArrowRight' });
    fireEvent.keyUp(tile, { key: 'ArrowRight' });
    expect(handleIncrement).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Key events (DPAD left/right for increment/decrement)
// ============================================================================

describe('ControlTile key handling (DPAD)', () => {
  it('ArrowRight calls onIncrement with current progress', () => {
    const handleIncrement = vi.fn();
    render(
      <ControlTile
        showHorizontalProgressBar
        progress={0.5}
        onIncrement={handleIncrement}
        icon={TEST_ICON}
      />
    );
    const tile = getFocusableSlider();
    fireEvent.keyDown(tile, { key: 'ArrowRight' });
    expect(handleIncrement).not.toHaveBeenCalled();
    fireEvent.keyUp(tile, { key: 'ArrowRight' });
    expect(handleIncrement).toHaveBeenCalledWith(0.5);
  });

  it('ArrowLeft calls onDecrement with current progress', () => {
    const handleDecrement = vi.fn();
    render(
      <ControlTile
        showHorizontalProgressBar
        progress={0.5}
        onDecrement={handleDecrement}
        icon={TEST_ICON}
      />
    );
    const tile = getFocusableSlider();
    fireEvent.keyDown(tile, { key: 'ArrowLeft' });
    expect(handleDecrement).not.toHaveBeenCalled();
    fireEvent.keyUp(tile, { key: 'ArrowLeft' });
    expect(handleDecrement).toHaveBeenCalledWith(0.5);
  });

  it('ignores arrow keys when no progress bar', () => {
    const handleIncrement = vi.fn();
    render(
      <ControlTile title="Test" onIncrement={handleIncrement} />
    );
    const tile = screen.getByRole('button');
    fireEvent.keyDown(tile, { key: 'ArrowRight' });
    fireEvent.keyUp(tile, { key: 'ArrowRight' });
    expect(handleIncrement).not.toHaveBeenCalled();
  });

  it('ignores arrow keys when disabled', () => {
    const handleIncrement = vi.fn();
    render(
      <ControlTile
        showHorizontalProgressBar
        progress={0.5}
        onIncrement={handleIncrement}
        disabled
        icon={TEST_ICON}
      />
    );
    const tile = getFocusableSlider();
    const keyDownNotPrevented = fireEvent.keyDown(tile, { key: 'ArrowRight' });
    fireEvent.keyUp(tile, { key: 'ArrowRight' });
    expect(keyDownNotPrevented).toBe(true);
    expect(handleIncrement).not.toHaveBeenCalled();
  });

  it('keeps directional focus trapped when lockFocus is enabled', () => {
    const handleKeyDown = vi.fn();
    render(<ControlTile title="Brightness" lockFocus onKeyDown={handleKeyDown} />);

    const prevented = !fireEvent.keyDown(screen.getByRole('button'), {
      key: 'ArrowDown',
    });

    expect(prevented).toBe(true);
    expect(handleKeyDown).not.toHaveBeenCalled();
  });

  it('reports locked focus loss when focus is cleared programmatically', () => {
    const handleLockedFocusLost = vi.fn();
    render(
      <ControlTile
        title="Brightness"
        lockFocus
        onLockedFocusLost={handleLockedFocusLost}
      />,
    );

    const tile = screen.getByRole('button');
    fireEvent.focus(tile);
    fireEvent.blur(tile);

    expect(handleLockedFocusLost).toHaveBeenCalledTimes(1);
  });

  it('retains focused visuals during same-document browser navigation', async () => {
    const handleStateChange = vi.fn();
    const browserRoot = document.createElement('div');
    browserRoot.id = 'root';
    browserRoot.tabIndex = -1;
    browserRoot.setAttribute('role', 'region');
    document.body.appendChild(browserRoot);
    render(
      <ControlTile title="Brightness" onStateChange={handleStateChange} />,
      { container: browserRoot },
    );
    const tile = screen.getByRole('button');
    act(() => {
      tile.focus();
    });
    handleStateChange.mockClear();

    const stopPreservingFocus = preserveFocusedInteractableDuringNavigation();
    await act(async () => {
      browserRoot.focus();
      await Promise.resolve();
    });

    expect(document.activeElement).toBe(tile);
    expect(
      handleStateChange.mock.calls.some(([, next]) => next.state === State.DEFAULT),
    ).toBe(false);
    stopPreservingFocus();
    browserRoot.remove();
  });

  it('tracks every later focus owner during same-document navigation', async () => {
    const browserRoot = document.createElement('div');
    browserRoot.tabIndex = -1;
    document.body.appendChild(browserRoot);
    const view = render(
      <>
        <ControlTile title="First" />
        <ControlTile title="Second" />
        <ControlTile title="Third" />
      </>,
      { container: browserRoot },
    );
    const [first, second, third] = screen.getAllByRole('button');
    let stopPreservingFocus: (() => void) | null = null;

    try {
      await act(async () => {
        first.focus();
        stopPreservingFocus = preserveFocusedInteractableDuringNavigation();
        second.focus();
        third.focus();
        browserRoot.focus();
        await Promise.resolve();
      });

      expect(document.activeElement).toBe(third);
    } finally {
      stopPreservingFocus?.();
      view.unmount();
      browserRoot.remove();
    }
  });
});

// ============================================================================
// Icon container sizing (72x72px)
// ============================================================================

describe('ControlTile icon container (72x72px)', () => {
  it('icon container has correct dimensions', () => {
    const { container } = render(<ControlTile icon={TEST_ICON} title="Test" />);
    const iconBg = container.querySelector('[class*="iconContainerBackground"]');
    const style = iconBg?.getAttribute('style') ?? '';
    expect(style).toContain(`width: ${CONTROL_TILE_ICON_CONTAINER_SIZE}`);
    expect(style).toContain(`height: ${CONTROL_TILE_ICON_CONTAINER_SIZE}`);
  });
});

// ============================================================================
// Accessibility
// ============================================================================

describe('ControlTile accessibility', () => {
  it('aria-label from title', () => {
    render(<ControlTile title="Brightness" />);
    const el = screen.getByRole('button');
    expect(el.getAttribute('aria-label')).toBe('Brightness');
  });

  it('no aria-label when no title', () => {
    render(<ControlTile icon={TEST_ICON} />);
    const el = screen.getByRole('button');
    expect(el.getAttribute('aria-label')).toBeNull();
  });

  it('progress role takes priority over switch role', () => {
    render(
      <ControlTile
        title="Volume"
        checked={true}
        showHorizontalProgressBar
        progress={0.6}
        icon={TEST_ICON}
      />
    );
    const el = getFocusableSlider();
    expect(el.getAttribute('aria-valuenow')).toBe('0.6');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('1');
  });
});

// ============================================================================
// Click handler
// ============================================================================

describe('ControlTile click', () => {
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<ControlTile title="Test" onClick={handleClick} />);
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Material integration
// ============================================================================

describe('ControlTile material', () => {
  it('has background layers', () => {
    const { container } = render(<ControlTile title="Test" />);
    expect(container.querySelector('[class*="backgroundLayers"]')).not.toBeNull();
  });

  it('has foreground layers', () => {
    const { container } = render(<ControlTile title="Test" />);
    expect(container.querySelector('[class*="foregroundLayers"]')).not.toBeNull();
  });

  it('renders custom icon container material as the focused icon background', () => {
    const { container } = render(
      <ControlTile
        title="Test"
        icon={TEST_ICON}
        iconContainerMaterial={MaterialLibrary.default()}
      />
    );

    const iconMaterial = container.querySelector('[class*="iconMaterialBackground"]');
    expect(iconMaterial).not.toBeNull();
    expect(iconMaterial?.querySelector('[class*="backgroundLayers"]')).not.toBeNull();
  });

  it('keeps checked icon container material mounted for checked-state motion', () => {
    const { container } = render(
      <ControlTile
        title="Test"
        icon={TEST_ICON}
        checked={false}
        checkedIconContainerMaterial={MaterialLibrary.panel()}
      />
    );

    const checkedIconMaterial = container.querySelector(
      '[class*="iconMaterialBackground"]',
    );
    expect(checkedIconMaterial).not.toBeNull();
    expect(checkedIconMaterial?.getAttribute('style') ?? '').toContain(
      'opacity: 0',
    );
    expect(checkedIconMaterial?.getAttribute('style') ?? '').toMatch(
      /transition: opacity/,
    );
  });

  it('shows checked icon container material when initially checked', () => {
    const { container } = render(
      <ControlTile
        title="Test"
        icon={TEST_ICON}
        checked
        checkedIconContainerMaterial={MaterialLibrary.panel()}
      />
    );

    const checkedIconMaterial = container.querySelector(
      '[class*="iconMaterialBackground"]',
    );
    expect(checkedIconMaterial).not.toBeNull();
    expect(checkedIconMaterial?.getAttribute('style') ?? '').toContain(
      'opacity: 1',
    );
  });

  it('uses the default checked icon material when omitted', () => {
    const { container } = render(
      <ControlTile title="Test" icon={TEST_ICON} checked />
    );

    const checkedIconMaterial = container.querySelector(
      '[class*="iconMaterialBackground"]',
    );
    expect(checkedIconMaterial).not.toBeNull();
    expect(checkedIconMaterial?.getAttribute('style') ?? '').toContain(
      'opacity: 1',
    );
  });

  it('uses the checked icon material layer structure', () => {
    const material = MaterialLibrary.controlTileCheckedIcon();

    const backgroundLayers = material.getBackgroundLayers();
    expect(backgroundLayers.map(layer => layer.id)).toEqual([
      'control-tile-checked-icon-background',
    ]);
    const fills = drawLayer(backgroundLayers[0], {
      state: VisualState.FOCUSED,
    }).ofType('fill');
    expect(fills).toHaveLength(1);
    expect(fills[0].style?.fillStyle).toBe(MaterialColors.strokeHighlight);
  });

  it('allows the default checked icon material to be disabled', () => {
    const { container } = render(
      <ControlTile
        title="Test"
        icon={TEST_ICON}
        checked
        checkedIconContainerMaterial={null}
      />
    );

    expect(
      container.querySelector('[class*="iconMaterialBackground"]'),
    ).toBeNull();
    expect(
      container.querySelector('[class*="iconImageView"]')?.getAttribute('style') ?? '',
    ).toContain('color: var(--uit-color-icon-primary)');
  });

  it('uses checked icon tint only while checked', () => {
    expect(getControlTileIconTintColor({
      checked: false,
      iconTintColor: IconTintColor.PRIMARY,
      checkedIconTintColor: IconTintColor.ON_CHECKED,
    })).toBe(IconTintColor.PRIMARY);
    expect(getControlTileIconTintColor({
      checked: true,
      iconTintColor: IconTintColor.PRIMARY,
      checkedIconTintColor: IconTintColor.ON_CHECKED,
    })).toBe(IconTintColor.ON_CHECKED);
    expect(getControlTileIconTintColor({
      checked: true,
      iconTintColor: IconTintColor.PRIMARY,
    })).toBe(IconTintColor.PRIMARY);
    expect(getControlTileIconTintColor({
      checked: true,
      usesDefaultCheckedIconMaterial: true,
    })).toBe(IconTintColor.ON_CHECKED);
    expect(getControlTileIconTintColor({
      checked: true,
    })).toBeUndefined();
  });

  it('resolves semantic icon tint to a design-system token', () => {
    const { container } = render(
      <ControlTile
        title="Test"
        icon={TEST_ICON}
        iconTintColor={IconTintColor.NEGATIVE}
      />
    );

    const iconView = container.querySelector('[class*="iconImageView"]');
    expect(iconView).not.toBeNull();
    expect(iconView?.getAttribute('style') ?? '').toContain(
      'color: var(--uit-color-persistent-negative)',
    );
  });

  it('resolves checked semantic icon tint to its checked token', () => {
    const { container, rerender } = render(
      <ControlTile
        checked
        title="Test"
        icon={TEST_ICON}
        iconTintColor={IconTintColor.PRIMARY}
        checkedIconTintColor={IconTintColor.ON_CHECKED}
      />
    );

    const getIconStyle = () =>
      container.querySelector('[class*="iconImageView"]')?.getAttribute('style') ?? '';

    expect(getIconStyle()).toContain(
      'color: var(--uit-color-button-primary-background)',
    );

    rerender(
      <ControlTile
        checked={false}
        title="Test"
        icon={TEST_ICON}
        iconTintColor={IconTintColor.PRIMARY}
        checkedIconTintColor={IconTintColor.ON_CHECKED}
      />
    );

    expect(getIconStyle()).toContain('color: var(--uit-color-icon-primary)');
  });

  it('pairs the default checked material with its checked foreground', () => {
    const { container, rerender } = render(
      <ControlTile checked title="Test" icon={TEST_ICON} />
    );
    const getIconStyle = () =>
      container.querySelector('[class*="iconImageView"]')?.getAttribute('style') ?? '';

    expect(getIconStyle()).toContain(
      'color: var(--uit-color-button-primary-background)',
    );

    rerender(
      <ControlTile checked={false} title="Test" icon={TEST_ICON} />
    );
    expect(getIconStyle()).toContain('color: var(--uit-color-icon-primary)');
  });
});

// ============================================================================
// Custom props
// ============================================================================

describe('ControlTile custom props', () => {
  it('accepts className', () => {
    const { container } = render(<ControlTile title="Test" className="my-tile" />);
    expect(container.firstElementChild?.className).toContain('my-tile');
  });

  it('accepts custom style', () => {
    const { container } = render(<ControlTile title="Test" style={{ margin: 8 }} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('margin: 8px');
  });
});

// ============================================================================
// Re-rendering
// ============================================================================

describe('ControlTile re-rendering', () => {
  it('handles checked toggle', () => {
    const { rerender } = render(<ControlTile title="Test" checked={false} />);
    rerender(<ControlTile title="Test" checked={true} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('handles progress updates', () => {
    const { container, rerender } = render(
      <ControlTile showHorizontalProgressBar progress={0.3} icon={TEST_ICON} />
    );
    rerender(
      <ControlTile showHorizontalProgressBar progress={0.8} icon={TEST_ICON} />
    );
    expect(container.querySelector('[class*="sliderBarContainer"]')).not.toBeNull();
  });
});

describe('ControlTile layout helpers', () => {
  it('uses horizontal progress priority when both modes are enabled', () => {
    expect(getControlTileProgressMode({
      showHorizontalProgressBar: true,
      showCircularProgressBar: true,
    })).toBe('horizontal');
  });

  it('sizes and scales icons per progress mode', () => {
    expect(getControlTileIconSize(false)).toBe(CONTROL_TILE_ICON_SIZE_LARGE);
    expect(getControlTileIconSize(true)).toBe(CONTROL_TILE_ICON_SIZE_MEDIUM);
    expect(getControlTileIconScale('horizontal')).toBe(
      CONTROL_TILE_ICON_SCALE_HORIZONTAL_PROGRESS
    );
    expect(getControlTileIconScale('circular')).toBe(1);
  });

  it('shows icon background for focused, checked, or custom material states', () => {
    expect(shouldShowControlTileIconBackground({
      state: State.FOCUSED,
      checked: null,
      hasIcon: true,
      progressMode: 'circular',
    })).toBe(true);
    expect(shouldShowControlTileIconBackground({
      state: State.DEFAULT,
      checked: true,
      hasIcon: true,
      progressMode: 'none',
    })).toBe(true);
    expect(shouldShowControlTileIconBackground({
      state: State.DEFAULT,
      checked: null,
      hasIcon: true,
      progressMode: 'none',
      hasIconContainerMaterial: true,
    })).toBe(true);
    expect(shouldShowControlTileIconBackground({
      state: State.DEFAULT,
      checked: null,
      hasIcon: true,
      progressMode: 'horizontal',
      hasIconContainerMaterial: true,
    })).toBe(false);
  });

  it('uses the static icon overlay material for default checked/focused states', () => {
    expect(getControlTileIconOverlayStyle({
      visible: true,
      transition: 'opacity 240ms ease',
    })).toMatchObject({
      opacity: 1,
      background: CONTROL_TILE_DEFAULT_ICON_OVERLAY_BACKGROUND,
      transition: 'opacity 240ms ease',
    });
    expect(CONTROL_TILE_DEFAULT_ICON_OVERLAY_BACKGROUND).toContain(
      'var(--uit-color-background-window, #000000)',
    );
    expect(CONTROL_TILE_DEFAULT_ICON_OVERLAY_BACKGROUND).not.toContain(
      'color-button-primary-targeted-highlight',
    );
  });

  it('only handles progress keys for enabled horizontal progress', () => {
    expect(shouldHandleControlTileProgressKey({
      showHorizontalProgressBar: true,
      disabled: false,
    })).toBe(true);
    expect(shouldHandleControlTileProgressKey({
      showHorizontalProgressBar: false,
      disabled: false,
    })).toBe(false);
    expect(shouldHandleControlTileProgressKey({
      showHorizontalProgressBar: true,
      disabled: true,
    })).toBe(false);
  });

  it('maps accessibility role priority correctly', () => {
    expect(getControlTileAriaState({
      title: 'Brightness',
      checked: true,
      progress: 0.25,
    })).toMatchObject({
      role: 'slider',
      ariaLabel: 'Brightness',
      ariaValueNow: 0.25,
      ariaValueMin: 0,
      ariaValueMax: 1,
    });
    expect(getControlTileAriaState({
      title: 'Wi-Fi',
      checked: false,
    })).toMatchObject({
      role: 'switch',
      ariaLabel: 'Wi-Fi',
      ariaChecked: false,
    });
  });
});
