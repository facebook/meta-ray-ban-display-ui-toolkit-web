/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import {
  Container,
  State,
  TextStyle,
  TextView,
  createWebAppIconMaterial,
} from '@wearables-ui-toolkit/mrbd';
import cloudSunFilled from '@wearables-ui-toolkit/icons/svg/cloudsun__filled.svg?raw';
import compassFilled from '@wearables-ui-toolkit/icons/svg/compass__filled.svg?raw';
import mapFilled from '@wearables-ui-toolkit/icons/svg/map__filled.svg?raw';
import notebookFilled from '@wearables-ui-toolkit/icons/svg/notebook__filled.svg?raw';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

const ICON_SURFACE_SIZE = 112;
const ICON_REST_SCALE = 88 / ICON_SURFACE_SIZE;
// The icon sits inset at rest and grows into its full box on focus.
const iconScaleForState = (state: typeof State[keyof typeof State]) =>
  state === State.FOCUSED ? 1 : ICON_REST_SCALE;

function createDemoArtworkSource(
  iconMarkup: string,
  opticalScale: number,
  offsetY = 0,
): string {
  const artworkSize = 64;
  const iconSize = artworkSize * opticalScale;
  const inset = (artworkSize - iconSize) / 2;
  const coordinate = (value: number) => Number(value.toFixed(4));
  const x = coordinate(inset);
  const y = coordinate(inset + artworkSize * offsetY);
  const size = coordinate(iconSize);
  // The artwork is consumed as an image source, and an SVG loaded that way does
  // not fetch external references, so the glyph is inlined rather than linked.
  // Only the root tag may carry the placement: a nested element can also declare
  // width, and a root that sizes through viewBox alone declares none.
  const positionedSvg = iconMarkup.replace(/<svg\b[^>]*>/, rootTag =>
    rootTag
      .replace(/\s+(?:width|height|x|y)\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
      .replace(
        /\s*(\/?)>$/,
        ` x="${x}" y="${y}" width="${size}" height="${size}"$1>`,
      ),
  );
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">${positionedSvg}</svg>`,
  )}`;
}

interface DemoApp {
  title: string;
  iconSrc: string;
  radialColors: readonly string[];
  innerGlowColor: string;
}

const DEMO_APPS: readonly DemoApp[] = [
  {
    title: 'Trail Guide',
    iconSrc: createDemoArtworkSource(mapFilled, 0.78),
    radialColors: ['#BFF35E', '#4FD27B', '#257F70', '#163B44'],
    innerGlowColor: '#3E9E71',
  },
  {
    title: 'Forecast',
    iconSrc: createDemoArtworkSource(cloudSunFilled, 0.78, 0.01),
    radialColors: ['#72E9D7', '#4ABFC4', '#6677C0', '#30335F'],
    innerGlowColor: '#6A9FAB',
  },
  {
    title: 'Notes',
    iconSrc: createDemoArtworkSource(notebookFilled, 0.78),
    radialColors: ['#A86134', '#914B31', '#663525', '#37231D'],
    innerGlowColor: '#7D402B',
  },
  {
    title: 'Wayfinder',
    iconSrc: createDemoArtworkSource(compassFilled, 0.8),
    radialColors: ['#5B71D8', '#6454C4', '#79398F', '#401F5E'],
    innerGlowColor: '#6849A8',
  },
];

// The previews are Containers carrying the web-app-icon container material,
// which is how an interactive surface adopts this material. The Container
// supplies focus behavior and drives the material's own focused state, so focus
// is drawn by the material rather than by any ring of this page's own.
function WebAppIconPreview({ app }: { app: DemoApp }) {
  const rendering = useMemo(
    () => createWebAppIconMaterial({
      iconSrc: app.iconSrc,
      radialColors: app.radialColors,
      innerGlowColor: app.innerGlowColor,
    }),
    [app],
  );

  return (
    <div className="gallery-web-app-icon-demo-tile">
      <Container
        aria-label={app.title}
        className="gallery-web-app-icon-demo-surface"
        clipContent={false}
        contentScaleForStateFn={iconScaleForState}
        data-uit-capture-id={`web-app-icon-${app.title.toLowerCase().split(' ').join('-')}`}
        height={ICON_SURFACE_SIZE}
        material={rendering.material}
        // Focusable for inspectability of the material's focused state, which
        // is what this preview demonstrates — deliberately not activatable
        // (no onClick): a button role would promise an action that does not
        // exist.
        role="img"
        shapeProvider={rendering.shapeProvider}
        width={ICON_SURFACE_SIZE}
      />
      <TextView as="span" textStyle={TextStyle.META3}>
        {app.title}
      </TextView>
    </div>
  );
}

function WebAppIconFallbackPreview() {
  // No artwork, so the factory supplies its own fallback treatment.
  const rendering = useMemo(() => createWebAppIconMaterial({}), []);

  return (
    <div className="gallery-web-app-icon-demo-tile">
      <Container
        aria-label="Web app icon without artwork"
        className="gallery-web-app-icon-demo-surface"
        clipContent={false}
        contentScaleForStateFn={iconScaleForState}
        data-uit-capture-id="web-app-icon-fallback"
        height={ICON_SURFACE_SIZE}
        material={rendering.material}
        // Focusable for inspectability of the material's focused state, which
        // is what this preview demonstrates — deliberately not activatable
        // (no onClick): a button role would promise an action that does not
        // exist.
        role="img"
        shapeProvider={rendering.shapeProvider}
        width={ICON_SURFACE_SIZE}
      />
      <TextView as="span" textStyle={TextStyle.META3}>
        No artwork
      </TextView>
    </div>
  );
}

export function WebAppIconPage() {
  return (
    <GalleryPage title="WebAppIcon">
      <DemoSection
        title="Icon previews"
        description="Preview web app icon treatments."
      >
        <div className="gallery-web-app-icon-preview-grid">
          {DEMO_APPS.map(app => (
            <WebAppIconPreview key={app.title} app={app} />
          ))}
        </div>
      </DemoSection>
      <DemoSection
        title="Fallback artwork"
        description="Without artwork the component supplies its own fallback treatment."
      >
        <div className="gallery-web-app-icon-preview-grid">
          <WebAppIconFallbackPreview />
        </div>
      </DemoSection>
      <GuidancePanel
        summary="WebAppIcon gives monochrome Web App artwork a complete app-container material derived from manifest appearance data."
        useWhen={<ul><li>A Web App manifest supplies transparent monochrome artwork and a theme color or radial palette.</li></ul>}
        capabilities={<ul><li>Generated palettes, dimensional artwork treatment, focus lighting, and fallback artwork.</li></ul>}
        avoid={<ul><li>Using artwork that already includes its background or final color treatment.</li><li>Wrapping the icon in another material surface.</li></ul>}
      />
    </GalleryPage>
  );
}
