/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Button, Pager, PagerPage } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function PagerComponentPage() {
  return (
    <GalleryPage title="Pager">
      <DemoSection
        title="Directional pages"
        description="Move left and right to navigate. Each child is a page with its own focusable content."
      >
        <Pager
          className="gallery-embedded-pager"
          useBackButtonForHome={false}
          ariaLabel="Three example pages"
        >
          <PagerPage><div className="gallery-pager-page"><Button title="First page" alwaysShowText onClick={() => {}} /></div></PagerPage>
          <PagerPage><div className="gallery-pager-page"><Button title="Second page" alwaysShowText onClick={() => {}} /></div></PagerPage>
          <PagerPage><div className="gallery-pager-page"><Button title="Third page" alwaysShowText onClick={() => {}} /></div></PagerPage>
        </Pager>
      </DemoSection>
      <GuidancePanel
        summary="Pager manages directional movement, page lifecycle, focus handoff, and animated transitions between peer pages."
        useWhen={<ul><li>Content is naturally divided into a small sequence or peer set.</li></ul>}
        capabilities={<ul><li>Horizontal or vertical orientation, controlled state, lifecycle callbacks, and navigation locking.</li></ul>}
        avoid={<ul><li>Using nested pagers without a clearly distinct axis.</li><li>Intercepting system back for ordinary page history.</li></ul>}
      />
    </GalleryPage>
  );
}
