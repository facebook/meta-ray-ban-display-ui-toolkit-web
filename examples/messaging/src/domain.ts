/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  alexLeeAvatar,
  mayaJohnsonAvatar,
  samRiveraAvatar,
} from './publicAssets';

export type MessageSender = 'contact' | 'self';
export type BubbleStyle = 'rounded' | 'tailed';
export type MessageTailDirection = 'left' | 'none' | 'right';

export type Message = {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
};

export type Conversation = {
  id: string;
  name: string;
  avatarSrc: string;
  unread: boolean;
  messages: Message[];
};

const MESSAGE_STACK_WINDOW_MS = 5 * 60 * 1000;

/**
 * The draft ceiling, counted in graphemes.
 *
 * Both the agent tool and the on-screen composer measure against this, so a
 * draft either side accepts is one the other also accepts. Counting UTF-16
 * code units instead would let an emoji draft pass the tool and then exceed
 * the field.
 */
export const MAX_DRAFT_GRAPHEMES = 240;

/** Counts user-perceived characters, so one emoji counts once. */
export function countGraphemes(value: string): number {
  if (typeof Intl.Segmenter !== 'function') {
    return Array.from(value).length;
  }
  return Array.from(new Intl.Segmenter(undefined, {
    granularity: 'grapheme',
  }).segment(value)).length;
}

/** Truncates to whole graphemes, never splitting one apart when Intl.Segmenter is available; falls back to code-point truncation otherwise. */
export function truncateToGraphemes(value: string, limit: number): string {
  if (countGraphemes(value) <= limit) {
    return value;
  }
  if (typeof Intl.Segmenter !== 'function') {
    return Array.from(value).slice(0, limit).join('');
  }
  const segments = Array.from(new Intl.Segmenter(undefined, {
    granularity: 'grapheme',
  }).segment(value));
  return segments.slice(0, limit).map(segment => segment.segment).join('');
}

export const conversations: Conversation[] = [
  {
    id: 'alex',
    name: 'Alex Lee',
    avatarSrc: alexLeeAvatar,
    unread: true,
    messages: [
      {
        id: 'alex-1',
        sender: 'contact',
        text: 'Are you close to the cafe?',
        timestamp: '2026-08-19T09:34:00-07:00',
      },
      {
        id: 'alex-2',
        sender: 'contact',
        text: 'I found a table by the window.',
        timestamp: '2026-08-19T09:35:00-07:00',
      },
      {
        id: 'alex-3',
        sender: 'self',
        text: 'Almost there. Want anything?',
        timestamp: '2026-08-19T09:37:00-07:00',
      },
      {
        id: 'alex-4',
        sender: 'contact',
        text: 'An iced tea would be perfect.',
        timestamp: '2026-08-19T09:39:00-07:00',
      },
      {
        id: 'alex-5',
        sender: 'self',
        text: 'Got it. See you in a minute.',
        timestamp: '2026-08-19T09:41:00-07:00',
      },
    ],
  },
  {
    id: 'maya',
    name: 'Maya Johnson',
    avatarSrc: mayaJohnsonAvatar,
    unread: false,
    messages: [
      {
        id: 'maya-1',
        sender: 'self',
        text: 'I uploaded the photos from the trail.',
        timestamp: '2026-08-19T08:52:00-07:00',
      },
      {
        id: 'maya-2',
        sender: 'contact',
        text: 'They look great!',
        timestamp: '2026-08-19T09:16:00-07:00',
      },
      {
        id: 'maya-3',
        sender: 'contact',
        text: 'Can you send the overlook shot too?',
        timestamp: '2026-08-19T09:18:00-07:00',
      },
    ],
  },
  {
    id: 'sam',
    name: 'Sam Rivera',
    avatarSrc: samRiveraAvatar,
    unread: false,
    messages: [
      {
        id: 'sam-1',
        sender: 'contact',
        text: 'Lunch at the market?',
        timestamp: '2026-08-18T12:05:00-07:00',
      },
      {
        id: 'sam-2',
        sender: 'self',
        text: 'Yes, I can meet you at noon.',
        timestamp: '2026-08-18T12:08:00-07:00',
      },
    ],
  },
];

export function getConversation(id: string | undefined): Conversation | undefined {
  return conversations.find(conversation => conversation.id === id);
}

function normalizeContactName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function findConversations(value: string): readonly Conversation[] {
  const normalizedValue = normalizeContactName(value);
  if (normalizedValue.length === 0) {
    return [];
  }

  return conversations.filter(conversation => {
    const nameParts = conversation.name.split(/\s+/);
    return normalizeContactName(conversation.id) === normalizedValue ||
      normalizeContactName(conversation.name) === normalizedValue ||
      nameParts.some(part => normalizeContactName(part) === normalizedValue);
  });
}

export function findConversation(value: string): Conversation | undefined {
  const matches = findConversations(value);
  return matches.length === 1 ? matches[0] : undefined;
}

export function getLatestMessage(
  conversation: {messages: readonly Message[]},
): Message {
  return conversation.messages[conversation.messages.length - 1];
}

export function beginsMessageStack(
  messages: readonly Message[],
  index: number,
): boolean {
  const message = messages[index];
  const previous = messages[index - 1];
  if (previous == null || previous.sender !== message.sender) {
    return true;
  }

  return (
    new Date(message.timestamp).getTime() - new Date(previous.timestamp).getTime() >
    MESSAGE_STACK_WINDOW_MS
  );
}

export function endsMessageStack(
  messages: readonly Message[],
  index: number,
): boolean {
  return index === messages.length - 1 || beginsMessageStack(messages, index + 1);
}

export function getMessageTailDirection(
  message: Message,
  tailsEnabled: boolean,
): MessageTailDirection {
  if (!tailsEnabled) {
    return 'none';
  }

  return message.sender === 'self' ? 'right' : 'left';
}

export function formatInboxTimestamp(timestamp: string, now = new Date()): string {
  const date = new Date(timestamp);
  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatMessageTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}
