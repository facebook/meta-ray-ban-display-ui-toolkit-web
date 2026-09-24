---
name: uit-screen-architecture-web
description: Design, implement, or review production UI Toolkit for Meta Ray-Ban Display route structure before choosing detailed components. Use for Page versus SubNavigationPager, ScrollView versus VerticalList, single-scroll-owner composition, mixed content and lists, settings screens, edge-to-edge rails/lists, responsive containment, D-pad scrolling, focus visibility, route height, or horizontal overflow.
---

# UI Toolkit for Meta Ray-Ban Display screen architecture

Choose the route skeleton before implementing its content. A route with the
wrong vertical owner cannot be repaired with margins, heights, or focus code.

Read [references/route-skeletons.md](references/route-skeletons.md) completely.
Then apply the component-specific skills required by the route.

## Non-negotiable invariant

Each visible pager page or ordinary route has exactly one vertical scroll
owner. Never nest same-axis scroll owners.

Application/domain providers whose state must survive route changes wrap
`ReactRouterPageTransition`; never instantiate them inside a transition render
snapshot. Retained pages must observe one store so changes made on a child
route are still present after Back.

- If the route contains any `ListItem`, use one root `VerticalList`. Put all
  route sections participating in that flow inside it. Do not wrap it in
  `ScrollView` or an authored `overflow: auto|scroll` element.
- If the route is heterogeneous and does not need `ListItem`, use one root
  `ScrollView`. Do not put `VerticalList` or `ListItem` inside it.
- If a `ScrollView` contains substantial static information and has no
  legitimate child interaction, set `tabIndex={0}` on the `ScrollView`. The
  scroll owner then receives focus and handles D-pad scrolling itself. Supply a
  concise `ariaLabel` naming the region. Never invent a Button, Container, or
  destination as a focus sentinel.
- `ScrollView`, `VerticalList`, and `ButtonRail` component frames always extend
  fully to both left and right screen edges. Inset authored ScrollView children
  and rely on VerticalList row anatomy; never horizontally inset or pad the
  component frames.
- Keep full-bleed Panel/Carousel/component backdrops as direct ScrollView
  children. Wrap and inset only ordinary prose or custom non-full-bleed blocks;
  never put a page-level Panel inside that wrapper. Set `width="100%"` on a
  page-level Panel; its default width is not a responsive full-bleed contract.
- When the owner uses `insetForHeader`, that property is the complete leading
  clearance for the page header. Do not add top padding, margin, spacer, or an
  empty first child before the first surface/row to create a second header
  inset.
- Each `SubNavigationPager` child follows one of those two choices. Do not add
  an authored scrolling wrapper around either owner. Each enabled pager page
  must contain at least one meaningful focus target so focus can hand off from
  SubNavigation into page content; do not build a scrollable page entirely from
  static surfaces while focus remains trapped and the content stays dimmed.
  An empty/status-only page must not make “All fresh,” “Up to date,” or similar
  status copy into an unrelated action just to satisfy this requirement. Add a
  truthful recovery/navigation command when one exists; otherwise reconsider
  whether the empty peer page should be enabled or how its real task is
  reached.
- `Carousel` may participate in the vertical flow as a direct edge-to-edge
  child of the vertical owner. Page-level `ButtonRail`/`ButtonGroup` actions do
  not participate in that flow: dock them below the vertical owner at the
  bottom of the display. The content scroller ends above the action region.

Do not solve mixed-content pressure by assigning arbitrary heights to nested
lists. A list viewport that cannot show one complete row is always invalid.
Keep list rows adjacent; do not insert `Header`, `ContainerHeader`, Panel, or
another backdrop as a simulated section/item. `Header` belongs to `Page`,
`ContainerHeader` identifies content within a larger Container-owned region,
and Panel is one informational backdrop rather than a row primitive.

## Bottom action region

On an ordinary action page, Page content owns a full-height two-row shell,
implemented as Grid or an equivalent shrinkable column Flex layout:

1. `minmax(0, 1fr)` for the route's single `VerticalList` or `ScrollView`;
2. `auto` for one edge-to-edge `ButtonRail` or fitting `ButtonGroup`.

The action region is outside the scroller and has bottom padding
`var(--uit-spacing-xsmall)`. Do not put the
rail/group under the Page header, at the top of the scroller, or inside the
scroll content. The vertical owner must end at or just above the action region
so content and rubber-band feedback cannot render behind its buttons.

The dock is the sole owner of its page commands. Do not duplicate a docked
Track, Share, Directions, Save, or other command as another Button inside the
scroller. Repeating one operation creates competing focus stops and makes its
state appear twice. Scroller targets must be distinct content destinations.

ButtonRail and ButtonGroup are actions, never peer-content navigation. Use
`SubNavigationPager` for tabs/sections and do not imitate it with selected
buttons in a rail/group.

## Required workflow

1. Write a route table naming the top-level root and single vertical owner for
   every route/pager page.
2. Identify the route's primary user task and make its first meaningful target
   the initial focus. On a content/dashboard route, primary records and urgent
   work precede app-wide navigation, settings, help, and other secondary
   destinations. A route whose purpose is navigation may begin with navigation.
   Keep that target close enough to the route start that the settled first
   frame can show both the target and essential leading context. Do not put a
   large static dashboard before the first focusable item and let autofocus
   scroll the route summary offscreen. Move primary actions to the bottom dock,
   make an earlier semantic record interactive, or simplify the preamble.
   On a route with a fixed bottom action region, verify that D-pad Up can move
   from the rail/group into a visible content target. Do not put an entire
   informational surface before the first content target; a focusable control
   hidden near the bottom of a long Panel does not make that content navigable.
   Do not solve this by duplicating Settings, Preferences, Help, or another
   secondary destination near both ends of the scroller. Keep one genuinely
   contextual destination, or condense/split the static detail. A secondary
   settings link must not steal initial focus from the route's primary action.
   Do not add a secondary “Jump,” “Help,” or informational button near the top
   merely as a scroll sentinel while a long static region follows it. For
   genuinely static information, make the `ScrollView` itself focusable with
   `tabIndex={0}` so it owns D-pad scrolling. If the route also has meaningful
   child targets, D-pad focus must remain visible and every content region must
   remain reachable. Condense or split content that is still overloaded.
   Do not bracket a detail region with generic “Next item” and “Previous item”
   Buttons merely to create targets on both sides. If sequential peer browsing
   is genuinely primary, model it with an appropriate pager/carousel and clear
   content identity. Otherwise, keep the detail focused on its selected record
   and let Back return to the collection.
3. Select one legal skeleton from the reference. If none fits, simplify or
   split the route; do not invent another scroll hierarchy.
4. Keep `html`, `body`, the mount node, `App`, and route viewport nonzero and
   responsive. Paint the complete window with
   `var(--uit-color-background-window)`; never override the `App` root to
   transparent or expose the WebView backing surface.
   Derive all route geometry from available space. Do not encode a device
   resolution, branch on a particular viewport dimension, or use a captured
   emulator frame as a layout constant.
   In CSS Grid, use shrinkable tracks such as
   `repeat(..., minmax(0, 1fr))`, not bare `1fr` tracks whose intrinsic content
   can widen the route. Set `min-inline-size: 0` on content cells that receive
   variable text, and inspect the narrowest supported constraint for wrapping
   and horizontal overflow.
5. Use semantic tokens without copied literal fallbacks.
6. Write product copy, not implementation commentary. Never expose the toolkit,
   focus, D-pad, scrolling, pager, rail, additive-display, or restoration
   rationale in ordinary route content unless that information is an actual
   user-facing product requirement.
   Keep the Page header to one concise route identity. `headerMetadata` is one
   short supporting value, not a second line for serializing time, place,
   status, and other facts. Do not join multiple values with separators in the
   fixed header overlay; put those details in the route body. Header title,
   metadata/subtitle, and textual status fields are each at most two words.
   Metadata/subtitle and status are optional and stay absent unless they add
   high-value context that materially affects interpretation or the next
   action; never use them as overflow for routine facts.
   Every SubNavigationPager item label is one word. Do not add an
   in-app action that navigates to `/`, a parent collection, or the previous
   route merely to return—system Back owns route return.
7. Run `node scripts/validate-app-structure.mjs <app-src>` from this skill.
   Treat the script as opaque: never read, print, search, copy, or modify its
   implementation. Respond only to the findings it emits. Completion requires
   zero findings. Do not dismiss remaining output as heuristic/false-positive
   noise or describe a nonzero result as reduced, acceptable, or passing.
8. Build and launch the untouched app on the target WebView.
9. Connect Chrome DevTools and run
   `node scripts/audit-runtime.mjs <CDP-endpoint>` on every route, after each
   viewport change, and after representative focus moves.
10. Capture and inspect every route and pager page at the top, middle, and
   bottom of its scroll extent. Also capture the first, representative middle,
   and last focused targets; every popup/modal/menu open and dismissed; each
   meaningful selected, disabled, changed, empty, and error state; forward
   navigation and restored Back state; and first/middle/last focus in every
   bottom action region. Do not infer visual quality from DOM geometry alone.
   For SubNavigationPager, scroll one page away from its top, return focus to
   subnavigation, then open a never-visited sibling. The sibling must begin at
   its own first primary target and top boundary; it must not inherit the other
   page's focus index or scroll offset. Revisit both pages and verify each
   independently restores only its own state.
11. Traverse every target with D-pad in both directions and verify the focused
   rectangle is fully visible after every move. When focus reaches the first or
   last target, verify the owner is at its exact top or bottom scroll boundary
   without requiring an extra D-pad press. Focus-driven expansion must not
   leave residual scroll distance after the boundary target settles.
12. Repeat the full visual/interaction matrix at materially different inline
   and block constraints. A hidden overflow bar does
   not make an overflowing route responsive.

Do not declare completion from source inspection or a successful build alone.
