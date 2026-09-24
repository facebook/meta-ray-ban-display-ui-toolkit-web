/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';
import {
  Interpolators,
  createTransition,
} from '@wearables-ui-toolkit/foundation/motion/Animations';
import {
  ALPHA_INACTIVE,
  ICON_SIZE,
  ITEM_SIZE,
  SPRING_DURATION,
  TEXT_FADING_EDGE,
} from './SubNavigationMetrics';
import type { SubNavigationItem } from '../SubNavigation.types';

export type SubNavigationAdjacentDirection = 'previous' | 'next';

export interface SubNavigationItemLayout {
  wrapperStyle: CSSProperties;
  contentStyle: CSSProperties;
  iconContainerStyle: CSSProperties;
  iconStyle: CSSProperties;
  iconLayerStyle: CSSProperties;
  loaderLayerStyle: CSSProperties;
  textStyle: CSSProperties;
}

export function isSubNavigationFocused(state: State): boolean {
  return state === State.FOCUSED || state === State.PRESSED;
}

export function shouldRunSubNavigationAutoHideTimer(
  autoHide: boolean,
  isFocused: boolean,
): boolean {
  return autoHide && !isFocused;
}

export function getSubNavigationContainerStyle(
  visible: boolean,
  style: CSSProperties,
  animated: boolean = true,
): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transition: animated
      ? createTransition(
          'opacity',
          SPRING_DURATION,
          Interpolators.CONTAINER_SCALE,
        )
      : 'none',
    ...style,
  };
}

/**
 * Builds the host accessible description: "Page N of M, <label>." plus
 * conditional next/previous swipe hints. Emits no label when there are no
 * pages (or no valid active page) instead of a stale "Page 1 of 0, null." and
 * suppresses the ", <label>" / hint segments for blank labels so it never
 * announces "null".
 */
export function getSubNavigationAriaLabel(
  items: SubNavigationItem[],
  active: number,
): string | undefined {
  const totalPages = items.length;
  if (totalPages <= 0 || active < 0 || active >= totalPages) {
    return undefined;
  }

  const label = items[active]?.label;
  const pageLabel =
    label != null && label.trim() !== '' ? `, ${label}` : '';
  const description = `Page ${active + 1} of ${totalPages}${pageLabel}.`;
  const hints: string[] = [];

  if (active < totalPages - 1) {
    const nextName = items[active + 1]?.label;
    if (nextName != null && nextName.trim() !== '') {
      hints.push(`Swipe up with one finger to navigate to ${nextName}`);
    }
  }

  if (active > 0) {
    const previousName = items[active - 1]?.label;
    if (previousName != null && previousName.trim() !== '') {
      hints.push(`Swipe down with one finger to navigate to ${previousName}`);
    }
  }

  return hints.length > 0
    ? `${description} ${hints.join('. ')}`
    : description;
}

/**
 * Concise announcement pushed through the polite live region on active-item
 * changes. Omits the swipe-hint guidance (that lives on the focus-read
 * aria-label) so each page change announces just "Page N of M, label".
 */
export function getSubNavigationLiveAnnouncement(
  items: SubNavigationItem[],
  active: number,
): string {
  const totalPages = items.length;
  if (totalPages <= 0 || active < 0 || active >= totalPages) {
    return '';
  }
  const label = items[active]?.label;
  const pageLabel =
    label != null && label.trim() !== '' ? `, ${label}` : '';
  return `Page ${active + 1} of ${totalPages}${pageLabel}`;
}

export function getSubNavigationAdjacentIndex(
  active: number,
  itemCount: number,
  direction: SubNavigationAdjacentDirection,
): number | null {
  const index = direction === 'previous' ? active - 1 : active + 1;
  return index >= 0 && index < itemCount ? index : null;
}

export function getSubNavigationContentScale(): number {
  return 1;
}

export function getSubNavigationItemLayout({
  textWidth,
  isActive,
  isParentFocused,
  isLoading,
}: {
  textWidth: number;
  isActive: boolean;
  isParentFocused: boolean;
  isLoading: boolean;
}): SubNavigationItemLayout {
  const showText = isActive && isParentFocused;
  const wrapperWidth = showText ? ITEM_SIZE + textWidth : ITEM_SIZE;
  const itemAlpha = isActive ? 1 : ALPHA_INACTIVE;
  const iconPadding = (ITEM_SIZE - ICON_SIZE) / 2;
  const widthTransition = createTransition(
    'width',
    SPRING_DURATION,
    Interpolators.CONTAINER_SCALE,
  );
  const opacityTransition = createTransition(
    'opacity',
    SPRING_DURATION,
    Interpolators.CONTAINER_SCALE,
  );
  const swapTransition = createTransition(
    ['opacity', 'transform'],
    SPRING_DURATION,
    Interpolators.CONTAINER_SCALE,
  );

  return {
    wrapperStyle: {
      width: wrapperWidth,
      height: ITEM_SIZE,
      transition: widthTransition,
    },
    contentStyle: {
      opacity: itemAlpha,
      width: ITEM_SIZE + textWidth,
      transition: opacityTransition,
    },
    iconContainerStyle: {
      width: ITEM_SIZE,
      height: ITEM_SIZE,
      minWidth: ITEM_SIZE,
    },
    iconStyle: {
      width: ITEM_SIZE,
      height: ITEM_SIZE,
      padding: iconPadding,
      boxSizing: 'border-box',
    },
    iconLayerStyle: {
      opacity: isLoading ? 0 : 1,
      transform: isLoading ? 'scale(0.75)' : 'scale(1)',
      visibility: isLoading ? 'hidden' : 'visible',
      transition: swapTransition,
    },
    loaderLayerStyle: {
      opacity: isLoading ? 1 : 0,
      transform: isLoading ? 'scale(1)' : 'scale(0.75)',
      visibility: isLoading ? 'visible' : 'hidden',
      transition: swapTransition,
    },
    textStyle: getSubNavigationTextStyle(textWidth),
  };
}

function getSubNavigationTextStyle(textWidth: number): CSSProperties {
  const maskImage = textWidth > TEXT_FADING_EDGE
    ? `linear-gradient(to right, black 0%, black ${
        ((textWidth - TEXT_FADING_EDGE) / textWidth) * 100
      }%, transparent 100%)`
    : undefined;

  return {
    width: textWidth,
    paddingRight: TEXT_FADING_EDGE,
    boxSizing: 'border-box',
    opacity: 1,
    overflow: 'hidden',
    flexShrink: 0,
    maskImage,
    WebkitMaskImage: maskImage,
  };
}
