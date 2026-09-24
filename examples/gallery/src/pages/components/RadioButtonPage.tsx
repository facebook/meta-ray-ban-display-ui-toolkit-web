/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { ListItem, RadioButton, VerticalList } from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function RadioButtonPage() {
  const [selected, setSelected] = useState<'nearby' | 'saved'>('nearby');

  return (
    <GalleryPage title="RadioButton">
      <DemoSection
        title="Visual states"
        description="RadioButton renders selected and unselected state while the parent owns group behavior."
      >
        <RadioButton checked />
        <RadioButton checked={false} />
      </DemoSection>
      <DemoSection
        title="Single-choice rows"
        description="Each ListItem is a complete labeled target; only one row is selected at a time."
        fullBleedStage
      >
        <VerticalList
          height="calc(2 * var(--uit-listitem-min-height) + var(--uit-spacing-xlarge))"
          fadingEdgeEnabled={false}
          ariaLabel="Place selection"
        >
          <ListItem
            title="Nearby places"
            showRadioButton
            checked={selected === 'nearby'}
            onCheckedChange={() => setSelected('nearby')}
          />
          <ListItem
            title="Saved places"
            showRadioButton
            checked={selected === 'saved'}
            onCheckedChange={() => setSelected('saved')}
          />
        </VerticalList>
      </DemoSection>
      <GuidancePanel
        summary="RadioButton communicates one selection within a mutually exclusive set. The public RadioButton itself is visual-only; compose it through an interactive parent such as ListItem when users must change the selection."
        useWhen={<ul><li>Users must choose exactly one visible option.</li></ul>}
        capabilities={<ul><li>Selected and unselected visual states.</li></ul>}
        avoid={<ul><li>Using a standalone RadioButton as an interactive control.</li><li>Using radio buttons for independent settings.</li><li>Presenting a radio glyph without a clear group label.</li></ul>}
      />
    </GalleryPage>
  );
}
