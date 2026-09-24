# Production routed list application

Use this pattern for a focused product with one record collection, one record
detail route, durable application state, and at most one real detail action.
Product depth comes from realistic data, state, route restoration, and polished
copy—not extra component categories.

## Fixed feature budget

Use only:

- `Page`, `VerticalList`, `ListItem`, `ScrollView`, `TextView`, `TextStyle`,
  `TextColor`, `Panel`, `Button`, `ButtonRail`, `Toast`, and the toolkit `App`;
- `BrowserRouter`, `Routes`, `Route`, `useNavigate`, and `useParams`;
- `ReactRouterNavigationProvider` and `ReactRouterPageTransition` from the
  `/react-router` package subpath;
- one durable React context/provider outside the page transition.

Do not add SubNavigationPager, Container, Surface, StaticContainer, cards,
chips, tags, badges, icons, overlays, forms, filters, settings, menus, custom
materials, data-entry routes, or additional destinations. Use Panel only for
the one detail information backdrop specified below; never use it for collection
rows or repeat it as field tiles. Do not inspect the toolkit source, package
declarations, gallery/examples, tests, built CSS, icon assets, or validator
source. The APIs below are complete for this pattern.

Use this fixed source partition; do not collapse it into one large file:

- `main.tsx`: imports, router composition, and mount only;
- `domain.ts`: record type, realistic mock records, and point-in-time formatter;
- `DomainContext.tsx`: durable state and domain operations;
- `pages/CollectionPage.tsx`: non-empty VerticalList route only;
- `pages/CollectionEmptyPage.tsx`: empty ScrollView route only;
- `pages/DetailPage.tsx`: detail and not-found ScrollView branches;
- `app.css`: only the selectors shown below.

Create independent files in one parallel tool batch when supported. Keeping
route skeletons in separate page files also makes structural ownership
unambiguous to reviewers and validation.

Use paths relative to that fixed partition: `DomainContext.tsx` imports
`./domain`; files under `pages/` import `../domain` and `../DomainContext`;
`main.tsx` imports root-level modules with `./` and page modules with `./pages/`.

## Root and routing

Import the two router adapters only from
`@wearables-ui-toolkit/mrbd/react-router`; they are never root-package exports.
Import the toolkit styles once. Use one root file and this exact ownership order:

```tsx
import {App as UITApp} from '@wearables-ui-toolkit/mrbd';
import {
  ReactRouterNavigationProvider,
  ReactRouterPageTransition,
} from '@wearables-ui-toolkit/mrbd/react-router';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Route, Routes} from 'react-router-dom';

function Root() {
  return (
    <BrowserRouter>
      <ReactRouterNavigationProvider>
        <UITApp>
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
        </UITApp>
      </ReactRouterNavigationProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
```

Keep records and mutable state in `DomainProvider`; route transitions must not
reset them. Forward navigation uses `navigate('/item/' + id)`. Never render an
application Back, Home, Close, or Cancel-return button. System/browser Back owns
route return and the toolkit restores collection focus and scroll.

## Global layout

Use only tokens, percentages, and flexible tracks:

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

Do not author backgrounds, borders, radii, decorative geometry, viewport/device
dimensions, horizontal page padding, or another overflow/scroll rule. Do not
add another selector to this stylesheet.

Never style the toolkit internals. Do not target toolkit component descendants, rendered tags,
generated classes, roles, ARIA/data attributes, pseudo-elements, or internal
states in CSS, and do not query/mutate them from JavaScript. Only documented
public props and root hooks are available. The fixed stylesheet styles authored
wrappers only and intentionally has no selector for a toolkit component.

Use a record model with one concise value for each ListItem slot:

```ts
export type DomainRecord = {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  description: string;
  active: boolean;
};
```

The mutable boolean above represents the action's own state only. Do not reuse
one field for two independent product facts. For example, saving or unsaving a
record must not change its verification, availability, accessibility, severity,
or processing status. If the brief includes an informational status independent
of the action, add a separate typed field such as `verificationStatus` and keep
the action field as `saved`; the save operation updates only `saved`. Reusing
one boolean because both facts happen to have two labels is a semantic data-model
failure.

Store timestamp as an ISO point in time. Format it through one
`formatPointInTime(timestamp)` helper at render time. Do not store a display
label such as “Due Friday” in the timestamp field, and do not combine status,
duration, or two time representations there. Choose the shortest
context-sufficient representation: a collection spanning several dates uses
month/day only; a same-day collection may use time only. Do not show both date
and time when that forces identity truncation.

For generated English mock data shown beside a timestamp, make every collection
title no longer than ten characters, using a short identity such as “Table saw,”
“Drill kit,” or “Level.” Make every subtitle no longer than twelve characters.
Do not combine brand,
model, variant, and item type in the title; those details belong in the detail
description. Make subtitle exactly one short complementary fact—not a
delimiter-joined pair. This content budget must remain readable beside the
timestamp at every tested width; component ellipsis is not the planned layout.

## Collection route

The non-empty collection route is exactly `Page > VerticalList > ListItem`.
There is no ScrollView, summary, section heading, Panel, footer, gap, divider,
or action rail on this route. `VerticalList` and its rows own edge geometry.

```tsx
export function CollectionPage() {
  const {records} = useDomain();
  const navigate = useNavigate();

  if (records.length === 0) {
    return <CollectionEmptyPage />;
  }

  return (
    <Page headerText="Items" enableSystemBarInset={false}>
      <VerticalList insetForHeader ariaLabel="Items">
        {records.map(record => (
          <ListItem
            key={record.id}
            title={record.title}
            subtitle={record.subtitle}
            timestamp={formatPointInTime(record.timestamp)}
            onClick={() => navigate(`/item/${record.id}`)}
          />
        ))}
      </VerticalList>
    </Page>
  );
}
```

Keep normal record titles within the available row width. No chevrons or
accessory arrows.

The empty branch replaces the list with one static owner:

```tsx
function CollectionEmptyPage() {
  return (
    <Page headerText="Items" enableSystemBarInset={false}>
      <ScrollView insetForHeader tabIndex={0} ariaLabel="No items">
        <div className="content-inset">
          <TextView as="p" textStyle={TextStyle.BODY2_EMPHASIZED}>
            Nothing here
          </TextView>
          <TextView as="p" textStyle={TextStyle.BODY2}>
            New records will appear here when they are available.
          </TextView>
        </div>
      </ScrollView>
    </Page>
  );
}
```

Do not invent an Add/import/setup action when the brief does not provide a real
supported creation flow.

## Detail route

Use a generic two-word Page header when record names may be longer. The body may
then state the record identity once. `TextView` receives text as children; it
does not have a `text` prop.

Put the complete informational block in one edge-to-edge `Panel` backdrop. Keep
the Panel as a direct child of `ScrollView`; do not wrap the Panel itself in
horizontal padding. Set `width="100%"`; the default Panel width is not a
responsive full-bleed contract. Inside it, one `content-inset` wrapper supplies
`var(--uit-spacing-large)` between Panel edges and non-full-bleed content. Keep
this default detail body to the four text roles shown below: record identity,
description, `STATUS` eyebrow, and status value. Do not append field grids,
dividers, instructional action prose, every property from the data model, or
additional Panels. The collection and detail route should demonstrate a
focused task, not a record dump.

The description must not restate the title or embed it in a longer phrase. Once
the heading identifies “Baking scale,” begin with useful capability/context such
as “Measures grams and ounces…” rather than “Digital baking scale…”. Apply this
to every mock record; visible title and description must not repeat the same
identity fact.

```tsx
export function DetailPage() {
  const {id} = useParams();
  const {records, toggleRecordState} = useDomain();
  const record = records.find(candidate => candidate.id === id);

  if (!record) {
    return <NotFoundPage />;
  }

  const handleToggle = () => {
    toggleRecordState(record.id);
    Toast.show(record.active ? 'Marked complete' : 'Marked active');
  };

  return (
    <Page headerText="Item detail" enableSystemBarInset={false}>
      <div className="action-page-shell">
        <ScrollView
          insetForHeader
          tabIndex={0}
          ariaLabel={`${record.title} details`}>
          <Panel width="100%">
            <div className="content-inset">
              <TextView as="p" textStyle={TextStyle.BODY2_EMPHASIZED}>
                {record.title}
              </TextView>
              <TextView as="p" textStyle={TextStyle.BODY2}>
                {record.description}
              </TextView>
              <TextView
                as="p"
                textStyle={TextStyle.LABEL}
                textColor={TextColor.SECONDARY}>
                STATUS
              </TextView>
              <TextView as="p" textStyle={TextStyle.META1}>
                {record.active ? 'Active' : 'Complete'}
              </TextView>
            </div>
          </Panel>
        </ScrollView>
        <div className="action-dock">
          <ButtonRail>
            <Button
              title={record.active ? 'Mark complete' : 'Mark active'}
              onClick={handleToggle}
            />
          </ButtonRail>
        </div>
      </div>
    </Page>
  );
}
```

Set `textColor={TextColor.SECONDARY}` on the `STATUS` eyebrow. Authored
category/field labels and supporting subtitles use secondary text color; keep
eyebrow/category strings all caps. The associated value remains primary. When
a toolkit component exposes a built-in subtitle slot, let the component apply its
secondary treatment. Never restyle that internal subtitle element.

The action Button stays mounted across state changes and performs the named
domain operation before Toast feedback. Do not add Copy, Share, Edit, Delete,
Back, Cancel, or placeholder actions. Do not remove the record or its row while
it owns the restoration target.

When the action changes a state such as saved/unsaved, display that action state
only when it adds useful context. An independent record status remains stable
across the action and renders from its own field.

The not-found branch uses the empty branch structure: `Page > ScrollView` with
`insetForHeader`, `tabIndex={0}`, concise `ariaLabel`, one `content-inset`, and
ordinary BODY2 text. It has no fake recovery action.

## Pre-verification audit

Before invoking tools, check the complete source set once:

- exactly two routes and one durable provider;
- collection branch uses VerticalList only; static branches use ScrollView only;
- no Back/Cancel-return controls, duplicate action, no-op, or feedback-only
  handler;
- router adapters use `/react-router`, and transition Routes consume its
  `location`;
- every TextView uses children, never `text=`;
- detail ScrollView is focusable and labelled; action rail is its bottom sibling;
- detail information is inside one direct-child edge-to-edge Panel with one
  tokenized content inset; the collection and empty/not-found states use no Panel;
- no icons, forms, optional component domains, literal design values, or nested
  scrolling.
- every realistic mock title and subtitle remains fully readable beside its
  context-sufficient timestamp at a materially narrower viewport;
- no detail description repeats its record title or merely adds a modifier to
  that same identity;

Then, while the application workspace remains the current directory, run the
absolute path to `scripts/verify-app.mjs` in this skill directory. The skill
directory is the parent of the `references` directory containing this file. Do
not read that script or the structural validator. Fix every reported issue in
all files as one repair batch, then rerun the command once.

When that command prints `UI Toolkit for Meta Ray-Ban Display application verification passed.`, stop. Do not
run typecheck, validator, or build again individually. Do not search for a
browser/headless runner, start a server, curl a preview, or create ad hoc
interaction/inspection scripts. Those activities are not part of this
generation workflow and previously consumed turns without improving the app.
