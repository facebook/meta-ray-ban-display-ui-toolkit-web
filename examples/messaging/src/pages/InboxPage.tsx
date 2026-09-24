/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ListItem,
  Page,
  StatusIndicatorType,
  TimestampPosition,
  TimestampTextColor,
  VerticalList,
} from '@wearables-ui-toolkit/mrbd';
import {useNavigate} from 'react-router-dom';
import {
  conversations,
  formatInboxTimestamp,
  getLatestMessage,
} from '../domain';
import {useMessaging} from '../MessagingProvider';

export function InboxPage() {
  const navigate = useNavigate();
  const {messagesByConversation} = useMessaging();

  return (
    <Page
      headerText="Messages"
      headerMetadata={`${conversations.length} chats`}
      enableSystemBarInset={false}>
      <VerticalList insetForHeader ariaLabel="Message inbox">
        {conversations.map(conversation => {
          const latestMessage = getLatestMessage({
            messages: messagesByConversation[conversation.id] ??
              conversation.messages,
          });
          return (
            <ListItem
              key={conversation.id}
              title={conversation.name}
              subtitle={latestMessage.text}
              timestamp={formatInboxTimestamp(latestMessage.timestamp)}
              timestampPosition={TimestampPosition.ACCESSORY_TOP}
              timestampTextColor={
                conversation.unread
                  ? TimestampTextColor.ACCENT
                  : TimestampTextColor.PRIMARY
              }
              avatarSrc={conversation.avatarSrc}
              avatarAlt={conversation.name}
              avatarStatusIndicator={
                conversation.unread ? StatusIndicatorType.UNREAD : undefined
              }
              onClick={() => navigate(`/thread/${conversation.id}`)}
            />
          );
        })}
      </VerticalList>
    </Page>
  );
}
