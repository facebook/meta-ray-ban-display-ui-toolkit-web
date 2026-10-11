/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import {
  LISTS_HREF,
  SETTINGS_HREF,
  itemHref,
  listHref,
  resolveRoute,
} from './routes';

describe('resolveRoute', () => {
  it('resolves every screen from the hrefs that link to it', () => {
    expect(resolveRoute(LISTS_HREF)).toEqual({ screen: 'lists' });
    expect(resolveRoute(SETTINGS_HREF)).toEqual({ screen: 'settings' });
    expect(resolveRoute(listHref('travel'))).toEqual({
      screen: 'list',
      listId: 'travel',
    });
    expect(resolveRoute(itemHref('travel', 'passport'))).toEqual({
      screen: 'item',
      listId: 'travel',
      itemId: 'passport',
    });
  });

  it('accepts the trailing slash that static export URLs use', () => {
    expect(resolveRoute('/lists/home/')).toEqual({
      screen: 'list',
      listId: 'home',
    });
    expect(resolveRoute('/settings/')).toEqual({ screen: 'settings' });
  });

  it('falls back to the nearest known screen for unknown paths', () => {
    expect(resolveRoute('/lists/unknown')).toEqual({ screen: 'lists' });
    expect(resolveRoute('/lists')).toEqual({ screen: 'lists' });
    expect(resolveRoute('/lists/travel/items/unknown')).toEqual({
      screen: 'list',
      listId: 'travel',
    });
    expect(resolveRoute('/lists/travel/passport')).toEqual({
      screen: 'list',
      listId: 'travel',
    });
    expect(resolveRoute('/elsewhere')).toEqual({ screen: 'lists' });
  });
});
