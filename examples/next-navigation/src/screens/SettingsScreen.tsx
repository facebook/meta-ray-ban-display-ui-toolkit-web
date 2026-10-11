/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { ListItem, Page, VerticalList } from '@wearables-ui-toolkit/mrbd';
import { useChecklist } from '../ChecklistProvider';

export function SettingsScreen() {
  const { dispatch, state } = useChecklist();

  return (
    <Page headerText="Settings" enableSystemBarInset={false}>
      <VerticalList insetForHeader ariaLabel="Settings">
        <ListItem
          title="Show completed"
          showSwitch
          checked={state.showCompleted}
          onCheckedChange={showCompleted =>
            dispatch({ type: 'setShowCompleted', showCompleted })
          }
        />
        <ListItem
          title="Reset lists"
          subtitle="Restore the sample items"
          onClick={() => dispatch({ type: 'reset' })}
        />
      </VerticalList>
    </Page>
  );
}
