/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ProgressRing, ProgressRingSize } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function ProgressRingPage() {
  return (
    <GalleryPage title="ProgressRing">
      <DemoSection
        title="Determinate progress"
        description="Small and large rings displaying the same progress value."
      >
        <ProgressRing progress={0.68} size={ProgressRingSize.SMALL} aria-label="Sync progress" />
        <ProgressRing progress={0.68} size={ProgressRingSize.LARGE} aria-label="Sync progress" />
      </DemoSection>
      <GuidancePanel
        summary="ProgressRing displays determinate progress on a circular track. It is a visual-only component whose value is controlled by the application."
        useWhen={<ul><li>Determinate progress needs to fit within a compact or square layout.</li></ul>}
        capabilities={<ul><li>Small and large sizes, optional value animation, and accessible progress announcements.</li></ul>}
        avoid={<ul><li>Using it when completion cannot be estimated. Use an IndeterminateLoader instead.</li><li>Using it for direct value adjustment or placing detailed status content inside the ring.</li></ul>}
      />
    </GalleryPage>
  );
}
