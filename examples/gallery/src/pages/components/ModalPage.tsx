/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Button, ButtonGroup, Modal } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';
import { galleryAvatarPortrait } from '../../galleryAssets';

const avatarPortrait = galleryAvatarPortrait;

export function ModalPage() {
  return (
    <GalleryPage title="Modal">
      <DemoSection
        title="Focused decision"
        description="Modal owns one panel surface. The portrait, copy, and actions are composed directly into that surface."
      >
        <Modal
          className="gallery-modal-example"
          title="Share this route?"
          subtitle="Jordan will receive the saved coastal route and its current trail notes."
          avatarSrc={avatarPortrait}
          avatarAlt="Portrait of Jordan"
          buttons={
            <ButtonGroup>
              <Button title="Cancel" alwaysShowText onClick={() => {}} />
              <Button title="Share" alwaysShowText onClick={() => {}} />
            </ButtonGroup>
          }
        />
      </DemoSection>
      <GuidancePanel
        summary="Modal concentrates attention on information or a decision using one non-nested panel surface."
        useWhen={<ul><li>Users must acknowledge information or choose before continuing.</li></ul>}
        capabilities={<ul><li>Title, subtitle, icon, portrait, banner, list, and action slots.</li></ul>}
        avoid={<ul><li>Opening a modal for routine confirmation.</li><li>Nesting another modal or rounded panel inside it.</li><li>Adding an in-app back button.</li></ul>}
      />
    </GalleryPage>
  );
}
