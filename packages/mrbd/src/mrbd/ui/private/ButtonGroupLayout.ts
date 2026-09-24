/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ButtonGroupAlignment } from '../ButtonGroup.types';

/** Default group height in px. */
export const BUTTON_GROUP_DEFAULT_HEIGHT = 88;

/**
 * Data attribute that recognized sizable toolkit children (Button, QuickReplyButton,
 * ButtonDivider) stamp on their root element. It carries the item height and acts
 * as the `Sizable` contract.
 */
export const BUTTON_GROUP_ITEM_HEIGHT_ATTR = 'data-uit-button-group-item-height';

const BUTTON_GROUP_CHILD_WARNING =
  '[ButtonGroup] received a child that does not appear to implement the Sizable contract. ' +
  'ButtonGroup should only contain sizable components, which are typically Button, ' +
  'QuickReplyButton, or ButtonDivider components. The child is missing the ' +
  `"${BUTTON_GROUP_ITEM_HEIGHT_ATTR}" sizing attribute and may not lay out correctly.`;

/**
 * Returns whether a rendered DOM child carries the sizing contract expected by
 * ButtonGroup. Recognized toolkit children stamp [BUTTON_GROUP_ITEM_HEIGHT_ATTR] on
 * their root element. Kept deliberately conservative: only element nodes are
 * inspected, and the marker may also appear on a descendant (e.g. a child wrapped
 * by the consumer), which still counts as sizable to avoid false positives.
 */
export function isButtonGroupSizableChild(child: Element): boolean {
  if (child.hasAttribute(BUTTON_GROUP_ITEM_HEIGHT_ATTR)) {
    return true;
  }
  return child.querySelector(`[${BUTTON_GROUP_ITEM_HEIGHT_ATTR}]`) != null;
}

/**
 * Dev-only check for non-`Sizable` children. A non-sizable child cannot break
 * the page, so the contract violation is surfaced as a soft `console.warn`
 * (guarded to development) instead of throwing in production.
 */
export function warnOnNonSizableButtonGroupChildren(
  children: HTMLCollection,
): void {
  if (!import.meta.env.DEV) {
    return;
  }
  for (const child of Array.from(children)) {
    if (!isButtonGroupSizableChild(child)) {
      // eslint-disable-next-line no-console
      console.warn(BUTTON_GROUP_CHILD_WARNING, child);
    }
  }
}

export function getButtonGroupFocusableChildren(
  container: HTMLElement | null,
): HTMLElement[] {
  if (!container) return [];
  const focusable = container.querySelectorAll<HTMLElement>(
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
  );
  return Array.from(focusable);
}

export function getButtonGroupNextFocusable(
  focusable: HTMLElement[],
  current: HTMLElement,
  key: string,
): HTMLElement | null {
  const currentIndex = focusable.indexOf(current);
  if (currentIndex === -1) return null;

  switch (key) {
    case 'ArrowLeft':
      return currentIndex > 0 ? focusable[currentIndex - 1] : null;
    case 'ArrowRight':
      return currentIndex < focusable.length - 1
        ? focusable[currentIndex + 1]
        : null;
    default:
      return null;
  }
}

export function readButtonGroupItemHeight(child: Element): number {
  const attrHeight = (child as HTMLElement).dataset.uitButtonGroupItemHeight;
  const parsedHeight = attrHeight != null ? Number.parseFloat(attrHeight) : 0;
  return parsedHeight > 0 ? parsedHeight : child.getBoundingClientRect().height;
}

export function calculateButtonGroupHeight(
  children: HTMLCollection,
  fallbackHeight: number = BUTTON_GROUP_DEFAULT_HEIGHT,
): number {
  const childHeights = Array.from(children)
    .map(readButtonGroupItemHeight)
    .filter((height) => height > 0);

  return childHeights.length > 0 ? Math.max(...childHeights) : fallbackHeight;
}

export function getButtonGroupJustifyContent(
  alignment: ButtonGroupAlignment,
): 'flex-start' | 'center' | 'flex-end' {
  switch (alignment) {
    case ButtonGroupAlignment.START:
      return 'flex-start';
    case ButtonGroupAlignment.CENTER:
      return 'center';
    case ButtonGroupAlignment.END:
      return 'flex-end';
  }
}
