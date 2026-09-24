/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Panel, TextColor, TextStyle, TextView } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function PanelPage() {
  return (
    <GalleryPage title="Panel">
      <DemoSection
        title="Informational content"
        description="Panels provide a background for informational content or lightweight visual grouping. They are static by default but can support focus and interaction when a pattern requires it."
      >
        <Panel className="gallery-example-surface">
          <div className="gallery-surface-content">
            <TextView as="h2" textStyle={TextStyle.HEADING2}>Trail conditions</TextView>
            <TextView as="p" textStyle={TextStyle.BODY2} textColor={TextColor.SECONDARY}>
              The north overlook is open. Exposed sections may be windy after sunset.
            </TextView>
          </div>
        </Panel>
      </DemoSection>
      <GuidancePanel
        summary="Panels are background surfaces for informational content and lightweight grouping or organization. If a Panel is focusable or interactive, it must not contain focusable or interactive children."
        useWhen={<ul><li>Related text, status, or supporting information should read as one visual group.</li><li>A specialized pattern calls for the panel material and stable content scale. Modal, for example, uses Panel and may become focusable when its behavior requires it.</li></ul>}
        capabilities={<ul><li>Panel material, configurable corner treatment, content clipping, and responsive sizing.</li><li>Optional focus and press states without scaling the content.</li></ul>}
        avoid={<ul><li>Placing focusable or interactive children inside a Panel that is itself focusable or interactive.</li><li>Using a bare Panel as a generic action surface; use Container unless the pattern specifically calls for Panel behavior.</li><li>Rebuilding specialized components such as Modal from Panel.</li><li>Nesting another rounded container inside it.</li></ul>}
      />
    </GalleryPage>
  );
}
