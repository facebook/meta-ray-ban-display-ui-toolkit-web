/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ActionHint } from '@wearables-ui-toolkit/mrbd';
import circleArrowRightFilled from '@wearables-ui-toolkit/icons/svg/circlearrowright__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function ActionHintPage() {
  return (
    <GalleryPage title="ActionHint">
      <DemoSection
        title="Directional cue"
        description="The hint names a gesture or next movement without becoming an interactive target."
      >
        <ActionHint text="Swipe for more" icon={circleArrowRightFilled} />
      </DemoSection>
      <GuidancePanel
        summary="ActionHint is a concise, non-interactive cue for a gesture or available continuation."
        useWhen={<ul><li>An offscreen action or gesture needs a lightweight explanation.</li></ul>}
        capabilities={<ul><li>Optional leading icon and short text.</li></ul>}
        avoid={<ul><li>Using it as a button.</li><li>Repeating instructions that are already obvious from the layout.</li></ul>}
      />
    </GalleryPage>
  );
}
