/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Meta Wearables Developer Terms found in
 * the LICENSE file in this package.
 *
 */

/**
 * (c) Meta Platforms, Inc. and affiliates.
 */

export type UITIconVariant = 'filled' | 'outline';

export type UITIconAssetPath = `./svg/${string}.svg`;

export type UITIconKeywordIndex<TPlatformIconName extends string = string> =
  Readonly<Record<string, readonly TPlatformIconName[]>>;

export interface UITIconManifestEntry<
  TPlatformIconName extends string = string,
  TAssetPath extends UITIconAssetPath = UITIconAssetPath,
> {
  readonly name: TPlatformIconName;
  readonly slug: string;
  readonly category: string;
  readonly keywords: readonly string[];
  readonly filled?: TAssetPath;
  readonly outline?: TAssetPath;
  readonly default: TAssetPath;
}
