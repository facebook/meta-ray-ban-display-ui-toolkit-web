/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import galleryRoutesSource from './GalleryRoutes.tsx?raw';
import {
  GALLERY_DESTINATIONS,
  findGalleryDestination,
} from './galleryCatalog';

function getDeclaredRoutePaths(): ReadonlySet<string> {
  return new Set(
    Array.from(
      galleryRoutesSource.matchAll(/<Route\s+path="([^"]+)"/g),
      match => match[1],
    ),
  );
}

describe('findGalleryDestination', () => {
  it('matches component names independent of spaces and casing', () => {
    expect(findGalleryDestination('button rail').destination).toMatchObject({
      path: '/actions/button-rail',
      title: 'ButtonRail',
    });
  });

  it('supports aliases for combined gallery entries', () => {
    expect(findGalleryDestination('button divider').destination).toMatchObject({
      path: '/actions/button-group',
    });
  });

  it('offers nearby entries without choosing one', () => {
    expect(findGalleryDestination('progress').suggestions).toEqual([
      'ProgressIndicator',
      'ProgressRing',
      'CircularProgressBar',
    ]);
  });

  it('keeps every destination path unique', () => {
    const paths = GALLERY_DESTINATIONS.map(destination => destination.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('only points at routes the gallery actually declares', () => {
    const declaredRoutePaths = getDeclaredRoutePaths();
    expect(declaredRoutePaths.size).toBeGreaterThan(0);
    const missingRoutes = GALLERY_DESTINATIONS
      .map(destination => destination.path)
      .filter(path => !declaredRoutePaths.has(path));
    expect(missingRoutes).toEqual([]);
  });
});
