/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Shimmer, ShimmerItem, ShimmerItemCornerRadius } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function ShimmerPage() {
  return (
    <GalleryPage title="Shimmer">
      <DemoSection
        title="Content placeholder"
        description="Compose placeholder shapes to reflect the layout of content being loaded."
      >
        <Shimmer className="gallery-shimmer-example">
          <div className="gallery-shimmer-list-item">
            <ShimmerItem
              className="gallery-shimmer-avatar"
              cornerRadius={ShimmerItemCornerRadius.XLARGE}
            />
            <ShimmerItem
              className="gallery-shimmer-content"
              cornerRadius={ShimmerItemCornerRadius.MEDIUM}
            />
          </div>
        </Shimmer>
      </DemoSection>
      <GuidancePanel
        summary="Shimmer applies an animated highlight across arbitrary placeholder content representing the UI while its data loads."
        useWhen={<ul><li>The content layout is known before its data is available.</li></ul>}
        capabilities={<ul><li>Arbitrary child content and ShimmerItem placeholders with configurable dimensions and corner radii.</li><li>Animation visibility, start behavior, delay, repeat behavior, child clipping, and static animation progress.</li></ul>}
        avoid={<ul><li>Using it for brief operations that do not need a loading state.</li><li>Recreating every text line or small detail when a few container-shaped placeholders can communicate the layout.</li><li>Using placeholder shapes that do not reflect the final content structure.</li></ul>}
      />
    </GalleryPage>
  );
}
