/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import {
  AppControlTile,
  CornerRadius,
  MaterialLibrary,
  RoundedRectangleShapeProvider,
  StatusIndicatorType,
} from '@wearables-ui-toolkit/mrbd';
import cameraFilled from '@wearables-ui-toolkit/icons/svg/camera__filled.svg';
import closedCaptioningFilled from '@wearables-ui-toolkit/icons/svg/closedcaptioning__filled.svg';
import headphoneFilled from '@wearables-ui-toolkit/icons/svg/headphone__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';
import { galleryAvatarPortrait } from '../../galleryAssets';

const ICON_CONTAINER_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.FULL);

export function AppControlTilePage() {
  // Keep custom material instances stable across state-driven rerenders.
  const captionsIconMaterial = useMemo(
    () =>
      MaterialLibrary.themedPrimary({
        idleFill: '#9A4E00',
        gradientStep1: '#FFB23F',
        gradientStep2: '#D97100',
        gradientStep3: '#713400',
        gradientStep4: '#341600',
        glowTint: '#FFB23F',
      }),
    [],
  );
  const cameraIconMaterial = useMemo(
    () =>
      MaterialLibrary.themedPrimary({
        idleFill: '#8A315A',
        gradientStep1: '#F28BB9',
        gradientStep2: '#BD4C81',
        gradientStep3: '#662040',
        gradientStep4: '#310E1E',
        glowTint: '#F28BB9',
      }),
    [],
  );
  const audioIconMaterial = useMemo(
    () =>
      MaterialLibrary.themedPrimary({
        idleFill: '#49327A',
        gradientStep1: '#A98BE8',
        gradientStep2: '#7051B4',
        gradientStep3: '#38245F',
        gradientStep4: '#1C102F',
        glowTint: '#A98BE8',
      }),
    [],
  );

  return (
    <GalleryPage title="AppControlTile">
      <DemoSection
        title="App shortcut group"
        description="A compact icon-only pair can sit beside a larger titled destination when one app deserves more emphasis."
      >
        <div className="gallery-app-shortcut-grid">
          <div className="gallery-app-shortcut-pair">
            <AppControlTile
              className="gallery-app-shortcut-tile"
              aria-label="Open captions"
              iconSrc={closedCaptioningFilled}
              iconContainerMaterial={captionsIconMaterial}
              iconContainerShapeProvider={ICON_CONTAINER_SHAPE_PROVIDER}
              onClick={() => {}}
            />
            <AppControlTile
              className="gallery-app-shortcut-tile"
              aria-label="Open camera"
              iconSrc={cameraFilled}
              iconContainerMaterial={cameraIconMaterial}
              iconContainerShapeProvider={ICON_CONTAINER_SHAPE_PROVIDER}
              onClick={() => {}}
            />
          </div>
          <AppControlTile
            className="gallery-app-shortcut-tile"
            title="Audio"
            iconSrc={headphoneFilled}
            iconContainerMaterial={audioIconMaterial}
            iconContainerShapeProvider={ICON_CONTAINER_SHAPE_PROVIDER}
            onClick={() => {}}
          />
        </div>
      </DemoSection>
      <DemoSection
        title="Person shortcuts"
        description="An avatar-only tile centers the person. Add a title and presence when the extra context helps distinguish the destination."
      >
        <div className="gallery-tile-row">
          <AppControlTile
            aria-label="Open Jordan Lee"
            avatarSrc={galleryAvatarPortrait}
            avatarAlt="Portrait of Jordan Lee"
            onClick={() => {}}
          />
          <AppControlTile
            title="Jordan Lee"
            avatarSrc={galleryAvatarPortrait}
            avatarAlt="Portrait of Jordan Lee"
            avatarStatusIndicator={StatusIndicatorType.ACTIVE}
            onClick={() => {}}
          />
        </div>
      </DemoSection>
      <GuidancePanel
        summary="AppControlTile is a prominent shortcut to an app, destination, or person. Its app icon or avatar provides the primary identity, while optional text and status provide supporting context."
        useWhen={<ul><li>A small set of recognizable, high-value destinations benefits from visual scanning.</li><li>An app or person is the primary identity of the destination.</li></ul>}
        capabilities={<ul><li>An app icon or avatar. These treatments are mutually exclusive, and icon-only or avatar-only tiles center the media.</li><li>An optional title with multiline overflow treatment or an opt-in marquee for long names.</li><li>A static status icon or custom status media below the title. Adding status media limits the title to one line.</li><li>Avatar badges, shapes, placeholders, and semantic status indicators with optional glyphs.</li><li>Responsive width, disabled state, a custom tile material, and an optional material behind the app icon.</li></ul>}
        avoid={<ul><li>Omitting the title unless the image is unmistakable; icon-only tiles still need a descriptive accessible label.</li><li>Using generic imagery when recognizable app or person identity is required.</li><li>Presenting dense collections better suited to a list.</li><li>Wrapping the tile in another material surface.</li></ul>}
      />
    </GalleryPage>
  );
}
