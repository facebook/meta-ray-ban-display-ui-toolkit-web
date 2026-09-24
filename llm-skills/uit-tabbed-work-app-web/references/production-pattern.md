# Production tabbed work application

Use this architecture when two peer work collections are the root experience,
selecting a row opens a routed detail, and detail actions can move or update the
record. `SubNavigationPager` replaces `Page` at the root; the detail route uses
`Page`. Do not substitute a ButtonRail, ButtonGroup, chips, tags, or authored
filters for the pager.

## Feature and file budget

Use the toolkit `App`, `SubNavigationPager`, `VerticalList`, `ListItem`, `ScrollView`,
`Page`, `Panel`, `TextView`, `TextStyle`, `TextColor`, `Button`, `ButtonRail`,
and `Toast`; React context/state; BrowserRouter; and the toolkit router integration.
Use exactly two root collections and one detail route. Do not add cards,
Containers, StaticContainers, Surfaces, standalone headers, menus, forms,
custom materials, list section headers, summary strips, or extra destinations.

Use this source partition:

- `main.tsx`: mount and routed shell;
- `domain.ts`: work-record type, mock records, and time formatter;
- `WorkContext.tsx`: durable records, selected pager index, and operations;
- `WorkPager.tsx`: controlled SubNavigationPager only;
- `pages/TodayPage.tsx`: Today list or its empty state;
- `pages/DonePage.tsx`: Done list or its empty state;
- `pages/DetailPage.tsx`: detail/not-found route and actions;
- `app.css`: only the layout rules below.

Do not inspect package source, examples, tests, built CSS, icon directories, or
validator source. The APIs below are complete.

## Shell and state

Mount in this ownership order:

```tsx
<BrowserRouter>
  <ReactRouterNavigationProvider>
    <UITApp>
      <WorkProvider>
        <ReactRouterPageTransition>
          {({location}) => (
            <Routes location={location}>
              <Route path="/" element={<WorkPager />} />
              <Route path="/job/:id" element={<DetailPage />} />
            </Routes>
          )}
        </ReactRouterPageTransition>
      </WorkProvider>
    </UITApp>
  </ReactRouterNavigationProvider>
</BrowserRouter>
```

Import router adapters from `@wearables-ui-toolkit/mrbd/react-router`. Keep
`WorkProvider` outside the page transition so pager selection, status, focus,
and route state survive navigation. Import the toolkit styles once.

Model each record with `id`, concise `title`, concise `subtitle`, ISO
`timestamp`, useful `description`, `done`, and `deferred`. Derive collections
from state rather than duplicating records:

```tsx
const todayJobs = jobs.filter(job => !job.done);
const doneJobs = jobs.filter(job => job.done);
```

Expose `jobs`, `todayJobs`, `doneJobs`, `pageIndex`, `setPageIndex`,
`returnFocusId`, `clearReturnFocus()`, `toggleCompleted(id)`, and
`toggleDeferred(id)` from context. Completing a job sets its `done` state,
selects the Done page, and records its ID for focus handoff; reopening selects
Today and records the same ID. Deferring does not move the record. Compute the
next state before the React state updater; do not mutate a local variable from
inside `setJobs` and then read it synchronously:

```tsx
const toggleCompleted = (id: string) => {
  const current = jobs.find(job => job.id === id);
  if (current == null) return;
  const nextDone = !current.done;
  setJobs(previous => previous.map(job =>
    job.id === id ? {...job, done: nextDone, deferred: false} : job,
  ));
  setReturnFocusId(id);
  setPageIndex(nextDone ? 1 : 0);
};
```

Update immutably and keep record IDs stable.

Seed both collections with realistic data. Do not use timers, random updates,
or generated display strings as stored timestamps.

## Root work pager

Use these known filled icons without searching:

```tsx
import calendarFilled from '@wearables-ui-toolkit/icons/svg/calendar__filled.svg';
import circleCheckFilled from '@wearables-ui-toolkit/icons/svg/circlecheck__filled.svg';
```

Render the controlled pager directly, without `Page` or a wrapper:

```tsx
<SubNavigationPager
  items={[
    {label: 'Today', icon: calendarFilled},
    {label: 'Done', icon: circleCheckFilled},
  ]}
  currentPageIndex={pageIndex}
  onPageChange={setPageIndex}
  homeIndex={0}
  ariaLabel="Work queues">
  <TodayPage />
  <DonePage />
</SubNavigationPager>
```

Labels are one word. Do not add a Page/Header around the pager, a third tab, or
another horizontal navigation control.

Each nonempty pager child is exactly one edge-to-edge `VerticalList` with
`insetForHeader`; it contains adjacent ListItems only. Today renders
`todayJobs`; Done renders `doneJobs`. Each row uses title, one short subtitle,
one formatted timestamp, and `onClick={() => navigate('/job/' + job.id)}`.
Omit icons and chevrons. Never put Panel, labels, dividers, gaps, or actions
inside either list.

Keep every row fully readable beside its timestamp:

- title is a one- or two-word identity such as `HVAC service`, `Leak repair`,
  or `Battery swap`;
- subtitle is one short location such as `North wing` or `Maple Drive`, never
  an address/detail pair joined by a bullet or delimiter;
- Today formats only local time (`9:00 AM`); Done formats only month/day
  (`Aug 12`). Never show date and time together in one row.

Define `formatTodayTime` and `formatDoneDate` helpers in `domain.ts`; each page
uses the matching helper. Do not use `toLocaleString` for a ListItem timestamp.

When a record moves between pages, its destination ListItem is the focus
restoration target. Each page keeps row refs and, in a layout effect, focuses
`returnFocusId` with `preventScroll: true`, then calls `clearReturnFocus()`.
The default ListItem root is an `HTMLDivElement`; type the ref map and callback
accordingly. Never cast it to `HTMLButtonElement` or suppress the type error.
Do not fall back to the first row when the moved record is present. Do not add
comments about validators, exemptions, or satisfying tooling to application
source.

If a derived collection is empty, replace its VerticalList with one
`ScrollView insetForHeader tabIndex={0}` containing only an ordinary
`content-inset` and concise BODY2 state copy. Do not fake the state as a
ListItem or Panel and do not invent a recovery action.

## Detail route

Use `Page headerText="Job detail"` and a full-height two-row action shell. Its
first row is one edge-to-edge `ScrollView insetForHeader tabIndex={0}`. Put one
edge-to-edge Panel directly inside it, with one `content-inset`. Use routine
text only:

- record title in `BODY2_EMPHASIZED`;
- description in `BODY2`, beginning with new information rather than repeating
  the title;
- all-caps `STATUS` in secondary `META2`;
- one primary `META1` status such as `Scheduled`, `Deferred`, or `Complete`.

Separate these mixed roles by
`calc(var(--uit-spacing-large) + var(--uit-spacing-xsmall))`. The Panel is a
single information backdrop, not a field-card collection.

The second shell row contains one edge-to-edge ButtonRail in an action dock.
Render exactly two mounted Buttons in this order:

1. `Complete` or `Reopen`, calling `toggleCompleted` and then Toast;
2. `Defer` or `Resume`, calling `toggleDeferred` and then Toast.

Buttons stay mounted while their labels/state change so focus remains stable.
Disable Defer/Resume while the record is complete. Do not remove the record,
navigate as part of the action, or add Back/Home/Close controls. Browser Back
returns to the selected pager page; completion has already selected Done.

The not-found branch is `Page > ScrollView insetForHeader tabIndex={0} >
content-inset` with concise BODY2 copy and no Panel or action.

## Authored CSS

Use exactly:

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

Do not add selectors, literal values, authored overflow, or component-internal
styling. Components retain intrinsic size; lists, scroll owners, pager, Panel,
and ButtonRail remain edge-to-edge.

## Verification

Before tools, confirm two one-word pager items, two filtered collections, one
detail route, two real detail actions, both empty branches, one vertical owner
per surface, direct Panel ownership, no in-app Back, and durable state. Run
`scripts/verify-app.mjs` from this skill. Stop only when typecheck, opaque toolkit
validation, focused pattern validation, and production build all succeed.
