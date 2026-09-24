/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { IndeterminateLoader, IndeterminateLoaderSize } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function IndeterminateLoaderPage() {
  return (
    <GalleryPage title="IndeterminateLoader">
      <DemoSection
        title="Indeterminate progress"
        description="Extra-small, small, medium, and large loader sizes."
      >
        <IndeterminateLoader size={IndeterminateLoaderSize.XSMALL} aria-label="Loading" />
        <IndeterminateLoader size={IndeterminateLoaderSize.SMALL} aria-label="Loading" />
        <IndeterminateLoader size={IndeterminateLoaderSize.MEDIUM} aria-label="Loading" />
        <IndeterminateLoader size={IndeterminateLoaderSize.LARGE} aria-label="Loading" />
      </DemoSection>
      <GuidancePanel
        summary="IndeterminateLoader indicates that an operation is in progress when its completion cannot be measured. It is a visual-only component controlled by the application."
        useWhen={<ul><li>An operation is active but does not have a meaningful progress value.</li></ul>}
        capabilities={<ul><li>Extra-small, small, medium, and large sizes, with declarative animation control.</li></ul>}
        avoid={<ul><li>Using it when determinate progress is available.</li><li>Leaving it visible after the operation completes.</li></ul>}
      />
    </GalleryPage>
  );
}
