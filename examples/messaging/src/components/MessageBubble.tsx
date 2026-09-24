/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  CornerRadius,
  Container,
  MaterialLibrary,
  TailShapeProvider,
  TextColor,
  TextStyle,
  TextView,
} from '@wearables-ui-toolkit/mrbd';
import {forwardRef, useMemo} from 'react';
import type {BubbleStyle, Message} from '../domain';
import {formatMessageTimestamp, getMessageTailDirection} from '../domain';

type MessageBubbleProps = {
  bubbleStyle: BubbleStyle;
  message: Message;
  endsStack: boolean;
  initialFocusEligible: boolean;
  onSelect: (messageId: string) => void;
  selected: boolean;
};

const OUTBOUND_TOKEN_NAMES = {
  idleFill: '--uit-color-background-message-outbound',
  gradientStep1: '--uit-color-container-message-outbound-target-step1',
  gradientStep2: '--uit-color-container-message-outbound-target-step2',
  gradientStep3: '--uit-color-container-message-outbound-target-step3',
  gradientStep4: '--uit-color-container-message-outbound-target-step4',
  glowTint: '--uit-color-container-message-outbound-glow',
} as const;

function resolveColorToken(token: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (value.length === 0) {
    throw new Error(`Missing toolkit color token: ${token}`);
  }
  return value;
}

export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  function MessageBubble(
    {bubbleStyle, message, endsStack, initialFocusEligible, onSelect, selected},
    ref,
  ) {
    const isOutgoing = message.sender === 'self';
    const tailDirection = getMessageTailDirection(message, bubbleStyle === 'tailed');
    const shapeProvider = useMemo(
      () => new TailShapeProvider(tailDirection, CornerRadius.MEDIUM),
      [tailDirection],
    );
    const material = useMemo(() => {
      if (!isOutgoing) {
        return MaterialLibrary.inboundMessage();
      }

      // Canvas materials require resolved colors rather than CSS var() references.
      return MaterialLibrary.outboundMessage({
        idleFill: resolveColorToken(OUTBOUND_TOKEN_NAMES.idleFill),
        gradientStep1: resolveColorToken(OUTBOUND_TOKEN_NAMES.gradientStep1),
        gradientStep2: resolveColorToken(OUTBOUND_TOKEN_NAMES.gradientStep2),
        gradientStep3: resolveColorToken(OUTBOUND_TOKEN_NAMES.gradientStep3),
        gradientStep4: resolveColorToken(OUTBOUND_TOKEN_NAMES.gradientStep4),
        glowTint: resolveColorToken(OUTBOUND_TOKEN_NAMES.glowTint),
      });
    }, [isOutgoing]);
    const selectMessage = () => onSelect(message.id);

    return (
      <div
        ref={ref}
        className={`message-row ${isOutgoing ? 'message-row--outgoing' : ''}`}>
        <div className="message-column">
          <Container
            aria-pressed={selected}
            ariaLabel={`${isOutgoing ? 'You' : 'Contact'}: ${message.text}, ${formatMessageTimestamp(message.timestamp)}`}
            clickable
            focusable
            initialFocusEligible={initialFocusEligible}
            material={material}
            onClick={selectMessage}
            shapeProvider={shapeProvider}>
            <div className="message-bubble-content">
              <div className={`message-tail-inset message-tail-inset--${tailDirection}`}>
                <TextView as="p" textStyle={TextStyle.BODY2}>
                  {message.text}
                </TextView>
              </div>
            </div>
          </Container>
          {endsStack ? (
            <TextView
              className="message-timestamp"
              as="p"
              textStyle={TextStyle.META2}
              textColor={TextColor.SECONDARY}>
              {formatMessageTimestamp(message.timestamp)}
            </TextView>
          ) : null}
        </div>
      </div>
    );
  },
);
