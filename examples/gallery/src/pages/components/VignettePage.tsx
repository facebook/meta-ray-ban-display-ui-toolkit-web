/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TextColor, TextStyle, TextView, Vignette, VignetteEdge } from '@wearables-ui-toolkit/mrbd';
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

export function VignettePage() {
  return (
    <GalleryPage title="Vignette">
      <DemoSection
        title="Pannable media boundaries"
        description="Each fade indicates that the media continues beyond that side of the viewport. As the user pans to an actual media boundary, turn that edge off."
      >
        <div className="gallery-vignette-examples">
          <div className="gallery-vignette-example">
            <TextView as="h2" textStyle={TextStyle.HEADING2}>Media continues on every edge</TextView>
            <TextView as="p" textStyle={TextStyle.BODY2} textColor={TextColor.SECONDARY}>
              Use this state while a zoomed image can still pan in every direction.
            </TextView>
            <div className="gallery-media-frame">
              <img className="gallery-photo" src={overlookPhoto} alt="Mountain overlook" />
              <Vignette
                className="gallery-vignette"
                animate={false}
                enabledEdges={{
                  [VignetteEdge.TOP]: true,
                  [VignetteEdge.BOTTOM]: true,
                  [VignetteEdge.LEFT]: true,
                  [VignetteEdge.RIGHT]: true,
                }}
              />
            </div>
          </div>
          <div className="gallery-vignette-example">
            <TextView as="h2" textStyle={TextStyle.HEADING2}>Vertical continuation</TextView>
            <TextView as="p" textStyle={TextStyle.BODY2} textColor={TextColor.SECONDARY}>
              Top and bottom remain enabled when the media is at its horizontal boundaries but can still pan vertically.
            </TextView>
            <div className="gallery-media-frame">
              <img className="gallery-photo" src={forestPhoto} alt="Sunlight through a forest" />
              <Vignette
                className="gallery-vignette"
                animate={false}
                enabledEdges={{
                  [VignetteEdge.TOP]: true,
                  [VignetteEdge.BOTTOM]: true,
                  [VignetteEdge.LEFT]: false,
                  [VignetteEdge.RIGHT]: false,
                }}
              />
            </div>
          </div>
          <div className="gallery-vignette-example">
            <TextView as="h2" textStyle={TextStyle.HEADING2}>Top-left boundary reached</TextView>
            <TextView as="p" textStyle={TextStyle.BODY2} textColor={TextColor.SECONDARY}>
              Top and left are disabled at those media boundaries; right and bottom show that more content remains offscreen.
            </TextView>
            <div className="gallery-media-frame">
              <img className="gallery-photo" src={coastPhoto} alt="Rocky coast at sunrise" />
              <Vignette
                className="gallery-vignette"
                animate={false}
                enabledEdges={{
                  [VignetteEdge.TOP]: false,
                  [VignetteEdge.BOTTOM]: true,
                  [VignetteEdge.LEFT]: false,
                  [VignetteEdge.RIGHT]: true,
                }}
              />
            </div>
          </div>
        </div>
      </DemoSection>
      <GuidancePanel
        summary="Vignette overlays fades at the edges of a zoomed or pannable media viewport. An enabled edge communicates that more of the image or video exists beyond that side; disable it when the viewport reaches the media boundary."
        useWhen={<ul><li>Users can pan or zoom media and need a subtle visual indication of which directions still contain offscreen content.</li><li>Media should blend into the surrounding display at edges where it continues beyond the current viewport.</li></ul>}
        capabilities={<ul><li>Independent top, bottom, left, and right fades.</li><li>Animated or immediate edge changes as viewport position reaches or leaves each media boundary.</li></ul>}
        avoid={<ul><li>Using Vignette to make overlaid text readable; use Card scrims or MediaWrapper instead.</li><li>Using it on ordinary static media that is already fully visible.</li><li>Leaving an edge enabled after the viewport reaches that media boundary.</li></ul>}
      />
    </GalleryPage>
  );
}
