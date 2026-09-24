/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { ControlTile } from '@wearables-ui-toolkit/mrbd';
import heartActivityFilled from '@wearables-ui-toolkit/icons/svg/heartactivity__filled.svg';
import speakerLowFilled from '@wearables-ui-toolkit/icons/svg/speakerlow__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function ControlTilePage() {
  const [enabled, setEnabled] = useState(true);

  return (
    <GalleryPage title="ControlTile">
      <DemoSection
        title="Setting tiles"
        description="Each tile is a complete interactive surface; no additional rounded wrapper is needed."
      >
        <div className="gallery-tile-row">
          <ControlTile
            title="Activity"
            icon={heartActivityFilled}
            checked={enabled}
            onClick={() => setEnabled(current => !current)}
          />
          <ControlTile
            title="Volume"
            icon={speakerLowFilled}
            showCircularProgressBar
            progress={0.68}
            onIncrement={() => {}}
            onDecrement={() => {}}
          />
        </div>
      </DemoSection>
      <GuidancePanel
        summary="ControlTile presents a compact setting, toggle, or progress adjustment as one interactive surface."
        useWhen={<ul><li>A small set of high-value controls benefits from visual scanning.</li></ul>}
        capabilities={<ul><li>Checked state, circular or linear progress, and directional adjustment.</li></ul>}
        avoid={<ul><li>Nesting tiles inside rounded panels.</li><li>Using tiles for dense settings lists.</li></ul>}
      />
    </GalleryPage>
  );
}
