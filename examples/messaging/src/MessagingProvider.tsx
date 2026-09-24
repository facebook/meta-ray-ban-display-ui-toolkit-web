/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {conversations, type Message} from './domain';

export interface MessageDraft {
  conversationId: string;
  text: string;
}

interface MessagingState {
  messagesByConversation: Readonly<Record<string, readonly Message[]>>;
  draft: MessageDraft | null;
  appendMessage(conversationId: string, message: Message): void;
  clearDraft(conversationId: string): void;
  updateDraft(conversationId: string, text: string): void;
  setDraftIfAvailable(draft: MessageDraft): MessageDraft | null;
  sendDraft(conversationId: string): boolean;
}

const MessagingContext = createContext<MessagingState | null>(null);

function createInitialMessages(): Record<string, readonly Message[]> {
  return Object.fromEntries(conversations.map(conversation => [
    conversation.id,
    [...conversation.messages],
  ]));
}

export function MessagingProvider({children}: {children: ReactNode}) {
  const [messagesByConversation, setMessagesByConversation] =
    useState(createInitialMessages);
  const [draft, setDraftState] = useState<MessageDraft | null>(null);
  const draftRef = useRef<MessageDraft | null>(null);

  const appendMessage = useCallback((conversationId: string, message: Message) => {
    setMessagesByConversation(current => ({
      ...current,
      [conversationId]: [...(current[conversationId] ?? []), message],
    }));
  }, []);
  const clearDraft = useCallback((conversationId: string) => {
    if (draftRef.current?.conversationId !== conversationId) {
      return;
    }
    draftRef.current = null;
    setDraftState(null);
  }, []);
  /**
   * Updates the open draft's text.
   *
   * One draft exists at a time, so a write for a different conversation is
   * rejected rather than silently replacing pending work. `ThreadPage` never
   * opens a composer over another thread's draft, so a rejected write cannot
   * reach a field the user is typing into.
   */
  const updateDraft = useCallback((conversationId: string, text: string) => {
    const currentDraft = draftRef.current;
    if (currentDraft != null && currentDraft.conversationId !== conversationId) {
      return;
    }
    const nextDraft = text.length === 0 ? null : {conversationId, text};
    draftRef.current = nextDraft;
    setDraftState(nextDraft);
  }, []);
  /**
   * Claims the draft slot for `nextDraft`, or returns the unsent draft that
   * already owns it.
   *
   * An empty draft is a composer placeholder rather than pending work, so it
   * never blocks a new draft and is never stored: the provider only ever holds
   * a draft that has text a user could lose.
   */
  const setDraftIfAvailable = useCallback((nextDraft: MessageDraft) => {
    const currentDraft = draftRef.current;
    const isSameDraft = currentDraft != null &&
      currentDraft.conversationId === nextDraft.conversationId &&
      currentDraft.text === nextDraft.text;
    if (isSameDraft) {
      return null;
    }
    if (currentDraft != null && currentDraft.text.length > 0) {
      return currentDraft;
    }
    const storedDraft = nextDraft.text.length === 0 ? null : nextDraft;
    draftRef.current = storedDraft;
    setDraftState(storedDraft);
    return null;
  }, []);
  /**
   * Sends the open draft, reporting whether a message was appended.
   *
   * A draft that is only whitespace is not a message. It is left exactly as
   * the user typed it, with the composer still open, rather than being
   * discarded for text they could otherwise finish.
   */
  const sendDraft = useCallback((conversationId: string): boolean => {
    const activeDraft = draftRef.current;
    if (activeDraft?.conversationId !== conversationId) {
      return false;
    }
    const text = activeDraft.text.trim();
    if (text.length === 0) {
      return false;
    }
    draftRef.current = null;
    setDraftState(null);
    appendMessage(conversationId, {
      id: `Draft-${Date.now()}`,
      sender: 'self',
      text,
      timestamp: new Date().toISOString(),
    });
    return true;
  }, [appendMessage]);

  const value = useMemo<MessagingState>(() => ({
    messagesByConversation,
    draft,
    appendMessage,
    clearDraft,
    updateDraft,
    setDraftIfAvailable,
    sendDraft,
  }), [
    appendMessage,
    clearDraft,
    draft,
    messagesByConversation,
    sendDraft,
    setDraftIfAvailable,
    updateDraft,
  ]);

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging(): MessagingState {
  const value = useContext(MessagingContext);
  if (value == null) {
    throw new Error('useMessaging must be used inside MessagingProvider.');
  }
  return value;
}
