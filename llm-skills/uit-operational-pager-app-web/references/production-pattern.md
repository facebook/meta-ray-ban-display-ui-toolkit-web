# Production operational pager application

Use this pattern for one operational subject with three peer areas: a compact
overview, a collection of actionable records, and a read-only notes or handoff
surface. `SubNavigationPager` is the root surface and replaces `Page`. This is
not a dashboard, form, routed detail app, or substitute for a two-collection
Today/Done workflow.

This is a source-construction task only. Never run `npm run dev`, `vite`,
`curl`, a browser command, or any development, preview, automation, or HTTP
server command. Never inspect or choose a port. Run only the focused verifier
after construction. The instant it succeeds, stop all tool use and return a
brief file-and-verification summary without a URL or local-run instructions.

## Feature and file budget

Use the toolkit `App`, `SubNavigationPager`, `ScrollView`, `VerticalList`, `ListItem`,
`Panel`, `TextView`, `TextStyle`, `TextColor`, `Button`, `ButtonRail`, and
`Toast`, plus React state. Do not add routing, `Page`, Header, cards,
Containers, StaticContainers, Surfaces, chips, tags, badges, menus, overlays,
forms, prompts, HTML controls, custom materials, or authored scrolling.

Use exactly these source files:

- `main.tsx`: the toolkit's `App` composition and mount;
- `OperationalPager.tsx`: durable state and controlled pager;
- `pages/OverviewPage.tsx`: compact status Panel and two bottom actions;
- `pages/ItemsPage.tsx`: one uninterrupted actionable VerticalList;
- `pages/NotesPage.tsx`: one read-only information Panel;
- `app.css`: only the documented layout selectors.

Keep state in `OperationalPager` and pass explicit props. Do not introduce a
context, reducer, domain framework, timers, dates generated at runtime, or a
second model layer for this medium-size product. Every helper and transition
table must have one owner and be used. Do not leave speculative helpers or
duplicate domain-transition logic in multiple files.

## Root pager

Import styles once and mount one `OperationalPager` inside the toolkit `App`. Render
one controlled `SubNavigationPager` directly, without `Page` or a wrapper.
Provide exactly three one-word items in the order requested by the product.
Use these known filled icons when their meanings fit:

```tsx
import gridFilled from '@wearables-ui-toolkit/icons/svg/grid4panels__filled.svg';
import locationFilled from '@wearables-ui-toolkit/icons/svg/maplocationpin__filled.svg';
import notesFilled from '@wearables-ui-toolkit/icons/svg/notebook__filled.svg';
```

Each item must have a semantically accurate filled icon. Keep
`currentPageIndex` and `onPageChange` controlled by one `useState(0)`. Each
child owns exactly one vertical scroll component and sets `insetForHeader`.

## Overview area

Use a full-height two-row action shell. The first row is one edge-to-edge
`ScrollView insetForHeader tabIndex={0}`. Put one edge-to-edge `Panel` directly
inside it with `width="100%"`, then one `content-inset` for authored copy. Do
not rely on Panel's default width for a responsive page backdrop.

Keep the Panel to five text roles at most:

1. one concise subject or condition in `BODY2_EMPHASIZED`;
2. one short operational sentence in `BODY2`;
3. one all-caps category such as `STATUS` in secondary `LABEL`;
4. one compact state in `META1`;
5. optionally, one high-value secondary `META2` update.

Do not create grids, columns, stat blocks, fact bars, nested backdrops, or a
second Panel. Routine text stays at body, label, and metadata sizes.

The second shell row is one edge-to-edge `ButtonRail` in `action-dock`, with
exactly two mounted Buttons. Both commands must update visible state and then
show concise Toast feedback. Use short reversible operational actions such as
Hold/Resume and Report/Clear. Do not add navigation, tab, settings, close, or
placeholder actions. Keep Buttons mounted while labels change so focus remains
stable.

## Items area

Use exactly one edge-to-edge `VerticalList insetForHeader`. Render four to six
adjacent `ListItem` rows from one state collection. Do not add Panel,
ScrollView, Button, dividers, gaps, labels, summaries, footers, or a synthetic
action row.

Each row has a one- or two-word identity title of at most 9 characters, its
current mutable state as the short subtitle, and optionally one genuine concise
timestamp. Shorten mock identities rather than accepting narrow-width
truncation. The row's one `onClick` operation updates the subtitle state for
that same record and shows a Toast, so the outcome remains visible after the
Toast leaves. Perform that immutable record update directly in the collection
state setter. Do not create a parallel temporary record, unused variable,
`void` expression, or other no-op merely to describe the intended update. Use
an action-only `ariaLabel` such as `Update stop`; ListItem
appends the visible record content, so do not repeat the title in that prefix.
Write Toast feedback as a short natural-language sentence such as
`Central now ready`; do not use arrows or symbolic state-transition notation.
Never add a chevron or arrow.

## Notes area

Use one edge-to-edge `ScrollView insetForHeader tabIndex={0}` with one direct
edge-to-edge `Panel width="100%"` and one `content-inset`. This surface is read-only. Show a
concise handoff summary followed by at most three short note entries using
ordinary `TextView` roles. All-caps note categories and timestamps use
secondary metadata color. Do not add clickable text, remove/clear/add actions,
`window.prompt`, HTML inputs, a VerticalList, note cards, or a separate rounded
container per note.

## Authored CSS

Use exactly these five selector blocks:

```css
html,
body,
#root {
  inline-size: 100%;
  block-size: 100%;
  margin: 0;
  background: var(--uit-color-background-window);
}

* {
  box-sizing: border-box;
}

.action-page-shell {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  block-size: 100%;
  min-block-size: 0;
  min-inline-size: 0;
}

.action-dock {
  min-inline-size: 0;
  padding-block-end: var(--uit-spacing-xsmall);
}

.content-inset {
  display: flex;
  flex-direction: column;
  gap: calc(var(--uit-spacing-large) + var(--uit-spacing-xsmall));
  min-inline-size: 0;
  padding: var(--uit-spacing-large);
}
```

Do not add selectors or declarations. Never target the toolkit internals. Components
with compact intrinsic anatomy retain intrinsic size; pager children, scroll
owners, `Panel width="100%"`, VerticalList, and ButtonRail remain edge-to-edge.

## Verification

Before verification, confirm exactly three one-word tabs, one vertical owner
per area, no Page or routes, no nested scroll, one compact overview Panel, two
bottom actions, no list action row, one read-only notes Panel, token-only CSS,
and durable visible state. Then run this skill's `scripts/verify-app.mjs src`.
When it passes, stop immediately. Starting or probing a server, checking an
HTTP response, mentioning a port, URL, browser, or local-run command after a
pass makes the task a failure.
