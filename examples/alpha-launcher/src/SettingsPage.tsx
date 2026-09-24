/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  Page,
  TrailingTag,
  VerticalList,
} from '@wearables-ui-toolkit/mrbd';
import aiConsumerFilled from '@wearables-ui-toolkit/icons/svg/aiconsumer__filled.svg';
import arrowsRefreshOutline from '@wearables-ui-toolkit/icons/svg/arrowsrefresh__outline.svg';
import grid4PanelsFilled from '@wearables-ui-toolkit/icons/svg/grid4panels__filled.svg';
import speechBubbleMessageFilled from '@wearables-ui-toolkit/icons/svg/speechbubblemessage__filled.svg';
import squareTiltSlashFilled from '@wearables-ui-toolkit/icons/svg/squaretiltslash__filled.svg';
import trashFilled from '@wearables-ui-toolkit/icons/svg/trash__filled.svg';
import { ThemedListItem } from './AppMaterialTheme';

function logSelection(label: string): void {
  console.info(`${label} selected`);
}

export function SettingsPage() {
  return (
    <div
      className="launcher-list-layer is-visible"
      data-alpha-list-page="settings"
    >
      <Page headerText="Settings">
        <VerticalList
          ariaLabel="Settings"
          insetForHeader
          scrollbarEnabled
        >
          <ThemedListItem
            icon={aiConsumerFilled}
            title="Assistant shortcuts"
            onClick={() => logSelection('Assistant shortcuts')}
          />
          <ThemedListItem
            icon={grid4PanelsFilled}
            title="Widgets"
            onClick={() => logSelection('Widgets')}
          />
          <ThemedListItem
            icon={speechBubbleMessageFilled}
            title="Message notifications"
            subtitle="Always wake the display"
            showSwitch
            checked
            onClick={() => logSelection('Message notifications')}
          />
          <ThemedListItem
            icon={arrowsRefreshOutline}
            title="Phone notifications"
            onClick={() => logSelection('Phone notifications')}
          />
          <ThemedListItem
            icon={squareTiltSlashFilled}
            title="Display alignment"
            trailingTag={TrailingTag.BETA}
            onClick={() => logSelection('Display alignment')}
          />
          <ThemedListItem
            icon={trashFilled}
            title="Reset sample"
            onClick={() => logSelection('Reset sample')}
          />
        </VerticalList>
      </Page>
    </div>
  );
}
