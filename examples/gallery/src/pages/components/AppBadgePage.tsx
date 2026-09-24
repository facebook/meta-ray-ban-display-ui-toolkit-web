/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppBadge } from '@wearables-ui-toolkit/mrbd';
import heartActivityFilled from '@wearables-ui-toolkit/icons/svg/heartactivity__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function AppBadgePage() {
  return (
    <GalleryPage title="AppBadge">
      <DemoSection
        title="Compact app identity"
        description="The badge owns the icon backdrop and sizing."
      >
        <AppBadge icon={heartActivityFilled} aria-label="Activity app" />
        <AppBadge icon={bookmarkFilled} aria-label="Saved app" />
      </DemoSection>
      <GuidancePanel
        summary="AppBadge gives a small app glyph a consistent badge treatment for identity slots."
        useWhen={<ul><li>An app must be identified in a compact supporting role.</li></ul>}
        capabilities={<ul><li>One centered icon source rendered by the toolkit.</li></ul>}
        avoid={<ul><li>Using it as an interactive button.</li><li>Adding another circular or rounded backdrop.</li></ul>}
      />
    </GalleryPage>
  );
}
