/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ReactNode } from 'react';
import {
  Page,
  ScrollView,
} from '@wearables-ui-toolkit/mrbd';

interface GalleryPageProps {
  title: string;
  children: ReactNode;
}

export function GalleryPage({
  title,
  children,
}: GalleryPageProps) {
  // Keep the scroll viewport full-screen. ScrollView reserves header space
  // inside its content without shifting the viewport or its scrollbar.
  return (
    <Page headerText={title} enableSystemBarInset={false}>
      <ScrollView
        className="gallery-scroll-view"
        insetForHeader
        scrollbarEnabled
        ariaLabel={title}
      >
        <div className="gallery-page-content">
          {children}
        </div>
      </ScrollView>
    </Page>
  );
}
