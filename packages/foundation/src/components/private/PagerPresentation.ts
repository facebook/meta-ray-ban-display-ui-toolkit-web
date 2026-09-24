/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import {
  INVALID_PAGE_INDEX,
  PEEK_PERCENT,
  getMappedAlpha,
  getPageAlpha,
  getPageTranslation,
} from './PagerAnimation';
import type { PeekState } from './PagerAnimation';
import { PagerOrientation } from '../Pager.types';

export interface PagerStyleClasses {
  page: string;
  pageActive: string;
  pageInactive: string;
  pageHidden: string;
  pageAnimated: string;
  scrim: string;
  scrimHorizontalNext: string;
  scrimHorizontalPrev: string;
  scrimVerticalNext: string;
  scrimVerticalPrev: string;
}

export interface PagerPageStyleOptions {
  orientation: PagerOrientation;
  internalIndex: number;
  pageIndex: number;
  containerSize: number;
  peekState: PeekState | null;
}

export interface PagerPageClassNameOptions {
  styles: PagerStyleClasses;
  pageIndex: number;
  internalIndex: number;
  isTransitioning: boolean;
  previousIndex: number;
  peekState: PeekState | null;
}

export interface PagerPeekScrimClassNameOptions {
  styles: PagerStyleClasses;
  orientation: PagerOrientation;
  peekState: PeekState | null;
}

export function getPagerPageStyle({
  orientation,
  internalIndex,
  pageIndex,
  containerSize,
  peekState,
}: PagerPageStyleOptions): CSSProperties {
  const baseTranslation = getPageTranslation(
    orientation,
    internalIndex,
    pageIndex,
    containerSize,
  );

  let x = baseTranslation.x;
  let y = baseTranslation.y;

  const rawAlpha = getPageAlpha(internalIndex, pageIndex);
  const isIncoming = pageIndex === internalIndex;
  let mappedAlpha = getMappedAlpha(rawAlpha, isIncoming);

  if (
    peekState != null &&
    (pageIndex === peekState.outgoingIndex || pageIndex === peekState.incomingIndex)
  ) {
    const targetTranslation = getPageTranslation(
      orientation,
      peekState.incomingIndex,
      pageIndex,
      containerSize,
    );
    const progress = peekState.phase === 'peek' ? PEEK_PERCENT : 0;
    x = baseTranslation.x + (targetTranslation.x - baseTranslation.x) * progress;
    y = baseTranslation.y + (targetTranslation.y - baseTranslation.y) * progress;
    mappedAlpha = pageIndex === peekState.incomingIndex
      ? progress > 0
        ? 1
        : 0
      : 1;
  }

  return {
    transform: `translate(${x}px, ${y}px)`,
    opacity: mappedAlpha,
  };
}

export function getPagerPageClassName({
  styles,
  pageIndex,
  internalIndex,
  isTransitioning,
  previousIndex,
  peekState,
}: PagerPageClassNameOptions): string {
  const classList = [styles.page];
  const isPeekPage =
    peekState != null &&
    (pageIndex === peekState.outgoingIndex || pageIndex === peekState.incomingIndex);
  const isTransitionPage =
    isTransitioning &&
    (pageIndex === internalIndex || pageIndex === previousIndex);

  if (isPeekPage) {
    classList.push(
      pageIndex === peekState.outgoingIndex ? styles.pageActive : styles.pageInactive,
    );
  } else if (pageIndex === internalIndex) {
    classList.push(styles.pageActive);
  } else if (
    isTransitioning &&
    previousIndex !== INVALID_PAGE_INDEX &&
    pageIndex === previousIndex
  ) {
    classList.push(styles.pageInactive);
  } else {
    classList.push(styles.pageHidden);
  }

  if (isPeekPage || isTransitionPage) {
    classList.push(styles.pageAnimated);
  }

  return classList.join(' ');
}

export function getPagerPeekScrimClassName({
  styles,
  orientation,
  peekState,
}: PagerPeekScrimClassNameOptions): string {
  if (peekState == null) {
    return styles.scrim;
  }

  const classList = [styles.scrim];
  const isForward = peekState.incomingIndex > peekState.outgoingIndex;

  if (orientation === PagerOrientation.HORIZONTAL) {
    classList.push(isForward ? styles.scrimHorizontalNext : styles.scrimHorizontalPrev);
  } else {
    classList.push(isForward ? styles.scrimVerticalNext : styles.scrimVerticalPrev);
  }

  return classList.join(' ');
}
