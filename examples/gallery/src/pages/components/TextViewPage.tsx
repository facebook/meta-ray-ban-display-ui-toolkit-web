/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TextColor, TextStyle, TextView } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function TextViewPage() {
  return (
    <GalleryPage title="TextView">
      <DemoSection
        title="Semantic hierarchy"
        description="TextStyle and TextColor select complete design-system appearances instead of ad hoc font values."
      >
        <div className="gallery-component-column">
          <TextView as="h2" textStyle={TextStyle.DISPLAY1}>Morning walk</TextView>
          <TextView as="p" textStyle={TextStyle.BODY1}>The waterfront route is clear and ready.</TextView>
          <TextView as="p" textStyle={TextStyle.META1} textColor={TextColor.SECONDARY}>Updated 2 minutes ago</TextView>
          <TextView as="span" textStyle={TextStyle.LABEL_EMPHASIZED} textColor={TextColor.ACCENT}>LIVE</TextView>
        </div>
      </DemoSection>
      <GuidancePanel
        summary="TextView applies semantic toolkit typography and color while preserving the appropriate HTML element for document structure."
        useWhen={<ul><li>Any application text needs a supported design-system appearance.</li></ul>}
        capabilities={<ul><li>Display, heading, body, label, meta, and numeral styles.</li><li>Semantic text colors and selectable HTML elements.</li></ul>}
        avoid={<ul><li>Hardcoding font sizes, weights, or additive-display colors.</li><li>Choosing a heading appearance without matching semantic structure.</li></ul>}
      />
    </GalleryPage>
  );
}
