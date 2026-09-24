/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLayoutEffect, useRef, useState } from 'react';
import { AspectRatio, CardAboveScrim, CardStack, ScrimType, StackType, TextStyle, TextView } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';
import {
  galleryCoastPhoto,
  galleryForestPhoto,
  galleryOverlookPhoto,
} from '../../galleryAssets';

const coastPhoto = galleryCoastPhoto;

const forestPhoto = galleryForestPhoto;

const overlookPhoto = galleryOverlookPhoto;

interface ResponsiveCardStackExampleProps {
  backgroundCards: Array<{ src: string; alt: string }>;
  imageAlt: string;
  imageSrc: string;
  title: string;
}

function ResponsiveCardStackExample({
  backgroundCards,
  imageAlt,
  imageSrc,
  title,
}: ResponsiveCardStackExampleProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (frame == null) {
      return;
    }

    // CardStack accepts a numeric width. Observe this responsive frame instead
    // of hardcoding a size for one display resolution.
    const updateWidth = () => setWidth(frame.clientWidth);
    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(frame);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="gallery-card-stack-frame">
      {width > 0 && (
        <CardStack
          type={StackType.INTERACTIVE}
          aspectRatio={AspectRatio.PORTRAIT}
          width={width}
          bottomScrim={ScrimType.SMALL}
          backgroundCards={backgroundCards}
          aria-label={`Open ${title}`}
          onClick={() => {}}
        >
          <img
            className="gallery-photo"
            src={imageSrc}
            alt={imageAlt}
          />
          <CardAboveScrim className="gallery-card-label">
            <TextView as="h2" textStyle={TextStyle.HEADING2}>
              {title}
            </TextView>
          </CardAboveScrim>
        </CardStack>
      )}
    </div>
  );
}

export function CardStackPage() {
  return (
    <GalleryPage title="CardStack">
      <DemoSection
        title="Media collections"
        description="Each CardStack represents a collection of related media. The primary card identifies the collection, while the cards behind it suggest additional items, similar to an album stack."
      >
        <div className="gallery-card-stack-grid">
          <ResponsiveCardStackExample
            title="Weekend routes"
            imageSrc={coastPhoto}
            imageAlt="Rocky coast at sunrise"
            backgroundCards={[
              { src: forestPhoto, alt: 'Sunlight through a forest' },
              { src: overlookPhoto, alt: 'Mountain overlook' },
            ]}
          />
          <ResponsiveCardStackExample
            title="Saved places"
            imageSrc={overlookPhoto}
            imageAlt="Mountain overlook"
            backgroundCards={[
              { src: coastPhoto, alt: 'Rocky coast at sunrise' },
              { src: forestPhoto, alt: 'Sunlight through a forest' },
            ]}
          />
        </div>
      </DemoSection>
      <GuidancePanel
        summary="CardStack presents a collection of related media as one album-like stack. Selecting the stack opens the collection rather than an individual item shown behind the primary card."
        useWhen={<ul><li>A single destination represents an album, gallery, playlist, or another recognizable collection of related media.</li></ul>}
        capabilities={<ul><li>One primary card, a limited preview of additional media, interactive or display layouts, and square or portrait aspect ratios.</li></ul>}
        avoid={<ul><li>Grouping unrelated media or separate destinations into one stack.</li><li>Using background cards as independent actions.</li><li>Adding decorative fake layers outside the component.</li></ul>}
      />
    </GalleryPage>
  );
}
