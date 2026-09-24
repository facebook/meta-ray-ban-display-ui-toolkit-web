/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { MediaWrapper, MediaWrapperPosition, MediaWrapperSize, TextColor, TextStyle, TextView } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';
import { galleryForestPhoto } from '../../galleryAssets';

const forestPhoto = galleryForestPhoto;

export function MediaWrapperPage() {
  return (
    <GalleryPage title="MediaWrapper">
      <DemoSection
        title="Readable content over media"
        description="MediaWrapper creates a dark area for a caption or controls over an image or video, then fades that area smoothly into the media so there is no hard visual edge."
      >
        <div className="gallery-media-frame">
          <img className="gallery-photo" src={forestPhoto} alt="Sunlight through a forest" />
          <MediaWrapper
            className="gallery-media-overlay gallery-media-overlay-bottom"
            position={MediaWrapperPosition.BOTTOM}
            size={MediaWrapperSize.LARGE}
          >
            <div className="gallery-media-copy">
              <TextView as="h2" textStyle={TextStyle.HEADING2}>Forest loop</TextView>
              <TextView as="p" textStyle={TextStyle.META1} textColor={TextColor.SECONDARY}>Shaded · 2.4 miles</TextView>
            </div>
          </MediaWrapper>
        </div>
      </DemoSection>
      <GuidancePanel
        summary="MediaWrapper is a readable content shelf for a custom image or video composition. Place the caption or controls inside it; the component provides a dark background behind that content and a matching gradient that blends back into the media. It does not load or lay out the media itself."
        useWhen={<ul><li>Building a custom media view, such as a full-bleed photo, video player, or hero area, where a caption, metadata, or controls sit over one edge.</li><li>The overlaid content needs a consistently dark background that transitions into the media without a hard boundary.</li></ul>}
        capabilities={<ul><li>Top or bottom placement and a managed content area that remains fully dark behind its children.</li><li>Small or large fade treatments for choosing how gradually the dark content area blends into the media.</li></ul>}
        avoid={<ul><li>Using MediaWrapper inside Card; Card already provides scrims and `CardAboveScrim` for content over media.</li><li>Using MediaWrapper when no content is being placed over media.</li><li>Recreating its content background and fade with an arbitrary gradient.</li><li>Using it as a standalone rounded container or expecting it to render the image or video.</li></ul>}
      />
    </GalleryPage>
  );
}
