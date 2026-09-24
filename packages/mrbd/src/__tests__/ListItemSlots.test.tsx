/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarShape } from '../mrbd/ui/Avatar';
import { StatusIndicatorType } from '../mrbd/ui/Avatar.types';
import {
  SubtitleTextColor,
  TimestampPosition,
} from '../mrbd/ui/ListItem';
import { IconTintColor } from '../mrbd/ui/IconTintColor';
import { TimestampTextColor } from '../mrbd/ui/TimestampTextColor';
import {
  ListItemLeadingSlot,
  ListItemSecondLine,
  ListItemTrailingSlot,
} from '../mrbd/ui/private/ListItemSlots';

describe('ListItemSlots', () => {
  it('renders the icon leading slot when no avatar is present', () => {
    const { container } = render(
      <ListItemLeadingSlot
        layout={{ hasLeading: true, hasAvatar: false }}
        icon={{ uri: '/icons/test-icon.svg' }}
        avatarAlt="Avatar"
        avatarShape={AvatarShape.CIRCLE}
      />,
    );

    const icon = container.querySelector('[style*="mask-image"]');
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute('style')).toContain('/icons/test-icon.svg');
  });

  it('renders the avatar leading slot when an avatar is present', () => {
    render(
      <ListItemLeadingSlot
        layout={{ hasLeading: true, hasAvatar: true }}
        avatarSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"
        avatarAlt="Jane"
        avatarShape={AvatarShape.CIRCLE}
      />,
    );

    expect(screen.getAllByRole('img', { name: 'Jane' })).toHaveLength(2);
  });

  it('renders avatar leading slot content within Avatar-owned slots', () => {
    render(
      <ListItemLeadingSlot
        layout={{ hasLeading: true, hasAvatar: true }}
        avatarPrimaryContent={<span data-testid="slot-avatar-primary">P</span>}
        avatarSecondaryContent={<span data-testid="slot-avatar-secondary">S</span>}
        avatarBadgeContent={<span data-testid="slot-avatar-badge">B</span>}
        avatarAlt="Jane"
        avatarShape={AvatarShape.CIRCLE}
      />,
    );

    expect(screen.getByTestId('slot-avatar-primary')).toBeInTheDocument();
    expect(screen.getByTestId('slot-avatar-secondary')).toBeInTheDocument();
    expect(screen.getByTestId('slot-avatar-badge')).toBeInTheDocument();
  });

  it('renders subtitle text with inline timestamp divider', () => {
    render(
      <ListItemSecondLine
        layout={{
          effectiveSubtitle: 'Message preview',
          showSubtitleTimestamp: true,
        }}
        subtitleTextColor={SubtitleTextColor.SECONDARY}
        subtitleMaxLines={1}
        timestamp="2m ago"
      />,
    );

    const subtitle = screen.getByText('Message preview');
    const divider = screen.getByText('\u2022');
    const timestamp = screen.getByText('2m ago');

    expect(subtitle.style.mixBlendMode).toBe('lighten');
    expect(divider.style.mixBlendMode).toBe('lighten');
    expect(timestamp.style.mixBlendMode).toBe('lighten');
  });

  it('renders the subtitle text directly without hyphen non-breaking wrappers', () => {
    // The subtitle renders as plain text that ellipsizes at the end, with no
    // special hyphenated-token non-breaking wrapping and no extra segments.
    const { container } = render(
      <ListItemSecondLine
        layout={{
          effectiveSubtitle: 'This is multi-line text',
          showSubtitleTimestamp: false,
        }}
        subtitleTextColor={SubtitleTextColor.SECONDARY}
        subtitleMaxLines={3}
      />,
    );

    expect(container.textContent).toContain('This is multi-line text');
    expect(
      container.querySelector('[class*="nonBreakingTextSegment"]'),
    ).toBeNull();
  });

  it('renders accessory timestamp and status indicator content', () => {
    render(
      <ListItemTrailingSlot
        layout={{
          hasTrailingContent: true,
          showAccessoryTimestamp: true,
          showSubtitleTimestamp: false,
          effectiveHasStatus: true,
          hasStatusIcons: false,
          effectiveShowSwitch: false,
          effectiveShowRadio: false,
          effectiveHasAccessoryIcon: false,
          effectiveHasTag: false,
          accessoryIconOpacity: 1,
        }}
        timestampPosition={TimestampPosition.ACCESSORY}
        timestamp="10:30"
        statusIndicator={{
          type: StatusIndicatorType.POSITIVE,
          contentDescription: 'Active',
        }}
        checked={false}
        disabled={false}
      />,
    );

    expect(screen.getByText('10:30')).toBeInTheDocument();
    const dot = screen.getByLabelText('Active');
    expect(dot).toBeInTheDocument();
    expect(dot.getAttribute('style')).toContain(
      'var(--uit-color-persistent-positive',
    );
  });

  it('resolves the status indicator token from the semantic type', () => {
    render(
      <ListItemTrailingSlot
        layout={{
          hasTrailingContent: true,
          showAccessoryTimestamp: false,
          showSubtitleTimestamp: false,
          effectiveHasStatus: true,
          hasStatusIcons: false,
          effectiveShowSwitch: false,
          effectiveShowRadio: false,
          effectiveHasAccessoryIcon: false,
          effectiveHasTag: false,
          accessoryIconOpacity: 1,
        }}
        timestampPosition={TimestampPosition.ACCESSORY}
        statusIndicator={{ type: StatusIndicatorType.ACTIVE }}
        checked={false}
        disabled={false}
      />,
    );

    const dot = screen.getByLabelText('Active Status');
    expect(dot).toBeInTheDocument();
    expect(dot.getAttribute('style')).toContain(
      'var(--uit-color-persistent-active',
    );
  });

  it('reserves an empty trailing spacer for inline subtitle timestamps', () => {
    const { container } = render(
      <ListItemTrailingSlot
        layout={{
          hasTrailingContent: true,
          showAccessoryTimestamp: false,
          showSubtitleTimestamp: true,
          effectiveHasStatus: false,
          hasStatusIcons: false,
          effectiveShowSwitch: false,
          effectiveShowRadio: false,
          effectiveHasAccessoryIcon: false,
          effectiveHasTag: false,
          accessoryIconOpacity: 1,
        }}
        timestampPosition={TimestampPosition.SUBTITLE}
        timestamp="5m"
        checked={false}
        disabled={false}
      />,
    );

    expect(
      container.querySelector('[class*="timestampStatusContainer"]'),
    ).not.toBeNull();
    expect(screen.queryByText('5m')).toBeNull();
  });

  it('top-aligns accessory top timestamp trailing slots', () => {
    const { container } = render(
      <ListItemTrailingSlot
        layout={{
          hasTrailingContent: true,
          showAccessoryTimestamp: true,
          showSubtitleTimestamp: false,
          effectiveHasStatus: false,
          hasStatusIcons: false,
          effectiveShowSwitch: false,
          effectiveShowRadio: false,
          effectiveHasAccessoryIcon: false,
          effectiveHasTag: false,
          accessoryIconOpacity: 1,
        }}
        timestampPosition={TimestampPosition.ACCESSORY_TOP}
        timestamp="10:30"
        checked={false}
        disabled={false}
      />,
    );

    expect(
      container.querySelector('[class*="trailingSlotTopAligned"]'),
    ).not.toBeNull();
  });

  it('renders trailing beta tags through the list item tag material', () => {
    render(
      <ListItemTrailingSlot
        layout={{
          hasTrailingContent: true,
          showAccessoryTimestamp: false,
          showSubtitleTimestamp: false,
          effectiveHasStatus: false,
          hasStatusIcons: false,
          effectiveShowSwitch: false,
          effectiveShowRadio: false,
          effectiveHasAccessoryIcon: false,
          effectiveHasTag: true,
          accessoryIconOpacity: 1,
        }}
        timestampPosition={TimestampPosition.ACCESSORY}
        checked={false}
        disabled={false}
        trailingTagLabel="Beta"
      />,
    );

    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('tints the leading icon with the resolved icon-tint token', () => {
    const { container } = render(
      <ListItemLeadingSlot
        layout={{ hasLeading: true, hasAvatar: false }}
        icon={{ uri: '/icons/test-icon.svg' }}
        iconTintColor={IconTintColor.NEGATIVE}
        avatarAlt="Avatar"
        avatarShape={AvatarShape.CIRCLE}
      />,
    );

    const style = container
      .querySelector('[class*="iconContainer"]')
      ?.getAttribute('style') ?? '';
    expect(style).toContain('color: var(--uit-color-persistent-negative)');
  });

  it('tints the secondary icon and the inline timestamp', () => {
    const { container } = render(
      <ListItemSecondLine
        layout={{
          effectiveSubtitle: 'Preview',
          showSubtitleTimestamp: true,
        }}
        secondaryIcon={{ uri: '/icons/sec.svg' }}
        secondaryIconTintColor={IconTintColor.ACCENT}
        subtitleTextColor={SubtitleTextColor.SECONDARY}
        subtitleMaxLines={1}
        timestamp="2m"
        timestampTextColor={TimestampTextColor.ACCENT}
      />,
    );

    const secondaryStyle = container
      .querySelector('[class*="secondaryIcon"]')
      ?.getAttribute('style') ?? '';
    expect(secondaryStyle).toContain('color: var(--uit-color-icon-accent)');

    const timestampStyle = container
      .querySelector('[class*="subtitleTimestamp"]')
      ?.getAttribute('style') ?? '';
    expect(timestampStyle).toContain('color: var(--uit-color-text-accent)');
  });

  it('tints accessory icon and status icons in the trailing slot', () => {
    const { container } = render(
      <ListItemTrailingSlot
        layout={{
          hasTrailingContent: true,
          showAccessoryTimestamp: false,
          showSubtitleTimestamp: false,
          effectiveHasStatus: true,
          hasStatusIcons: true,
          effectiveShowSwitch: false,
          effectiveShowRadio: false,
          effectiveHasAccessoryIcon: false,
          effectiveHasTag: false,
          accessoryIconOpacity: 1,
        }}
        timestampPosition={TimestampPosition.ACCESSORY}
        statusIndicatorIcons={[
          { icon: { uri: '/a.svg' }, accessibilityContentDescription: 'A' },
        ]}
        statusIndicatorIconTintColor={IconTintColor.WARNING}
        checked={false}
        disabled={false}
      />,
    );

    const statusStyle = container
      .querySelector('[class*="statusIndicatorIcon"]:not([class*="statusIndicatorIcons"])')
      ?.getAttribute('style') ?? '';
    expect(statusStyle).toContain('color: var(--uit-color-persistent-warning)');
  });

  it('constrains URI accessory icons to the ListItem icon geometry', () => {
    const { container } = render(
      <ListItemTrailingSlot
        layout={{
          hasTrailingContent: true,
          showAccessoryTimestamp: false,
          showSubtitleTimestamp: false,
          effectiveHasStatus: false,
          hasStatusIcons: false,
          effectiveShowSwitch: false,
          effectiveShowRadio: false,
          effectiveHasAccessoryIcon: true,
          effectiveHasTag: false,
          accessoryIconOpacity: 1,
        }}
        timestampPosition={TimestampPosition.ACCESSORY}
        accessoryIcon={{ uri: '/icons/phone.svg' }}
        checked={false}
        disabled={false}
      />,
    );

    const icon = container.querySelector(
      '[class*="accessoryIconContainer"] > [style*="mask-image"]',
    );
    expect(icon?.className).toContain('accessoryIcon');
  });
});
