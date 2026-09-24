/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { ListItem, Switch } from '@wearables-ui-toolkit/mrbd';
import bellFilled from '@wearables-ui-toolkit/icons/svg/bell__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function SwitchPage() {
  const [enabled, setEnabled] = useState(true);

  return (
    <GalleryPage title="Switch">
      <DemoSection
        title="Visual states"
        description="Switch is a visual building block. A parent such as ListItem owns the label and interaction."
      >
        <Switch checked />
        <Switch checked={false} />
      </DemoSection>
      <DemoSection
        title="Interactive setting"
        description="ListItem exposes one focus target and drives the presentational switch state."
      >
        <ListItem
          title="Activity alerts"
          subtitle={enabled ? 'On' : 'Off'}
          icon={bellFilled}
          showSwitch
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </DemoSection>
      <GuidancePanel
        summary="Switch communicates a binary setting. The public Switch itself is visual-only; compose it through an interactive parent when users must change it."
        useWhen={<ul><li>A setting can be clearly understood as on or off.</li></ul>}
        capabilities={<ul><li>On and off visual states with optional animation.</li></ul>}
        avoid={<ul><li>Using a standalone Switch as an unlabeled control.</li><li>Using it for a one-time command.</li></ul>}
      />
    </GalleryPage>
  );
}
