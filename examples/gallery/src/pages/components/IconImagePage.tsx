/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { IconImage } from '@wearables-ui-toolkit/mrbd';
import heartActivityFilled from '@wearables-ui-toolkit/icons/svg/heartactivity__filled.svg';
import bellFilled from '@wearables-ui-toolkit/icons/svg/bell__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function IconImagePage() {
  return (
    <GalleryPage title="IconImage">
      <DemoSection
        title="Icon sources"
        description="IconImage owns fitting and tint behavior for a toolkit vector or URI source."
      >
        <IconImage source={bookmarkFilled} className="gallery-standalone-icon" />
        <IconImage source={bellFilled} className="gallery-standalone-icon" />
        <IconImage source={{ uri: heartActivityFilled, tinted: false }} className="gallery-standalone-icon" />
      </DemoSection>
      <GuidancePanel
        summary="IconImage is the common renderer behind the toolkit icon slots. Pass an icon source and let the host component own semantic sizing whenever possible."
        useWhen={<ul><li>A standalone icon renderer is genuinely needed.</li></ul>}
        capabilities={<ul><li>Inline vector data, tinted URI masks, and untinted full-color URI assets.</li></ul>}
        avoid={<ul><li>Passing arbitrary JSX into icon props.</li><li>Overriding icon sizes inside components that already own the slot.</li></ul>}
      />
    </GalleryPage>
  );
}
