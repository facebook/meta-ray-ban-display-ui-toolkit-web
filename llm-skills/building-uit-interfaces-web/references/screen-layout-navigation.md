# Screen layout, navigation, and focus

## Contents

- [Choose the top-level surface](#choose-the-top-level-surface)
- [Page and header geometry](#page-and-header-geometry)
- [Lists and scrolling](#lists-and-scrolling)
- [Responsive layout](#responsive-layout)
- [Focus behavior](#focus-behavior)
- [Route history and back](#route-history-and-back)
- [Floating content](#floating-content)

## Choose the top-level surface

Use one of these, never both for one route:

- `Page`: ordinary header plus content route.
- `SubNavigationPager`: peer tabbed pages with synchronized tab/page focus.

`Header` is page-header infrastructure and application routes configure it
through `Page`. Never render it directly as an arbitrary heading or use it to
label a section inside a list. `ContainerHeader` is distinct: it identifies
content inside a larger Container-owned region, not a VerticalList section.
`SubNavigation` is owned by `SubNavigationPager` rather than rendered alone.
Each tab title is one word. Move qualifiers into page content rather than
making the persistent tab bar carry multiword labels.

Header metadata/subtitle and textual status are optional. Leave them absent by
default; use a one- or two-word value only when it provides high-value context
that changes interpretation or the next action. Routine identifiers, counts,
durations, difficulty, and decorative state belong in page content.

Every `VerticalList` or `ScrollView` used as a direct page inside
`SubNavigationPager` sets `insetForHeader`. The pager's SubNavigation is an
overlay; without the component-owned inset, initial content renders underneath
the tabs. Do not substitute manual padding. Each enabled pager page also owns
at least one meaningful focus target so partial focus can hand off from the
tabs into page content; a scrollable all-static child leaves its content dimmed
and has no valid D-pad destination.

This requirement applies across component files: a pager child component must
put `insetForHeader` on its own root `VerticalList` or `ScrollView`. Supplying
the prop on a parent or merely describing the inset in comments/tests does not
clear the overlay.

All authored page content—including a summary, progress treatment, or local
heading—belongs inside that one vertical owner after its component-owned
inset. A shell may wrap the owner only to reserve a bottom action dock; do not
add a separate header/summary row above the owner. It will compete with the
pager overlay, escape scrolling, and can leave a large dead region before the
first record.

## Page and header geometry

For a list route, make the `VerticalList` the page's scrolling child:

```tsx
<Page headerText="Experiences" enableSystemBarInset={false}>
  <VerticalList insetForHeader ariaLabel="Experiences">
    <ListItem title="Actions" subtitle="Buttons and action controls" onClick={openActions} />
    <ListItem title="Content" subtitle="Text, identity, and badges" onClick={openContent} />
  </VerticalList>
</Page>
```

Use `enableSystemBarInset={false}` when the scroll viewport itself must span the full display. Use `insetForHeader` to reserve content space without shifting the viewport/scrollbar. Do not add manual top padding for the header; this causes doubled or regressed header insets.

The scrollbar track belongs to the full scroll viewport and stays centered within that viewport. It must not move down to account for content/header padding.

Do not render a back button in the header. The system back path owns back navigation.

## Lists and scrolling

- Give each route or pager child exactly one vertical scroll owner.
- If the route contains any `ListItem`, use one `VerticalList` as that owner for
  the complete route. Keep rows as one adjacent flow. Do not
  wrap it in `ScrollView`, authored vertical overflow, or another
  `VerticalList`.
- Do not insert `Header` or `ContainerHeader` as arbitrary section labels in a
  list. Express essential grouping through row content and ordering, or split
  genuinely distinct collections into dedicated routes.
- If the route uses `ScrollView`, it contains no `ListItem` or `VerticalList`.
  Use semantic non-list content or split the rows into a list route.
- Make every `ScrollView` and `VerticalList` component frame extend fully to
  the left and right screen edges. Do not add page-level left/right padding or
  wrap either viewport in an inset container; row anatomy owns the list inset.
- All visible row content still clears each display edge by
  `var(--uit-spacing-large)` through the component's owned anatomy. For a
  `ScrollView`, put authored content in one wrapper with that inline inset.
  Do not pad either scroll viewport itself. `ButtonRail` likewise extends its
  component frame fully to both screen edges.
- A page-level Panel backdrop may also extend fully to both screen edges. Keep
  the Panel out of ordinary route horizontal padding and inset its children
  internally. Modal surfaces remain inset from the screen edges.
- Do not add gaps or margins between ListItems.
- Let fading edges show obscured continuation, but do not append permanent leading/trailing spacers equal to the fade size. At a true boundary the fade disappears, and the first/last item must reach the true scroll boundary.
- Focusing the first or last eligible element must scroll to the absolute beginning/end. A further D-pad press must not be required.
- If directional focus cannot move but the owning scroller can, scroll. Rubber-band only when neither focus nor scroll can move.

For a generic long page with heterogeneous sections, use one `ScrollView` and
normal non-list content. Do not place `ListItem` directly in that flow and do
not nest `VerticalList`; choose a list-first page or a separate route instead.

## Responsive layout

Avoid hardcoded display dimensions. Use:

- `width: 100%` for page/list/rail viewports;
- `min()`, `max()`, and `clamp()` for content caps;
- flex/grid with `minmax(0, 1fr)` for columns;
- semantic spacing variables;
- `ResizeObserver` only when an API requires a numeric measured size, such as `CardStack.width`.

Treat available inline and block space as inputs, never as device identity. Do
not branch on a known resolution or hardcode card/rail/list dimensions from a
captured frame. Account for component focus scale when placing content near
edges. If horizontally adjacent focus expansion clips, change the composition
(often a vertical stack) instead of hiding overflow.

Establish a nonzero containing block for the application:

```css
html,
body,
#root {
  inline-size: 100%;
  block-size: 100%;
  margin: 0;
}

html,
body,
#root {
  background: var(--uit-color-background-window);
}
```

`App` and page-transition viewports use percentage sizing. If any ancestor has
zero height, route content can exist and report descendant layout bounds while
the owning viewport clips the entire app. Treat a nonzero app-root rectangle as
a startup invariant. The document window and the toolkit `App` root must remain on the
window-background token; never make `[data-app-root]` transparent.

Set `min-inline-size: 0` on authored flex/grid children that may contain a rail,
long text, or another intrinsic-width component. Otherwise that child can widen
the route beyond the viewport even when its own width is `100%`. Inspect both
`scrollWidth` and visible clipping at every supported viewport; hiding overflow
does not make an overflowing composition responsive.

A grid route shell that divides content from a bottom action dock also sets
`min-inline-size: 0` on the shell itself. Rail buttons with persistent labels
have intrinsic width; without this constraint they can widen the grid, its
vertical scroll owner, and the rail beyond the display. At runtime, verify the
left and right bounds of the actual toolkit scroll owner and action region rather
than relying only on the document's `scrollWidth`.

## Focus behavior

- Provide one eligible initial focus target, usually the first primary action or row.
- The initial target must be fully visible in the settled first frame.
- Page-level ButtonRail/ButtonGroup actions live in a bottom dock outside the
  single vertical scroller. The scroller ends above the dock, and the dock uses
  `var(--uit-spacing-xsmall)` bottom clearance. Do not place actions beneath the
  header or at the top of list/content flow.
- A content-related Button follows the content it acts on. Do not place Save,
  Clear, Show/Hide, or another contextual action before its subject merely to
  create an early focus target.
- Use SubNavigationPager—not selected buttons in a rail/group—for peer content.
- Do not animate every component from collapsed/default to focused during page load. Only the actual initial target should enter its intended focused state, and it should run the same focus transition used during navigation.
- Programmatic focus must yield the same material state as D-pad focus.
- Preserve focus through benign state updates; do not remount focused regions merely to update content.
- Preserve a focused command's DOM identity when its state changes. Updating a
  rail action from Start to Pause/Resume must keep focus in the action region
  and retain the content scroll offset; otherwise transfer focus explicitly to
  the successor before the old node disappears.
- Restore the prior focused element, visual focus state, scroll offset, and pager/carousel index on back.
- Verify the restored focus rectangle is visible immediately after Back. A
  retained DOM focus target with a stale scroll offset is a failure.
- When a popup closes after an item action, restore focus to its trigger before paint where possible.
- Never create a focusable wrapper around an already focusable component.
- A focusable/interactive `Container` or `Panel` cannot contain focusable/interactive children.

## Route history and back

Use the React Router adapter for React Router applications:

```tsx
<BrowserRouter>
  <ReactRouterNavigationProvider>
    <App>
      <ReactRouterPageTransition>
        {({ location }) => (
          <Routes location={location}>{/* routes */}</Routes>
        )}
      </ReactRouterPageTransition>
    </App>
  </ReactRouterNavigationProvider>
</BrowserRouter>
```

Use this nesting and snapshot plumbing exactly. Do not put `App` outside
`BrowserRouter`, ignore the transition render argument, or let `Routes` read
the live router location directly. `PageTransition` retains outgoing/incoming
pages during animation and needs `location={location}` from its own snapshot;
otherwise a POP can restore the route while focus falls back to the first row.

Use `BrowserRouter` in the Android WebView host so forward navigation creates
history that the system Back path can traverse. Use `HashRouter` only when a
static-hosting constraint requires it and the actual host provides a separately
verified Back bridge; JavaScript hash history alone is not sufficient proof.

- Ordinary forward navigation must push a history entry. Do not use `replace` except for a genuine redirect or boundary fallback.
- Test with the WebApp host's routed Back/Escape input, not only
  `history.back()`, router calls, or desktop browser buttons. Raw Android
  `KEYCODE_BACK` belongs to the host exit surface and is not a substitute for
  the toolkit's Back event.
- Back dismisses the topmost transient UI first: vertical menu, context menu, focusable tooltip, modal. Only then navigate the route.
- Do not intercept Back/Escape with page code when normal history is intended.
- Use pager back-to-home only for a pager's own documented navigation model, not browser routes.
- Lazy routes should use the toolkit route-preload support where helpful so focus movement and transition timing remain stable.

## Floating content

`App` supplies the portal root and coordinate space. Tooltips, menus, context menus, toast, and modal-like floating content must use it rather than `document.body`.

Anchored content must follow its target and may choose a better-fitting direction than the preferred one. If the anchor scrolls away, the popup should leave with it rather than clamp over unrelated content.

Use a controlled open state. When item activation closes a popup, stop portal click propagation if it would bubble back into the trigger and reopen it.
