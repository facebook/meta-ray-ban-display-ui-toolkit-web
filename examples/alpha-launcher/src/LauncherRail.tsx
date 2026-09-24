/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Ref } from 'react';
import type { ButtonHandle } from '@wearables-ui-toolkit/mrbd/Button';
import { ButtonDivider } from '@wearables-ui-toolkit/mrbd/ButtonDivider';
import {
  ButtonRail,
  type ButtonRailHandle,
} from '@wearables-ui-toolkit/mrbd/ButtonRail';
import bellNotificationFilled from '@wearables-ui-toolkit/icons/svg/bellnotification__filled.svg';
import cameraFilled from '@wearables-ui-toolkit/icons/svg/camera__filled.svg';
import closedCaptioningFilled from '@wearables-ui-toolkit/icons/svg/closedcaptioning__filled.svg';
import compassFilled from '@wearables-ui-toolkit/icons/svg/compass__filled.svg';
import gameControllerFilled from '@wearables-ui-toolkit/icons/svg/gamecontroller__filled.svg';
import globeFilled from '@wearables-ui-toolkit/icons/svg/globe__filled.svg';
import imageFilled from '@wearables-ui-toolkit/icons/svg/image__filled.svg';
import mapFilled from '@wearables-ui-toolkit/icons/svg/map__filled.svg';
import mediaPlayFilled from '@wearables-ui-toolkit/icons/svg/mediaplay__filled.svg';
import moonCrescentFilled from '@wearables-ui-toolkit/icons/svg/mooncrescent__filled.svg';
import moonCrescentSlashFilled from '@wearables-ui-toolkit/icons/svg/mooncrescentslash__filled.svg';
import notebookFilled from '@wearables-ui-toolkit/icons/svg/notebook__filled.svg';
import phoneHandsetFilled from '@wearables-ui-toolkit/icons/svg/phonehandset__filled.svg';
import sliders2HorizontalFilled from '@wearables-ui-toolkit/icons/svg/sliders2horizontal__filled.svg';
import speechBubbleMessageFilled from '@wearables-ui-toolkit/icons/svg/speechbubblemessage__filled.svg';
import { ThemedButton } from './AppMaterialTheme';
import type { LauncherPage, RailFocusTarget } from './launcherTypes';
import { getBrightnessIcon, getVolumeIcon } from './settingIcons';

interface LauncherRailProps {
  railRef: Ref<ButtonRailHandle>;
  notificationsButtonRef: Ref<ButtonHandle>;
  railFocusTarget: RailFocusTarget;
  brightness: number;
  volume: number;
  isDoNotDisturbEnabled: boolean;
  onDoNotDisturbChanged: (enabled: boolean) => void;
  onOpenPage: (page: LauncherPage) => void;
  onChildFocusChange: (focusedChild: HTMLElement | null) => void;
}

function logSelection(label: string): void {
  console.info(label + ' selected');
}

export function LauncherRail({
  railRef,
  notificationsButtonRef,
  railFocusTarget,
  brightness,
  volume,
  isDoNotDisturbEnabled,
  onDoNotDisturbChanged,
  onOpenPage,
  onChildFocusChange,
}: LauncherRailProps) {
  return (
    <div className="launcher-rail-layer is-visible">
      {/*
        anchorIndex counts focusable children, not dividers. Notifications is
        the fifth button, so index 4 keeps it centered when focus returns home.
      */}
      <ButtonRail
        ref={railRef}
        className="launcher-rail"
        anchorIndex={4}
        onChildFocusChange={onChildFocusChange}
      >
        {/* Icon buttons reveal their titles only while focused. */}
        <ThemedButton
          initialFocusEligible={false}
          icon={sliders2HorizontalFilled}
          title="Settings"
          onClick={() => onOpenPage('settings')}
        />
        <ThemedButton
          initialFocusEligible={railFocusTarget === 'brightness'}
          icon={getBrightnessIcon(brightness)}
          title="Brightness"
          onClick={() => onOpenPage('brightness')}
        />
        <ThemedButton
          initialFocusEligible={railFocusTarget === 'volume'}
          icon={getVolumeIcon(volume)}
          title="Volume"
          onClick={() => onOpenPage('volume')}
        />
        <ThemedButton
          initialFocusEligible={false}
          icon={isDoNotDisturbEnabled
            ? moonCrescentFilled
            : moonCrescentSlashFilled}
          title="Do Not Disturb"
          aria-pressed={isDoNotDisturbEnabled}
          onClick={() => onDoNotDisturbChanged(!isDoNotDisturbEnabled)}
        />

        <ButtonDivider />

        <ThemedButton
          ref={notificationsButtonRef}
          initialFocusEligible={railFocusTarget === 'notifications'}
          icon={bellNotificationFilled}
          title="Notifications"
          onClick={() => onOpenPage('notifications')}
        />

        <ButtonDivider />

        <ThemedButton
          initialFocusEligible={false}
          icon={speechBubbleMessageFilled}
          title="Messages"
          onClick={() => logSelection('Messages')}
        />
        <ThemedButton
          initialFocusEligible={false}
          icon={compassFilled}
          title="Community"
          onClick={() => logSelection('Community')}
        />
        <ThemedButton
          initialFocusEligible={false}
          icon={speechBubbleMessageFilled}
          title="Contacts"
          onClick={() => logSelection('Contacts')}
        />
        <ThemedButton
          initialFocusEligible={false}
          icon={phoneHandsetFilled}
          title="Calls"
          onClick={() => logSelection('Calls')}
        />
        <ThemedButton
          initialFocusEligible={false}
          icon={cameraFilled}
          title="Camera"
          onClick={() => logSelection('Camera')}
        />
        <ThemedButton
          initialFocusEligible={false}
          icon={mediaPlayFilled}
          title="Music"
          onClick={() => logSelection('Music')}
        />
        <ThemedButton
          initialFocusEligible={false}
          icon={imageFilled}
          title="Photos"
          onClick={() => logSelection('Photos')}
        />
        <ThemedButton
          initialFocusEligible={false}
          icon={mapFilled}
          title="Navigation"
          onClick={() => logSelection('Navigation')}
        />
        <ThemedButton
          initialFocusEligible={false}
          icon={notebookFilled}
          title="Reader"
          onClick={() => logSelection('Reader')}
        />
        <ThemedButton
          initialFocusEligible={false}
          icon={closedCaptioningFilled}
          title="Captions"
          onClick={() => logSelection('Captions')}
        />
        <ThemedButton
          initialFocusEligible={false}
          icon={globeFilled}
          title="Browser"
          onClick={() => logSelection('Browser')}
        />
        <ThemedButton
          initialFocusEligible={false}
          icon={gameControllerFilled}
          title="Games"
          onClick={() => logSelection('Games')}
        />
      </ButtonRail>
    </div>
  );
}
