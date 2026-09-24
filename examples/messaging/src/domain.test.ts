/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {describe, expect, it, vi} from 'vitest';
import {
  beginsMessageStack,
  conversations,
  endsMessageStack,
  findConversation,
  findConversations,
  formatInboxTimestamp,
  getMessageTailDirection,
  type Message,
} from './domain';

const messages: Message[] = [
  {
    id: '1',
    sender: 'contact',
    text: 'First',
    timestamp: '2026-08-19T09:00:00-07:00',
  },
  {
    id: '2',
    sender: 'contact',
    text: 'Second',
    timestamp: '2026-08-19T09:02:00-07:00',
  },
  {
    id: '3',
    sender: 'self',
    text: 'Reply',
    timestamp: '2026-08-19T09:03:00-07:00',
  },
  {
    id: '4',
    sender: 'self',
    text: 'Later reply',
    timestamp: '2026-08-19T09:10:00-07:00',
  },
];

describe('conversation lookup', () => {
  it('matches a sample contact by first, full, or last name', () => {
    expect(findConversation('Alex')?.id).toBe('alex');
    expect(findConversation('  Alex Lee ')?.id).toBe('alex');
    expect(findConversation('LEE')?.id).toBe('alex');
    expect(findConversation('maya')?.name).toBe('Maya Johnson');
    expect(findConversation('unknown')).toBeUndefined();
  });

  it('returns all matching contacts so callers can handle ambiguity', () => {
    expect(findConversations('Rivera').map(conversation => conversation.name)).toEqual([
      'Sam Rivera',
    ]);
  });

  it('resolves every shipped contact name to exactly one conversation', () => {
    // The samples rely on this: `draft_message` and `open_message_thread` only
    // reach their ambiguity branches when two contacts collide, which no
    // shipped name currently does. If a future contact breaks that, this fails
    // and says so rather than the tools quietly starting to report ambiguity.
    for (const conversation of conversations) {
      const candidates = [
        conversation.id,
        conversation.name,
        ...conversation.name.split(/\s+/),
      ];
      for (const candidate of candidates) {
        expect(findConversations(candidate)).toHaveLength(1);
        expect(findConversation(candidate)?.id).toBe(conversation.id);
      }
    }
  });

  it('reports every match, and no single match, when two contacts collide', async () => {
    // Exercises the >1 branch against a private instance of the module, so the
    // shipped inbox the UI renders keeps its unambiguous names and the
    // `conversations` every other test imports is never touched.
    vi.resetModules();
    const isolated = await import('./domain');
    expect(isolated.conversations).not.toBe(conversations);

    isolated.conversations.push({
      id: 'alex-rivera',
      name: 'Alex Rivera',
      avatarSrc: isolated.conversations[0].avatarSrc,
      unread: false,
      messages: [
        {
          id: 'colliding-1',
          sender: 'contact',
          text: 'Shares a first name with Alex Lee.',
          timestamp: '2026-08-19T09:20:00-07:00',
        },
      ],
    });

    expect(
      isolated.findConversations('Alex').map(conversation => conversation.id),
    ).toEqual(['alex', 'alex-rivera']);
    // Two matches is not one, so the single-result lookup declines to guess.
    expect(isolated.findConversation('Alex')).toBeUndefined();
    // The surname now collides too, while the full name stays unique.
    expect(isolated.findConversation('Rivera')).toBeUndefined();
    expect(isolated.findConversation('Alex Rivera')?.id).toBe('alex-rivera');

    // The shared export never saw the fixture.
    expect(conversations.map(conversation => conversation.id)).toEqual([
      'alex',
      'maya',
      'sam',
    ]);
    expect(findConversation('Alex')?.id).toBe('alex');
  });
});

describe('message stacks', () => {
  it('starts a stack for a new sender or a longer pause', () => {
    expect(messages.map((_, index) => beginsMessageStack(messages, index))).toEqual([
      true,
      false,
      true,
      true,
    ]);
  });

  it('ends each stack before the next one begins', () => {
    expect(messages.map((_, index) => endsMessageStack(messages, index))).toEqual([
      false,
      true,
      true,
      true,
    ]);
  });

  it('puts a directional tail on every message', () => {
    expect(messages.map(message => getMessageTailDirection(message, true))).toEqual([
      'left',
      'left',
      'right',
      'right',
    ]);
  });

  it('removes every tail when tails are disabled', () => {
    expect(messages.map(message => getMessageTailDirection(message, false))).toEqual([
      'none',
      'none',
      'none',
      'none',
    ]);
  });
});

describe('formatInboxTimestamp', () => {
  it('uses a clock time for messages from today', () => {
    const messageTime = new Date(2026, 7, 19, 9);
    const now = new Date(2026, 7, 19, 12);
    const expected = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(messageTime);
    expect(formatInboxTimestamp(messageTime.toISOString(), now)).toBe(expected);
  });

  it('uses a short date for older messages', () => {
    const messageTime = new Date(2026, 7, 19, 9);
    const now = new Date(2026, 7, 20, 12);
    const expected = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(messageTime);
    expect(formatInboxTimestamp(messageTime.toISOString(), now)).toBe(expected);
  });
});
