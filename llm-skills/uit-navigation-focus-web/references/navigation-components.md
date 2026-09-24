# Navigation and focus component guide

## App and routing

App owns the app-relative focus-navigation provider, floating portal root, font/theme setup, initial focus, and Toast presenter. It is router-neutral.

For React Router, use the public adapter provider and page transition around Routes. Forward navigation pushes history; Back uses history and restores retained focus/scroll. Use route preload APIs for likely focus targets/lazy routes when valuable.

The required composition is `BrowserRouter` >
`ReactRouterNavigationProvider` > `App` > `ReactRouterPageTransition`, with
`{({location}) => <Routes location={location}>…</Routes>}`. The transition's
location is a retained-page snapshot, not redundant plumbing. Routes that read
only the live location can lose the launching row and scroll state on POP.

Use this public-import composition directly; do not inspect package exports or
gallery routing code before typecheck:

```tsx
import {App} from '@wearables-ui-toolkit/mrbd';
import {
  ReactRouterNavigationProvider,
  ReactRouterPageTransition,
} from '@wearables-ui-toolkit/mrbd/react-router';
import {BrowserRouter, Route, Routes} from 'react-router-dom';

export function Root() {
  return (
    <BrowserRouter>
      <ReactRouterNavigationProvider>
        <App>
          <DomainProvider>
            <ReactRouterPageTransition>
              {({location}) => (
                <Routes location={location}>
                  <Route path="/" element={<CollectionPage />} />
                  <Route path="/item/:id" element={<DetailPage />} />
                </Routes>
              )}
            </ReactRouterPageTransition>
          </DomainProvider>
        </App>
      </ReactRouterNavigationProvider>
    </BrowserRouter>
  );
}
```

Mount `Root` with React DOM's `createRoot`. Replace `DomainProvider` with the
application's durable state provider, or omit that wrapper when no state must
survive route transitions. Keep it outside `ReactRouterPageTransition`.

## Page and Header

Page exposes header content directly: text/max lines/metadata/icon, rich Avatar/duo/badge/status, loading, show/hide, and system-bar content inset. Its root/header placement remains full screen; `enableSystemBarInset` affects child content.

Configure Header through Page. Do not render Header directly as an arbitrary
content or list heading. ContainerHeader is for identity within a larger
Container-owned region, not for list sections. A Page handle reports measured
header height for exceptional coordination. Prefer `insetForHeader` on the
child scroller rather than a fixed number.

Treat Header as concise route context, not a record-detail summary. Verify the
combined leading identity, text, and metadata remains inside both viewport
edges. Put timing, channel, location, and other detailed facts in the body when
they do not all fit.

## ScrollView

Single-axis vertical/horizontal viewport with:

- independent leading/trailing fading-edge lengths for active axis;
- header content inset;
- optional custom scrollbar;
- responsive width/height;
- region label/tab index;
- scroll offset callback.

It scrolls focused children into visible safe space. Its content slot is the default focus boundary so first/last focus aligns true boundaries. Do not add content equal to fading-edge length; fade visibility derives from real scroll position.

## VerticalList

Vertical ScrollView specialization with row content class/style and list insets. Use directly under Page for list-first routes. It owns focus boundary and scrolling; avoid same-axis nesting.

## Pager and PagerPage

Pager supports horizontal/vertical orientation, controlled `currentPageIndex` or uncontrolled `defaultPageIndex`, animation, home/back behavior, page change callback, global lock callback, inactive-page unmount, and initial focus request.

Each PagerPage can handle:

- will show/hide/unload;
- initial focus by incoming direction;
- Back interception;
- navigation veto;
- animation completion;
- optional peek-before-navigation.

Controlled index updates are authoritative and bypass page veto; gate the state update in application logic when necessary. Use handle preload sparingly—eager mounting nontrivial pages can be slower—and never unload current page.

## SubNavigationPager

Composite route root: items correspond one-to-one with child pages. Supports controlled/uncontrolled index, page callback, navigation lock, auto-hide, full subnavigation disable, top-padding ownership, and Pager back/home options.

Every item requires both `label` and `icon`; label-only items do not compile.
Use a controlled index when selection must survive route transitions. The
callback receives the new index, previous index, and whether the move was
animated, so a one-argument state setter remains valid when those extra values
are not needed:

```tsx
<SubNavigationPager
  items={[
    {label: 'Recent', icon: clockFilled},
    {label: 'Saved', icon: bookmarkFilled},
  ]}
  currentPageIndex={pageIndex}
  onPageChange={setPageIndex}
  ariaLabel="Activity">
  <VerticalList insetForHeader ariaLabel="Recent activity">
    {/* adjacent ListItem rows */}
  </VerticalList>
  <VerticalList insetForHeader ariaLabel="Saved activity">
    {/* adjacent ListItem rows */}
  </VerticalList>
</SubNavigationPager>
```

Import each filled icon from its explicit SVG subpath. If the exact asset is
unknown, run the content-identity skill's `find-filled-icon.mjs` once with the
tab concepts; do not browse icon files or use the aggregate icon barrel.

Use instead of Page. `SubNavigation` itself is infrastructure for this composite; its icon/label/loading items, visibility, focus, and auto-hide are synchronized by the parent.

The SubNavigation is an overlay. Set `insetForHeader` on every direct child
`VerticalList` or `ScrollView` so initial content clears it while the viewport
and scrollbar remain full height. Do not reproduce the inset with authored
padding.

Every enabled pager page needs a real content focus target. Do not invent a
static information tab made only of Panel/prose: it cannot complete partial-
focus handoff, remains dimmed, and cannot be traversed with D-pad. Condense
short information into a fitting route or expose it from an accurately labeled
destination with legitimate actions/content targets.

When a pager page can open another route, control `currentPageIndex` with state
that survives the pager route unmount and update it through `onPageChange`.
Route-local `useState` and the uncontrolled `defaultPageIndex` reset when the
detail route replaces the pager. On Back, restore the originating page index,
its focused target, and its scroll offset before the pager is visible; never
fall back to the first tab and its first row.

## Visual indicators

PaginationIndicator shows zero-based position in dot/text mode and does not navigate. SwipeIndicator shows up/down continuation, optional prompt/scrim, and nudge; it is not focusable and triggers nothing.

## Focus model

Interactable owners register with the focus coordinator. Initial focus chooses the top-left eligible connected control on the active page. Focus handoff coordinates outgoing/incoming material origins within a route. Page transitions retain/restore ownership rather than allowing a temporary body focus to clear visual state.

When directional input occurs:

1. move to eligible target;
2. otherwise scroll owning viewport if distance remains;
3. otherwise dispatch invalid direction and rubber-band supported axes.

## Review matrix

Test first entry, reload/deep link, every direction, rapid repeats, top/bottom/left/right boundaries, scrollbar center, fade activation, Page header inset, Pager lifecycle/lock/veto, SubNavigation item/page count, forward/back history, popup dismissal precedence, and focus/scroll/page restoration before paint.
