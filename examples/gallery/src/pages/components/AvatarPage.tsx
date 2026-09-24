/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import {
  Avatar,
  AvatarShape,
  AvatarSize,
  CornerRadius,
  IconImage,
  MaterialLibrary,
  RoundedRectangleShapeProvider,
  StaticContainer,
  StatusIndicatorType,
} from '@wearables-ui-toolkit/mrbd';
import cameraFilled from '@wearables-ui-toolkit/icons/svg/camera__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';
import {
  galleryAvatarPortrait,
  galleryAvatarSecondary,
} from '../../galleryAssets';

const avatarPortrait = galleryAvatarPortrait;

const avatarSecondaryPortrait = galleryAvatarSecondary;

const BADGE_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.FULL);

function createCameraAppBadgeMaterial() {
  return MaterialLibrary.themedPrimary({
    idleFill: '#8A315A',
    gradientStep1: '#F28BB9',
    gradientStep2: '#BD4C81',
    gradientStep3: '#662040',
    gradientStep4: '#310E1E',
    glowTint: '#F28BB9',
  });
}

export function AvatarPage() {
  // Each custom badge keeps a stable material instance across rerenders.
  const cameraAppBadgeMaterial = useMemo(createCameraAppBadgeMaterial, []);
  const duoCameraAppBadgeMaterial = useMemo(
    createCameraAppBadgeMaterial,
    [],
  );

  return (
    <GalleryPage title="Avatar">
      <DemoSection
        title="Person identity"
        description="A real portrait provides recognizable identity. Size and shape are selected through the toolkit variants."
      >
        <Avatar src={avatarPortrait} alt="Portrait of Jordan" size={AvatarSize.LARGE} />
        <Avatar
          src={avatarPortrait}
          alt="Portrait of Jordan, active"
          size={AvatarSize.LARGE}
          statusIndicator={StatusIndicatorType.ACTIVE}
        />
        <Avatar
          src={avatarPortrait}
          alt="Portrait of Jordan with Camera app badge"
          size={AvatarSize.LARGE}
          badgeContent={(
            <StaticContainer
              aria-hidden="true"
              width="100%"
              height="100%"
              material={cameraAppBadgeMaterial}
              shapeProvider={BADGE_SHAPE_PROVIDER}
              useSmoothCorners={false}
              contentClassName="gallery-avatar-app-badge-content"
            >
              <IconImage
                source={cameraFilled}
                className="gallery-avatar-app-badge-icon"
              />
            </StaticContainer>
          )}
        />
        <Avatar
          src={avatarPortrait}
          alt="Portrait of Jordan"
          size={AvatarSize.LARGE}
          primaryImageShape={AvatarShape.ROUNDED_RECTANGLE}
          showStroke
        />
      </DemoSection>
      <DemoSection
        title="Duo identity"
        description="Duo layout combines two identities in one Avatar. An optional app badge can add compact source context."
      >
        <Avatar
          src={avatarPortrait}
          secondarySrc={avatarSecondaryPortrait}
          alt="Jordan and Avery"
          size={AvatarSize.LARGE}
        />
        <Avatar
          src={avatarPortrait}
          secondarySrc={avatarSecondaryPortrait}
          alt="Jordan and Avery with Camera app badge"
          size={AvatarSize.LARGE}
          badgeContent={(
            <StaticContainer
              aria-hidden="true"
              width="100%"
              height="100%"
              material={duoCameraAppBadgeMaterial}
              shapeProvider={BADGE_SHAPE_PROVIDER}
              useSmoothCorners={false}
              contentClassName="gallery-avatar-app-badge-content"
            >
              <IconImage
                source={cameraFilled}
                className="gallery-avatar-app-badge-icon"
              />
            </StaticContainer>
          )}
        />
      </DemoSection>
      <GuidancePanel
        summary="Avatar represents a person or entity with a photo, fallback, optional badge, or status indicator."
        useWhen={<ul><li>Identity helps users understand who content belongs to.</li></ul>}
        capabilities={<ul><li>Multiple semantic sizes, circle or rounded-rectangle images, status, image or custom-content app badges, and duo layouts.</li></ul>}
        avoid={<ul><li>Using generic UI icons as a substitute for a known person's image.</li><li>Adding a second clipping wrapper around the avatar.</li></ul>}
      />
    </GalleryPage>
  );
}
