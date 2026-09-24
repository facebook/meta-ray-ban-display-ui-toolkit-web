# Messaging sample

Messaging is a complete inbox and conversation flow built with UI Toolkit. It shows how to combine route-level pages, focus-aware lists, scrollable message history, bottom-anchored actions, custom message shapes, and an editable reply flow.

Use this sample when building an application with a list-to-detail navigation pattern, a conversation-like history, or actions that remain separate from scrolling content.

## Documentation

Read the [application structure](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/application-structure/), [navigation and focus](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/navigation-and-focus/), and [screen layout](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/screen-layout/) guides on the Wearables Developer Center.

## Open the hosted sample

Open the hosted [messaging sample](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/messaging/) in a browser. The sample card on the [samples and utilities page](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/) includes a QR code for adding it to your own glasses.

## Preview with the Meta Ray-Ban Display Simulator

Follow the [Simulator guide](https://wearables.developer.meta.com/docs/develop/webapps/test/#preview-with-the-meta-ray-ban-display-simulator) to preview the hosted or local sample in a 600 × 600 additive-display frame in desktop Chrome. The extension provides directional controls, display and background tuning, multiple surroundings, viewport recording, and a QR code for adding the sample to your own glasses during development.

[Install the Simulator from the Chrome Web Store](https://chromewebstore.google.com/detail/meta-ray-ban-display-simu/jpjlmmodokemlepklkdbimceggpbjcll). Use it while iterating on layout, readability, focus, and application flows. The Simulator is a development preview and does not replace validation on Meta Ray-Ban Display glasses.

## What the sample demonstrates

- An avatar-led inbox built with `Page`, `VerticalList`, and `ListItem`.
- Routed conversation pages with predictable Back behavior.
- Chronological message markup that opens at the newest message.
- Focusable message bubbles that remain visible during directional navigation.
- One `ScrollView` for message history with a sibling `ButtonRail` for actions.
- Message grouping, timestamp rules, and optional directional tails.
- A visible reply editor that preserves unsent text safely.
- Disabled actions that communicate unavailable behavior without disappearing.

## Run locally

From the repository root, install workspace dependencies and start Messaging:

```bash
yarn install
yarn workspace @meta/wearables-ui-toolkit-mrbd-messaging-demo dev
```

Build and type-check the sample with:

```bash
yarn workspace @meta/wearables-ui-toolkit-mrbd-messaging-demo build
```

Run its focused state and domain tests with:

```bash
yarn workspace @meta/wearables-ui-toolkit-mrbd-messaging-demo test
```

## Read the code

Start with these files:

1. `src/App.tsx` connects the provider, routes, and application shell.
2. `src/MessagingProvider.tsx` owns visible navigation, drafts, and conversation state.
3. `src/domain.ts` defines mock conversations and message-grouping rules.
4. `src/pages/InboxPage.tsx` composes the inbox from `Page`, `VerticalList`, and `ListItem`.
5. `src/pages/ThreadPage.tsx` combines message history, the action rail, and the reply editor.
6. `src/components/MessageBubble.tsx` pairs message materials with `TailShapeProvider`.
7. `src/MessagingAgentTools.tsx` adapts optional WebMCP tools to the same state used by the visible interface.

Keeping data rules, application state, pages, and bubble rendering separate makes each layer easier to reuse or replace.

## Message history and focus

Every message bubble can receive focus. The scroll container keeps the focused bubble visible, while the action rail remains outside the scrolling history. This gives each axis and region one clear owner and avoids nested scrollers competing for directional input.

Messages remain in chronological document order. The thread positions the view at the newest content when it opens rather than reversing the message markup. Timestamps appear on the last message in a short same-sender group.

The action rail can switch a conversation between tailed and tail-free message geometry. This changes the visual treatment without changing grouping, ordering, focus, or accessibility behavior.

## Reply flow

The visible Reply action opens `InputTextView`. Back dismisses the editor without sending. Text entered for another conversation remains attached to that conversation, and a non-empty draft is not replaced silently.

When WebMCP is available, `draft_message` opens a conversation and creates the same visible, editable draft. The tool does not send a message. The user reviews or edits the text and activates the field's Send action.

## Optional WebMCP tools

`MessagingAgentTools.tsx` registers tools only when the browser supports WebMCP:

- `open_message_thread` opens a conversation by contact name.
- `draft_message` opens a thread and creates a visible draft.

Both tools use the same provider actions as the visible interface. Messaging continues to work normally when WebMCP is unavailable.

## Adapt the sample

Replace the mock data and provider actions while preserving the page composition and ownership boundaries. Applications should provide localized labels, accessible image descriptions, loading and error states, persistence, and a real send operation appropriate to their data source.
