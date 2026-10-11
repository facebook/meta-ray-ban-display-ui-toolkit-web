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
import {
  isCompleted,
  remainingCount,
  visibleItems,
  type Checklist,
} from '../checklist';
import { useChecklist } from '../ChecklistProvider';
import { itemHref } from '../routes';

export function ListScreen({ list }: { list: Checklist }) {
  const router = useRouter();
  const { state } = useChecklist();

  return (
    <Page
      headerText={list.title}
      headerMetadata={`${remainingCount(state, list)} left`}
      enableSystemBarInset={false}
    >
      <VerticalList insetForHeader ariaLabel={list.title}>
        {visibleItems(state, list).map(item => (
          <ListItem
            key={item.id}
            title={item.title}
            subtitle={isCompleted(state, list.id, item.id) ? 'Done' : item.note}
            onClick={() => router.push(itemHref(list.id, item.id))}
          />
        ))}
      </VerticalList>
    </Page>
  );
}
