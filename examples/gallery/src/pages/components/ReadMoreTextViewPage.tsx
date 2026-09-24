/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ReadMoreTextView, StaticContainer, TextColor, TextStyle } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function ReadMoreTextViewPage() {
  return (
    <GalleryPage title="ReadMoreTextView">
      <DemoSection
        title="Clamped supporting copy"
        description="Long supporting copy is limited to three lines. When it overflows, the final line fades into a “Read more” affordance."
      >
        <StaticContainer className="gallery-copy-surface">
          <div className="gallery-surface-content">
            <ReadMoreTextView
              maxLines={3}
              readMoreLabel="Read more"
              textStyle={TextStyle.BODY2}
              textColor={TextColor.SECONDARY}
            >
              The coastal trail follows the shoreline before climbing to the north overlook. Expect exposed sections, uneven ground, and limited shade after the first mile. Carry water and check conditions before leaving.
            </ReadMoreTextView>
          </div>
        </StaticContainer>
      </DemoSection>
      <GuidancePanel
        summary="ReadMoreTextView clamps long supporting copy and shows a non-interactive affordance when content overflows. The application owns any expanded reading experience."
        useWhen={<ul><li>Supporting copy must stay within a predictable number of lines.</li></ul>}
        capabilities={<ul><li>Line clamp, semantic typography, custom label, and overflow callback.</li></ul>}
        avoid={<ul><li>Treating the affordance itself as an expansion button.</li><li>Clamping primary instructions users must read before acting.</li></ul>}
      />
    </GalleryPage>
  );
}
