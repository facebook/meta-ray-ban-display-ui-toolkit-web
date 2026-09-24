/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Button, ButtonRail, Toast } from '@wearables-ui-toolkit/mrbd';
import bellFilled from '@wearables-ui-toolkit/icons/svg/bell__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function ToastPage() {
  return (
    <GalleryPage title="Toast">
      <DemoSection
        title="Transient confirmation"
        description="Activate a button to queue a brief message at the top of the app."
        fullBleedStage
      >
        <ButtonRail>
          <Button
            title="Show confirmation"
            alwaysShowText
            onClick={() => Toast.show('Route saved', 'Available offline', bookmarkFilled)}
          />
          <Button
            title="Show update"
            alwaysShowText
            onClick={() => Toast.show('Alerts updated', undefined, bellFilled)}
          />
        </ButtonRail>
      </DemoSection>
      <GuidancePanel
        summary="Toast confirms a completed action with a brief message that dismisses automatically. If another toast is presented while one is visible, it waits in the queue; queued toasts are shown one at a time in the order they were requested."
        useWhen={<ul><li>The result is useful but does not require a response.</li></ul>}
        capabilities={<ul><li>Message, metadata, icon, cancellation, and ordered one-at-a-time presentation of queued toasts.</li></ul>}
        avoid={<ul><li>Using a toast for errors that require recovery.</li><li>Putting buttons or long instructions in a toast.</li></ul>}
      />
    </GalleryPage>
  );
}
