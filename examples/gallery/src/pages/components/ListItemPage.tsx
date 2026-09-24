/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { ListItem, StatusIndicatorType, SubtitleTextColor, TimestampPosition, TimestampTextColor, TrailingTag } from '@wearables-ui-toolkit/mrbd';
import archiveFilled from '@wearables-ui-toolkit/icons/svg/archive__filled.svg';
import bellFilled from '@wearables-ui-toolkit/icons/svg/bell__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import circleCheckFilled from '@wearables-ui-toolkit/icons/svg/circlecheck__filled.svg';
import speakerLowFilled from '@wearables-ui-toolkit/icons/svg/speakerlow__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';
import { galleryAvatarPortrait } from '../../galleryAssets';

const avatarPortrait = galleryAvatarPortrait;

export function ListItemPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<'scenic' | 'direct'>('scenic');
  const [volume, setVolume] = useState(0.4);

  return (
    <GalleryPage title="ListItem">
      <DemoSection
        title="Text and identity"
        description="Rows can use a title, supporting text, and either a leading icon or a rich avatar. Consecutive items use the component's own spacing."
      >
        <div className="gallery-listitem-group">
          <ListItem
            title="Saved places"
            subtitle="12 locations"
            icon={bookmarkFilled}
            onClick={() => {}}
          />
          <ListItem
            title="Jordan Lee"
            subtitle="Shared a coastal route"
            timestamp="2m"
            timestampPosition={TimestampPosition.SUBTITLE}
            timestampTextColor={TimestampTextColor.SECONDARY}
            avatarSrc={avatarPortrait}
            avatarAlt="Portrait of Jordan Lee"
            avatarStatusIndicator={StatusIndicatorType.ACTIVE}
            onClick={() => {}}
          />
          <ListItem
            title="Route alert"
            subtitle="North path temporarily closed"
            subtitleTextColor={SubtitleTextColor.WARNING}
            secondaryIcon={bellFilled}
            onClick={() => {}}
          />
          <ListItem
            title="Trip summary"
            subtitle="The waterfront route is clear and the overlook remains open."
            subtitleMaxLines={2}
            onClick={() => {}}
          />
        </div>
      </DemoSection>
      <DemoSection
        title="Trailing information"
        description="Use one trailing treatment to communicate recency, status, availability, or a concise label."
      >
        <div className="gallery-listitem-group">
          <ListItem
            title="Download complete"
            subtitle="Ready offline"
            timestamp="Now"
            timestampPosition={TimestampPosition.ACCESSORY_TOP}
            icon={archiveFilled}
            onClick={() => {}}
          />
          <ListItem
            title="Route preview"
            subtitle="Try the updated map"
            trailingTag={TrailingTag.BETA}
            icon={bookmarkFilled}
            onClick={() => {}}
          />
          <ListItem
            title="Map synchronized"
            subtitle="All saved places are current"
            statusIndicator={{
              type: StatusIndicatorType.POSITIVE,
              contentDescription: 'Synchronized',
            }}
            statusIndicatorIcons={[
              {
                icon: circleCheckFilled,
                accessibilityContentDescription: 'Download verified',
              },
            ]}
            icon={archiveFilled}
            onClick={() => {}}
          />
          <ListItem
            title="Saved for later"
            subtitle="Focus to reveal its bookmark status"
            accessoryIcon={bookmarkFilled}
            accessoryIconAlwaysVisible={false}
            onClick={() => {}}
          />
        </div>
      </DemoSection>
      <DemoSection
        title="Integrated controls"
        description="A row can own one switch or radio control, or become a full-width slider adjusted with left and right input."
      >
        <div className="gallery-listitem-group">
          <ListItem
            title="Notifications"
            subtitle="Important route updates"
            icon={bellFilled}
            showSwitch
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
          <ListItem
            title="Scenic route"
            subtitle="42 minutes"
            showRadioButton
            checked={selectedRoute === 'scenic'}
            onCheckedChange={(isChecked) => {
              if (isChecked) {
                setSelectedRoute('scenic');
              }
            }}
          />
          <ListItem
            title="Direct route"
            subtitle="28 minutes"
            showRadioButton
            checked={selectedRoute === 'direct'}
            onCheckedChange={(isChecked) => {
              if (isChecked) {
                setSelectedRoute('direct');
              }
            }}
          />
          <ListItem
            ariaLabel="Media volume"
            icon={speakerLowFilled}
            showSlider
            sliderMinimumValue={0}
            sliderMaximumValue={1}
            sliderValue={volume}
            sliderIncrementPercentage={0.1}
            onSliderValueChange={setVolume}
          />
        </div>
      </DemoSection>
      <GuidancePanel
        summary="ListItem is a complete interactive row for navigation, settings, selection, adjustment, or concise status. Its built-in slots establish the intended hierarchy and alignment."
        useWhen={<ul><li>Related rows share a consistent information structure.</li><li>A setting or choice benefits from a row-sized switch, radio target, or slider.</li><li>Concise metadata or status belongs beside one primary row action.</li></ul>}
        capabilities={<ul><li>Optional title and supporting text, including one- or two-line subtitles, semantic subtitle colors, a secondary-line icon, and separate accessibility descriptions for each text field.</li><li>A leading icon or avatar. Avatars can use primary, secondary, and badge images or content, alternate shapes and placeholders, and a status indicator with an optional glyph.</li><li>Timestamps can appear centered or top-aligned in the trailing slot, or inline with the subtitle, with semantic text colors and a dedicated accessibility description.</li><li>Choose one primary trailing treatment: switch, radio button, timestamp, described status dot and status icons, focus-revealed or always-visible accessory icon, or the supported trailing tag.</li><li>Slider mode replaces the text area with a full-width adjustable value and supports configurable minimum, maximum, step percentage, value, and change handling.</li><li>Leading, secondary, accessory, and status icons support semantic tints. ListItem also inherits Container capabilities such as custom material, disabled state, click and focus-state handling, semantic HTML, and ARIA labeling.</li></ul>}
        avoid={<ul><li>Adding margins or gaps between consecutive list items.</li><li>Adding another rounded container around each row.</li><li>Combining competing trailing modes or unrelated controls in one item.</li><li>Adding chevrons or arrows to indicate that a row opens another page.</li></ul>}
      />
    </GalleryPage>
  );
}
