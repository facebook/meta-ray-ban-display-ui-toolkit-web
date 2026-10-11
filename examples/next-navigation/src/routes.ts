/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { findChecklist, findChecklistItem } from './checklist';

export type Route =
  | { screen: 'lists' }
  | { screen: 'list'; listId: string }
  | { screen: 'item'; listId: string; itemId: string }
  | { screen: 'settings' };

export const LISTS_HREF = '/';
export const SETTINGS_HREF = '/settings';

export function listHref(listId: string): string {
  return `/lists/${listId}`;
}

export function itemHref(listId: string, itemId: string): string {
  return `/lists/${listId}/items/${itemId}`;
}

/**
 * Maps a pathname to the screen it shows. Unknown paths show the lists screen,
 * which is also the Back fallback.
 */
export function resolveRoute(pathname: string): Route {
  const segments = pathname.split('/').filter(segment => segment !== '');
  if (segments.length === 1 && segments[0] === 'settings') {
    return { screen: 'settings' };
  }
  if (segments[0] !== 'lists' || segments[1] == null) {
    return { screen: 'lists' };
  }

  const listId = segments[1];
  if (findChecklist(listId) == null) {
    return { screen: 'lists' };
  }
  if (segments.length === 2) {
    return { screen: 'list', listId };
  }

  const itemId = segments[3];
  if (
    segments.length === 4 &&
    segments[2] === 'items' &&
    itemId != null &&
    findChecklistItem(listId, itemId) != null
  ) {
    return { screen: 'item', listId, itemId };
  }
  return { screen: 'list', listId };
}
