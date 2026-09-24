/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  Page,
  TimestampPosition,
  VerticalList,
} from '@wearables-ui-toolkit/mrbd';
import cloudSunFilled from '@wearables-ui-toolkit/icons/svg/cloudsun__filled.svg';
import { ThemedListItem } from './AppMaterialTheme';
import {
  alexLeeAvatar,
  mayaJohnsonAvatar,
  samRiveraAvatar,
} from './publicAssets';

function logSelection(label: string): void {
  console.info(`${label} selected`);
}

export function NotificationsPage() {
  return (
    <div
      className="launcher-list-layer is-visible"
      data-alpha-list-page="notifications"
    >
      <Page headerText="Notifications">
        {/* insetForHeader keeps the first row clear of the Page header. */}
        <VerticalList
          ariaLabel="Notifications"
          insetForHeader
          scrollbarEnabled
        >
          {/* ACCESSORY_TOP aligns each timestamp with its row title. */}
          <ThemedListItem
            avatarSrc={mayaJohnsonAvatar}
            avatarAlt="Maya Johnson"
            title="Maya Johnson"
            subtitle="Are we still on for coffee after work?"
            timestamp="Now"
            timestampPosition={TimestampPosition.ACCESSORY_TOP}
            onClick={() => logSelection('Maya Johnson notification')}
          />
          <ThemedListItem
            avatarSrc={alexLeeAvatar}
            avatarAlt="Alex Lee"
            title="Alex Lee"
            subtitle="I sent the photos from our hike. The last one is my favorite."
            timestamp="4m"
            timestampPosition={TimestampPosition.ACCESSORY_TOP}
            onClick={() => logSelection('Alex Lee notification')}
          />
          <ThemedListItem
            avatarSrc={samRiveraAvatar}
            avatarAlt="Sam Rivera"
            title="Sam Rivera"
            subtitle="Perfect—I'll meet you by the entrance."
            timestamp="12m"
            timestampPosition={TimestampPosition.ACCESSORY_TOP}
            onClick={() => logSelection('Sam Rivera notification')}
          />
          <ThemedListItem
            icon={cloudSunFilled}
            title="Trail Weather"
            subtitle="Clear skies expected until 7 PM. Sunset is at 6:42."
            timestamp="1h"
            timestampPosition={TimestampPosition.ACCESSORY_TOP}
            onClick={() => logSelection('Trail Weather notification')}
          />
        </VerticalList>
      </Page>
    </div>
  );
}
