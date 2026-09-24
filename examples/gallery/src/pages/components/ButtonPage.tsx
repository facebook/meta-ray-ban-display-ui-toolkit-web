/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Button, ButtonGroup, TooltipMode } from '@wearables-ui-toolkit/mrbd';
import circleArrowRightFilled from '@wearables-ui-toolkit/icons/svg/circlearrowright__filled.svg';
import bellFilled from '@wearables-ui-toolkit/icons/svg/bell__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function ButtonPage() {
  return (
    <GalleryPage title="Button">
      <DemoSection
        title="Common button content"
        description="Buttons can present text, an icon, or both. Text remains visible in the emphasized example."
      >
        <ButtonGroup>
          <Button title="Continue" alwaysShowText onClick={() => {}} />
          <Button
            title="Notifications"
            icon={bellFilled}
            onClick={() => {}}
          />
          <Button
            icon={bookmarkFilled}
            aria-label="Save"
            onClick={() => {}}
          />
        </ButtonGroup>
      </DemoSection>
      <DemoSection
        title="Unavailable action"
        description="A persistent label keeps the unavailable action identifiable while the disabled treatment communicates that it cannot currently run."
      >
        <Button
          title="Sending"
          icon={circleArrowRightFilled}
          alwaysShowText
          disabled
          tooltipText="Action unavailable"
          tooltipMode={TooltipMode.DISABLED_CLICK}
        />
      </DemoSection>
      <GuidancePanel
        summary="Use Button for a direct action. The toolkit supplies its default material, shape, focus treatment, and content transition; pass another material when the control needs a different visual treatment."
        useWhen={<ul><li>An action should run immediately.</li><li>An icon, label, or short supporting subtitle clarifies the result.</li></ul>}
        capabilities={<ul><li>Text, icon, avatar, subtitle, and reduced-opacity disabled states.</li><li>Disabled-click tooltips for unavailable-action feedback.</li><li>Default toolkit styling or any compatible material, including a custom material.</li><li>Focus and press animation without custom wrappers.</li></ul>}
        avoid={<ul><li>Using a button as static status.</li><li>Placing buttons directly in a horizontal row; use ButtonRail for flexibility or ButtonGroup for a small connected set.</li><li>Placing a button inside another interactive surface.</li></ul>}
      />
    </GalleryPage>
  );
}
