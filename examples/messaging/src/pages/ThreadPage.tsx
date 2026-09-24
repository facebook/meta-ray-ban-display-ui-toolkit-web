/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  Button,
  ButtonRail,
  HeaderAvatarSize,
  InputTextView,
  Page,
  Toast,
  VerticalList,
  type ButtonHandle,
} from '@wearables-ui-toolkit/mrbd';
import cameraFilled from '@wearables-ui-toolkit/icons/svg/camera__filled.svg';
import imageStackFilled from '@wearables-ui-toolkit/icons/svg/imagestack__filled.svg';
import microphoneFilled from '@wearables-ui-toolkit/icons/svg/microphone__filled.svg';
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
} from 'react';
import {Navigate, useLocation, useNavigate, useParams} from 'react-router-dom';
import {MessageBubble} from '../components/MessageBubble';
import {
  endsMessageStack,
  getConversation,
  MAX_DRAFT_GRAPHEMES,
  truncateToGraphemes,
  type Message,
} from '../domain';
import {useMessaging} from '../MessagingProvider';

type MockAction = 'Camera' | 'Voice';

const MOCK_ACTION_MESSAGE: Record<MockAction, string> = {
  Camera: 'Photo captured',
  Voice: 'Voice message · 0:08',
};

export function ThreadPage() {
  const {threadId} = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const conversation = getConversation(threadId);
  const {
    appendMessage,
    clearDraft,
    draft,
    messagesByConversation,
    sendDraft,
    updateDraft,
  } = useMessaging();
  const messages = conversation == null
    ? []
    : messagesByConversation[conversation.id] ?? conversation.messages;
  const activeDraft = conversation != null && draft?.conversationId === conversation.id
    ? draft
    : null;
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [tailsEnabled, setTailsEnabled] = useState(true);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const replyButtonRef = useRef<ButtonHandle>(null);
  const restoreReplyFocusRef = useRef(false);
  // The thread whose Reply history entry was open on the previous commit, so
  // closing it can be told apart from navigating to a different thread.
  const openReplyThreadIdRef = useRef<string | null>(null);
  // Reply composition owns a same-route history entry, so the flag always
  // belongs to the thread that pushed it rather than to whatever thread is
  // rendered now.
  const replyEntryOpen =
    location.state != null &&
    typeof location.state === 'object' &&
    'replyComposer' in location.state &&
    location.state.replyComposer === true;
  // A draft belonging to another conversation. The composer never opens over
  // one: it would render empty while every keystroke was dropped, because the
  // provider keeps one draft at a time and rejects writes for a different
  // thread. Reply redirects to the pending draft instead.
  const pendingOtherDraft = conversation != null &&
    draft != null &&
    draft.conversationId !== conversation.id
    ? draft
    : null;
  const composerOpen = activeDraft != null ||
    (replyEntryOpen && pendingOtherDraft == null);

  useLayoutEffect(() => {
    setSelectedMessageId(null);
    setTailsEnabled(true);
  }, [conversation]);

  useLayoutEffect(() => {
    // Keep chronological DOM order, then reveal the newest message on entry.
    lastMessageRef.current?.scrollIntoView({block: 'end'});
  }, [messages.length]);

  const addMockMessage = useCallback((action: MockAction) => {
    if (conversation == null) {
      return;
    }
    const message: Message = {
      id: `${action}-${Date.now()}`,
      sender: 'self',
      text: MOCK_ACTION_MESSAGE[action],
      timestamp: new Date().toISOString(),
    };
    appendMessage(conversation.id, message);
    setSelectedMessageId(null);
    Toast.show(MOCK_ACTION_MESSAGE[action]);
  }, [appendMessage, conversation]);

  const startReply = useCallback(() => {
    if (conversation == null) {
      return;
    }
    if (draft != null && draft.conversationId !== conversation.id) {
      navigate(`/thread/${draft.conversationId}`);
      return;
    }
    const currentState = location.state != null && typeof location.state === 'object'
      ? location.state
      : {};
    navigate(location.pathname, {
      state: {...currentState, replyComposer: true},
    });
  }, [conversation, draft, location.pathname, location.state, navigate]);

  const handleSendDraft = useCallback(() => {
    if (conversation == null) {
      return;
    }
    // Nothing was sent when the draft is only whitespace. Leave the composer
    // open on the text the user typed instead of closing over it.
    if (!sendDraft(conversation.id)) {
      return;
    }
    Toast.show('Message sent');
    if (replyEntryOpen) {
      navigate(-1);
    }
  }, [conversation, navigate, replyEntryOpen, sendDraft]);

  const handleDraftTextChange = useCallback((text: string) => {
    if (conversation == null) {
      return;
    }
    // The field is measured in graphemes, the same unit the agent tool uses,
    // so a draft one side accepts can never overflow the other.
    updateDraft(conversation.id, truncateToGraphemes(text, MAX_DRAFT_GRAPHEMES));
  }, [conversation, updateDraft]);

  const handleDraftBlur = useCallback((event: FocusEvent<HTMLTextAreaElement>) => {
    const input = event.currentTarget;
    window.requestAnimationFrame(() => {
      const focusedElement = document.activeElement;
      // The web-app host hands focus to the document root when it opens its own
      // text entry. Only that handoff is reclaimed: focus moving to any other
      // element, including the field's own Send action, is left alone so this
      // never becomes a focus trap.
      const focusLeftTheDocument =
        focusedElement == null ||
        focusedElement === document.body ||
        focusedElement === document.documentElement ||
        (focusedElement instanceof HTMLElement && focusedElement.contains(input));
      if (input.isConnected && composerOpen && focusLeftTheDocument) {
        input.focus({preventScroll: true});
      }
    });
  }, [composerOpen]);

  useLayoutEffect(() => {
    const previousReplyThreadId = openReplyThreadIdRef.current;
    const currentReplyThreadId = replyEntryOpen && conversation != null
      ? conversation.id
      : null;
    openReplyThreadIdRef.current = currentReplyThreadId;
    // Only a Back out of the composer on its own thread discards the reply.
    // Navigating to another thread leaves that thread's text untouched, and
    // never clears a draft belonging to a different conversation.
    if (
      previousReplyThreadId != null &&
      previousReplyThreadId !== currentReplyThreadId &&
      previousReplyThreadId === conversation?.id
    ) {
      clearDraft(previousReplyThreadId);
      restoreReplyFocusRef.current = true;
    }
  }, [clearDraft, conversation, replyEntryOpen]);

  useLayoutEffect(() => {
    if (composerOpen || !restoreReplyFocusRef.current) {
      return;
    }
    restoreReplyFocusRef.current = false;
    replyButtonRef.current?.getElement()?.focus({preventScroll: true});
  }, [composerOpen]);

  if (conversation == null) {
    return <Navigate to="/" replace />;
  }

  return (
    <Page
      headerText={conversation.name}
      headerAvatarSrc={conversation.avatarSrc}
      headerAvatarAlt={conversation.name}
      headerAvatarSize={HeaderAvatarSize.SMALL}
      enableSystemBarInset={false}>
      <div
        className="thread-shell"
        data-tail-style={tailsEnabled ? 'tailed' : 'rounded'}>
        <VerticalList
          insetForHeader
          contentClassName="message-list"
          ariaLabel={`Conversation with ${conversation.name}`}>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              ref={index === messages.length - 1 ? lastMessageRef : undefined}
              bubbleStyle={tailsEnabled ? 'tailed' : 'rounded'}
              message={message}
              endsStack={endsMessageStack(messages, index)}
              initialFocusEligible={
                !composerOpen && index === messages.length - 1
              }
              onSelect={setSelectedMessageId}
              selected={message.id === selectedMessageId}
            />
          ))}
        </VerticalList>
        <div className="action-dock">
          {composerOpen ? (
            <div className="draft-input">
              <InputTextView
                text={activeDraft?.text ?? ''}
                hint="Write a message"
                actionLabel="Send message"
                onTextChange={handleDraftTextChange}
                onSend={handleSendDraft}
                inputProps={{
                  'aria-label': `Message to ${conversation.name}`,
                  autoFocus: true,
                  onBlur: handleDraftBlur,
                }}
              />
            </div>
          ) : (
            <ButtonRail
              centerContentWhenSmallerThanWidth={false}
              anchorIndex={1}>
              <Button
                ref={replyButtonRef}
                title="Reply"
                initialFocusEligible={false}
                onClick={startReply}
              />
              <Button
                title="Voice"
                icon={microphoneFilled}
                initialFocusEligible={false}
                onClick={() => addMockMessage('Voice')}
              />
              <Button
                title="Camera"
                icon={cameraFilled}
                initialFocusEligible={false}
                onClick={() => addMockMessage('Camera')}
              />
              <Button
                title="Photos"
                icon={imageStackFilled}
                disabled
                initialFocusEligible={false}
              />
              <Button
                title={tailsEnabled ? 'Hide tails' : 'Show tails'}
                initialFocusEligible={false}
                onClick={() => setTailsEnabled(enabled => !enabled)}
              />
            </ButtonRail>
          )}
        </div>
      </div>
    </Page>
  );
}
