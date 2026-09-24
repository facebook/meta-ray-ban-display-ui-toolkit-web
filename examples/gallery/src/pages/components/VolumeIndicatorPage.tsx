/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { VolumeIndicator } from '@wearables-ui-toolkit/mrbd';
import speakerLowFilled from '@wearables-ui-toolkit/icons/svg/speakerlow__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function VolumeIndicatorPage() {
  return (
    <GalleryPage title="VolumeIndicator">
      <DemoSection
        title="Volume feedback"
        description="Horizontal indicators with custom and icon-free presentations."
      >
        <VolumeIndicator icon={speakerLowFilled} value={0.25} aria-label="Volume" />
        <VolumeIndicator icon={speakerLowFilled} value={0.7} aria-label="Volume" />
        <VolumeIndicator icon={null} value={0.5} aria-label="Volume" />
      </DemoSection>
      <GuidancePanel
        summary="VolumeIndicator provides visual feedback for the current volume level. It displays application-controlled state and is not an interactive volume control."
        useWhen={<ul><li>A volume change needs immediate visual feedback.</li></ul>}
        capabilities={<ul><li>Default, custom, or hidden icon; configurable value range; optional value animation; and accessible value announcements.</li></ul>}
        avoid={<ul><li>Using it as the control that changes volume.</li><li>Using it to represent values unrelated to volume.</li></ul>}
      />
    </GalleryPage>
  );
}
