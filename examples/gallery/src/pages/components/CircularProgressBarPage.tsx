/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CircularProgressBar } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function CircularProgressBarPage() {
  return (
    <GalleryPage title="CircularProgressBar">
      <DemoSection
        title="Partial-arc progress"
        description="A determinate progress arc sized by its square parent."
      >
        <div className="gallery-circular-progress-slot">
          <CircularProgressBar progress={0.72} />
        </div>
      </DemoSection>
      <GuidancePanel
        summary="CircularProgressBar displays determinate progress on a partial circular track. It is a visual-only component whose value is controlled by the application."
        useWhen={<ul><li>A tile or custom layout needs progress represented by a partial arc.</li></ul>}
        capabilities={<ul><li>Responsive parent-sized rendering or an explicit square size, optional value animation, configurable stroke width, and custom start and end angles.</li></ul>}
        avoid={<ul><li>Using it when completion cannot be estimated. Use an IndeterminateLoader instead.</li><li>Hardcoding a size when the parent can provide a responsive square slot.</li><li>Customizing the arc geometry without a clear design requirement.</li></ul>}
      />
    </GalleryPage>
  );
}
