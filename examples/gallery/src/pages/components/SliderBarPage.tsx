/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SliderBar, SliderBarSize, SliderBarState } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function SliderBarPage() {
  return (
    <GalleryPage title="SliderBar">
      <DemoSection
        title="Value display"
        description="SliderBar displays a value supplied by its parent. The focused state is shown here only as a visual reference."
      >
        <div className="gallery-slider-example">
          <SliderBar
            aria-label="Display intensity"
            value={0.55}
            state={SliderBarState.FOCUSED}
          />
          <span className="uit-text-meta3">55%</span>
        </div>
      </DemoSection>
      <DemoSection
        title="Determinate progress"
        description="Without an onChange handler, SliderBar reports read-only progress."
      >
        <div className="gallery-slider-example">
          <SliderBar value={0.72} size={SliderBarSize.THIN} />
          <span className="uit-text-meta3">72%</span>
        </div>
      </DemoSection>
      <GuidancePanel
        summary="SliderBar visualizes a bounded value. The public SliderBar itself is visual-only; compose it through an interactive parent such as ListItem or IsolatedControl when users must adjust the value."
        useWhen={<ul><li>Displaying the current value inside a higher-level control or showing determinate progress.</li></ul>}
        capabilities={<ul><li>Bounded value and progress presentation.</li><li>Visual interaction states and default or thin sizes.</li></ul>}
        avoid={<ul><li>Using a standalone SliderBar as an interactive control.</li><li>Using it when named discrete choices are clearer.</li><li>Showing progress without a meaningful bound.</li></ul>}
      />
    </GalleryPage>
  );
}
