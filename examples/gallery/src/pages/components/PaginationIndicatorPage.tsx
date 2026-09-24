/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { Button, PaginationIndicator, PaginationMode } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function PaginationIndicatorPage() {
  const [page, setPage] = useState(1);

  return (
    <GalleryPage title="PaginationIndicator">
      <DemoSection
        title="Text and dot modes"
        description="Indicators communicate position; they do not navigate by themselves."
      >
        <div className="gallery-component-column gallery-component-column-centered">
          <PaginationIndicator mode={PaginationMode.TEXT} pageCount={5} currentPage={page} />
          <PaginationIndicator mode={PaginationMode.DOTS} pageCount={5} currentPage={page} />
          <Button
            title="Next page"
            alwaysShowText
            onClick={() => setPage(current => (current + 1) % 5)}
          />
        </div>
      </DemoSection>
      <GuidancePanel
        summary="PaginationIndicator displays the current zero-based page within a known page count."
        useWhen={<ul><li>Users need lightweight position context for a pager or carousel.</li></ul>}
        capabilities={<ul><li>Compact dots or explicit text.</li></ul>}
        avoid={<ul><li>Using it as the navigation control itself.</li><li>Showing dots for so many pages that individual positions are unreadable.</li></ul>}
      />
    </GalleryPage>
  );
}
