/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Scrim, ScrimPosition } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';
import { galleryCoastPhoto } from '../../galleryAssets';

const coastPhoto = galleryCoastPhoto;

export function ScrimPage() {
  return (
    <GalleryPage title="Scrim">
      <DemoSection
        title="Text protection over media"
        description="A real photograph stays visible while the bottom scrim creates a readable label region."
      >
        <div className="gallery-media-frame">
          <img className="gallery-photo" src={coastPhoto} alt="Rocky coast at sunrise" />
          <Scrim className="gallery-scrim" position={ScrimPosition.BOTTOM} />
          <div className="gallery-scrim-label">
            <span className="uit-text-heading2">Coastal route</span>
            <span className="uit-text-meta1">Sunrise · 3.8 miles</span>
          </div>
        </div>
      </DemoSection>
      <GuidancePanel
        summary="Scrim adds a directional gradient over media to protect foreground content without replacing the image."
        useWhen={<ul><li>Text or controls overlay visually variable media.</li></ul>}
        capabilities={<ul><li>Left, right, top, bottom, or full coverage.</li></ul>}
        avoid={<ul><li>Using fake gradient artwork instead of media.</li><li>Adding a second rounded container behind the protected text.</li></ul>}
      />
    </GalleryPage>
  );
}
