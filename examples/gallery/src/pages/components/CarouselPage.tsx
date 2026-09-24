/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Card, Carousel, Container, PaginationMode, TextColor, TextStyle, TextView } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';
import {
  galleryCoastPhoto,
  galleryOverlookPhoto,
} from '../../galleryAssets';

const coastPhoto = galleryCoastPhoto;

const overlookPhoto = galleryOverlookPhoto;

export function CarouselPage() {
  return (
    <GalleryPage title="Carousel">
      <DemoSection
        title="Page through items"
        description="Carousel lets users move horizontally through a collection, one centered item at a time. Items can contain any content, and an optional page indicator can show the current position with dots or numbers."
      >
        <Carousel
          className="gallery-example-carousel"
          showPagination
          paginationMode={PaginationMode.DOTS}
          ariaLabel="Recommended routes"
        >
          <Card
            className="gallery-carousel-card"
            width="min(68vw, 24rem)"
            onClick={() => {}}
          >
            <img className="gallery-photo" src={coastPhoto} alt="Rocky coast at sunrise" />
          </Card>
          <Container
            className="gallery-carousel-card"
            width="min(68vw, 24rem)"
            aria-label="Open current conditions"
            onClick={() => {}}
          >
            <div className="gallery-carousel-custom-content">
              <TextView as="p" textStyle={TextStyle.META1} textColor={TextColor.SECONDARY}>
                CURRENT CONDITIONS
              </TextView>
              <div className="gallery-carousel-custom-forecast">
                <TextView as="p" textStyle={TextStyle.DISPLAY1}>68°</TextView>
                <TextView as="h2" textStyle={TextStyle.HEADING2}>Clear skies</TextView>
              </div>
            </div>
          </Container>
          <Card
            className="gallery-carousel-card"
            width="min(68vw, 24rem)"
            onClick={() => {}}
          >
            <img className="gallery-photo" src={overlookPhoto} alt="Mountain overlook" />
          </Card>
        </Carousel>
      </DemoSection>
      <GuidancePanel
        summary="Carousel is for horizontally paging through a collection of items. Each item can contain arbitrary content, and the optional page indicator can use dots or numbers to show where the user is in the collection."
        useWhen={<ul><li>Users should move horizontally through related items one at a time.</li><li>Keeping the current item centered and showing part of the next or previous item makes the collection easier to browse.</li></ul>}
        capabilities={<ul><li>Arbitrary item content, automatic focus centering, horizontal paging, fading edges, and an optional dots or numbers page indicator.</li><li>Initial position, indicator placement, vertical alignment, and callbacks when the centered item changes.</li></ul>}
        avoid={<ul><li>Using Carousel for primary navigation, a step-by-step workflow, or a long dense list.</li><li>Mixing unrelated items in the same carousel.</li><li>Nesting another horizontal scroller inside an item.</li></ul>}
      />
    </GalleryPage>
  );
}
