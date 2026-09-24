/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import {
  InputTextView,
  InputTextViewSize,
  TextColor,
  TextStyle,
  TextView,
} from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

const SCROLLING_EXAMPLE = [
  'Meet at the north entrance by the ticket booth.',
  'Bring the tickets and the blue overnight bag.',
  'I will arrive around 7:15 after the last train.',
  'Text me if the entrance changes before I arrive.',
  'If it rains, wait under the covered walkway.',
  'I will send another update when I am nearby.',
].join('\n');

export function InputTextViewPage() {
  const [lastSubmittedText, setLastSubmittedText] = useState('No message sent yet.');

  return (
    <GalleryPage title="InputTextView">
      <DemoSection
        title="Text entry"
        description="Focus the field to enter a message. The action enables once text is available."
      >
        <InputTextView
          hint="Write a message"
          actionLabel="Send message"
          onSend={setLastSubmittedText}
          inputProps={{ 'aria-describedby': 'input-text-view-result' }}
        />
        <TextView
          id="input-text-view-result"
          textStyle={TextStyle.BODY2}
          textColor={TextColor.SECONDARY}
        >
          {lastSubmittedText}
        </TextView>
      </DemoSection>
      <DemoSection
        title="Multiline scrolling"
        description="The field grows to three lines, then scrolls with fading edges and a proportional scrollbar."
      >
        <InputTextView
          defaultText={SCROLLING_EXAMPLE}
          actionLabel="Send message"
          onSend={setLastSubmittedText}
          inputProps={{ 'aria-label': 'Long message' }}
        />
      </DemoSection>
      <DemoSection
        title="Loading and localized sizing"
        description="The empty compact field measures localized hint text, while loading animates the focused material and in-field indicator."
      >
        <InputTextView
          hint="メッセージを書く"
          size={InputTextViewSize.SHRINK_WHEN_EMPTY}
          showLoader
          loadingLabel="Loading message editor"
        />
      </DemoSection>
      <GuidancePanel
        summary="InputTextView provides a host-editable text display for the device input surface, including controlled and uncontrolled values, multiline growth, scrolling, and an optional submit action."
        useWhen={<ul><li>A route needs free-form text entry.</li><li>The embedding environment supplies the device input experience when the field receives focus.</li></ul>}
        capabilities={<ul><li>One-to-three-line growth, internal scrolling, fading edges, custom scrollbar, loading state, and action icon.</li><li>Standard textarea attributes through inputProps.</li></ul>}
        avoid={<ul><li>Coupling application- or host-specific input behavior to the component.</li><li>Nesting the field inside another material-owning surface.</li></ul>}
      />
    </GalleryPage>
  );
}
