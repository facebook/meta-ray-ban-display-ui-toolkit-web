/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Button, ButtonDivider, ButtonGroup } from '@wearables-ui-toolkit/mrbd';
import bellFilled from '@wearables-ui-toolkit/icons/svg/bell__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function ButtonGroupPage() {
  return (
    <GalleryPage title="ButtonGroup">
      <DemoSection
        title="Settings and actions"
        description="ButtonDivider acts as a section divider, marking the boundary between the setting and the action."
      >
        <ButtonGroup>
          <Button title="Notifications" icon={bellFilled} onClick={() => {}} />
          <ButtonDivider />
          <Button title="Save" icon={bookmarkFilled} onClick={() => {}} />
        </ButtonGroup>
      </DemoSection>
      <GuidancePanel
        summary="Use ButtonGroup when a small set of controls belongs together. Use ButtonDivider as a section divider between logical groups of content, such as settings and actions."
        useWhen={<ul><li>Two or three controls share one compact task area.</li><li>A clear boundary is needed between logical sections within the group.</li></ul>}
        capabilities={<ul><li>Start, center, or end alignment.</li><li>Component-aware focus sizing.</li><li>Section separation with ButtonDivider.</li></ul>}
        avoid={<ul><li>Grouping unrelated controls.</li><li>Placing a divider between every peer action or using dividers as decoration.</li><li>Adding custom separators or rounded containers around the group.</li></ul>}
      />
    </GalleryPage>
  );
}
