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
import { ListItemContent } from '../mrbd/ui/private/ListItemContent';
import type { ListItemLayoutState } from '../mrbd/ui/private/ListItemLayout';
import {
  SubtitleTextColor,
  TimestampPosition,
} from '../mrbd/ui/ListItem.types';
import { SliderBarState } from '../mrbd/ui/SliderBar.types';

const baseLayout: ListItemLayoutState = {
  effectiveTitle: 'Settings',
  effectiveSubtitle: 'Manage preferences',
  effectiveShowSlider: false,
  effectiveShowSwitch: false,
  effectiveShowRadio: false,
  effectiveHasTimestamp: false,
  effectiveHasStatus: false,
  effectiveHasAccessoryIcon: false,
  effectiveHasTag: false,
  hasAvatar: false,
  hasIcon: false,
  hasLeading: false,
  hasStatusIcons: false,
  isMultiline: false,
  showAccessoryTimestamp: false,
  showSubtitleTimestamp: false,
  hasTrailingContent: false,
  accessoryIconOpacity: 0,
  ariaRole: 'button',
  sliderState: SliderBarState.IDLE,
};

describe('ListItemContent', () => {
  it('renders title and subtitle row content', () => {
    render(
      <ListItemContent
        layout={baseLayout}
        avatarAlt="Avatar"
        avatarShape={AvatarShape.CIRCLE}
        subtitleTextColor={SubtitleTextColor.SECONDARY}
        subtitleMaxLines={1}
        timestampPosition={TimestampPosition.ACCESSORY}
        checked={false}
        disabled={false}
        sliderValue={0}
        sliderMinimumValue={0}
        sliderMaximumValue={1}
      />,
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Manage preferences')).toBeInTheDocument();
  });

  it('renders the slider region as presentational (no nested slider role)', () => {
    const { container } = render(
      <ListItemContent
        layout={{
          ...baseLayout,
          effectiveTitle: undefined,
          effectiveSubtitle: undefined,
          effectiveShowSlider: true,
          ariaRole: 'slider',
          sliderState: SliderBarState.FOCUSED,
        }}
        avatarAlt="Avatar"
        avatarShape={AvatarShape.CIRCLE}
        subtitleTextColor={SubtitleTextColor.SECONDARY}
        subtitleMaxLines={1}
        timestampPosition={TimestampPosition.ACCESSORY}
        checked={false}
        disabled={false}
        sliderValue={0.5}
        sliderMinimumValue={0}
        sliderMaximumValue={1}
      />,
    );

    // The ListItem Container (not rendered here) owns the slider role/state.
    // The inner SliderBar must be presentational so screen readers don't see
    // a duplicate nested slider widget or an extra tab stop.
    expect(screen.queryByRole('slider')).toBeNull();
    const slider = container.querySelector('.sliderContainer > div') as HTMLElement;
    expect(slider).not.toBeNull();
    expect(slider).toHaveAttribute('aria-hidden', 'true');
    expect(slider).toHaveAttribute('tabindex', '-1');
    expect(slider).not.toHaveAttribute('aria-valuenow');
  });

  it('renders trailing tag content through the trailing slot', () => {
    render(
      <ListItemContent
        layout={{
          ...baseLayout,
          effectiveHasTag: true,
          hasTrailingContent: true,
        }}
        avatarAlt="Avatar"
        avatarShape={AvatarShape.CIRCLE}
        subtitleTextColor={SubtitleTextColor.SECONDARY}
        subtitleMaxLines={1}
        timestampPosition={TimestampPosition.ACCESSORY}
        checked={false}
        disabled={false}
        trailingTagLabel="Beta"
        sliderValue={0}
        sliderMinimumValue={0}
        sliderMaximumValue={1}
      />,
    );

    expect(screen.getByText('Beta')).toBeInTheDocument();
  });
});
