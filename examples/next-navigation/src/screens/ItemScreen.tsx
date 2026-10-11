/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { ListItem, Page, VerticalList } from '@wearables-ui-toolkit/mrbd';
import { isCompleted, type Checklist, type ChecklistItem } from '../checklist';
import { useChecklist } from '../ChecklistProvider';

export function ItemScreen({
  item,
  list,
}: {
  item: ChecklistItem;
  list: Checklist;
}) {
  const { dispatch, state } = useChecklist();

  return (
    <Page
      headerText={item.title}
      headerMetadata={list.title}
      enableSystemBarInset={false}
    >
      <VerticalList insetForHeader ariaLabel={item.title}>
        <ListItem
          title="Done"
          showSwitch
          checked={isCompleted(state, list.id, item.id)}
          onCheckedChange={() =>
            dispatch({ type: 'toggle', listId: list.id, itemId: item.id })
          }
        />
        <ListItem title="Note" subtitle={item.note} subtitleMaxLines={3} />
      </VerticalList>
    </Page>
  );
}
