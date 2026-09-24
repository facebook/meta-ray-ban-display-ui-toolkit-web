/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  scrollElementIntoFadingEdgeSafeArea,
  type ScrollMetrics,
} from '@wearables-ui-toolkit/foundation/internal';
import { CONTEXT_MENU_ITEM_SPACING } from './ContextMenuMetrics';
import { CONTEXT_MENU_HEIGHT, TAIL_HEIGHT } from './ContextMenuPath';
import type {
  ContextMenuEffectiveSize,
  ContextMenuFadingEdgeStrengths,
  ContextMenuMeasuredSize,
  ContextMenuPadding,
  ContextMenuTailDirection,
} from './ContextMenuLayout.types';

export type {
  ContextMenuEffectiveSize,
  ContextMenuFadingEdgeStrengths,
  ContextMenuMeasuredSize,
  ContextMenuPadding,
  ContextMenuTailDirection,
} from './ContextMenuLayout.types';

export function shouldShowContextMenuTail(
  showTail: boolean,
  tailDirection?: ContextMenuTailDirection,
): boolean {
  return showTail && tailDirection != null;
}

export function getContextMenuPadding(
  showTailPointer: boolean,
  tailDirection: ContextMenuTailDirection | undefined,
  dropShadowPadding: number,
): ContextMenuPadding {
  const tailPadding = showTailPointer ? TAIL_HEIGHT : 0;
  const paddingTop =
    showTailPointer && tailDirection === 'up'
      ? dropShadowPadding + tailPadding
      : dropShadowPadding;
  const paddingBottom =
    showTailPointer && tailDirection === 'down'
      ? dropShadowPadding + tailPadding
      : dropShadowPadding;

  return {
    paddingTop,
    paddingBottom,
    totalHeight: CONTEXT_MENU_HEIGHT + paddingTop + paddingBottom,
  };
}

export function scrollContextMenuItemIntoView(
  scrollContainer: HTMLElement | null,
  element: HTMLElement,
  fadingEdgeLength: number,
): void {
  if (!scrollContainer) return;

  scrollElementIntoFadingEdgeSafeArea(
    scrollContainer,
    element,
    { left: fadingEdgeLength, right: fadingEdgeLength },
    { axis: 'horizontal', extraMargin: CONTEXT_MENU_ITEM_SPACING },
  );
}

export function getContextMenuItems(
  scrollContainer: HTMLElement | null,
  itemsContainerClassName: string,
): HTMLElement[] {
  const itemsContainer = scrollContainer?.querySelector(`.${itemsContainerClassName}`);
  if (!itemsContainer) return [];
  return Array.from(itemsContainer.children) as HTMLElement[];
}

export function getContextMenuFocusTarget(item: HTMLElement): HTMLElement {
  return (item.querySelector('[tabindex]') as HTMLElement | null) ?? item;
}

export function getContextMenuItemIndex(
  items: HTMLElement[],
  focusedElement: HTMLElement | null,
): number {
  if (focusedElement == null) return -1;
  return items.findIndex(
    (item) => item === focusedElement || item.contains(focusedElement),
  );
}

export function getContextMenuFocusedItem(
  menu: HTMLElement | null,
  activeElement: Element | null,
): HTMLElement | null {
  if (!(menu && activeElement instanceof HTMLElement && menu.contains(activeElement))) {
    return null;
  }

  const activeMenuItem = activeElement.closest('[role="menuitem"]');
  if (activeMenuItem instanceof HTMLElement && menu.contains(activeMenuItem)) {
    return activeMenuItem;
  }

  return activeElement;
}

export function getContextMenuNextItem(
  items: HTMLElement[],
  currentIndex: number,
  key: string,
): HTMLElement | null {
  if (currentIndex === -1) return null;

  const nextIndex = key === 'ArrowRight'
    ? currentIndex + 1
    : key === 'ArrowLeft'
      ? currentIndex - 1
      : -1;

  return nextIndex >= 0 && nextIndex < items.length ? items[nextIndex] : null;
}

export function getContextMenuEffectiveSize(
  measuredSize: ContextMenuMeasuredSize,
  maxWidth: number | undefined,
  totalHeight: number,
): ContextMenuEffectiveSize {
  return {
    // No magic fallback: when unmeasured and no maxWidth, report 0 so the shape
    // path is withheld (pathD=null) until a real measurement arrives, rather
    // than guessing a width and briefly painting a wrong-sized shape.
    width: Math.ceil(measuredSize.width > 0 ? measuredSize.width : (maxWidth ?? 0)),
    height: Math.ceil(measuredSize.height > 0 ? measuredSize.height : totalHeight),
  };
}

export function getContextMenuShadowOffsetY(
  tailDirection: ContextMenuTailDirection | undefined,
): number {
  return tailDirection === 'up' ? -4 : 4;
}

export function getContextMenuFadingEdgeStrengths(
  scrollMetrics: ScrollMetrics,
  fadingEdgeLength: number,
): ContextMenuFadingEdgeStrengths {
  const maxScrollLeft = Math.max(
    0,
    scrollMetrics.scrollWidth - scrollMetrics.clientWidth,
  );
  return {
    left:
      fadingEdgeLength > 0 && scrollMetrics.scrollLeft > 0.5
        ? Math.min(scrollMetrics.scrollLeft / fadingEdgeLength, 1)
        : 0,
    right:
      fadingEdgeLength > 0 && scrollMetrics.scrollLeft < maxScrollLeft - 0.5
        ? Math.min((maxScrollLeft - scrollMetrics.scrollLeft) / fadingEdgeLength, 1)
        : 0,
  };
}
