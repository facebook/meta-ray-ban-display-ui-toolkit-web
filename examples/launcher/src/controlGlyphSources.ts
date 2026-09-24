/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { IconSource } from '@wearables-ui-toolkit/mrbd';
import {
  audioOnlyOffIcon,
  audioOnlyOnIcon,
  brightnessHighIcon,
  brightnessLowIcon,
  brightnessMediumIcon,
  doNotDisturbOffIcon,
  doNotDisturbOnIcon,
  glassesIcon,
  phoneOffIcon,
  pinIcon,
  settingsIcon,
  volumeHighIcon,
  volumeLowIcon,
  volumeMediumIcon,
  volumeOffIcon,
} from './controlIcons';

export type ControlGlyphKind =
  | 'audio-off'
  | 'audio-on'
  | 'brightness-high'
  | 'brightness-low'
  | 'brightness-medium'
  | 'dnd-off'
  | 'dnd-on'
  | 'glasses'
  | 'phone-off'
  | 'settings'
  | 'volume-high'
  | 'volume-low'
  | 'volume-medium'
  | 'volume-off';

export const CONTROL_GLYPH_ICON_ASSETS: Record<ControlGlyphKind, string> = {
  'audio-off': audioOnlyOffIcon,
  'audio-on': audioOnlyOnIcon,
  'brightness-high': brightnessHighIcon,
  'brightness-low': brightnessLowIcon,
  'brightness-medium': brightnessMediumIcon,
  'dnd-off': doNotDisturbOffIcon,
  'dnd-on': doNotDisturbOnIcon,
  glasses: glassesIcon,
  'phone-off': phoneOffIcon,
  settings: settingsIcon,
  'volume-high': volumeHighIcon,
  'volume-low': volumeLowIcon,
  'volume-medium': volumeMediumIcon,
  'volume-off': volumeOffIcon,
};

function iconSource(kind: ControlGlyphKind): IconSource {
  return { uri: CONTROL_GLYPH_ICON_ASSETS[kind] };
}

export function getBrightnessIconSource(progress: number): IconSource {
  if (progress <= 0.01) {
    return iconSource('brightness-low');
  }
  return iconSource(progress <= 0.5 ? 'brightness-medium' : 'brightness-high');
}

export function getVolumeIconSource(progress: number): IconSource {
  if (progress <= 0) {
    return iconSource('volume-off');
  }
  if (progress <= 0.3) {
    return iconSource('volume-low');
  }
  return iconSource(progress <= 0.7 ? 'volume-medium' : 'volume-high');
}

export function getToggleIconSource(
  control: 'audio' | 'dnd',
  checked: boolean,
): IconSource {
  const kind: ControlGlyphKind = checked
    ? `${control}-on`
    : `${control}-off`;
  return iconSource(kind);
}

export const settingsIconSource = iconSource('settings');
export const pinIconAsset = pinIcon;
