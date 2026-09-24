# Route skeletons and acceptance rules

## Contents

- [Choose one skeleton](#choose-one-skeleton)
- [List route](#list-route)
- [Heterogeneous content route](#heterogeneous-content-route)
- [Tabbed route](#tabbed-route)
- [Containment rules](#containment-rules)
- [Device acceptance](#device-acceptance)

## Choose one skeleton

| Route content | Top-level root | Single vertical owner | Forbidden |
|---|---|---|---|
| Navigation, settings, selections, or any `ListItem` | `Page` | `VerticalList` | Outer `ScrollView`; inner authored vertical overflow |
| Media, panels, prose, cards, rails, carousels, no `ListItem` | `Page` | `ScrollView` | Any `VerticalList`/`ListItem`; nested vertical overflow |
| Peer tabs | `SubNavigationPager` | One `VerticalList` or `ScrollView` per child | `Page` inside pager; extra vertical wrapper |
| Short content proven to fit every supported viewport | `Page` | None | Assuming one emulator size; clipped focus expansion |

If a detail page appears to need a small list within a larger `ScrollView`, use
non-list semantic content for those facts/actions or move the collection to a
dedicated list route. Do not make a miniature independently scrolling list.

## List route

`VerticalList` is the route's scroll viewport, not a section inside another
viewport. Its rows remain one adjacent flow. `Header` is owned by `Page`, and
`ContainerHeader` identifies content inside a larger Container-owned region;
neither is an arbitrary list section label.

```tsx
<Page headerText="Settings" enableSystemBarInset={false}>
  <VerticalList insetForHeader ariaLabel="Settings">
    <ListItem title="Trail alerts" showSwitch checked={alerts} />
    <ListItem title="Weather alerts" showSwitch checked={weather} />
    <ListItem title="Miles" showRadioButton checked={units === 'miles'} />
    <ListItem title="Kilometers" showRadioButton checked={units === 'km'} />
  </VerticalList>
</Page>
```

Rules:

- Put the primary record collection and urgent work before secondary
  destinations such as app-wide views, Preferences, help, or administration.
  Initial focus should start the route's primary task. Only a route whose
  purpose is itself navigation starts with navigation rows.
- Keep one `VerticalList` for the complete route, not one per section.
- Do not use `Header` or `ContainerHeader` between list rows. If a collection
  needs a separately named hierarchy level, make that name part of the row's
  useful content or move the collection to a dedicated route.
- Keep rows adjacent. Do not add gaps, margins, cards, or dividers between
  ordinary rows.
- Do not add horizontal padding around `VerticalList`; its content inset owns
  row geometry.
- Do not set an arbitrary list height. The viewport fills available route
  height.
- The first and last focusable elements must reach the true scroll boundaries
  on the same D-pad move that focuses them.

## Heterogeneous content route

Use one `ScrollView` for media, a coherent Panel backdrop, cards, prose, and
Carousel. If the page has actions, place ButtonRail/ButtonGroup in a sibling
bottom dock outside that ScrollView.
Do not use `ListItem` merely to format a few facts inside this route.

`Page` remains the route root and owns the complete action shell. Put the
two-row content/dock shell inside `Page`; never put `Page` in the first row of
an authored shell and append the dock outside it.

```tsx
<Page headerText="Coastal trail" enableSystemBarInset={false}>
  <div className="action-page-shell">
    <ScrollView insetForHeader ariaLabel="Coastal trail details">
      <Card>{/* destination media/content */}</Card>
      <Panel width="100%">{/* one coherent informational region */}</Panel>
      <Carousel>{/* related focusable destinations */}</Carousel>
    </ScrollView>
    <div className="action-dock">
      <ButtonRail>{/* actions */}</ButtonRail>
    </div>
  </div>
</Page>
```

Rules:

- Do not place `VerticalList`, `ListItem`, or authored vertical overflow inside
  the `ScrollView`.
- Use ordinary semantic layout only between distinct component regions.
- Keep full-bleed `Panel width="100%"` and Carousel regions as direct ScrollView children.
  Put adjacent prose/custom content in separate wrappers inset with
  `var(--uit-spacing-large)`; never wrap the Panel itself in that inset.
- Do not repeat Panels to simulate records, facts, fields, settings, or rows.
  Use ordinary semantic layout inside one informational backdrop, or choose
  ListItem/Container when the content is actually an item.
- ButtonRail and Carousel viewports go edge-to-edge. Do not place them inside
  a horizontally padded/max-width wrapper. Apply component-specific content
  insets only to non-scrolling text/panel regions.
- Render Carousel as a direct child of the vertical owner. Render ButtonRail or
  ButtonGroup in a sibling bottom action dock, never inside the owner. Use a
  full-height two-row shell: Grid with `minmax(0, 1fr) auto`, or a column Flex
  shell whose scroller track can shrink with `min-block-size: 0`. The vertical
  owner ends above the dock, whose bottom padding is
  `var(--uit-spacing-xsmall)`.
- Give each page command one focus target. A command represented in the bottom
  ButtonRail/ButtonGroup must not appear again as a Button in the ScrollView,
  even if both controls share state. Keep only the docked action; retain
  scroller controls only for distinct content destinations.
- Do not apply one max-width container around the entire route. A capped prose
  region and an edge-to-edge rail have different geometry.
- The initial focus target must be completely visible in the first settled
  frame. The bottom action region is always visible; content scrolls only in
  the space above it and never behind it.
- When the `ScrollView` can overflow, include at least one meaningful focusable
  content destination/action, or set `tabIndex={0}` on a genuinely static
  `ScrollView` so the scroll owner itself receives focus and D-pad input. Never
  add a dummy target. Simplify or split content that remains overloaded.
- One contextual destination is not permission to repeat it as early and late
  Settings/Preferences/Help controls. Repeated navigation to the same route is
  a focus sentinel pattern. Keep the destination once, and never make that
  secondary route the initial focus ahead of the page's primary task.
- Keep leading static summary content compact enough that the first meaningful
  target appears in the upper portion of the first viewport. If a preamble
  consumes most of the display, simplify it or move secondary explanation to a
  detail route.
- On the first settled frame, the intended initial target must be fully inside
  its vertical owner's visible rectangle. A bottom dock's partial-focus effect
  does not compensate for a clipped content target, and waiting or pressing a
  direction is not a fix.
- Do not place a long static information region between two distant focus
  targets. Directional navigation can jump over unread content. Condense or
  split the information into focused routes/peer pages. A route whose content
  is genuinely static may instead focus its `ScrollView` with `tabIndex={0}`;
  do not add dummy controls.
- Do not add generic paired “Next item”/“Previous item” Buttons above and below
  static detail as focus sentinels. Use a pager/carousel when sequential peer
  browsing is a real product mode; otherwise keep one selected-record detail
  route, rely on Back for collection return, and split or condense inaccessible
  information.
- Never position a page-level rail/group beneath the header or at the top of a
  list. Never use it to choose peer content; use SubNavigationPager.

## Tabbed route

`SubNavigationPager` replaces `Page`. Each child owns exactly one vertical
viewport:

```tsx
<SubNavigationPager items={tabs} ariaLabel="Activity">
  <VerticalList insetForHeader ariaLabel="Recent activity">{/* rows */}</VerticalList>
  <VerticalList insetForHeader ariaLabel="Saved activity">{/* rows */}</VerticalList>
  <VerticalList insetForHeader ariaLabel="Alerts">{/* rows */}</VerticalList>
</SubNavigationPager>
```

Do not wrap children in `overflow: auto`, fixed-height divs, `Page`, or
another vertical owner. Each direct child owner must set `insetForHeader` so
its initial content clears the overlaid SubNavigation; do not replace that
property with authored top padding. Preserve the controlled page index across
route history when the product expects return restoration.

Every enabled pager page needs a meaningful focus target below SubNavigation.
This allows the documented partial-focus handoff to complete and restores full
content emphasis. If a dashboard contains actionable records, render them with
`Container` or the appropriate semantic interactive component. Do not make the
entire page from `StaticContainer`/plain text and leave focus trapped in the
tabs while D-pad input merely scrolls dimmed content.

Do not turn status copy into a switch or destructive command to manufacture
that target. “All fresh,” “Up to date,” “Nothing due,” and similar empty status
phrases are not action labels. When recovery or navigation is useful, render a
separately named command whose handler performs exactly that outcome.

Each pager page still owns one coherent task. Do not turn one child into an
entire application dashboard by stacking a hero summary, record grid, control
grid, insight feed, and unrelated detail destinations in the same scroller.
Promote distinct tasks to peer pages or dedicated routes. The first meaningful
target must be completely visible with the leading context on the settled
first frame; if it is not, the page is overloaded even when its single
`ScrollView` can technically reach everything.

Define the vertical owner in the same page component as its content. This
makes the one-owner contract reviewable and prevents a pager shell from
wrapping ownerless fragments whose rows, empty states, or alternate branches
silently violate the chosen skeleton.

## Containment rules

- Never target the toolkit component internals in application CSS or DOM code. No
  descendant selectors from a component root hook, generated class names,
  role/ARIA/data selectors, internal rendered tags, pseudo-elements, or DOM
  queries. Use documented public props, handles, material/theme APIs, tokens,
  and supported root hooks only.
- Give `html`, `body`, and the mount node full viewport block/inline size.
- Give each route/pager shell an explicit `block-size: 100%` (or an equivalent
  established containing block). `flex: 1` does not create height unless the
  immediate parent is a flex container; never assume a transition wrapper is
  one. Inspect the actual vertical owner's measured height on-device.
- Set `min-inline-size: 0` on authored flex/grid children that contain text or
  horizontal toolkit scrollers.
- Paint the full application window with
  `var(--uit-color-background-window)`. Apply the token to `html`, `body`, and
  the mount root
  so the WebView backing surface cannot show through while the app loads or
  between retained routes. Do not override the `App` root to transparent;
  `App` already uses the window-background token.
- Use the toolkit semantic spacing, color, corner, typography, size, elevation, and
  motion tokens without literal fallbacks.
- A responsive formula does not legitimize a copied pixel value. Do not write
  `min(560px, 100%)`, `min(100%, 20em)`, `gap: 2px`, or an authored `8px`
  decoration. Changing from pixels to `em`, `rem`, or `ch` does not create a
  token. Use the
  relevant toolkit token, a percentage, a flexible track such as
  `minmax(0, 1fr)`, or a value measured from the available space/API.
- Never use `overflow: hidden` to conceal a width bug or clipped focus effect.
- At each supported viewport, every vertical owner must satisfy
  `scrollWidth === clientWidth` and have enough height to show at least one
  complete focusable child.

## Device acceptance

For every route and pager page:

1. capture the top, middle, and bottom after animations settle;
2. traverse all focusable elements forward and backward with D-pad;
3. after each move, verify the focused bounds are fully inside the visible
   rectangle of the single owning vertical viewport;
4. verify focus movement scrolls that owner—never an inner list while the page
   remains fixed;
5. verify first/last focus reaches the absolute start/end without an extra key;
6. inspect both left/right edges for clipped material expansion and accidental
   margin/inset;
7. open/dismiss every popup and verify focus returns to its exact trigger;
8. navigate forward/back through the WebApp host's routed Back/Escape path and
   verify route, pager index, focus, and scroll state; do not substitute
   platform-level key injection, which belongs to the host exit surface;
9. on initial route entry and after Back restoration, reject any focused target
   that is even partly outside its owning viewport; waiting or pressing another
   direction is not a fix;
10. inspect Header bounds and reject text/icon/metadata that extends past either
    display edge;
11. repeat at a materially different width and height;
12. reject the generation on the first failure. Do not patch it before scoring.

Before device launch, require a clean type check and production build. Consume
the public packages through package exports. A repository-local harness may use
ordered Vite aliases only when necessary. Map `styles.css`, `/svg`, and
`/react-router` explicitly before broad package aliases, and make broad aliases
exact matches when possible so a path such as `styles.css` cannot resolve below
an `index.js` file. A development server loading is not evidence that the
production resolver succeeds.
