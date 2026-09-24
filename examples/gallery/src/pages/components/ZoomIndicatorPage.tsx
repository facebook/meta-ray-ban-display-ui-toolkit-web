/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ZoomIndicator } from '@wearables-ui-toolkit/mrbd';
import circleSearchFilled from '@wearables-ui-toolkit/icons/svg/circlesearch__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function ZoomIndicatorPage() {
  return (
    <GalleryPage title="ZoomIndicator">
      <DemoSection
        title="Zoom feedback"
        description="Vertical indicators with custom and icon-free presentations."
      >
        <ZoomIndicator icon={circleSearchFilled} value={0.25} aria-label="Zoom level" />
        <ZoomIndicator icon={circleSearchFilled} value={0.7} aria-label="Zoom level" />
        <ZoomIndicator icon={null} value={0.5} aria-label="Zoom level" />
      </DemoSection>
      <GuidancePanel
        summary="ZoomIndicator provides visual feedback for the current zoom level. It displays application-controlled state and is not an interactive zoom control."
        useWhen={<ul><li>A zoom or magnification change needs immediate visual feedback.</li></ul>}
        capabilities={<ul><li>Default, custom, or hidden icon; configurable value range; optional value animation; and accessible value announcements.</li></ul>}
        avoid={<ul><li>Using it as the control that changes zoom.</li><li>Using it to represent unrelated vertical progress.</li></ul>}
      />
    </GalleryPage>
  );
}
