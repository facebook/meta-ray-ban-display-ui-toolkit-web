/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ProgressIndicator, ProgressIndicatorSize } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function ProgressIndicatorPage() {
  return (
    <GalleryPage title="ProgressIndicator">
      <DemoSection
        title="Determinate progress"
        description="Default and thin indicators at several progress values."
      >
        <div className="gallery-progress-column">
          <ProgressIndicator value={0.25} aria-label="Download progress" />
          <ProgressIndicator value={0.65} aria-label="Download progress" />
          <ProgressIndicator value={0.9} size={ProgressIndicatorSize.THIN} aria-label="Download progress" />
        </div>
      </DemoSection>
      <GuidancePanel
        summary="ProgressIndicator displays determinate progress on a horizontal track. It is a visual-only component whose value is controlled by the application."
        useWhen={<ul><li>Progress can be represented by a current value within a known range.</li></ul>}
        capabilities={<ul><li>Configurable minimum, maximum, and current values.</li><li>Default and thin sizes, active and inactive states, optional value animation, and accessible progress announcements.</li></ul>}
        avoid={<ul><li>Using determinate progress when completion cannot be estimated. Use an IndeterminateLoader instead.</li><li>Using it for direct value adjustment.</li></ul>}
      />
    </GalleryPage>
  );
}
