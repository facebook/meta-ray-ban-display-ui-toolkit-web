/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Tag } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function TagPage() {
  return (
    <GalleryPage title="Tag">
      <DemoSection
        title="Category metadata"
        description="Tags name categories or attributes without introducing another action."
      >
        <Tag text="Outdoors" />
        <Tag text="Saved" />
        <Tag text="Offline" />
      </DemoSection>
      <GuidancePanel
        summary="Tag is a compact static label for category or attribute metadata."
        useWhen={<ul><li>A short category adds useful scanning context.</li></ul>}
        capabilities={<ul><li>Single concise text label with the toolkit-owned material.</li></ul>}
        avoid={<ul><li>Attaching button behavior to a tag.</li><li>Using sentence-length labels.</li></ul>}
      />
    </GalleryPage>
  );
}
