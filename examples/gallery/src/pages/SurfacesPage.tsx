/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


import { ListItem } from '@wearables-ui-toolkit/mrbd';
import apertureFilled from '@wearables-ui-toolkit/icons/svg/aperture__filled.svg';
import filmstripFilled from '@wearables-ui-toolkit/icons/svg/filmstrip__filled.svg';
import imageFilled from '@wearables-ui-toolkit/icons/svg/image__filled.svg';
import imageMediaPlayerFilled from '@wearables-ui-toolkit/icons/svg/imagemediaplayer__filled.svg';
import imageStackFilled from '@wearables-ui-toolkit/icons/svg/imagestack__filled.svg';
import rectangleCheckmarkStackFilled from '@wearables-ui-toolkit/icons/svg/rectanglecheckmarkstack__filled.svg';
import rectangleLandscapeFilled from '@wearables-ui-toolkit/icons/svg/rectanglelandscape__filled.svg';
import rectangleStackFilled from '@wearables-ui-toolkit/icons/svg/rectanglestack__filled.svg';
import rectangleTwoLinesFilled from '@wearables-ui-toolkit/icons/svg/rectangletwolines__filled.svg';
import { useNavigate } from 'react-router-dom';
import { GalleryPage } from '../components/GalleryPage';

export function SurfacesPage() {
  const navigate = useNavigate();

  return (
    <GalleryPage title="Surfaces">
      <div className="gallery-home-list" aria-label="Surface components">
        <ListItem title="Panel" subtitle="A non-interactive legibility surface" icon={rectangleLandscapeFilled} onClick={() => navigate('/surfaces/panel')} />
        <ListItem title="StaticContainer" subtitle="A static material surface" icon={rectangleStackFilled} onClick={() => navigate('/surfaces/static-container')} />
        <ListItem title="Container" subtitle="An interactive material surface" icon={rectangleTwoLinesFilled} onClick={() => navigate('/surfaces/container')} />
        <ListItem title="Surface" subtitle="A semantic interactive surface" icon={rectangleCheckmarkStackFilled} onClick={() => navigate('/surfaces/surface')} />
        <ListItem title="Card" subtitle="A focused visual destination" icon={imageFilled} onClick={() => navigate('/surfaces/card')} />
        <ListItem title="CardStack" subtitle="A destination representing a collection" icon={imageStackFilled} onClick={() => navigate('/surfaces/card-stack')} />
        <ListItem title="Carousel" subtitle="Horizontal browsing between peer items" icon={filmstripFilled} onClick={() => navigate('/surfaces/carousel')} />
        <ListItem title="MediaWrapper" subtitle="Reserved treatment around media content" icon={imageMediaPlayerFilled} onClick={() => navigate('/surfaces/media-wrapper')} />
        <ListItem title="Vignette" subtitle="Directional edge fading" icon={apertureFilled} onClick={() => navigate('/surfaces/vignette')} />
      </div>
    </GalleryPage>
  );
}
