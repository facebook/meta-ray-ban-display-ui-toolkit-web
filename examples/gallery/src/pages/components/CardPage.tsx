/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Card, CardAboveScrim, ScrimType, TextColor, TextStyle, TextView } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';
import {
  galleryCoastPhoto,
  galleryForestPhoto,
} from '../../galleryAssets';

const coastPhoto = galleryCoastPhoto;

const forestPhoto = galleryForestPhoto;

export function CardPage() {
  return (
    <GalleryPage title="Card">
      <DemoSection
        title="Visual destination"
        description="The photo renders below a medium bottom scrim, while the title and metadata render above it for legibility."
      >
        <Card
          className="gallery-photo-card"
          width="100%"
          height="auto"
          bottomScrim={ScrimType.MEDIUM}
          onClick={() => {}}
        >
          <img className="gallery-photo" src={coastPhoto} alt="Rocky coast at sunrise" />
          <CardAboveScrim className="gallery-card-label">
            <TextView as="h2" textStyle={TextStyle.HEADING2}>Coastal sunrise</TextView>
            <TextView as="p" textStyle={TextStyle.META1} textColor={TextColor.SECONDARY}>Waterfront route · 3.8 miles</TextView>
          </CardAboveScrim>
        </Card>
      </DemoSection>
      <DemoSection
        title="Custom content"
        description="Card accepts arbitrary children. Here, a custom forecast layout renders above full-height top and bottom scrims, with a heavily subdued photo acting as background texture."
      >
        <Card
          className="gallery-custom-content-card"
          width="100%"
          topScrim={ScrimType.FULL}
          bottomScrim={ScrimType.FULL}
          aria-label="Open today's forecast"
          onClick={() => {}}
        >
          <img
            className="gallery-photo"
            src={forestPhoto}
            alt=""
            aria-hidden="true"
          />
          <CardAboveScrim className="gallery-custom-card-content">
            <TextView as="p" textStyle={TextStyle.META1} textColor={TextColor.SECONDARY}>
              TODAY’S FORECAST
            </TextView>
            <div className="gallery-custom-card-value-row">
              <TextView as="p" textStyle={TextStyle.DISPLAY1}>68°</TextView>
              <div className="gallery-custom-card-details">
                <TextView as="h2" textStyle={TextStyle.HEADING2}>Clear skies</TextView>
                <TextView as="p" textStyle={TextStyle.BODY2} textColor={TextColor.SECONDARY}>
                  High 72° · Low 54°
                </TextView>
              </div>
            </div>
          </CardAboveScrim>
        </Card>
      </DemoSection>
      <GuidancePanel
        summary="Card presents featured content as one interactive destination. It accepts arbitrary children and can layer selected content above built-in scrims when a visual background needs additional contrast."
        useWhen={<ul><li>Featured image or custom content should be selected as one destination.</li><li>Text needs to layer over visual content with a supported top or bottom scrim.</li></ul>}
        capabilities={<ul><li>Arbitrary child content, semantic corner radii, optional tails, and top or bottom scrims.</li><li>Focus and press highlights designed to remain visible without obscuring Card content. This provides interaction contrast when opaque content, such as a photo, hides the background material.</li><li>Explicit above-scrim content for titles and metadata that must remain legible.</li></ul>}
        avoid={<ul><li>Leaving a detailed background image visually dominant behind custom content.</li><li>Adding a scrim when there is no visual background competing with text.</li><li>Faking photography with CSS gradients.</li><li>Placing a rounded image container inside the Card.</li><li>Overloading one card with multiple actions.</li></ul>}
      />
    </GalleryPage>
  );
}
