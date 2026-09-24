---
name: uit-lists-menus-web
description: Build or review UI Toolkit for Meta Ray-Ban Display ListItem, VerticalList, ScrollView list layouts, SwipeToReveal rows, Divider, VerticalMenu, VerticalMenuButton, ContextMenu, and menu items. Use for navigation/settings rows, timestamps, avatars, status/accessories, row controls, list spacing/insets, boundary scrolling, reveal actions, anchored menus, dismissal, or focus restoration.
---

# UI Toolkit for Meta Ray-Ban Display lists and menus

Read [../building-uit-interfaces-web/references/actions-lists-controls.md](../building-uit-interfaces-web/references/actions-lists-controls.md) and [../building-uit-interfaces-web/references/screen-layout-navigation.md](../building-uit-interfaces-web/references/screen-layout-navigation.md).

Read [references/list-menu-components.md](references/list-menu-components.md) for complete row modes, popup APIs, and selection rules.

## Vertical lists

If a route contains any ListItem, put the complete route flow in one
`VerticalList`. It is the route's sole vertical ScrollView, not a section inside
another page scroller.

- Keep the viewport edge-to-edge; ListItem owns row inset.
- Put rows directly adjacent with no margin, gap, decorative divider, or rounded wrapper.
- Never nest it inside another same-axis scroller in application UI.
- Do not create one VerticalList per section. Keep rows in one adjacent flow;
  `Header` is page-only and `ContainerHeader` belongs inside a larger
  Container-owned region, not between list rows.
- Do not assign an arbitrary height to make an inner list fit. A list viewport
  must fill the route and show at least one complete row at every supported
  viewport.
- Focus on the first/last row must reach the true top/bottom immediately.
- Do not append permanent fade-safe spacers; the fade disappears at the boundary.
- Use stable row keys and restore focused row/scroll offset on back.

## ListItem anatomy

Use its supported slots: title, subtitle, semantic subtitle color, secondary icon, leading filled icon or Avatar, timestamp positions/colors, one primary trailing treatment, status dot/icons, accessory icon, supported tag, switch/radio, or full-width slider.

- Do not add navigation chevrons/arrows.
- Do not combine competing trailing modes.
- Do not resize component-owned accessory/status icons.
- Use semantic accessibility descriptions for status/timestamp/text where visible copy is insufficient.
- Use a real avatar for known identity.
- Parent row owns interaction when showing switch/radio/slider.
- Give each fact one visible home. Do not repeat the same status/time in the
  subtitle, timestamp, tag, or trailing area, and do not create equivalent
  adjacent segments such as “Due tomorrow · Tomorrow.”
- When `timestamp` contains the start time, the subtitle contains the
  complementary fact only; do not build `"time · place"` in the subtitle and
  repeat `time` in the trailing slot. Check the rendered row, because a local
  `subtitle` variable can hide this duplication during source review.
- When a row uses the trailing `timestamp` slot, keep the subtitle to one
  concise complementary fact. Do not also serialize a delimiter-separated fact
  pair there; the timestamp already consumes the width needed by the primary
  identity and supporting text.
- Use `timestamp` only for actual concise time/date information. Never put a
  location, status, category, count, or general metadata string in that
  trailing slot; it steals width from the title/subtitle and misrepresents the
  information. Put those facts in concise title/subtitle content instead.
- Treat visible truncation as a content-model failure. Preserve the complete
  row identity and one essential complementary fact. Remove redundant words or
  move additional detail to the destination instead of allowing primary row
  text to ellipsize across much of a collection.

## Swipe to reveal

Wrap a ListItem and keep it in VerticalList. Expose one to three contextual secondary actions. Keep the essential/primary action visible on the row. Ensure revealing does not clip before either screen edge.

## Menus

VerticalMenu and ContextMenu are temporary popup content anchored to a Button/Container through tooltip/portal infrastructure. Never render inline.

- Use menu-specific item components.
- Pass the menu element to the trigger's `tooltipContent`; drive visibility
  through the trigger's `tooltipMode`; and spread
  `getVerticalMenuAnchorProps(...)` onto that same trigger. Do not render the
  menu as a trigger sibling, a child of the action dock, or any other normal-flow
  element. Opening a menu must not change the scroller, dock, trigger, or page
  geometry.
- Open with controlled state.
- Dismiss on item activation, Back/Escape, or navigation exit.
- Close before route navigation unless the selected command explicitly navigates after dismissal.
- Stop item click propagation if it would reopen the trigger.
- Restore trigger focus before paint.
- Do not use menus as permanent page navigation or open nested overlays.

Validate list top/middle/bottom, rapid D-pad navigation, fade/scrollbar alignment, every row variant, reveal clipping, menu placement at multiple anchors, item activation, dismissal reasons, and focus restoration.
