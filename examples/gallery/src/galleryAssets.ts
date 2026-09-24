/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function galleryAssetUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}${fileName}`;
}

export const galleryAvatarPortrait = galleryAssetUrl(
  'gallery-avatar-portrait.png',
);
export const galleryAvatarSecondary = galleryAssetUrl(
  'gallery-avatar-secondary.png',
);
export const galleryCoastPhoto = galleryAssetUrl('gallery-coast.png');
export const galleryForestPhoto = galleryAssetUrl('gallery-forest.png');
export const galleryOverlookPhoto = galleryAssetUrl('gallery-overlook.png');
