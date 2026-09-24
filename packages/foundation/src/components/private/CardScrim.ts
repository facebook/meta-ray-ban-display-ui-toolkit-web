/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import {
  CARD_FULL_SCRIM_FALLBACK_HEIGHT,
  CARD_SCRIM_COLOR,
  CARD_SCRIM_HEIGHT_MEDIUM,
  CARD_SCRIM_HEIGHT_SMALL,
  CARD_SCRIM_HEIGHT_TALL,
} from './CardMetrics';
import { ScrimType } from '../Card.types';

export interface CardScrimStyleInput {
  topScrim: ScrimType;
  bottomScrim: ScrimType;
  containerHeight: number;
}

export function isCardScrimVisible(scrimType: ScrimType): boolean {
  return scrimType !== ScrimType.NONE;
}

export function getCardScrimHeight(
  scrimType: ScrimType,
  containerHeight?: number,
): number {
  switch (scrimType) {
    case ScrimType.SMALL:
      return CARD_SCRIM_HEIGHT_SMALL;
    case ScrimType.MEDIUM:
      return CARD_SCRIM_HEIGHT_MEDIUM;
    case ScrimType.TALL:
      return CARD_SCRIM_HEIGHT_TALL;
    case ScrimType.FULL:
      return containerHeight ?? CARD_FULL_SCRIM_FALLBACK_HEIGHT;
    case ScrimType.NONE:
    default:
      return 0;
  }
}

export function getTopCardScrimGradient(scrimHeight: number): string {
  const darkStop = scrimHeight * 0.2;
  return `linear-gradient(to bottom, ${CARD_SCRIM_COLOR} ${darkStop}px, transparent ${scrimHeight}px)`;
}

export function getBottomCardScrimGradient(scrimHeight: number): string {
  const darkStop = scrimHeight * 0.2;
  return `linear-gradient(to top, ${CARD_SCRIM_COLOR} ${darkStop}px, transparent ${scrimHeight}px)`;
}

export function getCardScrimStyle({
  topScrim,
  bottomScrim,
  containerHeight,
}: CardScrimStyleInput): CSSProperties | null {
  const backgrounds: string[] = [];

  if (isCardScrimVisible(topScrim)) {
    backgrounds.push(
      getTopCardScrimGradient(getCardScrimHeight(topScrim, containerHeight)),
    );
  }

  if (isCardScrimVisible(bottomScrim)) {
    backgrounds.push(
      getBottomCardScrimGradient(
        getCardScrimHeight(bottomScrim, containerHeight),
      ),
    );
  }

  return backgrounds.length > 0
    ? { background: backgrounds.join(', ') }
    : null;
}
