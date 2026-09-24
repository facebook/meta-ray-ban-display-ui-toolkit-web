/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { Scrubber, ScrubberTimestampPosition } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function ScrubberPage() {
  const [position, setPosition] = useState(35);

  return (
    <GalleryPage title="Scrubber">
      <DemoSection
        title="Media position"
        description="Use left and right input while focused to move the seek position. The track, timestamps, tooltip, and seek interaction remain one component-owned control."
      >
        <Scrubber
          className="gallery-wide-control"
          aria-label="Podcast position"
          value={position}
          durationSeconds={240}
          showTooltip
          onValueChange={setPosition}
        />
      </DemoSection>
      <DemoSection
        title="Elapsed and duration above the track"
        description="timestampPosition moves the persistent elapsed and total labels. The focused value tooltip remains anchored above the handle."
      >
        <Scrubber
          className="gallery-wide-control"
          aria-label="Media position with labels above"
          value={65}
          durationSeconds={180}
          timestampPosition={ScrubberTimestampPosition.TOP}
          showTooltip
        />
      </DemoSection>
      <GuidancePanel
        summary="Scrubber is the media-specific value control for playback position. It understands duration, time labels, and committed seeks."
        useWhen={<ul><li>Users need to inspect or seek through time-based media.</li></ul>}
        capabilities={<ul><li>Persistent elapsed and duration labels can sit above or below the track.</li><li>An optional focused-value tooltip follows the handle independently of the persistent label placement.</li><li>Pointer seeking and directional steps with continuous and committed value callbacks.</li></ul>}
        avoid={<ul><li>Using a general SliderBar when media time semantics matter.</li></ul>}
      />
    </GalleryPage>
  );
}
