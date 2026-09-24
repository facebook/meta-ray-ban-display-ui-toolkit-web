/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type FocusNavigationDirection = 'up' | 'down' | 'left' | 'right';

export const INVALID_FOCUS_DIRECTION_EVENT = 'uit-invalid-focus-direction';
export const FOCUS_NAVIGATION_HANDLED_EVENT = 'uit-focus-navigation-handled';
export const PARTIAL_FOCUS_HANDOFF_EVENT = 'uit-partial-focus-handoff';
export const FORCE_FOCUS_SYNC_EVENT = 'uit-force-focus-sync';
export const INITIAL_FOCUS_EXCLUDED_ATTRIBUTE = 'data-uit-initial-focus-excluded';
export const FOCUS_SEARCH_FROM_ORIGIN_EVENT = 'uit-focus-search-from-origin';
export const SCROLL_VIEW_NAVIGATION_REQUEST_EVENT = 'uit-scroll-view-navigation-request';

export const FOCUS_POPUP_ROOT_SELECTOR = '[data-uit-focus-popup-root="true"]';
export const FOCUS_BOUNDARY_ROOT_SELECTOR = '[data-uit-focus-boundary-root="true"]';
export const FOCUS_SECTION_SELECTOR = '[data-uit-focus-section="true"]';
export const SCROLL_VIEW_SELECTOR = '[data-scroll-view="true"]';

/**
 * Elements a user can reach through sequential or directional navigation.
 *
 * The `:not()` qualifiers are load-bearing: consumers of this selector filter
 * only on visibility and geometry, so this string is the sole thing keeping
 * disabled controls and `tabindex="-1"` elements out of the arrow-key order.
 *
 * Deliberately narrower than `FOCUS_CANDIDATE_SELECTOR` — see that constant.
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Elements that could hold focus at all, before any eligibility filtering.
 *
 * Used where the caller applies its own stricter test afterwards (for example
 * `PageTransition`, which rejects disabled elements and anything with a
 * negative `tabIndex` after querying). Because that filtering happens in the
 * caller, this selector omits the `:not()` qualifiers and additionally matches
 * natively focusable elements the navigation order does not use: `area[href]`,
 * `summary`, and `[contenteditable="true"]`.
 *
 * NOTE: these two selectors are intentionally different and must not be
 * collapsed into one. Narrowing this one would drop focus restoration for a
 * page whose only focusable content is a `summary` or a rich-text editor;
 * widening `FOCUSABLE_SELECTOR` to match would put disabled controls and
 * `tabindex="-1"` elements into directional navigation. Moving `summary` or
 * `[contenteditable="true"]` into the navigation order is a deliberate
 * behavior change, not a cleanup.
 */
export const FOCUS_CANDIDATE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable="true"]',
  '[tabindex]',
].join(',');
