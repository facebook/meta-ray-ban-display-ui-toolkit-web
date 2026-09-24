/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {useCallback, useLayoutEffect, useMemo, useRef} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {
  useWebMcpTools,
  type WebMcpTool,
} from '../../shared/webmcp';
import {
  conversations,
  countGraphemes,
  findConversations,
  MAX_DRAFT_GRAPHEMES,
} from './domain';
import {useMessaging} from './MessagingProvider';

const VISIBLE_TEXT_PATTERN = /[\p{L}\p{N}\p{P}\p{S}]/u;

export function MessagingAgentTools() {
  const location = useLocation();
  const navigate = useNavigate();
  const committedPathRef = useRef(location.pathname);
  const pendingPathRef = useRef<string | null>(null);
  const {setDraftIfAvailable} = useMessaging();

  // Only a committed render updates what the tools treat as the current route,
  // so a navigation that never lands cannot make a later call think it did.
  useLayoutEffect(() => {
    committedPathRef.current = location.pathname;
    pendingPathRef.current = null;
  }, [location.pathname]);

  /**
   * Requests `route`, and reports the route that will actually be shown.
   *
   * A navigation already in flight has been written to history and will land,
   * so a later request cannot claim its own route opened. Rather than
   * overriding the in-flight navigation — which would leave the earlier
   * caller's already-returned result describing a route that never appears —
   * the in-flight route wins and is reported back, so no caller is told a
   * thread is open when it is not.
   */
  const openRoute = useCallback((route: string): string => {
    const pendingPath = pendingPathRef.current;
    if (pendingPath != null) {
      return pendingPath;
    }
    if (committedPathRef.current === route) {
      return route;
    }
    pendingPathRef.current = route;
    navigate(route);
    return route;
  }, [navigate]);

  const describeRoute = useCallback((route: string) => {
    const conversation = conversations.find(
      candidate => `/thread/${candidate.id}` === route,
    );
    return {
      error: 'navigation_in_progress',
      message: conversation == null
        ? 'Another screen is already opening.'
        : `The thread with ${conversation.name} is already opening.`,
      openingRoute: route,
      openingPerson: conversation?.name,
      next_action: 'Confirm the open thread, then ask again if another is wanted.',
    };
  }, []);

  const tools = useMemo<readonly WebMcpTool[]>(() => {
    const openThreadTool: WebMcpTool = {
      name: 'open_message_thread',
      description:
        'Opens a sample message thread by the contact’s first name, full name, or last name.',
      inputSchema: {
        type: 'object',
        properties: {
          person: {
            type: 'string',
            description: 'Contact first name, full name, or last name.',
          },
        },
        required: ['person'],
      },
      execute: input => {
        if (typeof input.person !== 'string' || input.person.trim().length === 0) {
          return {
            error: 'invalid_person',
            message: 'Choose a contact from the sample inbox.',
            availableContacts: conversations.map(conversation => conversation.name),
            next_action: 'Ask whose message thread to open.',
          };
        }

        const matches = findConversations(input.person);
        if (matches.length === 0) {
          return {
            error: 'unknown_person',
            message: `No sample contact matches ${input.person.trim()}.`,
            availableContacts: conversations.map(conversation => conversation.name),
            next_action: 'Ask the user to choose an available contact.',
          };
        }
        if (matches.length > 1) {
          return {
            error: 'ambiguous_person',
            message: `${input.person.trim()} matches more than one contact.`,
            matchingContacts: matches.map(conversation => conversation.name),
            next_action: 'Ask the user for the contact’s full name.',
          };
        }

        const conversation = matches[0];
        const route = `/thread/${conversation.id}`;
        const openingRoute = openRoute(route);
        if (openingRoute !== route) {
          return describeRoute(openingRoute);
        }
        return {
          opened: true,
          person: conversation.name,
          route,
          next_action: `Confirm the thread with ${conversation.name} is open.`,
        };
      },
    };
    const draftTool: WebMcpTool = {
      name: 'draft_message',
      description:
        'Creates a visible message draft for a sample contact. The user must press Send.',
      inputSchema: {
        type: 'object',
        properties: {
          recipient: {
            type: 'string',
            description: 'Contact name shown in the sample inbox.',
          },
          text: {
            type: 'string',
            description: 'Message text to place in the draft.',
          },
        },
        required: ['recipient', 'text'],
      },
      execute: input => {
        if (
          typeof input.recipient !== 'string' ||
          input.recipient.trim().length === 0
        ) {
          return {
            error: 'invalid_recipient',
            message: 'Choose a contact from the sample inbox.',
            availableRecipients: conversations.map(conversation => conversation.name),
            next_action: 'Ask which contact should receive the draft.',
          };
        }
        const recipientMatches = findConversations(input.recipient);
        if (recipientMatches.length > 1) {
          return {
            error: 'ambiguous_recipient',
            message: `${input.recipient.trim()} matches more than one contact.`,
            matchingRecipients: recipientMatches.map(candidate => candidate.name),
            next_action: 'Ask the user for the contact’s full name.',
          };
        }
        const conversation = recipientMatches[0];
        if (conversation == null) {
          return {
            error: 'unknown_recipient',
            message: `No sample contact matches ${input.recipient.trim()}.`,
            availableRecipients: conversations.map(candidate => candidate.name),
            next_action: 'Ask the user to choose an available contact.',
          };
        }
        if (typeof input.text !== 'string') {
          return {
            error: 'invalid_message',
            message: 'The draft message cannot be empty.',
            next_action: 'Ask what the message should say.',
          };
        }

        const text = input.text.trim();
        if (!VISIBLE_TEXT_PATTERN.test(text)) {
          return {
            error: 'invalid_message',
            message: 'The draft message must contain visible text.',
            next_action: 'Ask what the message should say.',
          };
        }
        if (countGraphemes(text) > MAX_DRAFT_GRAPHEMES) {
          return {
            error: 'message_too_long',
            message: `Keep the draft to ${MAX_DRAFT_GRAPHEMES} graphemes or fewer.`,
            next_action: 'Ask the user for a shorter message.',
          };
        }
        const existingDraft = setDraftIfAvailable({
          conversationId: conversation.id,
          text,
        });
        if (existingDraft != null) {
          const existingRecipient = conversations.find(
            candidate => candidate.id === existingDraft.conversationId,
          )?.name;
          return {
            error: 'unsent_draft_exists',
            message: existingRecipient == null
              ? 'Review or cancel the existing draft first.'
              : `Review or cancel the existing draft to ${existingRecipient} first.`,
            next_action: 'Ask the user to review or cancel the existing draft.',
          };
        }

        const route = `/thread/${conversation.id}`;
        const openingRoute = openRoute(route);
        return {
          drafted: true,
          recipient: conversation.name,
          requiresConfirmation: true,
          // The draft exists either way; only the thread on screen can differ
          // when another navigation is already landing.
          ...(openingRoute === route ? {} : {
            showingRoute: openingRoute,
            message:
              `The draft is saved, but another screen is opening, so the thread with ${conversation.name} is not on screen yet.`,
          }),
          next_action: openingRoute === route
            ? 'Ask the user to review the draft and press Send on screen.'
            : `Ask the user to open the thread with ${conversation.name} to review the draft.`,
        };
      },
    };
    return [openThreadTool, draftTool];
  }, [describeRoute, openRoute, setDraftIfAvailable]);
  useWebMcpTools(tools);
  return null;
}
