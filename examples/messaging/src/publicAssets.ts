/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function publicAssetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

export const alexLeeAvatar = publicAssetUrl('avatars/alex-lee.webp');
export const mayaJohnsonAvatar = publicAssetUrl('avatars/maya-johnson.webp');
export const samRiveraAvatar = publicAssetUrl('avatars/sam-rivera.webp');
