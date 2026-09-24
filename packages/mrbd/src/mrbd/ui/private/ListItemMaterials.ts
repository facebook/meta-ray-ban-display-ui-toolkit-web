/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  createDefaultContainerMaterial,
} from '@wearables-ui-toolkit/foundation/material/DefaultContainerMaterial';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import type { ContainerMaterial } from '@wearables-ui-toolkit/foundation';
import { MaterialColors } from '@wearables-ui-toolkit/foundation/colors/Colors';
import { LIST_ITEM_MATERIAL_INSET } from './ListItemMetrics';

function screenBlendChannel(source: number, backdrop: number): number {
  return Math.round(255 - ((255 - source) * (255 - backdrop)) / 255);
}

export function screenBlendHex(sourceHex: string, backdropHex: string): string {
  const source = sourceHex.match(/[0-9a-f]{2}/gi)?.map((value) => parseInt(value, 16));
  const backdrop = backdropHex.match(/[0-9a-f]{2}/gi)?.map((value) => parseInt(value, 16));

  if (!source || !backdrop || source.length < 3 || backdrop.length < 3) {
    return sourceHex;
  }

  const [red, green, blue] = source
    .slice(0, 3)
    .map((channel, index) => screenBlendChannel(channel, backdrop[index]));

  return `rgb(${red}, ${green}, ${blue})`;
}

/**
 * Create the default ListItem material.
 */
export function createListItemMaterial() {
  return createDefaultContainerMaterial().withInset(LIST_ITEM_MATERIAL_INSET);
}

export function resolveListItemMaterial(
  material: ContainerMaterial | undefined,
): ContainerMaterial {
  return material == null
    ? createListItemMaterial()
    : material.withInset(LIST_ITEM_MATERIAL_INSET);
}

// The trailing tag uses a screen-blended idle fill against the parent
// composition: the ListItem material is drawn in sibling DOM layers, so the
// tag's fill is pre-blended with a screen blend to match.
export const LIST_ITEM_TAG_IDLE_COLOR = screenBlendHex(
  MaterialColors.backgroundSurface,
  MaterialColors.backgroundSurface
);

export function createListItemTagMaterial() {
  return MaterialLibrary.defaultStatic({
    idleColor: LIST_ITEM_TAG_IDLE_COLOR,
  });
}
