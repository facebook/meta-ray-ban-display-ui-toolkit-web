/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ListItem, SwipeToReveal, VerticalList } from '@wearables-ui-toolkit/mrbd';
import type { SwipeToRevealAction } from '@wearables-ui-toolkit/mrbd';
import archiveFilled from '@wearables-ui-toolkit/icons/svg/archive__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

const archiveAction: SwipeToRevealAction = {
  icon: archiveFilled,
  contentDescription: 'Archive',
  onClick: () => {},
};

const saveAction: SwipeToRevealAction = {
  icon: bookmarkFilled,
  contentDescription: 'Save',
  onClick: () => {},
};

export function SwipeToRevealPage() {
  return (
    <GalleryPage title="SwipeToReveal">
      <DemoSection
        title="Secondary row actions"
        description="Swipe a focused row to expose one or two contextual actions. The row remains the primary target."
        fullBleedStage
      >
        <VerticalList
          height="calc(3 * var(--uit-listitem-min-height) + var(--uit-spacing-xlarge))"
          fadingEdgeEnabled={false}
          ariaLabel="Items with secondary actions"
        >
          <SwipeToReveal actions={[archiveAction]}>
            <ListItem title="Trip notes" subtitle="Swipe to archive" icon={archiveFilled} />
          </SwipeToReveal>
          <SwipeToReveal actions={[saveAction, archiveAction]}>
            <ListItem title="Trail recommendation" subtitle="Save or archive" icon={bookmarkFilled} />
          </SwipeToReveal>
          <ListItem
            title="Standard list item"
            subtitle="No swipe-to-reveal actions"
            icon={bookmarkFilled}
            onClick={() => {}}
          />
        </VerticalList>
      </DemoSection>
      <GuidancePanel
        summary="SwipeToReveal adds one to three secondary actions behind a focusable child such as ListItem."
        useWhen={<ul><li>Common row actions should stay available without crowding the default layout.</li></ul>}
        capabilities={<ul><li>One required action and up to two additional actions.</li></ul>}
        avoid={<ul><li>Hiding the row's only essential action behind a gesture.</li><li>Using more than three reveal actions.</li></ul>}
      />
    </GalleryPage>
  );
}
