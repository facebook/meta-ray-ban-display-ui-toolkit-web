/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SwipeDirection, SwipeIndicator } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function SwipeIndicatorPage() {
  return (
    <GalleryPage title="SwipeIndicator">
      <DemoSection
        title="More content cues"
        description="SwipeIndicator is a visual-only cue. The owning scroll or paging surface handles the gesture and any resulting action."
      >
        <SwipeIndicator prompt="Swipe up for details" expanded direction={SwipeDirection.UP} />
        <SwipeIndicator prompt="Swipe down to close" expanded direction={SwipeDirection.DOWN} showScrim={false} />
      </DemoSection>
      <GuidancePanel
        summary="SwipeIndicator is a visual-only element that points toward offscreen content and can reveal a short explanatory prompt. It does not receive focus, handle gestures, or support triggering actions."
        useWhen={<ul><li>The continuation direction is otherwise easy to miss.</li></ul>}
        capabilities={<ul><li>Up or down direction, expanded prompt, optional scrim, and nudge animation.</li></ul>}
        avoid={<ul><li>Attaching click, keyboard, or gesture actions to SwipeIndicator; place behavior on the owning surface.</li><li>Using it as a swipe control or focus destination.</li><li>Leaving repetitive instructional text expanded forever.</li><li>Using it where visible layout already makes continuation obvious.</li></ul>}
      />
    </GalleryPage>
  );
}
