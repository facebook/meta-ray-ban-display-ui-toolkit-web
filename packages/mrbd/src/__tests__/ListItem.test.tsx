/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ListItem tests
 *
 * Container with MEDIUM corner radius, leading slot (icon/avatar),
 * text area (title/subtitle/timestamp), trailing slot (switch/radio/slider/tag/accessory).
 */

import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import type { MouseEvent } from 'react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { INVALID_FOCUS_DIRECTION_EVENT } from '@wearables-ui-toolkit/foundation/base/FocusCoordinator';
import {
  IconTintColor,
  ListItem,
  SubtitleTextColor,
  TimestampPosition,
  TimestampTextColor,
  TrailingTag,
} from '../mrbd/ui/ListItem';
import { StatusIndicatorType } from '../mrbd/ui/Avatar';
import {
  clampListItemSliderValue,
  getListItemContentDescription,
  getListItemLayoutState,
  getListItemSliderAnnouncementPercent,
  getListItemSliderNextValue,
  getListItemSliderState,
} from '../mrbd/ui/private/ListItemLayout';
import {
  LIST_ITEM_CONTROL_SLIDER_MIN_WIDTH,
  LIST_ITEM_DEFAULT_SLIDER_INCREMENT_PERCENTAGE,
  LIST_ITEM_ICON_END_MARGIN,
  LIST_ITEM_ICON_SIZE,
  LIST_ITEM_ICON_START_MARGIN,
  LIST_ITEM_MATERIAL_INSET,
  LIST_ITEM_MIN_HEIGHT,
  LIST_ITEM_SECONDARY_ICON_END_MARGIN,
  LIST_ITEM_SECONDARY_ICON_SIZE,
  LIST_ITEM_STATUS_INDICATORS_HEIGHT,
  LIST_ITEM_STATUS_INDICATOR_SIZE,
  LIST_ITEM_STATUS_ICON_SIZE,
  LIST_ITEM_TRAILING_ICON_CONTAINER_SIZE,
} from '../mrbd/ui/private/ListItemMetrics';
import {
  LIST_ITEM_TAG_IDLE_COLOR,
  screenBlendHex,
} from '../mrbd/ui/private/ListItemMaterials';
import { SliderBarState } from '../mrbd/ui/SliderBar';
import { TEST_ICON } from './helpers/testIcon';

describe('ListItem initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<ListItem title="Item" />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('applies a class name to the content layout', () => {
    const { container } = render(
      <ListItem contentClassName="custom-content" title="Item" />,
    );

    expect(container.querySelector('.custom-content')).not.toBeNull();
  });

  it('default role is button', () => {
    render(<ListItem title="Item" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('preserves router link props and native link semantics', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ListItem as={Link} to="/settings" title="Settings" />
        <Routes>
          <Route path="/settings" element={<div>Settings page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link).not.toHaveAttribute('role');
    fireEvent.click(link);
    expect(screen.getByText('Settings page')).toBeInTheDocument();
  });

  it('forwards the root mouse event so a router link can cancel navigation', () => {
    const onClick = vi.fn((event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
    });
    render(
      <MemoryRouter initialEntries={['/']}>
        <ListItem
          as={Link}
          to="/settings"
          title="Stay here"
          onClick={onClick}
        />
        <Routes>
          <Route path="/settings" element={<div>Settings page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(fireEvent.click(screen.getByRole('link', { name: 'Stay here' })))
      .toBe(false);
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByText('Settings page')).toBeNull();
  });
});

describe('ListItem title and subtitle', () => {
  it('renders title', () => {
    const { container } = render(<ListItem title="Settings" />);
    expect(container.textContent).toContain('Settings');
  });

  it('renders subtitle', () => {
    const { container } = render(<ListItem title="Wi-Fi" subtitle="Connected" />);
    expect(container.textContent).toContain('Connected');
  });

  it('title updates on rerender', () => {
    const { container, rerender } = render(<ListItem title="First" />);
    rerender(<ListItem title="Second" />);
    expect(container.textContent).toContain('Second');
  });
});

describe('ListItem leading slot', () => {
  it('renders icon from a URL source as a tinted mask', () => {
    const { container } = render(
      <ListItem title="Test" icon={{ uri: '/icons/li-icon.svg' }} />
    );
    const icon = container.querySelector('[style*="mask-image"]');
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute('style')).toContain('/icons/li-icon.svg');
  });

  it('renders a bundled vector token as inline svg', () => {
    const { container } = render(
      <ListItem title="Test" icon={TEST_ICON} />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('clears icon when icon removed', () => {
    const { container, rerender } = render(
      <ListItem title="Test" icon={{ uri: '/icons/li-icon.svg' }} />
    );
    expect(container.querySelector('[style*="mask-image"]')).toBeTruthy();
    rerender(<ListItem title="Test" />);
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();
  });

  it('renders avatar when avatarSrc provided', () => {
    const { container } = render(
      <ListItem title="Test" avatarSrc="/avatar.webp" />
    );
    const avatar = container.querySelector('[role="img"]');
    expect(avatar).not.toBeNull();
  });

  it('forwards avatar content slots to the leading avatar', () => {
    render(
      <ListItem
        title="Test"
        avatarPrimaryContent={<span data-testid="list-avatar-primary">P</span>}
        avatarSecondaryContent={<span data-testid="list-avatar-secondary">S</span>}
        avatarBadgeContent={<span data-testid="list-avatar-badge">B</span>}
      />
    );

    expect(screen.getByTestId('list-avatar-primary')).toBeInTheDocument();
    expect(screen.getByTestId('list-avatar-secondary')).toBeInTheDocument();
    expect(screen.getByTestId('list-avatar-badge')).toBeInTheDocument();
  });

  it('forwards avatar status indicator and glyph to the leading avatar', () => {
    const { container } = render(
      <ListItem
        title="Test"
        avatarSrc="/avatar.webp"
        avatarStatusIndicator={StatusIndicatorType.ACTIVE}
        avatarStatusIndicatorIcon={TEST_ICON}
      />
    );
    // The avatar badge dot lives inside an aria-hidden container, so it is not
    // in the a11y tree — query it by class rather than role.
    const statusDot = container.querySelector('[class*="statusDot"]');
    expect(statusDot).not.toBeNull();
    expect(statusDot).toHaveAttribute('aria-label', 'Active Status');
    expect(
      statusDot?.querySelector('[class*="statusIndicatorGlyph"] svg'),
    ).not.toBeNull();
  });

  it('avatar takes priority over icon', () => {
    const { container } = render(
      <ListItem title="Test" icon={{ uri: '/icons/li-icon.svg' }} avatarSrc="/avatar.webp" />
    );
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();
    expect(container.querySelector('[role="img"]')).not.toBeNull();
  });
});

describe('ListItem trailing switch', () => {
  it('role=switch when showSwitch', () => {
    render(<ListItem title="Toggle" showSwitch />);
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);
    expect(switches[0]).toHaveAttribute('aria-checked', 'false');
  });

  it('exposes the controlled switch state on the interactive row', () => {
    render(<ListItem title="Toggle" showSwitch checked />);

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('toggling switch calls onCheckedChange', () => {
    const handleChange = vi.fn();
    render(
      <ListItem title="Toggle" showSwitch checked={false} onCheckedChange={handleChange} />
    );
    // Click the outer ListItem container (first switch role)
    screen.getAllByRole('switch')[0].click();
    expect(handleChange).toHaveBeenCalledWith(true);
  });
});

describe('ListItem trailing radio', () => {
  it('role=radio when showRadioButton', () => {
    render(<ListItem title="Option" showRadioButton />);
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThan(0);
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
  });

  it('exposes the controlled radio state on the interactive row', () => {
    render(<ListItem title="Option" showRadioButton checked />);

    expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'true');
  });
});

describe('ListItem trailing slider', () => {
  it('role=slider when showSlider', () => {
    render(<ListItem showSlider sliderValue={0.5} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '1');
    expect(slider).toHaveAttribute('aria-valuenow', '0.5');
  });

  it('clamps the exposed slider value to its configured range', () => {
    render(
      <ListItem
        showSlider
        sliderMinimumValue={10}
        sliderMaximumValue={20}
        sliderValue={30}
      />,
    );

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '10');
    expect(slider).toHaveAttribute('aria-valuemax', '20');
    expect(slider).toHaveAttribute('aria-valuenow', '20');
    expect(slider).not.toHaveAttribute('aria-checked');
  });

  it('preserves explicit HTML accessibility overrides', () => {
    render(
      <ListItem
        showSlider
        sliderValue={0.5}
        aria-valuenow={0.75}
        aria-valuetext="Three quarters"
      />,
    );

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '0.75');
    expect(slider).toHaveAttribute('aria-valuetext', 'Three quarters');
  });

  it('ArrowRight increments slider', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <ListItem showSlider sliderValue={0.5} onSliderValueChange={handleChange} />
    );
    const keyTarget = container.firstElementChild!;
    fireEvent.keyDown(keyTarget, { key: 'ArrowRight' });
    expect(handleChange).not.toHaveBeenCalled();
    fireEvent.keyUp(keyTarget, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('does not consume slider arrows while disabled', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <ListItem
        showSlider
        sliderValue={0.5}
        onSliderValueChange={handleChange}
        disabled
      />
    );
    const keyTarget = container.firstElementChild!;

    expect(fireEvent.keyDown(keyTarget, { key: 'ArrowRight' })).toBe(true);
    expect(fireEvent.keyUp(keyTarget, { key: 'ArrowRight' })).toBe(true);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('allows vertical arrows to pass through to focus navigation', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <ListItem showSlider sliderValue={0.5} onSliderValueChange={handleChange} />
    );
    const keyTarget = container.firstElementChild!;

    expect(fireEvent.keyDown(keyTarget, { key: 'ArrowDown' })).toBe(true);
    expect(fireEvent.keyUp(keyTarget, { key: 'ArrowDown' })).toBe(true);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('uses vertical partial focus when showSlider is enabled', () => {
    const { container } = render(<ListItem showSlider sliderValue={0.5} />);
    const root = container.querySelector('[role="slider"]') as HTMLElement;
    const requestFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 1);

    act(() => {
      root.dispatchEvent(
        new CustomEvent(INVALID_FOCUS_DIRECTION_EVENT, {
          detail: { direction: 'right' },
        }),
      );
    });

    expect(requestFrameSpy).not.toHaveBeenCalled();

    act(() => {
      root.dispatchEvent(
        new CustomEvent(INVALID_FOCUS_DIRECTION_EVENT, {
          detail: { direction: 'down' },
        }),
      );
    });

    expect(requestFrameSpy).toHaveBeenCalledTimes(1);
    requestFrameSpy.mockRestore();
  });
});

describe('ListItem timestamp', () => {
  it('renders timestamp in accessory position', () => {
    const { container } = render(
      <ListItem title="Message" timestamp="2m ago" />
    );
    expect(container.textContent).toContain('2m ago');
  });

  it('renders timestamp inline with subtitle', () => {
    const { container } = render(
      <ListItem
        title="Chat"
        subtitle="Last message"
        timestamp="5m"
        timestampPosition={TimestampPosition.SUBTITLE}
      />
    );
    expect(container.textContent).toContain('5m');
  });
});

describe('ListItem trailing tag', () => {
  it('renders the design-system label resolved from the TrailingTag enum', () => {
    const { container } = render(
      <ListItem title="Feature" trailingTag={TrailingTag.BETA} />
    );
    expect(container.textContent).toContain('Beta');
  });

  it('renders no tag for TrailingTag.NONE', () => {
    const { container } = render(
      <ListItem title="Feature" trailingTag={TrailingTag.NONE} />
    );
    expect(container.textContent).not.toContain('Beta');
  });
});

describe('SubtitleTextColor enum', () => {
  it('has all values', () => {
    expect(SubtitleTextColor.PRIMARY).toBe('primary');
    expect(SubtitleTextColor.SECONDARY).toBe('secondary');
    expect(SubtitleTextColor.POSITIVE).toBe('positive');
    expect(SubtitleTextColor.WARNING).toBe('warning');
    expect(SubtitleTextColor.NEGATIVE).toBe('negative');
    expect(SubtitleTextColor.INFO).toBe('info');
  });
});

describe('TimestampPosition enum', () => {
  it('has all values', () => {
    expect(TimestampPosition.ACCESSORY).toBe('accessory');
    expect(TimestampPosition.ACCESSORY_TOP).toBe('accessoryTop');
    expect(TimestampPosition.SUBTITLE).toBe('subtitle');
  });
});

describe('ListItem icon tinting', () => {
  function iconContainerStyle(container: HTMLElement): string {
    return container
      .querySelector('[class*="iconContainer"]')
      ?.getAttribute('style') ?? '';
  }

  it('tints the primary icon with the resolved negative token', () => {
    const { container } = render(
      <ListItem
        title="Item"
        icon={{ uri: '/icons/li.svg' }}
        iconTintColor={IconTintColor.NEGATIVE}
      />
    );
    const style = iconContainerStyle(container);
    expect(style).toContain('color: var(--uit-color-persistent-negative)');
    expect(style).not.toContain('mix-blend-mode');
  });

  it('composites a SECONDARY primary icon tint with lighten', () => {
    const { container } = render(
      <ListItem
        title="Item"
        icon={{ uri: '/icons/li.svg' }}
        iconTintColor={IconTintColor.SECONDARY}
      />
    );
    const style = iconContainerStyle(container);
    expect(style).toContain('color: var(--uit-color-icon-secondary)');
    expect(style).toContain(
      'mix-blend-mode: lighten',
    );
  });

  it('tints the secondary icon with the resolved accent token', () => {
    const { container } = render(
      <ListItem
        title="Item"
        subtitle="Sub"
        secondaryIcon={{ uri: '/icons/sec.svg' }}
        secondaryIconTintColor={IconTintColor.ACCENT}
      />
    );
    const style = container
      .querySelector('[class*="secondaryIcon"]')
      ?.getAttribute('style') ?? '';
    expect(style).toContain('color: var(--uit-color-icon-accent)');
  });

  it('tints the accessory icon with the resolved action token', () => {
    const { container } = render(
      <ListItem
        title="Item"
        accessoryIcon={{ uri: '/icons/chevron.svg' }}
        accessoryIconTintColor={IconTintColor.ACTION}
      />
    );
    const style = container
      .querySelector('[class*="accessoryIconContainer"]')
      ?.getAttribute('style') ?? '';
    expect(style).toContain('color: var(--uit-color-persistent-action)');
  });

  it('applies the group status-icon tint to every status icon', () => {
    const { container } = render(
      <ListItem
        title="Item"
        statusIndicatorIconTintColor={IconTintColor.WARNING}
        statusIndicatorIcons={[
          { icon: { uri: '/a.svg' }, accessibilityContentDescription: 'A' },
          { icon: { uri: '/b.svg' }, accessibilityContentDescription: 'B' },
        ]}
      />
    );
    const icons = container.querySelectorAll('[class*="statusIndicatorIcon"]:not([class*="statusIndicatorIcons"])');
    expect(icons.length).toBeGreaterThanOrEqual(2);
    icons.forEach((icon) => {
      expect(icon.getAttribute('style') ?? '').toContain(
        'color: var(--uit-color-persistent-warning)',
      );
    });
  });

  it('lets the group status-icon tint override the per-icon tint', () => {
    const { container } = render(
      <ListItem
        title="Item"
        statusIndicatorIconTintColor={IconTintColor.WARNING}
        statusIndicatorIcons={[
          {
            icon: { uri: '/a.svg' },
            accessibilityContentDescription: 'A',
            tintColor: IconTintColor.POSITIVE,
          },
        ]}
      />
    );
    const style = container
      .querySelector('[class*="statusIndicatorIcon"]:not([class*="statusIndicatorIcons"])')
      ?.getAttribute('style') ?? '';
    expect(style).toContain('color: var(--uit-color-persistent-warning)');
    expect(style).not.toContain('var(--uit-color-persistent-positive)');
  });

  it('renders status icons before the status dot (icons to the left)', () => {
    const { container } = render(
      <ListItem
        title="Item"
        statusIndicator={{ type: StatusIndicatorType.ACTIVE }}
        statusIndicatorIcons={[
          { icon: { uri: '/a.svg' }, accessibilityContentDescription: 'A' },
        ]}
      />
    );
    const statusRow = container.querySelector(
      '[class*="statusIndicatorsContainer"]',
    );
    expect(statusRow).not.toBeNull();
    const children = Array.from(statusRow!.children);
    const iconsIdx = children.findIndex((c) =>
      /statusIndicatorIcons/.test(c.className.toString()),
    );
    const dotIdx = children.findIndex((c) =>
      /statusIndicatorDot/.test(c.className.toString()),
    );
    expect(iconsIdx).toBeGreaterThanOrEqual(0);
    expect(dotIdx).toBeGreaterThanOrEqual(0);
    expect(iconsIdx).toBeLessThan(dotIdx);
  });

  it('falls back to the per-icon status tint when no group override is set', () => {
    const { container } = render(
      <ListItem
        title="Item"
        statusIndicatorIcons={[
          {
            icon: { uri: '/a.svg' },
            accessibilityContentDescription: 'A',
            tintColor: IconTintColor.INFO,
          },
        ]}
      />
    );
    const style = container
      .querySelector('[class*="statusIndicatorIcon"]:not([class*="statusIndicatorIcons"])')
      ?.getAttribute('style') ?? '';
    expect(style).toContain('color: var(--uit-color-persistent-info)');
  });
});

describe('ListItem timestamp tinting', () => {
  it('tints the standalone accessory timestamp with the accent token', () => {
    const { container } = render(
      <ListItem
        title="Message"
        timestamp="2m"
        timestampTextColor={TimestampTextColor.ACCENT}
      />
    );
    const style = container
      .querySelector('[class*="timestampText"]')
      ?.getAttribute('style') ?? '';
    expect(style).toContain('color: var(--uit-color-text-accent)');
  });

  it('tints the inline subtitle timestamp and composites SECONDARY-style lighten', () => {
    const { container } = render(
      <ListItem
        title="Chat"
        subtitle="Last message"
        timestamp="5m"
        timestampPosition={TimestampPosition.SUBTITLE}
        timestampTextColor={TimestampTextColor.ACCENT}
      />
    );
    const style = container
      .querySelector('[class*="subtitleTimestamp"]')
      ?.getAttribute('style') ?? '';
    expect(style).toContain('color: var(--uit-color-text-accent)');
  });
});

describe('ListItem accessibility', () => {
  it('aria-label includes title and subtitle', () => {
    render(<ListItem title="Wi-Fi" subtitle="Connected" />);
    const btn = screen.getByRole('button');
    const label = btn.getAttribute('aria-label') ?? '';
    expect(label).toContain('Wi-Fi');
    expect(label).toContain('Connected');
  });
});

describe('ListItem click', () => {
  it('calls onClick', () => {
    const handleClick = vi.fn();
    render(<ListItem title="Test" onClick={handleClick} />);
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('ListItem material', () => {
  it('has background layers', () => {
    const { container } = render(<ListItem title="Test" />);
    expect(container.querySelector('[class*="backgroundLayers"]')).not.toBeNull();
  });
});

describe('ListItem custom props', () => {
  it('accepts className', () => {
    const { container } = render(<ListItem title="Test" className="my-li" />);
    const listItemEl = container.querySelector('[class*="listItem"]');
    expect(listItemEl?.className).toContain('my-li');
  });
});

describe('ListItem layout helpers', () => {
  it('uses the expected layout metrics', () => {
    expect(LIST_ITEM_MATERIAL_INSET).toBe(8);
    expect(LIST_ITEM_MIN_HEIGHT).toBe(120);
    expect(LIST_ITEM_ICON_SIZE).toBe(32);
    expect(LIST_ITEM_ICON_START_MARGIN).toBe(16);
    expect(LIST_ITEM_ICON_END_MARGIN).toBe(32);
    expect(LIST_ITEM_SECONDARY_ICON_SIZE).toBe(24);
    expect(LIST_ITEM_SECONDARY_ICON_END_MARGIN).toBe(6);
    expect(LIST_ITEM_TRAILING_ICON_CONTAINER_SIZE).toBe(56);
    expect(LIST_ITEM_STATUS_ICON_SIZE).toBe(24);
    expect(LIST_ITEM_STATUS_INDICATOR_SIZE).toBe(16);
    expect(LIST_ITEM_STATUS_INDICATORS_HEIGHT).toBe(28);
    expect(LIST_ITEM_CONTROL_SLIDER_MIN_WIDTH).toBe(200);
    expect(LIST_ITEM_DEFAULT_SLIDER_INCREMENT_PERCENTAGE).toBe(0.1);
  });

  it('maps interaction state to the slider state', () => {
    expect(getListItemSliderState(State.DEFAULT)).toBe(SliderBarState.IDLE);
    expect(getListItemSliderState(State.FOCUSED)).toBe(SliderBarState.FOCUSED);
    expect(getListItemSliderState(State.PRESSED)).toBe(SliderBarState.FOCUSED);
  });

  it('clamps and increments slider values using percentage math', () => {
    expect(clampListItemSliderValue(2, 0, 1)).toBe(1);
    expect(getListItemSliderNextValue({
      value: 0.5,
      minimumValue: 0,
      maximumValue: 1,
      increment: true,
    })).toBe(0.6);
    expect(getListItemSliderNextValue({
      value: 0.05,
      minimumValue: 0,
      maximumValue: 1,
      increment: false,
    })).toBe(0);
    expect(getListItemSliderAnnouncementPercent(0.42, 0, 1)).toBe(42);
    expect(getListItemSliderAnnouncementPercent(1, 1, 1)).toBe(100);
  });

  it('applies trailing-slot priority when status icons are present', () => {
    const layout = getListItemLayoutState({
      title: 'Status',
      subtitle: 'With icon',
      subtitleMaxLines: 1,
      timestampPosition: TimestampPosition.ACCESSORY,
      showSwitch: true,
      showRadioButton: true,
      showSlider: false,
      statusIndicatorIcons: [
        {
          icon: { uri: '/icons/muted.svg' },
          accessibilityContentDescription: 'Muted',
        },
      ],
      hasAccessoryIcon: true,
      accessoryIconAlwaysVisible: true,
      trailingTagLabel: 'Beta',
      hasAvatar: false,
      hasIcon: false,
      currentState: State.DEFAULT,
    });

    expect(layout.effectiveHasStatus).toBe(true);
    expect(layout.effectiveShowSwitch).toBe(false);
    expect(layout.effectiveShowRadio).toBe(false);
    expect(layout.effectiveHasAccessoryIcon).toBe(false);
    expect(layout.effectiveHasTag).toBe(false);
    expect(layout.hasTrailingContent).toBe(true);
    expect(layout.ariaRole).toBe('button');
  });

  it('reserves trailing spacer for inline subtitle timestamps', () => {
    const layout = getListItemLayoutState({
      title: 'Message',
      subtitle: 'Preview',
      subtitleMaxLines: 3,
      timestamp: '5m',
      timestampPosition: TimestampPosition.SUBTITLE,
      showSwitch: false,
      showRadioButton: false,
      showSlider: false,
      hasAccessoryIcon: false,
      accessoryIconAlwaysVisible: true,
      hasAvatar: true,
      hasIcon: false,
      currentState: State.DEFAULT,
    });

    expect(layout.showSubtitleTimestamp).toBe(true);
    expect(layout.hasTrailingContent).toBe(true);
  });

  it('builds accessible labels only from visible slots', () => {
    const layout = getListItemLayoutState({
      title: 'Handwriting',
      subtitle: 'Write with your hand',
      subtitleMaxLines: 1,
      timestampPosition: TimestampPosition.ACCESSORY,
      showSwitch: false,
      showRadioButton: false,
      showSlider: false,
      statusIndicatorIcons: [
        {
          icon: { uri: '/icons/muted.svg' },
          accessibilityContentDescription: 'Muted',
        },
      ],
      hasAccessoryIcon: false,
      accessoryIconAlwaysVisible: true,
      trailingTagLabel: 'Beta',
      hasAvatar: false,
      hasIcon: false,
      currentState: State.DEFAULT,
    });

    expect(getListItemContentDescription({
      layout,
      statusIndicatorIcons: [
        {
          icon: { uri: '/icons/muted.svg' },
          accessibilityContentDescription: 'Muted',
        },
      ],
      trailingTagLabel: 'Beta',
    })).toBe('Handwriting, Write with your hand, Muted');
  });

  it('uses the screen-blended trailing tag idle color', () => {
    expect(screenBlendHex('#27282D', '#27282D')).toBe(LIST_ITEM_TAG_IDLE_COLOR);
  });
});

describe('ListItem trailing-slot rendering', () => {
  it('does not render a switch when status icons are supplied', () => {
    render(
      <ListItem
        title="Status"
        showSwitch
        statusIndicatorIcons={[
          {
            icon: { uri: '/icons/muted.svg' },
            accessibilityContentDescription: 'Muted',
          },
        ]}
      />
    );

    expect(screen.queryAllByRole('switch')).toHaveLength(0);
    expect(screen.getByRole('button').getAttribute('aria-label')).toContain('Muted');
  });

  it('includes an explicit aria label before visible slot descriptions', () => {
    render(
      <ListItem
        title="Wi-Fi"
        subtitle="Connected"
        ariaLabel="Network setting"
      />
    );

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Network setting, Wi-Fi, Connected'
    );
  });
});
