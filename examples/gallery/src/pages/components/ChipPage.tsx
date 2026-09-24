/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Chip, ChipStyle } from '@wearables-ui-toolkit/mrbd';
import bellFilled from '@wearables-ui-toolkit/icons/svg/bell__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import { useEffect, useState } from 'react';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';
import { galleryAvatarPortrait } from '../../galleryAssets';

const avatarPortrait = galleryAvatarPortrait;

const CHIP_STATE_DURATION_MS = 3000;

type AnimatedChipLeadingState = 'none' | 'avatar' | 'icon' | 'loading';

function AnimatedChipExample() {
  const [leadingState, setLeadingState] =
    useState<AnimatedChipLeadingState>('none');

  useEffect(() => {
    // This timer exists only to demonstrate Chip's built-in transitions. In an
    // application, update these props in response to real state changes.
    const intervalId = window.setInterval(() => {
      setLeadingState(currentState => {
        switch (currentState) {
          case 'none':
            return 'avatar';
          case 'avatar':
            return 'icon';
          case 'icon':
            return 'loading';
          case 'loading':
            return 'none';
        }
      });
    }, CHIP_STATE_DURATION_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <Chip
      text="Activity"
      showAvatar={leadingState === 'avatar'}
      avatarSrc={leadingState === 'avatar' ? avatarPortrait : undefined}
      avatarAlt="Portrait of Jordan"
      icon={leadingState === 'icon' ? bellFilled : undefined}
      isLoading={leadingState === 'loading'}
      chipStyle={ChipStyle.ELEVATED}
    />
  );
}

export function ChipPage() {
  return (
    <GalleryPage title="Chip">
      <DemoSection
        title="Labels and metadata"
        description="Chips are static content. Style communicates hierarchy without turning the chip into a button."
      >
        <Chip text="Connected" icon={bookmarkFilled} />
        <Chip text="Saved" metadata="2 min" icon={bookmarkFilled} />
        <Chip
          text="Jordan"
          showAvatar
          avatarSrc={avatarPortrait}
          avatarAlt="Portrait of Jordan"
        />
        <Chip text="Important" chipStyle={ChipStyle.EMPHASIZED} />
        <Chip text="Updating" isLoading chipStyle={ChipStyle.ELEVATED} />
      </DemoSection>
      <DemoSection
        title="Animated state changes"
        description="This Chip cycles from text-only to avatar, icon, loading, and back to text-only. Updating the leading-content props lets Chip animate each transition."
      >
        <AnimatedChipExample />
      </DemoSection>
      <GuidancePanel
        summary="Chip displays compact, non-interactive status or metadata. It can combine a short label with an icon, avatar, loading state, or metadata."
        useWhen={<ul><li>Showing a category, state, or lightweight attribution.</li></ul>}
        capabilities={<ul><li>Three emphasis styles.</li><li>Icon, avatar, loading, and metadata slots.</li><li>Animated transitions when leading content changes.</li></ul>}
        avoid={<ul><li>Adding click behavior to a static chip.</li><li>Using long paragraph text.</li><li>Cycling states without a real status change; this sample loops only to demonstrate the available transitions.</li></ul>}
      />
    </GalleryPage>
  );
}
