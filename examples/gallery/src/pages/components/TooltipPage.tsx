/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Button, ButtonRail, TooltipMode, TooltipPosition } from '@wearables-ui-toolkit/mrbd';
import bellFilled from '@wearables-ui-toolkit/icons/svg/bell__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function TooltipPage() {
  return (
    <GalleryPage title="Tooltip">
      <DemoSection
        title="Focused context"
        description="Move focus to either button. The tooltip is anchored by the component rather than manually positioned."
        fullBleedStage
      >
        <ButtonRail>
          <Button
            title="Saved"
            icon={bookmarkFilled}
            tooltipText="Open saved places"
            tooltipMode={TooltipMode.FOCUSED}
            tooltipPosition={TooltipPosition.ANCHORED}
            onClick={() => {}}
          />
          <Button
            icon={bellFilled}
            aria-label="Alerts"
            tooltipText="Alerts"
            tooltipMode={TooltipMode.FOCUSED}
            tooltipPosition={TooltipPosition.ANCHORED_BOTTOM}
            onClick={() => {}}
          />
        </ButtonRail>
      </DemoSection>
      <GuidancePanel
        summary="Tooltip supplies short context for a focused target and uses the target's positioning contract."
        useWhen={<ul><li>An icon-only or unfamiliar control needs a concise label.</li></ul>}
        capabilities={<ul><li>Text, metadata, custom content, tail, focus mode, and anchor positions.</li></ul>}
        avoid={<ul><li>Repeating a button label that is already fully visible.</li><li>Putting essential instructions only in a tooltip.</li></ul>}
      />
    </GalleryPage>
  );
}
