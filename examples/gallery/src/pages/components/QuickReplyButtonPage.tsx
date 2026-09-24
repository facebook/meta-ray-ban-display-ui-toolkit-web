/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ButtonRail, QuickReplyButton } from '@wearables-ui-toolkit/mrbd';
import circleArrowRightFilled from '@wearables-ui-toolkit/icons/svg/circlearrowright__filled.svg';
import bellFilled from '@wearables-ui-toolkit/icons/svg/bell__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import heartFilled from '@wearables-ui-toolkit/icons/svg/heart__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function QuickReplyButtonPage() {
  return (
    <GalleryPage title="QuickReplyButton">
      <DemoSection
        title="Content variants"
        description="Quick replies can use concise text, an icon-only reaction, or an icon that appears when a text reply is focused."
        fullBleedStage
      >
        <ButtonRail>
          <QuickReplyButton title="Got it" onClick={() => {}} />
          <QuickReplyButton
            icon={heartFilled}
            aria-label="Send heart reaction"
            onClick={() => {}}
          />
          <QuickReplyButton title="Sounds good" icon={bookmarkFilled} onClick={() => {}} />
          <QuickReplyButton title="On my way" icon={circleArrowRightFilled} onClick={() => {}} />
          <QuickReplyButton title="Reply" icon={bellFilled} onClick={() => {}} />
        </ButtonRail>
      </DemoSection>
      <GuidancePanel
        summary="Use QuickReplyButton for concise, ready-to-send responses. Keep labels conversational and immediately understandable."
        useWhen={<ul><li>Offering a short response to a message or prompt.</li></ul>}
        capabilities={<ul><li>Text-only, icon-only, or text with a focus-revealed icon.</li></ul>}
        avoid={<ul><li>Long sentences or multi-step actions.</li><li>Using quick replies as general navigation.</li></ul>}
      />
    </GalleryPage>
  );
}
