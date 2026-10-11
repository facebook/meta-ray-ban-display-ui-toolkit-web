/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { ListItem, Page, VerticalList } from '@wearables-ui-toolkit/mrbd';
import { useRouter } from 'next/navigation';
import { CHECKLISTS, remainingCount } from '../checklist';
import { useChecklist } from '../ChecklistProvider';
import { SETTINGS_HREF, listHref } from '../routes';

export function ListsScreen() {
  const router = useRouter();
  const { state } = useChecklist();

  return (
    <Page headerText="Lists" enableSystemBarInset={false}>
      <VerticalList insetForHeader ariaLabel="Lists">
        {CHECKLISTS.map(list => (
          <ListItem
            key={list.id}
            title={list.title}
            subtitle={`${remainingCount(state, list)} of ${list.items.length} left`}
            onClick={() => router.push(listHref(list.id))}
          />
        ))}
        <ListItem
          title="Settings"
          subtitle={state.showCompleted ? 'Showing completed' : 'Hiding completed'}
          onClick={() => router.push(SETTINGS_HREF)}
        />
      </VerticalList>
    </Page>
  );
}
