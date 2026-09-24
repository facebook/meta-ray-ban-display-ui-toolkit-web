/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { StaticContainer, TextColor, TextStyle, TextView } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function StaticContainerPage() {
  return (
    <GalleryPage title="StaticContainer">
      <DemoSection
        title="Non-interactive material"
        description="StaticContainer renders a material without managing focus or press interactions. It can render on its own or contain children, optionally clipping them to the material’s shape."
      >
        <StaticContainer className="gallery-example-surface">
          <div className="gallery-surface-content">
            <TextView as="h2" textStyle={TextStyle.HEADING2}>Offline map ready</TextView>
            <TextView as="p" textStyle={TextStyle.BODY2} textColor={TextColor.SECONDARY}>The saved region is available without a connection.</TextView>
          </div>
        </StaticContainer>
      </DemoSection>
      <GuidancePanel
        summary="StaticContainer is a non-interactive material renderer. Unlike Container, it does not automatically manage or transition focus and press states. Unlike Panel, it does not prescribe the panel-specific material or grouping pattern."
        useWhen={<ul><li>A material needs to render without interaction.</li><li>Child content or media should optionally be clipped to a material shape.</li></ul>}
        capabilities={<ul><li>Optional children, custom material, caller-selected static visual state, semantic background styles, configurable corner treatment, and optional content clipping.</li><li>Primary, secondary, or no rendered background. Clipping can remain enabled when no background is drawn.</li></ul>}
        avoid={<ul><li>Using it for a surface that needs focus or press behavior; use Container instead.</li><li>Using it when the panel-specific informational grouping pattern is intended; use Panel instead.</li><li>Placing a second rounded surface inside it.</li></ul>}
      />
    </GalleryPage>
  );
}
