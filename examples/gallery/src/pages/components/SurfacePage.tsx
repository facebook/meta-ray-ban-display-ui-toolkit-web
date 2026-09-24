/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Surface, SurfaceCornerRadius, TextColor, TextStyle, TextView } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function SurfacePage() {
  return (
    <GalleryPage title="Surface">
      <DemoSection
        title="Secondary interactive content"
        description="Surface provides a lower-emphasis interactive treatment for secondary content. Prefer Container for primary actionable content and most new component work."
      >
        <Surface
          className="gallery-example-surface"
          cornerRadius={SurfaceCornerRadius.SMALL}
          drawBackground
          onClick={() => {}}
        >
          <div className="gallery-surface-content">
            <TextView as="h2" textStyle={TextStyle.HEADING2}>View activity</TextView>
            <TextView as="p" textStyle={TextStyle.BODY2} textColor={TextColor.SECONDARY}>42 active minutes today</TextView>
          </div>
        </Surface>
      </DemoSection>
      <GuidancePanel
        summary="Surface is a lower-emphasis alternative to Container for secondary interactive content. It is not commonly used and may be removed in a future release, so prefer an established toolkit component or Container for new work."
        useWhen={<ul><li>Maintaining an existing pattern that specifically uses Surface for a secondary action or content region.</li><li>The Surface-specific background and inner-shadow focus treatment is required for compatibility with an established design.</li></ul>}
        capabilities={<ul><li>Focus and press feedback, optional background, supported semantic corner radii, content clipping, disabled appearance, and interaction-driven scale.</li></ul>}
        avoid={<ul><li>Using Surface for primary content or as the default choice for a new interactive surface.</li><li>Adopting it when Container or a higher-level toolkit component meets the need.</li><li>Depending on Surface for a new reusable pattern without accounting for its potential removal.</li></ul>}
      />
    </GalleryPage>
  );
}
