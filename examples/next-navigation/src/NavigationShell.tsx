/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { App } from '@wearables-ui-toolkit/mrbd';
import {
  NextNavigationProvider,
  NextPageTransition,
} from '@wearables-ui-toolkit/mrbd/next';
import { findChecklist, findChecklistItem } from './checklist';
import { ChecklistProvider } from './ChecklistProvider';
import { resolveRoute } from './routes';
import { ItemScreen } from './screens/ItemScreen';
import { ListScreen } from './screens/ListScreen';
import { ListsScreen } from './screens/ListsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

function renderScreen(pathname: string) {
  const route = resolveRoute(pathname);
  switch (route.screen) {
    case 'settings':
      return <SettingsScreen />;
    case 'list':
      return <ListScreen list={findChecklist(route.listId)!} />;
    case 'item':
      return (
        <ItemScreen
          item={findChecklistItem(route.listId, route.itemId)!}
          list={findChecklist(route.listId)!}
        />
      );
    case 'lists':
      return <ListsScreen />;
  }
}

export function NavigationShell() {
  return (
    <NextNavigationProvider>
      <App>
        <ChecklistProvider>
          <NextPageTransition>
            {({ pathname }) => renderScreen(pathname)}
          </NextPageTransition>
        </ChecklistProvider>
      </App>
    </NextNavigationProvider>
  );
}
