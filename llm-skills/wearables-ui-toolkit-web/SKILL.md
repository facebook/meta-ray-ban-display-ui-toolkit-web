---
name: wearables-ui-toolkit-web
description: Discover and route to the complete UI Toolkit for Meta Ray-Ban Display skill library for building production Meta Ray-Ban Display React applications with `@wearables-ui-toolkit/mrbd`. Use first for any broad, ambiguous, multi-component, or unfamiliar toolkit task; for architecture decisions; or when an agent needs to locate the right component, material, navigation, accessibility, validation, or design-system skill.
---

# UI Toolkit for Meta Ray-Ban Display

Use this as the entrypoint for UI Toolkit for Meta Ray-Ban Display work. The production contract below is
binding even when no additional skill fits in context. Read the relevant
specialized skills before implementation; use multiple skills when a route
crosses domains.

## Hard execution boundary

Before the first application-source write, read only the supplied application
workspace, this entry, and the direct skill references selected below. Do not
list, search, or open the toolkit package roots, `node_modules`, implementation,
examples/gallery, unrelated application sources, tests, export barrels, built CSS, or icon
directories. Do not open validator source; run the validator as an opaque
acceptance command. A pre-write command that touches one of those locations is
a failed workflow, even when it appears faster than reading the skill.

For a new empty application workspace, first run this skill's
`scripts/init-app.mjs <workspace>`. It installs the canonical public package,
TypeScript, Vite, and HTML configuration without application source. Keep the
generated `vite.config.ts` unchanged: never add the toolkit source aliases. If the
workspace already supplies equivalent build configuration, preserve it and do
not run the initializer.

Use the exact public API map in this entry and the selected direct references.
Resolve required icons only with the bundled `find-filled-icon.mjs` command.
After a direct, unmasked typecheck, one exact exported type file may be read for
each genuine unresolved type error; no directory search is permitted. If the
documented APIs cannot express an optional idea, simplify the product instead
of exploring package code or examples.

Run typecheck, build, and validator commands directly. Never append `echo`,
pipe through `head`/`tail`, chain a fallback command, or otherwise replace the
real exit status. Environment/tooling failures are failures to report, not
permission to search the library or continue as if verification passed.

For an ambiguous simple or medium-complexity product brief, load only
`../uit-routed-list-app-web/references/production-pattern.md`. It defines the
default focused collection/detail architecture, exact public APIs, feature
budget, and one-command verification. Do not also load the mandatory foundation
or domain references below. Add other component domains only when the user
explicitly requests a capability outside that production pattern.

When this entry routes to any specialized production pattern in the list below,
that pattern's `scripts/verify-app.mjs` is the only verification command to run.
It already performs focused contract checks, typecheck, opaque toolkit structure
validation, and a production build. Do not run those gates individually, list
the script directory, or read either verifier after a failure. Its diagnostics
are the complete repair contract; fix all reported source files in one batch and
rerun the same command. This specialized one-command rule overrides the generic
completion-gate commands later in this entry.

If the focused verifier cannot start because dependencies or its runtime are
missing, stop and report that environment failure. Never run a package manager,
copy dependencies from another workspace, search the machine for a runtime, or
substitute another validator. When verification succeeds, invoke no more tools
or commands; the next action must be the final answer. Do not start or probe a
development server.

When the product explicitly asks users to switch between peer work
collections such as Today/Done, Active/Done, Open/Closed, or Current/History,
and selecting a record opens a detail with completion/defer-style actions,
load only `../uit-tabbed-work-app-web/references/production-pattern.md`. The
SubNavigationPager is the root surface; do not collapse the collections into
one routed list or substitute action controls for tabs.

When the requested product is explicitly a focused settings/control experience
with peer categories, load only
`../uit-tabbed-controls-app-web/references/production-pattern.md`. It defines a
SubNavigationPager architecture with integrated switch and radio ListItems. Do
not route that task through the conventional collection/detail pattern.

When the requested product explicitly has three peer operational areas such as
Overview/Stops/Notes, Summary/Tasks/Log, or Status/Checks/Notes, and does not
need routed record details, load only
`../uit-operational-pager-app-web/references/production-pattern.md`. It defines
a compact overview, one actionable record list, and one read-only handoff
surface. Do not improvise a dashboard, form system, or third work queue.

When the requested product is one focused status, monitor, or session surface
with one primary state and one reversible action, load only
`../uit-status-action-app-web/references/production-pattern.md`. It defines a
single Page with one edge-to-edge Panel information backdrop and one bottom
ButtonRail. Do not invent a collection or peer pager for that task. This route
does not cover countdowns or automatic completion.

A singular recorded alert, incident, threshold crossing, door event, or
excursion with an Acknowledge/Reopen workflow is also this status-action route.
Do not pluralize the record or invent a collection, history, or detail route.
Use a collection pattern only when the brief explicitly asks to browse, search,
queue, or retain multiple records.

When the product is explicitly a countdown or timed session that can run,
pause, complete, and restart, load only
`../uit-timed-session-app-web/references/production-pattern.md`. Its state
machine keeps the displayed condition, status value, and persistent action
semantically synchronized through terminal completion.

When real media is the primary collection and selecting a horizontally paged
item opens a reading detail, load only
`../uit-media-browser-app-web/references/production-pattern.md`. It defines
nonzero responsive Card geometry, static detail media, and Back restoration.

When two or three peer custom-material regions each expose one direct mode
operation, load only
`../uit-material-controls-app-web/references/production-pattern.md`. It defines
a restrained vertical control hierarchy and forbids telemetry-console
expansion.

When each row in one work queue opens temporary record commands, load only
`../uit-contextual-inbox-app-web/references/production-pattern.md`. It defines
ListItem-hosted tooltip menus with no page reflow and stable focus return.

## Load the smallest complete reference set

Resolve every relative path from the directory containing this `SKILL.md`.
The `../uit-*-web` targets are sibling directories under `llm-skills`; never
drop the `llm-skills` segment when constructing an absolute path. If a read
fails because the path was constructed incorrectly, correct that path directly
from this rule. Do not list parent directories to rediscover the skill tree.

For a whole application that does not fit the default routed-list pattern, this
entry contract plus the following direct references are the mandatory
foundation:

- `../uit-screen-architecture-web/references/route-skeletons.md`;
- `../uit-navigation-focus-web/references/navigation-components.md`;
- `../uit-accessibility-testing-web/references/validation-playbook.md`.

After selecting components, load only each matching domain's directly linked
component reference. For example, a list/action application additionally reads
`../uit-lists-menus-web/references/list-menu-components.md` and
`../uit-actions-web/references/action-components.md`. Text-entry work additionally
reads `../uit-text-input-web/references/text-input-components.md`. Do not also
read each parent `SKILL.md`; this entry has already performed routing and the
direct reference contains the component API/composition contract. Read a parent
skill only when the direct reference explicitly points to missing advanced
guidance.

Do not load the broad `building-uit-interfaces-web` catalog for an ordinary
whole-app generation. Use it only when component selection remains genuinely
unknown after this entry contract. Likewise, routine `TextView` usage does not
require the content-identity skill, and a route that does not use a material,
media, or surface component does not require the surfaces/media skill. This
keeps the active instruction set small enough to follow precisely.

## Route by task

| Task | Load target |
|---|---|
| Conventional collection/detail production app | `../uit-routed-list-app-web/SKILL.md` |
| Peer work queues with routed details/actions | `../uit-tabbed-work-app-web/SKILL.md` |
| Peer paged settings/control production app | `../uit-tabbed-controls-app-web/SKILL.md` |
| Three-area operational pager without routed details | `../uit-operational-pager-app-web/SKILL.md` |
| Single status/monitor with one action | `../uit-status-action-app-web/SKILL.md` |
| Countdown or timed session | `../uit-timed-session-app-web/SKILL.md` |
| Horizontal media collection with reading detail | `../uit-media-browser-app-web/SKILL.md` |
| Two or three custom-material controls | `../uit-material-controls-app-web/SKILL.md` |
| Work queue with row-level temporary actions | `../uit-contextual-inbox-app-web/SKILL.md` |
| Route skeleton, single scroll owner, responsive containment | `../uit-screen-architecture-web/references/route-skeletons.md` |
| Unknown component, whole application/route, broad review | `../building-uit-interfaces-web/SKILL.md` |
| ContainerMaterial, layers, gradients, custom materials, partial focus/handoff | `../uit-materials-web/SKILL.md` |
| Theme tokens, semantic color, typography, spacing, color ramps | `../uit-theming-color-web/SKILL.md` |
| Button, ButtonRail, ButtonGroup, divider, quick reply, action hint | `../uit-actions-web/references/action-components.md` |
| ListItem, VerticalList, SwipeToReveal, VerticalMenu, ContextMenu | `../uit-lists-menus-web/references/list-menu-components.md` |
| Switch, radio, slider, scrubber, IsolatedControl, tiles | `../uit-controls-web/references/control-components.md` |
| InputTextView, text entry, built-in send action, field loading | `../uit-text-input-web/references/text-input-components.md` |
| Text, icons, Avatar, badges, Tag, Chip, content headers | `../uit-content-identity-web/references/content-components.md` |
| Container, StaticContainer, Panel, Surface, Card, Carousel, media | `../uit-surfaces-media-web/references/surface-media-components.md` |
| Page, scrolling, Pager, SubNavigationPager, routes, focus | `../uit-navigation-focus-web/references/navigation-components.md` |
| Tooltip, popup menus, Modal, Toast, Scrim, portals | `../uit-overlays-feedback-web/references/overlay-components.md` |
| Progress, loaders, shimmer, status, volume/zoom indicators | `../uit-status-loading-web/references/status-components.md` |
| Accessibility, D-pad behavior, visual/device validation, release gate | `../uit-accessibility-testing-web/references/validation-playbook.md` |

## Sources of truth

- For whether a public prop/export exists, the current exported TypeScript type
  is authoritative. Consult it only for one unresolved API question or a real
  typecheck error.
- For production composition, component selection, behavior, and design
  guidance, specialized skills in this library are authoritative, followed by
  the current [Wearables Developer Center documentation](https://wearables.developer.meta.com/docs/develop/webapps/design/overview/).
- Tests prove covered behavior but do not define application composition.

Do not invent an API based on a similarly named component elsewhere. Translate design intent into the actual React API that exists.

## Core public API map

Use this map for the common production shell without inspecting package files:

- Import `App`, `Page`, `SubNavigationPager`, `ScrollView`, `VerticalList`,
  `ListItem`, `Button`, `ButtonRail`, `ButtonGroup`, `InputTextView`,
  `ProgressIndicator`, `TextView`, `TextStyle`, and `Toast` from
  `@wearables-ui-toolkit/mrbd`.
- Import `ReactRouterNavigationProvider` and
  `ReactRouterPageTransition` from `@wearables-ui-toolkit/mrbd/react-router`. They
  are never root-package exports.
- Render the application inside `App`, which loads the toolkit stylesheet.
- `Page` receives concise `headerText`, optional `headerMetadata`, and route
  content as children.
- `ScrollView` and `VerticalList` receive `insetForHeader`, `ariaLabel`, and
  children. `ScrollView` additionally accepts `tabIndex={0}` for a genuinely
  static D-pad-scrollable region.
- `ListItem` receives `title`, optional `subtitle`, optional real-time
  `timestamp`, optional filled `icon`, and one row interaction such as
  `onClick`; use its documented switch/radio/slider props only for those modes.
- `SubNavigationPager` receives one-word `{label, icon}` items, persistent
  `currentPageIndex`, `onPageChange`, `ariaLabel`, and one vertical-owner child
  per item. `icon` is required on every item; never start with label-only
  placeholders.
- `Button` receives concise `title`, optional filled `icon`, `onClick`, and
  `disabled` when unavailable. `ButtonRail`/`ButtonGroup` receive Button
  children. `Toast.show(message)` follows a real outcome.
- `InputTextView` receives controlled `text` plus `onTextChange`, or
  `defaultText` for uncontrolled use. Provide `onSend` and a localized
  `actionLabel` for its component-owned action; set `showActionButton={false}`
  only when Enter submission should remain available without that button. Use
  `showLoader` for unknown-duration field work and a sibling
  `ProgressIndicator` for measurable completion.
- `ProgressIndicator` receives a real `value` range, an accessible label, and
  `animated` only when reduced motion is not requested. It is display-only.
- `TextView` receives rendered text as React children and optional `as`,
  `textStyle`, and `textColor` props. It has no `text` prop.
- Authored eyebrow/category/field labels are all caps and use
  `TextColor.SECONDARY`. Authored subtitles/supporting labels also use secondary
  text color; semantic components own the treatment of their built-in subtitle
  slots. Never reach into a component to recolor its subtitle.
- Filled SVG assets, when needed and already known, use the public subpath
  `@wearables-ui-toolkit/icons/svg/<semantic-name>__filled.svg`. Icons are
  optional except for `SubNavigationPager` items. Resolve an unknown required
  icon set in one call to
  `../uit-content-identity-web/scripts/find-filled-icon.mjs <concept> [<concept> ...]`;
  quote each multi-word concept. Do not inspect icon directories, barrels, or
  source. Omit an optional icon if the lookup has no semantically accurate
  result.
- `TextStyle` members are exactly `NUMERAL1`, `NUMERAL2`, `DISPLAY1`,
  `HEADING1`, `HEADING2`, `BODY1`, `BODY1_EMPHASIZED`, `BODY2`,
  `BODY2_EMPHASIZED`, `LABEL`, `LABEL_EMPHASIZED`, `META1`,
  `META1_EMPHASIZED`, `META2`, `META2_EMPHASIZED`, and `META3`. There is no
  generic `METADATA` member. Routine application copy should ordinarily stay
  within `BODY2`, `BODY2_EMPHASIZED`, `LABEL`, and `META1`–`META3`.
- Common application-layout spacing tokens include `--uit-spacing-2xs`,
  `--uit-spacing-xsmall`, `--uit-spacing-small`, `--uit-spacing-sm-med`,
  `--uit-spacing-medium`, and `--uit-spacing-large`. Common semantic corner
  tokens are `--uit-corner-radius-xxsmall`, `--uit-corner-radius-xsmall`,
  `--uit-corner-radius-small`, `--uit-corner-radius-medium`,
  `--uit-corner-radius-large`, and `--uit-corner-radius-xlarge`. Use the
  smallest semantically appropriate set; never inspect built CSS to discover
  token names during ordinary app construction.
- Common authored semantic colors include `--uit-color-background-window`,
  `--uit-color-text-primary`, `--uit-color-icon-primary`, and
  `--uit-color-border-primary`. Prefer component-owned color/material styling;
  use these only for genuinely custom content that the toolkit does not already paint.
  Secondary `TextView` content uses `TextColor.SECONDARY`; ordinary custom text
  or `currentColor` SVG uses `uit-color-text-secondary` or
  `uit-color-icon-secondary` so color and required blending stay paired.

## Whole-application production contract

Apply every rule in this section before adding optional content. Do not replace
these rules with generic web conventions.

### Foundation and routing

- Consume `@wearables-ui-toolkit/mrbd` and its icon package through their public
  package exports. Never alias an application to library source.
- Let `App` load the toolkit stylesheet. Paint `html`, `body`, and the mount
  root with `var(--uit-color-background-window)` and give each a real
  full-viewport containing block.
- Use the canonical routed shell in this order: `BrowserRouter` >
  `ReactRouterNavigationProvider` > the toolkit `App` > durable application providers >
  `ReactRouterPageTransition` > `Routes location={location}`. Keep state that
  must survive navigation outside the transition. `App` already owns Toast
  presentation; never mount `ToastContainer`.
- Every ordinary route uses `Page`; every tabbed route uses
  `SubNavigationPager` instead of `Page`. Never combine them. Configure Header
  only through `Page`; never render Header in content or lists. Header title,
  metadata, and status fields are each at most two words. Omit metadata/status
  unless it materially changes understanding or the next action. Subnavigation
  labels are one word.
- Never add an in-app Back/Home/Close control for route return. Browser history
  and the system Back path own return navigation.

### Scroll and page geometry

- Give every route or pager child exactly one vertical owner. If it contains
  any `ListItem`, use one root `VerticalList`; otherwise use one root
  `ScrollView`. Never nest same-axis scrolling or put `ListItem` in ScrollView.
- For substantial static information with no legitimate child interaction,
  set `tabIndex={0}` on `ScrollView` so the scroll owner itself receives focus
  and D-pad input, and provide a concise `ariaLabel` naming that region. Never
  invent a Button, Container, or other focus sentinel to make prose scrollable.
  Condense or split content that is still overloaded.
- Keep `VerticalList`, `ScrollView`, Carousel, and ButtonRail frames
  edge-to-edge. Let ListItem own row inset. Wrap each authored non-full-bleed
  ScrollView block and inset it with `var(--uit-spacing-large)`. Keep
  full-bleed `Panel width="100%"`, Carousel, and other component backdrops as direct children
  of the ScrollView; they own their internal content inset. Pager children set
  `insetForHeader` on their vertical owner.
- A VerticalList is one uninterrupted row collection: no authored headers,
  summaries, filters, Panels, section labels, footers, gaps, or dividers among
  rows. Split distinct collections into routes/pager pages or encode essential
  grouping in concise row content.
- Do not turn empty/error/status content into a ListItem. Replace the collection
  with ScrollView, ordinary inset state copy, and a real recovery Button below
  the copy when recovery exists.
- Derive layout from available space. Never hardcode device/viewport dimensions
  or branch on them. Use shrinkable grid/flex tracks and verify no horizontal
  overflow or clipped focus expansion.

### Content, components, and materials

- Never restyle a toolkit component's internals. Application CSS must not target a
  component descendant, generated class, role, ARIA/data attribute, DOM tag,
  pseudo-element, or state exposed by its rendered anatomy. Do not use DOM
  queries to find or mutate internal elements. Customize only through documented
  public props, handles, material/theme APIs, tokens, and supported root
  `className`/`style` hooks. A public root hook styles that root only; it does not
  authorize descendant selectors.
- Choose the semantic toolkit component before foundation primitives or HTML. Do
  not imitate, reconstruct, approximate, or work around any toolkit component with
  custom code, generic HTML/CSS, custom materials, or combinations of other
  components. Unsupported behavior is an API gap, not permission to synthesize
  a look-alike.
- Never nest `StaticContainer`, `Container`, `Surface`, `Button`, `Chip`, `Tag`,
  or Header inside another member of that set. Panel is one informational
  backdrop, not a row/item/list primitive. An interactive Container/Panel is one
  target and contains no interactive descendants.
- Inset non-full-bleed text/content inside Container, StaticContainer, Surface,
  or Panel with `var(--uit-spacing-large)`. Page-level Panel backdrops usually
  reach both screen edges; Modal is inset. Rounded inset content uses a
  concentric semantic corner token.
- Chip, Tag, Button, AppBadge, and Page-owned Header keep their intrinsic width
  and height. Never stretch, shrink, constrain, or scale them with props, CSS,
  flex/grid behavior, or wrappers. Do not draw full-width rounded fact bars as
  substitutes; genre, quantity, state, and similar ordinary facts usually use
  body/metadata text hierarchy.
- Build routine authored hierarchy with `TextStyle.BODY2`,
  `BODY2_EMPHASIZED`, label, and metadata styles. Semantic heading markup does
  not require a heading appearance. BODY1, heading, display, and numeral styles
  are exceptional and require a concrete product need plus device validation.
- Use only semantic toolkit tokens, without literal fallbacks, for spacing, color,
  corners, typography, size, elevation, opacity, and motion. Do not author font
  metrics, colors, radii, component dimensions, or timing literals. Use only
  filled, semantically accurate icons; gesture icons are instructional only.
  Emoji, Unicode pictographs, and geometric text glyphs never substitute for
  icons.

### Actions, focus, and product behavior

- Every horizontal action row uses ButtonRail or ButtonGroup. Page-level actions
  live in one bottom dock outside the vertical owner. Use a full-height two-row
  shell (`minmax(0, 1fr)` content, then `auto` actions), keep the rail
  edge-to-edge, and use `var(--uit-spacing-xsmall)` below it. Buttons always
  follow the content they affect. Rails/groups execute actions; they never act
  as tabs or filters.

  ```css
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
  ```
- Preserve focus when controlled state changes. Keep the focused Button mounted
  or explicitly move focus to its intended successor before removing it.
  Restore route focus/scroll on Back and popup-trigger focus on dismissal.
- Every focus target performs the visible command on the named object. Toast is
  feedback after a real state/platform/navigation result, never the result.
  Never invent Copy/Highlight/Next/Settings or other controls as scroll/focus
  sentinels. Disabled/unavailable actions use the component state and attempted
  action feedback when needed.
- Do not add instructional prose that merely repeats an obvious nearby Button
  label or its inverse state. Use the content region for domain information and
  let the action copy state the command.
- ListItem title is one identity, subtitle is one complementary fact or compact
  pair, and timestamp is one concise point in time. When timestamp or another
  trailing accessory consumes row width, subtitle is one short fact—never a
  delimiter-joined pair. Timestamp itself is also one representation: choose
  either a clock/calendar value or a relative value, never both joined with a
  delimiter. Do not serialize a record, use status/location/price as timestamp,
  add navigation chevrons, or apply status color to unrelated text. Verify
  realistic longest row copy without truncation at every tested constraint.
- On a detail route, the Page header owns the record identity. Do not repeat
  the same name as a heading inside the first Panel or content block; begin with
  useful supporting information.

### Completion gate

- If a specialized production pattern was selected, run only its focused
  `scripts/verify-app.mjs` as described above. Skip every remaining generic
  command in this section.
- Work in three bounded batches: architecture/API decisions, coherent source
  construction, then verification. Do not alternate between writing one file
  and rediscovering APIs.
- Before source construction, write a short route ledger for every route or
  pager child: top-level surface, single vertical owner, row versus static
  content, action location, focus owner, empty branch, and required icons.
  Resolve every required icon with the bundled lookup script at this point.
- During source construction, create the complete coherent file set using
  parallel tool calls when available. Before authoring CSS, inventory every
  declaration that needs a value: each must use a semantic toolkit token, a
  percentage, or flexible layout. If decorative geometry needs an arbitrary
  length or radius, omit the decoration rather than inventing a value.
- Run strict typecheck as a direct command with no pipe, `head`, `tail`,
  appended `echo`, or other construct that can mask its exit status. For a real
  type error, consult at most one exact public type file for that component;
  never search package/source directories. Fix all type errors in one batch,
  then rerun typecheck once.
- Read only the exact component types/implementation needed after choosing the
  route skeleton and exhausting the relevant domain skill/reference. Avoid
  broad source exploration and do not patch dependencies, toolchains,
  validators, or installed packages.
- Resolve the validator path relative to this entry skill and run:
  `node ../uit-screen-architecture-web/scripts/validate-app-structure.mjs <app-src>`.
  Invoke that exact file without listing or reading its directory/source. Run
  it directly without appending `; echo`, which masks its failure status.
  Completion requires zero findings; never waive or relabel findings.
- Treat one validator report as one repair batch: group every finding by file,
  read all affected files together, correct every finding in each file, and
  rerun once. Do not make one edit-and-rerun cycle per finding.
- Run strict typecheck and a production build. Then perform the full
  accessibility, D-pad, focus, navigation, state, responsive, and device visual
  matrix described by `uit-accessibility-testing-web` when that validation is
  in the task's scope.

## Required completion behavior

When modifying the UI Toolkit for Meta Ray-Ban Display library repository itself,
Meta-owned JavaScript, TypeScript, and CSS source files outside `packages/icons`
must begin (after a required shebang) with the repository's approved Meta Apache
License 2.0 header. The mixed-license root manifests must declare `"license":
"SEE LICENSE IN NOTICE"`, `packages/icons` must declare `"license": "SEE LICENSE
IN LICENSE"`, and other package manifests must declare `"license":
"Apache-2.0"`. The entire icon package is licensed under the Meta Wearables
Developer Terms; preserve `packages/icons/LICENSE`, its package-level source
headers, the root `NOTICE` package boundary, and the terms link. The UI Toolkit
for Meta Ray-Ban Display directory is the repository root referenced by the
Apache source-code license header used outside the icon package. Preserve the
required upstream license, headers, Meta
modification notices, `NOTICE`, and `UPSTREAM.md` in
`packages/androidx-shapes`. Other source in that package is Meta-authored glue
and uses the normal Meta Apache header. Never rewrite
dependencies or generated build output. Run `yarn license:check` after adding or
generating library source. This repository-maintenance rule does not add a Meta
copyright header to applications that merely consume the toolkit.

```text
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
```

For production UI, always begin with the screen-architecture skill and include
the accessibility/testing skill before declaring completion. For any
`StaticContainer`, `Container`, `Surface`, or compatible higher-level
component color/material customization, always include both material and
theming/color skills. For routing or focusable UI, include navigation/focus.

Across every skill, use semantic toolkit or application-theme tokens for color,
spacing, corners/shapes, typography, component sizing, elevation, opacity, and
motion. Never copy a token's resolved value into production component code.

Never imitate, reconstruct, approximate, or work around any toolkit component with
custom code, generic HTML/CSS, custom material painting, a foundation
primitive, or a composition of other toolkit components. Existing components own
their anatomy, intrinsic size, material, clipping, focus, interaction, motion,
and state contract. If the required result is unsupported, choose a genuinely
different semantic pattern, simplify the product design, or identify a public
library/API gap. Do not synthesize a look-alike.

`StaticContainer`, `Container`, and `Surface` are equal material hosts. Any
rule about material ownership, custom material layers, state rendering,
tokenized content inset, clipping, or concentric inset corners applies to all
three unless an individual component API explicitly says otherwise. The
`ContainerMaterial` type name does not narrow those rules to `Container`.

## One-shot planning prompt

Before coding, identify:

- route's single primary task;
- top-level surface (`Page` or `SubNavigationPager`);
- exactly one vertical scroll owner per route or pager page;
- semantic components for content, collection, actions, and transient UI;
- controlled application state and focus owner;
- material/theme customization, if any;
- responsive constraints and additive-display legibility;
- accessibility semantics;
- applicable state/interaction/device validation matrix.

Then implement with the specialized guidance rather than reconstructing the toolkit conventions from generic web practices.

For a whole-app generation, enforce these decisions before adding secondary
content:

- Give every route or pager page one coherent task. A page that combines a
  large summary, record collection, control grid, insight feed, and unrelated
  detail link is several destinations collapsed into one dashboard; split it
  into focused peer pages or routes.
- Keep the leading summary compact enough that the initial meaningful focus
  target is fully visible in the settled first frame. Autofocus scrolling a
  summary away is a failed composition.
- Co-locate each pager page's `VerticalList` or `ScrollView` with the component
  that owns that page's content. Do not hide the vertical owner in a distant
  router shell while the page file emits ownerless rows or heterogeneous
  fragments.
- Treat repeated Panels or authored rounded/background tiles as a signal that
  records, controls, or facts need a semantic component or one coherent
  informational backdrop.
- Use a multidimensional grid only when its component pattern supports one and
  its longest realistic label remains readable at every tested constraint.
  Flexible columns are not responsive when their contents truncate into
  indistinguishable controls.
- Preserve a routed pager's controlled page index outside route unmounts, and
  use the canonical toolkit router shell/transition snapshot contract so Back can
  restore the originating page, focus, and scroll.
