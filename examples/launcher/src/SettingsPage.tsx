/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ListItem,
  Page,
  VerticalList,
} from '@wearables-ui-toolkit/mrbd';
import grid4PanelsFilled from '@wearables-ui-toolkit/icons/svg/grid4panels__filled.svg';
import {
  APP_GRID_STYLE_LABELS,
  type AppGridStyle,
} from './appGridStyle';

export function SettingsPage({
  appGridStyle,
  onOpenAppGridStyle,
}: {
  appGridStyle: AppGridStyle;
  onOpenAppGridStyle: () => void;
}) {
  return (
    <Page className="launcherSettingsPage" headerText="Settings">
      <VerticalList
        ariaLabel="Settings"
        className="launcherSettingsList"
        contentClassName="launcherSettingsListContent"
        insetForHeader
      >
        <ListItem
          data-uit-capture-id="launcher-app-grid-style-setting"
          icon={grid4PanelsFilled}
          onClick={onOpenAppGridStyle}
          subtitle={APP_GRID_STYLE_LABELS[appGridStyle]}
          title="App grid style"
        />
      </VerticalList>
    </Page>
  );
}
