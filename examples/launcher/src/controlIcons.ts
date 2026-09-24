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
import eyeglassesOutline from '@wearables-ui-toolkit/icons/svg/eyeglasses__outline.svg';
import headphoneFilled from '@wearables-ui-toolkit/icons/svg/headphone__filled.svg';
import headphoneSlashFilled from '@wearables-ui-toolkit/icons/svg/headphoneslash__filled.svg';
import moonCrescentFilled from '@wearables-ui-toolkit/icons/svg/mooncrescent__filled.svg';
import moonCrescentSlashFilled from '@wearables-ui-toolkit/icons/svg/mooncrescentslash__filled.svg';
import phoneSlashFilled from '@wearables-ui-toolkit/icons/svg/phoneslash__filled.svg';
import sliders2HorizontalFilled from '@wearables-ui-toolkit/icons/svg/sliders2horizontal__filled.svg';
import speakerHiFilled from '@wearables-ui-toolkit/icons/svg/speakerhi__filled.svg';
import speakerLowFilled from '@wearables-ui-toolkit/icons/svg/speakerlow__filled.svg';
import speakerMidFilled from '@wearables-ui-toolkit/icons/svg/speakermid__filled.svg';
import speakerOffFilled from '@wearables-ui-toolkit/icons/svg/speakeroff__filled.svg';
import thumbpinFilled from '@wearables-ui-toolkit/icons/svg/thumbpin__filled.svg';

// Use filled variants so controls have consistent visual weight. Eyeglasses is
// the one exception because the public catalog does not provide a filled pair;
// its filled search results represent a VR headset or an incognito symbol.
// Individual imports keep the complete icon catalog out of the bundle.
export const audioOnlyOnIcon = headphoneFilled;
export const audioOnlyOffIcon = headphoneSlashFilled;
export const doNotDisturbOnIcon = moonCrescentFilled;
export const doNotDisturbOffIcon = moonCrescentSlashFilled;
export const glassesIcon = eyeglassesOutline;
export const phoneOffIcon = phoneSlashFilled;
export const pinIcon = thumbpinFilled;
export const settingsIcon = sliders2HorizontalFilled;
export const brightnessHighIcon = brightnessHiFilled;
export const brightnessLowIcon = brightnessLowFilled;
export const brightnessMediumIcon = brightnessMidFilled;
export const volumeHighIcon = speakerHiFilled;
export const volumeLowIcon = speakerLowFilled;
export const volumeMediumIcon = speakerMidFilled;
export const volumeOffIcon = speakerOffFilled;
