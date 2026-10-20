/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ContainerHeader,
  IconImage,
  PlaceholderStyle,
  StatusIndicatorType,
} from '@wearables-ui-toolkit/mrbd';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';
import { galleryAvatarPortrait } from '../../galleryAssets';

const avatarPortrait = galleryAvatarPortrait;
const localizedStatusLabels = { [StatusIndicatorType.ACTIVE]: 'En ligne' };

export function ContainerHeaderPage() {
  return (
    <GalleryPage title="ContainerHeader">
      <DemoSection
        title="Surface identity"
        description="ContainerHeader aligns identity and title content intended for the top of a toolkit surface."
      >
        <div className="gallery-component-column">
          <ContainerHeader
            title="Jordan Lee"
            subtitle="Shared a route"
            avatarSrc={avatarPortrait}
            avatarAlt="Portrait of Jordan"
            statusIndicator={StatusIndicatorType.ACTIVE}
          />
          <ContainerHeader
            title="Saved places"
            subtitle="12 locations"
            icon={bookmarkFilled}
          />
        </div>
      </DemoSection>
      <DemoSection
        title="Badge-only identity"
        description="A badge image or custom badge content shows the configured avatar placeholder and takes precedence over an optional leading icon."
      >
        <div className="gallery-component-column">
          <ContainerHeader
            title="Group updates"
            subtitle="Image badge with a placeholder"
            avatarBadgeSrc={avatarPortrait}
            placeholderStyle={PlaceholderStyle.IMAGE}
            icon={bookmarkFilled}
          />
          <ContainerHeader
            title="Saved collection"
            subtitle="Custom badge content"
            avatarBadgeContent={<IconImage source={bookmarkFilled} />}
          />
        </div>
      </DemoSection>
      <DemoSection
        title="Localized status"
        description="Per-status labels supply localized status copy for the heading and avatar. Unspecified statuses retain the built-in English fallback."
      >
        <ContainerHeader
          title="Jordan Lee"
          subtitle="Disponible"
          avatarSrc={avatarPortrait}
          statusIndicator={StatusIndicatorType.ACTIVE}
          statusIndicatorLabels={localizedStatusLabels}
        />
      </DemoSection>
      <GuidancePanel
        summary="ContainerHeader provides consistent identity, title, and subtitle alignment inside a larger toolkit surface."
        useWhen={<ul><li>A surface needs a clear owner or section identity.</li></ul>}
        capabilities={<ul><li>Icon or avatar, subtitle, localized status labels, and image or custom-content badge slots.</li></ul>}
        avoid={<ul><li>Using it as the page-level navigation header.</li><li>Placing it in a second rounded inner container.</li></ul>}
      />
    </GalleryPage>
  );
}
