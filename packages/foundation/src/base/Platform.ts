/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  DefaultContentScaleInsets,
  type State,
} from './Interactions';

/** Platform identifier for the Meta Ray-Ban Display interaction profile. */
export type Platform = 'mrbd';

/** Content-scale horizontal insets for each platform and interaction state. */
export const ContentScaleInsets = {
  mrbd: DefaultContentScaleInsets,
} as const;

/** Calculate the platform content scale for an interaction state. */
export function getContentScaleForState(
  state: State,
  platform: Platform,
  containerSize: { width: number; height: number },
): number {
  const inset = ContentScaleInsets[platform][state].horizontal;
  if (containerSize.width <= 0) return 1;
  return (containerSize.width - inset * 2) / containerSize.width;
}
