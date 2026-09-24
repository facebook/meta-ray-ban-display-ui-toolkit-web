/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CSSProperties } from 'react';
import { createDefaultContainerMaterial } from '@wearables-ui-toolkit/foundation/material/DefaultContainerMaterial';
import { IconTintColor } from '../IconTintColor';

export const CONTROL_TILE_DEFAULT_ICON_OVERLAY_BACKGROUND =
  'linear-gradient(180deg, var(--uit-color-background-window, #000000), var(--uit-color-background-flat, transparent))';

/**
 * Create default ControlTile material.
 */
export function createControlTileMaterial() {
  return createDefaultContainerMaterial();
}

export function getControlTileIconTintColor({
  checked,
  iconTintColor,
  checkedIconTintColor,
  usesDefaultCheckedIconMaterial = false,
}: {
  checked?: boolean | null;
  iconTintColor?: IconTintColor;
  checkedIconTintColor?: IconTintColor;
  usesDefaultCheckedIconMaterial?: boolean;
}): IconTintColor | undefined {
  if (checked !== true) {
    return iconTintColor;
  }

  return checkedIconTintColor ??
    iconTintColor ??
    (usesDefaultCheckedIconMaterial ? IconTintColor.ON_CHECKED : undefined);
}

export function getControlTileIconOverlayStyle({
  visible,
  transition,
}: {
  visible: boolean;
  transition: string;
}): CSSProperties {
  const layerStyle: CSSProperties = {
    background: CONTROL_TILE_DEFAULT_ICON_OVERLAY_BACKGROUND,
  };

  return {
    ...layerStyle,
    opacity: visible ? (layerStyle.opacity ?? 1) : 0,
    transition: layerStyle.transition ?? transition,
  };
}
