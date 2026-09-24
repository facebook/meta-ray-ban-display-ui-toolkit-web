---
name: uit-navigation-focus-web
description: Build, debug, or review UI Toolkit for Meta Ray-Ban Display App, Page, Header, ScrollView, VerticalList, Pager, SubNavigationPager, SubNavigation, PaginationIndicator, SwipeIndicator, route transitions, React Router integration, focus coordination, focus restoration, partial focus, rubber-band feedback, boundary scrolling, fading edges, and scrollbars.
---

# UI Toolkit for Meta Ray-Ban Display navigation, scrolling, and focus

Read [../building-uit-interfaces-web/references/screen-layout-navigation.md](../building-uit-interfaces-web/references/screen-layout-navigation.md). Apply `uit-materials-web` for partial-focus/handoff layer behavior.

Read [references/navigation-components.md](references/navigation-components.md) for route, Pager, header, focus, and scrolling API behavior.

## Route roots

- Every app renders inside `App`.
- Ordinary route: `Page` with header props plus its content/scroll surface.
- Tabbed peer route: `SubNavigationPager` instead of Page.
- Do not render application back buttons.
- Use React Router provider/transition adapter and push ordinary forward transitions onto history.
- Use the canonical shell order `BrowserRouter` →
  `ReactRouterNavigationProvider` → `App` →
  `ReactRouterPageTransition`. Its render callback consumes `{location}` and
  passes `location={location}` to `Routes`. Omitting that snapshot can restore
  the pathname on Back while focus/scroll fall back to the first target.
- Use BrowserRouter for the production Android WebView host. HashRouter is not
  acceptable unless the host's Back bridge is explicitly verified on-device.

Header is page-only infrastructure and must be configured through Page; never
render it as an arbitrary route or list heading. ContainerHeader identifies
content inside a larger Container-owned region and is not a list section
label. SubNavigation belongs to SubNavigationPager. PaginationIndicator and
SwipeIndicator are visual-only.

Keep Page header text and metadata concise enough to remain inside both display
edges at every supported viewport. Move detailed facts into the route body;
`headerMaxLines` is not a license to overload the fixed overlay. Title,
metadata/subtitle, and textual status are each at most two words. Metadata and
status are optional and appear only when their high-value context materially
changes interpretation or the next action; routine facts stay in content. Each
SubNavigationPager child scroller uses `insetForHeader` so its content begins
below the overlaid tabs.

Header metadata is a brief optional qualifier, not an inline facts table or an
overflow line for the title.

Use a one-word title for every SubNavigationPager item. Validate every item
while the SubNavigation owns focus, after focus
hands into page content and labels collapse, and during interrupted left/right
transitions. No label may remain visible through a collapsed item, collide
with another icon, or extend beyond the SubNavigation material at any supported
viewport.

## Scrolling

Use VerticalList for ListItem collections; use ScrollView for generic content.
Keep the `ScrollView` and `VerticalList` component frames fully edge-to-edge
and use `insetForHeader` rather than manual top padding. All visible content
clears both display edges by
`var(--uit-spacing-large)` through owned row anatomy or one ScrollView content
wrapper. `ButtonRail` also extends fully to both screen edges. Never apply
horizontal padding or margin to any of these three component frames. The
scrollbar is centered in the full viewport, not the content inset.

First/last focus must reach absolute boundaries without another D-pad press. Fading edges must not create permanent trailing scroll space. Scroll remaining distance before rubber-band feedback.

## Focus

- Exactly one visual focus owner.
- Initial focus chooses intended top-left eligible control without animating every control on mount.
- Initial and Back-restored focus must already be fully visible after the route
  settles. Do not place the first eligible action below a viewport of static
  content, and do not accept a stale restored scroll position.
- Programmatic focus uses the same material state as D-pad focus.
- Preserve focus across content updates and restore focus/scroll/pager/carousel state on back before reveal.
- Partial focus respects supported axes; handoff animates between controls on the same route, not unrelated page transitions.
- Popup dismissal restores trigger focus.
- Test route history with the WebApp host's routed Back/Escape path. Do not
  substitute platform-level key injection, which tests the host exit surface
  rather than the toolkit navigation.

## Pager

Use Pager for peer content within a route, not browser route history. Match page lifecycle and initial-focus callbacks to real content. Controlled index changes are application-owned; gate them before updating if an inner page should veto. Avoid nested same-axis pagers.

Validate reload/deep link, forward/back, rapid D-pad, first/middle/last scroll and pager positions, focus retention, interrupted transitions, hidden/disabled targets, popup dismissal, and full viewport geometry.
