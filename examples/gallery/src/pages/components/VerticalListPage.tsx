/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ListItem, VerticalList } from '@wearables-ui-toolkit/mrbd';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function VerticalListPage() {
  return (
    <GalleryPage title="VerticalList">
      <DemoSection
        title="Scrollable collection"
        description="This bounded example shows the list's vertical focus and scroll behavior without adding another material surface."
        fullBleedStage
      >
        <VerticalList
          className="gallery-list-example"
          height="min(85vh, 36rem)"
          ariaLabel="Saved places"
        >
          <ListItem title="Harbor trail" subtitle="1.2 mi away" icon={bookmarkFilled} onClick={() => {}} />
          <ListItem title="North overlook" subtitle="3.4 mi away" icon={bookmarkFilled} onClick={() => {}} />
          <ListItem title="Museum entrance" subtitle="4.1 mi away" icon={bookmarkFilled} onClick={() => {}} />
          <ListItem title="Station platform" subtitle="5.7 mi away" icon={bookmarkFilled} onClick={() => {}} />
        </VerticalList>
      </DemoSection>
      <GuidancePanel
        summary="VerticalList manages a vertically scrolling group of rows and directional focus movement."
        useWhen={<ul><li>A collection extends beyond the available vertical space.</li></ul>}
        capabilities={<ul><li>An edge-to-edge scroll viewport with design-system row insets, fading edges, and scrollbar behavior.</li></ul>}
        avoid={<ul><li>Adding page-level horizontal insets around the list viewport.</li><li>Nesting it inside another vertical scroller unless the interaction is intentionally bounded.</li><li>Mixing unrelated row structures.</li></ul>}
      />
    </GalleryPage>
  );
}
