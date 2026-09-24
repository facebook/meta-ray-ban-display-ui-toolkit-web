/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import brightnessHiFilled from '@wearables-ui-toolkit/icons/svg/brightnesshi__filled.svg';
import brightnessLowFilled from '@wearables-ui-toolkit/icons/svg/brightnesslow__filled.svg';
import brightnessMidFilled from '@wearables-ui-toolkit/icons/svg/brightnessmid__filled.svg';
import speakerHiFilled from '@wearables-ui-toolkit/icons/svg/speakerhi__filled.svg';
import speakerLowFilled from '@wearables-ui-toolkit/icons/svg/speakerlow__filled.svg';
import speakerMidFilled from '@wearables-ui-toolkit/icons/svg/speakermid__filled.svg';
import speakerOffFilled from '@wearables-ui-toolkit/icons/svg/speakeroff__filled.svg';

export function getBrightnessIcon(value: number): string {
  if (value <= 1 / 3) {
    return brightnessLowFilled;
  }
  if (value <= 2 / 3) {
    return brightnessMidFilled;
  }
  return brightnessHiFilled;
}

export function getVolumeIcon(value: number): string {
  if (value <= 0) {
    return speakerOffFilled;
  }
  if (value <= 1 / 3) {
    return speakerLowFilled;
  }
  if (value <= 2 / 3) {
    return speakerMidFilled;
  }
  return speakerHiFilled;
}
