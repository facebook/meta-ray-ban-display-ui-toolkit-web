/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { NotificationBadge } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function NotificationBadgePage() {
  return (
    <GalleryPage title="NotificationBadge">
      <DemoSection
        title="Unread counts"
        description="Keep the label short enough to scan without competing with primary content."
      >
        <NotificationBadge text={1} aria-label="1 unread item" />
        <NotificationBadge text={12} aria-label="12 unread items" />
        <NotificationBadge text="99+" aria-label="More than 99 unread items" />
      </DemoSection>
      <GuidancePanel
        summary="NotificationBadge displays a compact unread marker or short count."
        useWhen={<ul><li>A nearby app, avatar, or destination needs unread context.</li></ul>}
        capabilities={<ul><li>Short string or numeric content.</li></ul>}
        avoid={<ul><li>Long text or precise large values.</li><li>Using the badge without an associated object.</li></ul>}
      />
    </GalleryPage>
  );
}
