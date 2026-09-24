# List and menu component guide

## ListItem information model

ListItem is one row-sized interaction target. Its content hierarchy is:

1. optional leading icon or Avatar identity;
2. title and optional subtitle;
3. optional subtitle-line secondary icon or inline timestamp;
4. one main trailing treatment;
5. optional material/focus/disabled behavior inherited from Container.

Every ListItem represents a purposeful row-level action or controlled value.
Do not use focusable ListItems as static summary cards, legends, section
headings, or decorative terminal rows. Put a concise collection count in Page
metadata, use an appropriate static surface outside the list when static detail
is genuinely needed, or make the row navigate to useful detail. A collection
of records that has no possible action should not expose a focus stop on every
record.

For an empty collection, do not make “No items yet” or equivalent status copy
the title of a focusable ListItem whose handler performs a different action.
Render a truthful empty-state message and, when a recovery action is useful,
label its semantic control with that command (for example, “Browse trails”).

Lead with the collection's primary records. Do not make users move through a
summary row and several persistent filter rows before reaching the first
record. When filtering is essential, expose a concise trigger for a temporary
menu or move substantial filter choices to a dedicated route. A single
frequently changed binary preference may remain an integrated switch row when
it does not crowd the collection.
Do not give a filter row a subtitle that simply repeats its title. The checked
radio state already communicates selection; supporting text must add a useful
distinction or be omitted.

Do not manufacture interactivity with a Toast-only callback. Toast confirms a
completed operation; it is not a destination, detail view, or substitute for a
real state change.

### Text

- `title`, `titleContentDescription`.
- `subtitle`, `subtitleContentDescription`, `subtitleMaxLines`.
- `subtitleTextColor`: primary, secondary, positive, warning, negative, info.
- `timestamp`, its content description, semantic color, and position: accessory centered, accessory top, or adjacent to subtitle.

Use content-description overrides when abbreviated visible copy would be ambiguous when spoken. An inline subtitle timestamp belongs against the subtitle rather than floating as a separate third line.
Each visible fact appears once. Before composing a subtitle from data fields,
remove semantically equivalent status/time labels; for example, choose either
“Due today” or “Today,” not both. A trailing timestamp or status treatment must
not repeat the same fact already shown in subtitle text.

The `timestamp` slot is semantically and geometrically reserved for a short
time/date. Do not pass location, room, category, status, occupancy, or other
general metadata to it. A long non-time trailing value crowds and truncates the
row's primary text; keep that information in a concise subtitle or a dedicated
detail route. Use the shortest date/time that remains unambiguous in the page
context: a current-day collection usually needs only the time, and a current-
year journal usually needs month and day rather than the year. Do not repeat
“Today,” a year, or another qualifier already established by the page.
The slot represents when something occurs or occurred, not how long it should
take. Put “90 min” or another duration in supporting detail; a relative point
in time such as “6m ago” remains appropriate.

Apply semantic status color to copy that actually names or communicates that
status. Do not turn a category, location, owner, or other unrelated subtitle
yellow/red because a separate availability or health field needs attention.
Expose the status through the supported status treatment, a concise status
subtitle, or the detail route instead of using color as an unlabeled code.
Do not replace a stable complementary subtitle such as instructor, location,
or owner with transient “Reserved,” “Full,” or “Closed” copy. Preserve the
row's identity/context and use the supported status/trailing treatment.

Treat the visible subtitle as a summary, not a serialized record. Select the
one or two facts needed to identify or act on the row, then move the remaining
detail to its destination route. Do not join every available field with dot
separators and rely on the component's ellipsis: repeated truncation across a
list makes the collection unreadable and usually signals a broken information
hierarchy. Verify the actual rendered width with the timestamp/accessory
present and with longer realistic values.

As a production default, a subtitle contains at most two compact fact groups
(one separator). The page already supplies collection context; the title and
timestamp supply identity/time. A row such as “Grade · Teacher · Gate ·
Guardian” or “Recipient · Location · Carrier status” is a database record, not
a usable summary.

Make the title one identity noun phrase. Do not combine event plus location,
carrier plus package type, task plus room, or similar peer facts with an em
dash/dot. Put the primary object or action in the title and one complementary
fact group in the subtitle. The detail route owns the full record.

Do not bind a generic prose field such as `description` directly to `title`.
Model a separate concise identity label and move size, variant, quantity, and
other qualifiers to the subtitle or detail route. Verify realistic records do
not systematically ellipsize beside timestamps and accessories.

Protect the title identity in the same way. If brand/model plus item type does
not fit beside the timestamp/accessory, keep the essential object/person name
as the title and move secondary brand, model, or classification into the
subtitle. Occasional truncation for exceptional data is supported; systematic
ellipsis across the visible collection is not a finished layout.

### Leading identity

Use `icon` plus semantic tint, or Avatar properties: primary/secondary/badge image or content, alt, shape, placeholder, status, status glyph. Icon and Avatar are alternative identity modes.
If a secondary subtitle icon is also present, it communicates a different
supporting fact. Never repeat the same asset in both the leading and secondary
slots; the duplicate reads as accidental decoration and consumes scarce text
width.

### Trailing treatments

Choose one primary mode:

- `showSwitch` + `checked` + `onCheckedChange`;
- `showRadioButton` + controlled checked state;
- timestamp;
- described `statusIndicator` plus optional status icons;
- `accessoryIcon`, always visible or focus-revealed;
- supported `trailingTag`.

For mutually exclusive filters or choices, use the integrated radio treatment
on each owning ListItem (`showRadioButton`, controlled `checked`, and one
state-change path). Do not add `aria-selected` to otherwise ordinary rows: it
creates hidden selection semantics without the required visible state.

Status icons may have individual accessible descriptions/tints. Do not use accessory chevrons for navigation. Avoid combining multiple modes even if TypeScript permits individual props.
An inline `timestampPosition="subtitle"` still consumes the row's timestamp
treatment and horizontal text budget. Do not pair it with `accessoryIcon`, a
switch/radio, a status treatment, or a trailing tag. Use `secondaryIcon` only
for a different supporting fact; do not show a false/inactive action glyph by
default merely so both boolean states have artwork.

Rendered fit is authoritative. Test representative long and short records with
the actual leading identity and trailing treatment. When normal data repeatedly
truncates, remove redundant decoration and reduce the subtitle to the one fact
needed for collection scanning; do not increase row height or depend on the
detail route to reveal every row's basic identity.

Use the shortest timestamp representation that remains unambiguous in the page
context. A collection spanning dates normally uses month/day without time; a
same-day collection normally uses time without the repeated date. Showing both
date and time is not useful when it causes ordinary row identities to truncate.
For generated mock content, prefer a compact two-word identity over a full
brand/model/type string; place model and variant detail on the destination
route.

### Slider mode

`showSlider` replaces ordinary text layout with a full-width adjustable value. Supply accessible row label, minimum, maximum, value, increment percentage, and change callback. Do not also crowd the row with title/subtitle/trailing controls.

## VerticalList

VerticalList forwards ScrollView capabilities except orientation and adds row-container class/style. Important inputs include height/width, header inset, fading-edge lengths, optional scrollbar, region label, and scroll callback.

The component supplies the focus-boundary root and row insets. For application
routes it is the single vertical owner for the complete route. Keep rows
adjacent; do not place Header, ContainerHeader, Panel, or another simulated
section/item backdrop between them. Do not add a second boundary wrapper,
horizontal page padding, row gap, permanent fade spacer, another VerticalList,
another vertical ScrollView, or an authored `overflow: auto|scroll` ancestor.

Do not append explanatory copy, counts, provenance, or an informational footer
after the final row. That content creates unreachable trailing scroll range and
breaks the adjacent row flow. Put essential collection context in concise Page
metadata; render a noninteractive empty-state body only when there are no rows.
Likewise, do not prepend an authored TextView/category/count header before the
first row. Page or SubNavigationPager owns the route identity; VerticalList
owns one uninterrupted row collection.

## SwipeToReveal

`actions` accepts one required plus up to two optional `SwipeToRevealAction`s. Each action needs icon, content description, and callback. The wrapped child remains the primary focus target. Secondary actions must be contextual and nonessential.

Test closed/open/action-focused states, left/right navigation, both screen edges, action execution, return to the row/list flow, and mixed revealable/non-revealable rows.

## VerticalMenu

Children are `VerticalMenuButton` elements. `onDismissRequest` reports Escape or navigation exit. `autoFocusFirstItem` controls initial menu focus. `getVerticalMenuAnchorProps(corner)` configures a Button/Container tooltip anchor for above/below and left/right alignment.

The menu is the trigger's `tooltipContent`, and controlled open state selects
the trigger's visible `tooltipMode`. Apply the anchor props to that trigger.
Never place `VerticalMenu` beside the trigger in normal flow: that bypasses the
portal, reflows the page, and makes the corner configuration meaningless.

Menu is a temporary popup and owns menu semantics. Keep labels short, optionally use leading icons, and let it choose focus order. Supplying `onDismissRequest` arms the component's transient Back entry; the callback must clear controlled open state and restore trigger focus. System Back then dismisses the menu before route navigation. Do not add application-authored history entries or Back listeners around it.

## ContextMenu

ContextMenu supports a temporary command collection with Button/Emoji item views, scrolling, and dismissal reasons. Its handle can support programmatic behavior defined by the current type API. Use the trigger's tooltip infrastructure with focusable content and a meaningful popup description.

Supplying `onDismiss` arms the component's transient Back entry. Handle `BACK_BUTTON` by clearing controlled open state and restoring the trigger. Do not add application-authored history entries or Back listeners around the menu.

On item activation:

1. stop propagation if needed;
2. perform/update application state;
3. close the menu;
4. restore trigger focus before paint;
5. navigate only after dismissal if the command changes routes.

## Divider

Divider is structural only where a design pattern calls for horizontal/vertical separation. Ordinary adjacent ListItems do not use it. Button action sections use ButtonDivider instead.

## Review matrix

- Every supported text/identity/trailing mode used by the route.
- Accessibility reading order and concise spoken descriptions.
- No gap, inset, clipping, or size overrides.
- Top/middle/bottom focus and true boundary alignment.
- Rapid D-pad navigation and dynamic row updates.
- Menu anchor placement, initial focus, dismissal reason, Back precedence, and trigger focus return.
