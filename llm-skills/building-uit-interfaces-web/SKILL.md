---
name: building-uit-interfaces-web
description: Build, revise, or review polished production Meta Ray-Ban Display React interfaces with the public `@wearables-ui-toolkit/mrbd` library. Use for UI Toolkit for Meta Ray-Ban Display applications, routes, layouts, focus/D-pad navigation, materials, responsive sizing, overlays, accessibility, performance, or visual validation. Covers component selection, compliant composition, semantic tokens, filled icons, additive-display legibility, incorrect patterns, and device-ready testing. Assume no prior toolkit knowledge.
---

# Build UI Toolkit for Meta Ray-Ban Display interfaces

Build with the toolkit components as behavioral primitives, not as visual inspiration for custom HTML. Let the library own material, shape, clipping, typography, interaction state, focus motion, and popup placement.

## Start every task

1. Read `../uit-screen-architecture-web/SKILL.md`, choose one legal route
   skeleton, and record the single vertical owner for every route/pager page.
2. Read only the relevant references below, plus
   `references/quality-checklist.md` before completion.
3. Implement from this skill library's public API guidance. Inspect one exact
   exported prop type only when a selected API remains ambiguous or typecheck
   reports a mismatch. Do not systematically browse implementation, tests,
   gallery pages, package directories, or icon directories before coding.
4. Use a gallery page only as a concrete API example after the skills and
   public documentation leave a specific composition unresolved. Gallery code
   is not production architecture and never overrides the skill contract.

Never infer an API from another platform or invent an unsupported prop, slot, variant, or behavior.

Write the first application pass before opening library source. The only
permitted pre-write reads are the supplied workspace and relevant toolkit skills
and references. Do not list package trees, read export barrels, inspect gallery
routes, open validator source, or search icon directories. Typecheck the first
pass, then inspect only the exact public type implicated by a real error. Omit
an optional icon when its exact filled export is unknown rather than browsing
for decoration.

Consume the toolkit through its public package exports. Do not alias application
imports directly to library source files or hide such aliases in a generated
Vite configuration. A real application declares the public toolkit packages as
dependencies and exercises the same package boundary its consumers use.
When a TypeScript Vite config imports `node:path`, `node:url`, or another Node
builtin, include the matching Node type package/configuration in the generated
project; a browser-only type setup will fail before Vite can build.

Treat installed dependencies, package-manager caches, validation scripts, and
the provisioned toolchain as immutable. Never patch `node_modules`, a compiler,
the bundler, or a validator to make a gate pass. Use the documented/provisioned
runtime; if a required runtime is unavailable, report that gate as unavailable
instead of changing the environment. A generated application is not accepted
if it mutates anything outside its authorized source/configuration scope.

Treat validators as minimum defect detectors, never as a design recipe. Do not
inspect their matching strategy, rename/extract code to avoid a finding, or add
controls, state, routes, wrappers, and copy merely to satisfy a threshold. If a
real product composition cannot pass naturally, redesign or split the product
flow. Every emitted element must remain justified with the validator removed.
Validator scripts are opaque acceptance tools: never open, read, print, search,
copy, or modify their source. Execute the documented command and use only its
reported findings. Inspecting validator implementation invalidates the
generation and wastes the context needed to build and verify the product.
Every reported finding must be resolved in the application before completion.
Never label a remaining finding a heuristic or false positive, waive it in the
final report, or claim the app is done with nonzero findings. If a finding is
genuinely incorrect, stop and report the blocker for the validator owner rather
than shipping or evaluating the app as passing.

## Mandatory app foundation

Render every surface inside `App`, which loads the toolkit stylesheet:

```tsx
import { createRoot } from 'react-dom/client';
import { App } from '@wearables-ui-toolkit/mrbd';

export function Root() {
  return <App>{/* router and routes */}</App>;
}

const mountElement = document.getElementById('root');
if (mountElement == null) {
  throw new Error('Application mount element is missing');
}
createRoot(mountElement).render(<Root />);
```

`App` supplies theme tokens, font setup, focus coordination, and the floating portal root. Do not recreate part of this shell.

Give every percentage-height ancestor a real viewport height. Without this
reset, `App`, page transitions, and routes may build a complete DOM inside a
zero-height root and render a blank screen:

```css
html,
body,
#root {
  inline-size: 100%;
  block-size: 100%;
  margin: 0;
  background: var(--uit-color-background-window);
}
```

Confirm the mounted app root has nonzero viewport bounds before debugging an
apparently blank component tree.

The host HTML must declare a device-width viewport. Without it, the WebView can
use a wide desktop layout viewport and scale the entire interface down, making
text and focus targets too small even when the CSS itself is flexible:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

## Production source organization

Keep the router/application shell declarative and small. Put each nontrivial
route and each substantial `SubNavigationPager` page in its own component file.
Move shared domain state and actions into a focused context/store module, and
keep mock/remote data types separate from view composition. A single file that
owns router setup, several pager pages, a detail route, state transitions, and
formatting helpers is not production-readable even if it builds.

Mount domain providers whose state must survive navigation outside
`ReactRouterPageTransition`. A provider created inside the transition snapshot
can give retained routes separate stores, so an Add/Save/Toggle operation
appears to work and then disappears on Back. Keep one application store around
the transition and verify state through a forward-and-Back round trip.

Split by semantic ownership, not arbitrary line fragments. Keep tiny local
render helpers beside their only caller, but extract a pager page once it owns
its own collection, controls, derived state, or interaction logic. Avoid both a
monolithic `App.tsx` and empty one-line wrapper files.

For list routes, compose `Page` and one full-screen `VerticalList`:

```tsx
<Page headerText="Saved places">
  <VerticalList insetForHeader ariaLabel="Saved places">
    <ListItem title="Harbor trail" subtitle="1.2 miles away" onClick={openHarbor} />
    <ListItem title="North overlook" subtitle="3.4 miles away" onClick={openOverlook} />
  </VerticalList>
</Page>
```

Use `SubNavigationPager` instead of `Page` for a top-level tabbed route. Do not combine both.

## Core design constraints

- Paint the complete document and application window with
  `var(--uit-color-background-window)`. `App` already uses that token; never
  override it to transparent or expose the WebView backing surface. Do not use
  a raw color, wallpaper, or decorative page gradient in its place. Keep
  hierarchy sparse and put semantic component/material surfaces only behind
  content that needs legibility or interaction.
- Use a static material surface behind long free-floating paragraph text. Do not nest a second rounded text container inside an existing rounded surface.
- Never nest `StaticContainer`, `Container`, `Button`, `Surface`, `Chip`, `Tag`,
  or `Header` inside another member of that set. One component owns the
  material, shape, clipping, interaction boundary, and semantic role. Configure
  the page header through `Page` instead of rendering `Header` in content.
- Inset non-full-bleed content inside `Container`, `StaticContainer`, `Surface`,
  and `Panel` with `var(--uit-spacing-large)`. Full-bleed media may use the
  owning component's clipping without that inset.
- When rounded media or other rounded content is inset inside a rounded owner,
  make its corners geometrically concentric with the owner. Choose the exact
  semantic corner token whose radius equals the outer radius minus the inset;
  never reuse the outer radius or eyeball a value. A medium outer corner with a
  large inset uses the xx-small inner-corner token.
- Do not add in-app back buttons. Use router history and the system back path.
- Keep `Page.headerText` to one concise page identity. Put supporting location,
  category, status, or other facts in `headerMetadata`; do not serialize facts
  into the title with delimiters. `headerMetadata` is one short supporting
  value, not a delimiter-joined fact list. Move the remaining facts into body
  content and verify the complete header stays inside the viewport. Every
  visible header title, subtitle/metadata, and textual status field is at most
  two words. Subtitle/metadata and status are optional: omit them unless that
  concise value adds high-value context that materially affects understanding
  or the next action. They are not overflow space for routine facts.
- Give every `SubNavigationPager` tab a one-word title.
- Inset ordinary visible content from both display edges with
  `var(--uit-spacing-large)`. The `ScrollView`, `VerticalList`, and
  `ButtonRail` component frames themselves always extend fully to the left and
  right screen edges. A page-level `Panel` backdrop also typically extends to
  both edges while its non-full-bleed children use the large internal inset.
  `Modal` is different: its surface is inset from the screen edges. Inset
  authored ScrollView content blocks, let VerticalList rows provide their owned
  content inset, and never pad the scroll component frames.
- Keep page-level Panel backdrops outside authored ScrollView inset wrappers.
  Render the Panel as a direct full-width child and apply the large token to its
  own non-full-bleed children. Use separate inset wrappers for adjacent prose.
- Use semantic toolkit components, token variables, typography appearances, sizes, states, and materials. Do not hardcode screenshot-matched colors, font metrics, radii, or device dimensions.
- Pass typography through the typed public contract,
  `textStyle={TextStyle.*}`. Do not use raw string values such as
  `textStyle="heading2"`, even when they happen to match an internal value.
- Build almost every authored text hierarchy from `TextStyle.BODY2`,
  `BODY2_EMPHASIZED`, label, and metadata styles. `BODY2` is the normal body
  size and the practical ceiling for routine product UI. Do not reach for a
  heading merely because text is a title; semantic heading markup and visual
  size are separate decisions. `BODY1`, display, heading, and numeral styles
  are exceptional. Use one only when a specific product need cannot be met by
  emphasis, color, order, or spacing at body size, then verify the whole
  surface on-device. A primary numeric readout is the usual rare exception.
- Reference design tokens without literal fallbacks. Do not write
  `var(--uit-spacing-*, <copied length>)`, alias a resolved token value into an
  app variable, copy resolved colors/corners/sizes into inline styles, or invent
  a token name. Verify every referenced token exists in the published theme.
- Do not leak engineering guidance into product copy. Terms such as the toolkit,
  focusable, pager, rail scrolling, additive-display legibility, or focus/scroll
  restoration belong in documentation and tests unless the product itself is
  explicitly a developer tool.
- Make every layout derive from its available inline and block space. Prefer
  normal flow, flex/grid, percentages, flexible tracks, and component-owned
  measurements. Never encode a known device resolution, branch on a particular
  viewport width/height, or size a route from an emulator frame. Tokens provide
  design values; parent constraints provide responsive geometry.
- A shrinkable grid is only a containment mechanism; it does not prove its
  content is readable. Render the real labels and values and reject columns
  whose text collides, crowds, or wraps into an ambiguous hierarchy. Reduce the
  column count or use a vertical stack instead of compressing telemetry to
  preserve a chosen grid.
- Use only filled toolkit icons in application UI. Never use gesture icons as general-purpose symbols; gesture artwork has specific instructional meaning.
- Never use emoji, Unicode pictographs, geometric text glyphs, or font symbols
  as stand-in icons. Use a semantically correct filled toolkit icon through a
  public icon prop, or omit the optional icon.
- Match icon semantics to the visible destination/action. Bell artwork means
  alerts, notifications, or reminders; camera artwork means capture or
  photography. Do not use either as a generic Shopping, Settings, Add, Save,
  or navigation icon.
- Import each chosen icon from its explicit filled SVG package subpath. Do not
  import the aggregate icons barrel: it can retain unrelated outline assets in
  the application bundle and obscures review of the actual icon choices.
- Give icon-only actions an accessible label. Let the host component own icon sizing and alignment.
- Ensure exactly one visual focus target. Never place focusable children inside a parent that is itself one interaction target.
- Any horizontal row of actions must use `ButtonRail` or `ButtonGroup`. Prefer `ButtonRail` when actions may overflow or the layout needs flexible positioning.
- Keep Button titles and subtitles concise command copy. A Button is not a
  record row or a host for paragraph-length descriptions. Do not solve verbose
  copy by assigning Button width/height, `enforceMaxWidth`, flex growth/shrink,
  or any other external size constraint; shorten the command or choose a more
  appropriate component.
- Chip, Tag, and Button always render at their component-owned intrinsic width
  and height. Never force one larger or smaller in either axis through props,
  style, CSS selectors, flex/grid tracks, transforms, or a constraining
  wrapper. Prevent parent flex/grid layout from stretching or shrinking them:
  align compact column children to flex-start, keep row items inflexible at
  their intrinsic basis, and wrap or scroll the owner instead of resizing a
  child. The same compact intrinsic treatment applies to AppBadge. `Header` is
  also intrinsically sized, but application content never renders or styles it
  directly: only `Page` owns the page Header. Never use Header as a section
  label or place it inside content, a list, or a list row.
- Never imitate, reconstruct, approximate, or work around any toolkit component
  with another primitive, a combination of the toolkit components, custom code,
  generic HTML/CSS, or custom material painting. This universal rule covers
  anatomy, intrinsic size, material, shape, clipping, focus, interaction,
  animation, and state—not only visual appearance. For example, do not replace
  an intrinsic Chip, Tag, Header, or Button with a full-width StaticContainer,
  Container, Surface, Panel, or rounded `div` containing the same short label.
  If the public component cannot provide a required behavior, choose a
  genuinely different semantic pattern, simplify the design, or document a
  library/API gap. Never synthesize a look-alike to bypass the contract.
- Layered media components do not acquire usable geometry from absolutely
  positioned or percentage-sized descendants. Give every Card and Carousel
  item a nonzero responsive inline size plus a nonzero block-size or
  content-appropriate aspect-ratio anchor before using full-bleed `100%`
  media. Verify every focusable element has a visible, nonzero rectangle.
- Place a Button after the content it acts on. Do not lead a detail or
  informational route with Save, Clear, Show, or another related action before
  users have reached the content that gives the action meaning.
- Do not add body copy that only tells users to perform the command already
  named by the nearby Button. Remove that repetition and keep the detail route
  focused on useful record information.
- On detail routes, render the descriptive content before Save/Remove or other
  actions that apply to the record as a whole.
- Let the Page header identify the selected record. Do not repeat the same
  record name as the first body heading inside a Panel or content block.
- Dock a page-level ButtonRail/ButtonGroup at the bottom outside the page's
  single content scroller. End the scroller above the action region and use
  `var(--uit-spacing-xsmall)` as the dock's bottom clearance. Never put actions
  under the header or at the top of a list.
- Render each command as one focus target in one logical location. When a
  ButtonRail/ButtonGroup owns page actions, do not repeat Track, Share,
  Directions, Save, or another dock command as a Button inside the content
  scroller. Content may still contain distinct destinations that are not page
  commands.
- The same one-location rule applies inside the scroller: do not add early and
  late Settings/Preferences/Help buttons that navigate to the same destination
  merely to create focus handoff points. Keep one contextually placed
  destination or condense/split static content that cannot be traversed.
- If a bottom-docked action route's `ScrollView` can overflow, provide a
  meaningful child target or set `tabIndex={0}` when its information is
  genuinely static. A focused `ScrollView` owns D-pad scrolling without a fake
  child action. Give that focusable region a concise `ariaLabel`; otherwise its
  entire text content becomes an unusable accessible name. Simplify or split
  overloaded content; never add an unrelated Settings/Preferences button
  solely to satisfy handoff.
- ButtonRail/ButtonGroup cannot replace SubNavigationPager. Use the pager for
  peer sections/tabs; rails/groups execute actions.
- Put every `ListItem` in a `VerticalList`. Do not insert gaps or dividers between ordinary rows. Do not add chevrons/arrows merely to imply navigation.
- Keep each ListItem subtitle to one short complementary fact when the row also
  has a timestamp or trailing accessory. A delimiter-joined destination plus
  progress/status pair is too wide for this anatomy. Move the secondary fact to
  Page metadata or the detail route, and test realistic longest labels at each
  responsive constraint.
- Give every ListItem one real row-level interaction. A non-actionable summary,
  count, legend, or informational record becomes a misleading focus stop; put a
  compact collection summary in Page metadata or move static information to an
  appropriate non-list surface. Do not append a fake “All items” or “Directory”
  row merely to summarize the rows above it.
- Do not turn empty/error copy or its recovery destination into a ListItem
  merely to obtain a focus target. In a pager child, replace the collection's
  `VerticalList` with an edge-to-edge `ScrollView insetForHeader`; render the
  state as ordinary inset content and put its real recovery Button below that
  copy. A collection recovery opens the collection, not one hardcoded record.
- A generated record row must open or change that record. Never map a collection
  while routing every row to one fixed unrelated destination.
- Do not append a generic Overview, Summary, Directory, or View-all row that
  merely opens the first record in a collection. Either provide the promised
  aggregate destination or name the specific record the row actually opens.
- Toast is feedback after an outcome, not the outcome itself. A row whose only
  callback presents a Toast is still a dead-end focus target; navigate, change
  controlled state, open an appropriate transient action surface, or remove the
  row. Apply the same rule to Buttons, Containers, and every other interaction
  target.
- Treat Browse similar, Contact, Call, Message, Email, and Share as promises of
  real capabilities. Route to the named collection, invoke the appropriate
  platform capability, or remove the target. A Toast that merely claims the
  operation happened is not an implementation.
- Never add dummy counters, render ticks, no-op setters, placeholder “coming
  soon” callbacks, or other mutations solely to evade a validator. The user-
  visible outcome must be real in the application's state or navigation model.
- Do not add Highlight, Toggle highlight, Quick remove, Remove first, or
  similar controls merely to manufacture focus targets or mutate an arbitrary
  record. An item action names and operates on that item; a visual emphasis
  toggle is not a product outcome.
- Do not invent Copy highlight, Copy summary, Copy details, Copy location, or
  similar clipboard actions to manufacture focus targets. Provide copy only
  when copying that exact content is a real product task and perform an actual
  clipboard operation rather than showing the value in a Toast.
- Bulk destructive actions such as Clear/Delete/Remove all must not execute
  immediately from an ordinary collection row. Present them as a deliberately
  separated command and require explicit confirmation that names the scope.
- When an action is unavailable, remove its focus target or expose the
  component's disabled state. Do not keep a focusable callback that immediately
  returns without feedback or state change.
- Render disclosure controls only when the optional content exists, label them
  with the action they perform (for example, Show tip / Hide tip), and expose
  that disclosure once. A content title is not an accurate label for toggling
  supporting detail.
- Keep each row concise and nonredundant. Do not repeat one fact in multiple
  subtitle segments or restate a status as both “Due today” and “Today.”
  Every visible segment must add information.
- For an integrated switch, do not begin supporting text with “On” or “Off”;
  the switch already communicates that state. Use the subtitle for the effect
  or scope of the setting. Likewise, a radio option's supporting text must add
  information rather than restating its title.
- Apply warning/negative/positive color to the status text it describes. Never
  color an unrelated quantity, location, category, or date as an indirect code
  for expiry, urgency, or availability. State must also be understandable
  without color.
- Treat each ListItem slot as one job: title is one identity noun phrase,
  subtitle is one complementary fact pair, and timestamp is one concise point
  in time. Never serialize the underlying record across those slots.
- Price, quantity, unit, location, category, and status are not timestamps.
  Keep them in the appropriate title/subtitle/status role or the detail route.
- Validate every runtime value that can reach `timestamp`, including delayed,
  unknown, fallback, and empty states. A status word such as “Delayed” is not a
  timestamp and must not repeat the subtitle; omit the timestamp or supply a
  real date/time estimate.
- Keep a trailing timestamp compact enough to preserve the row title. Do not
  combine weekday, calendar date, and clock time into one long trailing string;
  choose the most relevant concise date or time and put the full schedule on
  the record's detail route.
- Give each ListItem one trailing treatment. A timestamp, accessory icon,
  switch, radio, status treatment, or trailing tag competes for the same scarce
  row space even when the public type permits several props. Do not show an
  inactive action glyph merely to fill a slot; omit an absent passive state.
- When stacking authored `TextView`s, use semantic block elements or an
  explicit token-spaced column. Two default inline TextViews placed as adjacent
  siblings can concatenate into unreadable copy such as “6 doses2 due now.”
- Author short eyebrow, category, and field-label strings in all caps when they
  use the secondary text color. Do not apply all caps to ordinary headings,
  body copy, values, actions, or long metadata. Give each such label an
  explicit semantic `TextStyle`; do not rely on `TextView`'s default appearance.
- Apply the same rule to detail facts, Panel content, header metadata, and
  trailing labels. Do not compose a value such as “Wilts May 12 · May 12” or
  repeat the page identity as body content without a distinct purpose.
- Review all user-facing strings for grammar, articles, pluralization, and
  punctuation in every state. Generated copy such as “a 8 AM summary” or
  “1 items” is a release-blocking quality defect, even when layout and behavior
  are otherwise correct.
- A route containing any `ListItem` uses one `VerticalList` as its only vertical
  owner. Never put it in `ScrollView` or authored same-axis overflow, and never
  create one `VerticalList` per section.
- A heterogeneous `ScrollView` route contains no `ListItem` or `VerticalList`.
  Use semantic non-list content or move the rows to a dedicated route.
- Never bracket static detail with generic “Next item” and “Previous item”
  Buttons to manufacture focus stops. If sequential peer browsing is a real
  product task, use the appropriate pager/carousel pattern and meaningful
  item identity; otherwise let Back return to the collection and split or
  condense detail that cannot be traversed naturally.
- Do not scatter “View room,” “View category,” or other unrelated peer
  navigation Buttons through a detail route to manufacture D-pad handoff
  points. Include only destinations with a genuine contextual relationship;
  condense or split static detail that cannot be traversed naturally.
- Do not append a generic “Next: <record>” Button to detail merely to create a
  later focus target. If sequential peer browsing is a genuine task, use a
  pager/carousel with appropriate item anatomy; otherwise Back returns to the
  collection.
- Make `ScrollView`, `VerticalList`, and `ButtonRail` frames edge-to-edge. Let
  list rows provide their owned content inset, inset authored ScrollView
  children rather than its viewport, and preserve component-owned fading and
  scrollbar geometry.
- Present `VerticalMenu` and `ContextMenu` temporarily from an interactive anchor through tooltip/portal infrastructure. Never render them inline.
- Back/Escape dismisses the topmost open menu, context menu, tooltip-like popup, or modal before route navigation.
- Keep every route transition in browser history and use the toolkit router adapter so back restores the prior route, focus, and scroll state.
- Preserve the identity of every focused action across controlled state
  changes. When an Add, Save, Start, Pause, Resume, Finish, or Remove action
  changes the available command set, update one stable Button where possible
  or explicitly move focus to the intended successor before removing the
  focused node. Conditional rail replacement must not reset initial focus or
  jump the content scroller.

## Component-selection order

1. Choose the semantic component for the job.
2. Compose semantic components using supported slots and variants.
3. Use `Container`, `StaticContainer`, or `Panel` only when no higher-level component fits.
4. Create or pass a custom material only for a deliberate product treatment; memoize one material instance per mounted host.
5. Do not rebuild an existing toolkit component from generic elements.

This selection order does not authorize compositions that imitate another toolkit
component. Foundation primitives and custom materials are for genuinely custom
semantic regions, never for recreating an unsupported variant of a component
that already exists.

Read [component-catalog.md](references/component-catalog.md) for the complete public component map and selection guidance.

## Reference routing

- Whole screens, responsive layout, scrolling, routing, focus restoration, and overlays: [screen-layout-navigation.md](references/screen-layout-navigation.md)
- Exact public API/source locations and shared prop contracts: [api-source-map.md](references/api-source-map.md)
- Buttons, rails, lists, settings, sliders, tiles, and value controls: [actions-lists-controls.md](references/actions-lists-controls.md)
- Text entry, built-in submission actions, and field-associated progress: [../uit-text-input-web/references/text-input-components.md](../uit-text-input-web/references/text-input-components.md)
- Text, icons, avatars, badges, surfaces, cards, carousels, and media: [content-surfaces-media.md](references/content-surfaces-media.md)
- Tooltips, menus, modals, toast, progress, shimmer, and status feedback: [overlays-feedback-status.md](references/overlays-feedback-status.md)
- Tokens, typography, spacing, materials, shapes, motion, and customization: [tokens-materials-motion.md](references/tokens-materials-motion.md)
- Production screen composition patterns: [application-patterns.md](references/application-patterns.md)
- Accessibility, performance, WebView/device testing, and final review: [quality-checklist.md](references/quality-checklist.md)

## Implementation workflow

When the task changes the UI Toolkit for Meta Ray-Ban Display library repository rather than a consuming
application, keep the root Apache License 2.0 file intact for software code.
Keep the mixed-license root package metadata at `"license": "SEE LICENSE IN
NOTICE"`, the icon package at `"license": "SEE LICENSE IN LICENSE"`, and other
package metadata at `"license": "Apache-2.0"`. The entire icon package is
licensed under the Meta Wearables Developer Terms; preserve
`packages/icons/LICENSE`, its package-level source headers, the root `NOTICE`
package boundary, and the terms link. The UI Toolkit for Meta Ray-Ban Display
directory is the repository root referenced by the Apache source-code license
header used outside the icon package. Every Meta-owned JavaScript, TypeScript,
and CSS source file outside `packages/icons` must start (after a required
shebang) with the approved Meta Apache header. Preserve the required
upstream headers, Meta modification notices, `NOTICE`, and `UPSTREAM.md` in
`packages/androidx-shapes`. Meta-authored package glue still uses the normal
Meta header. Do not
modify dependencies or generated build output. Run `yarn license:check` after
adding or generating library source. Do not apply the Meta header to an external
application's own source.

1. State the route's single primary task and choose `Page` or `SubNavigationPager`.
   Order the route so its primary content/action owns initial focus; put
   secondary navigation and settings after the primary collection unless the
   screen is intentionally a navigation menu.
2. Choose the single vertical owner from the screen-architecture skill.
3. Identify its main collection, media, information, and action regions.
4. Select components from the catalog; remove redundant containers.
5. Implement semantic markup, controlled state, labels, and real callbacks.
6. Apply only layout-level CSS with the toolkit spacing/token variables and no copied
   resolved-value fallbacks.
7. Run the screen-architecture source validator and fix every finding.
8. Verify default, focused, pressed, disabled, selected, loading, overflow,
   popup, and return-navigation states that apply.
9. Test keyboard/D-pad navigation in every direction, rapid repeat input, back
   dismissal, focus restoration, and boundary scrolling.
10. Validate the untouched generation on the target WebView. Wait for assets
    and animations to settle before judging frames.
11. Run formatting, lint, relevant tests, and the production build.

## Completion gate

Do not report an application complete until all of these have passed on the
unchanged generated source:

1. Run `validate-app-structure.mjs src` from the
   `uit-screen-architecture-web/scripts` skill directory and fix every
   finding. Do not merely mention the validator, substitute a source review,
   or inspect the validator's implementation.
2. Run the application's strict typecheck.
3. Run the production bundle build. Type checking is not a substitute: a
   declaration can name a runtime export that its JavaScript module does not
   provide.
4. Run the runtime audit on every route and required state in the target
   WebView, capture the complete screenshot matrix described by the validation
   playbook, and inspect every frame after animations settle.
5. Confirm only the authorized application files changed and the installed
   library, skills, validators, dependencies, and toolchain remain unchanged.

If any gate is unavailable, the application is unverified and cannot count as
a successful generation. State the unavailable gate plainly; never claim that
another gate proves it would pass.
