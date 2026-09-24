/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Header, StatusIndicatorType } from '@wearables-ui-toolkit/mrbd';
import heartActivityFilled from '@wearables-ui-toolkit/icons/svg/heartactivity__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';
import { galleryAvatarPortrait } from '../../galleryAssets';

export function HeaderPage() {
  return (
    <GalleryPage title="Header">
      <DemoSection
        title="Screen context"
        description="These standalone examples isolate Header's visual variants. Application pages should normally configure the header through Page."
      >
        <div className="gallery-component-column">
          <Header text="Morning walk" metadata="Today · 42 min" icon={heartActivityFilled} />
          <Header text="Saved places" metadata="12 locations" icon={bookmarkFilled} />
          <Header
            text="Jordan Lee"
            metadata="Trail guide"
            showAvatar
            avatarSrc={galleryAvatarPortrait}
            avatarAlt="Portrait of Jordan Lee"
            statusIndicator={StatusIndicatorType.ACTIVE}
          />
          <Header text="Syncing activity" isLoading />
        </div>
      </DemoSection>
      <GuidancePanel
        summary="Header identifies the current context with a title and optional icon, avatar, loading state, or metadata. Configure it through Page in normal application layouts so Page owns its placement, layering, accessibility announcement, and relationship to content."
        useWhen={<ul><li>A page needs a persistent identity; pass the header content to Page through its header props.</li><li>A custom layout has an exceptional need to render Header directly and already owns the required placement and content inset behavior.</li></ul>}
        capabilities={<ul><li>Icon, avatar, loading, metadata, and text line limits.</li></ul>}
        avoid={<ul><li>Placing Header directly in a page layout when Page can host it.</li><li>Adding an in-app back button; rely on the system back gesture.</li><li>Using long body copy as a header.</li></ul>}
      />
    </GalleryPage>
  );
}
