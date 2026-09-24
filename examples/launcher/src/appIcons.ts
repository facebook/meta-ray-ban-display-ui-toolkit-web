/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import bookOpenFilled from '@wearables-ui-toolkit/icons/svg/bookopen__filled.svg?raw';
import cameraFilled from '@wearables-ui-toolkit/icons/svg/camera__filled.svg?raw';
import cloudSunFilled from '@wearables-ui-toolkit/icons/svg/cloudsun__filled.svg?raw';
import compassFilled from '@wearables-ui-toolkit/icons/svg/compass__filled.svg?raw';
import earFilled from '@wearables-ui-toolkit/icons/svg/ear__filled.svg?raw';
import globeFilled from '@wearables-ui-toolkit/icons/svg/globe__filled.svg?raw';
import grid4ShapesFilled from '@wearables-ui-toolkit/icons/svg/grid4shapes__filled.svg?raw';
import imageStackFilled from '@wearables-ui-toolkit/icons/svg/imagestack__filled.svg?raw';
import mapFilled from '@wearables-ui-toolkit/icons/svg/map__filled.svg?raw';
import notebookFilled from '@wearables-ui-toolkit/icons/svg/notebook__filled.svg?raw';
import stopwatchFilled from '@wearables-ui-toolkit/icons/svg/stopwatch__filled.svg?raw';
import telescopeFilled from '@wearables-ui-toolkit/icons/svg/telescope__filled.svg?raw';

export interface LauncherIcon {
  /** Inline SVG markup for the glyph, not a URL. */
  src: string;
  lightingRgb: string;
  opticalScale: number;
  /** Percentage of the artwork box, e.g. `'-2%'`. */
  opticalOffsetX?: `${number}%`;
  /** Percentage of the artwork box, e.g. `'1%'`. */
  opticalOffsetY?: `${number}%`;
}

/**
 * Wraps the inline glyph markup as a data URL. CSS `url()` cannot consume raw
 * markup, so mask and image consumers need this rather than `icon.src`.
 */
export function createLauncherIconUrl(icon: LauncherIcon): string {
  return `data:image/svg+xml,${encodeURIComponent(icon.src)}`;
}

export function createLauncherArtworkSource(icon: LauncherIcon): string {
  const artworkSize = 64;
  const iconSize = artworkSize * icon.opticalScale;
  const inset = (artworkSize - iconSize) / 2;
  const offset = (value: `${number}%` | undefined) => {
    if (value == null) {
      return 0;
    }
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : artworkSize * parsed / 100;
  };
  const coordinate = (value: number) => Number(value.toFixed(4));
  const x = coordinate(inset + offset(icon.opticalOffsetX));
  const y = coordinate(inset + offset(icon.opticalOffsetY));
  const size = coordinate(iconSize);
  // Only the root element may carry the placement, so the rewrite is anchored to
  // the opening tag: a nested element can also declare width, and a root that
  // sizes through viewBox alone declares none.
  const positionedSvg = icon.src.replace(/<svg\b[^>]*>/, rootTag =>
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

// Explicit filled imports keep the example's visual weight consistent and let
// bundlers include only the glyphs used by this app. Optical adjustments make
// differently shaped glyphs feel equally sized without editing library assets.
export const launcherIcons = {
  camera: {
    src: cameraFilled,
    lightingRgb: '67 157 232',
    opticalScale: 0.78,
    opticalOffsetY: '1%',
  },
  colorGrid: {
    src: grid4ShapesFilled,
    lightingRgb: '182 67 50',
    opticalScale: 0.78,
  },
  discover: {
    src: telescopeFilled,
    lightingRgb: '74 175 217',
    opticalScale: 0.8,
  },
  forecast: {
    src: cloudSunFilled,
    lightingRgb: '74 191 196',
    opticalScale: 0.78,
    opticalOffsetY: '1%',
  },
  gallery: {
    src: imageStackFilled,
    lightingRgb: '229 79 134',
    opticalScale: 0.78,
  },
  notes: {
    src: notebookFilled,
    lightingRgb: '145 75 49',
    opticalScale: 0.78,
  },
  reader: {
    src: bookOpenFilled,
    lightingRgb: '227 100 164',
    opticalScale: 0.78,
  },
  soundscape: {
    src: earFilled,
    lightingRgb: '227 75 97',
    opticalScale: 0.82,
    opticalOffsetX: '-2%',
  },
  timer: {
    src: stopwatchFilled,
    lightingRgb: '0 112 143',
    opticalScale: 0.8,
  },
  trailGuide: {
    src: mapFilled,
    lightingRgb: '79 210 123',
    opticalScale: 0.78,
  },
  translate: {
    src: globeFilled,
    lightingRgb: '232 141 46',
    opticalScale: 0.8,
  },
  wayfinder: {
    src: compassFilled,
    lightingRgb: '100 84 196',
    opticalScale: 0.8,
  },
} satisfies Record<string, LauncherIcon>;
