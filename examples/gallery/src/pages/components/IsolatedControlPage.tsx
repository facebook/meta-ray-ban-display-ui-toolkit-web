/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { IsolatedControl } from '@wearables-ui-toolkit/mrbd';
import speakerLowFilled from '@wearables-ui-toolkit/icons/svg/speakerlow__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function IsolatedControlPage() {
  const [volume, setVolume] = useState(0.6);

  return (
    <GalleryPage title="IsolatedControl">
      <DemoSection
        title="Focused adjustment"
        description="The icon and slider form one focusable directional control."
      >
        <IsolatedControl
          icon={speakerLowFilled}
          aria-label="Volume"
          value={volume}
          onValueChanged={setVolume}
        />
      </DemoSection>
      <GuidancePanel
        summary="IsolatedControl combines a recognizable icon and bounded value in a single compact focus target."
        useWhen={<ul><li>One value needs direct left and right adjustment.</li></ul>}
        capabilities={<ul><li>Controlled or uncontrolled value, step size, and optional click.</li></ul>}
        avoid={<ul><li>Using it when a labeled setting row is needed for comprehension.</li></ul>}
      />
    </GalleryPage>
  );
}
