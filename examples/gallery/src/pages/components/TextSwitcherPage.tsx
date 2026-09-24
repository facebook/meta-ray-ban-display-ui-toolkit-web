/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { TextSwitcher } from '@wearables-ui-toolkit/mrbd';
import { Button } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function TextSwitcherPage() {
  const [showDistance, setShowDistance] = useState(true);

  return (
    <GalleryPage title="TextSwitcher">
      <DemoSection
        title="In-place text change"
        description="Activate the button to crossfade between two values without rebuilding the surrounding layout."
      >
        <div className="gallery-component-column gallery-component-column-centered">
          <TextSwitcher text={showDistance ? '1.8 miles' : '34 minutes'} />
          <Button
            title="Change value"
            alwaysShowText
            onClick={() => setShowDistance(current => !current)}
          />
        </div>
      </DemoSection>
      <GuidancePanel
        summary="TextSwitcher crossfades a changing short text value inside its own static material surface."
        useWhen={<ul><li>A compact value changes in place and continuity matters.</li></ul>}
        capabilities={<ul><li>Configurable duration, first-frame behavior, and animation opt-out.</li></ul>}
        avoid={<ul><li>Wrapping it in another rounded container.</li><li>Using it for long paragraphs or rapid continuous updates.</li></ul>}
      />
    </GalleryPage>
  );
}
