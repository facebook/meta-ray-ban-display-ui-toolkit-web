# Production contextual inbox application

Use this pattern for one compact collection whose rows open temporary commands
for that same record. Do not introduce a detail route, inline menu, permanent
action panel, row chevron, or second vertical scroll owner.

This is a source-construction task only. Never start or probe a development,
preview, browser-automation, or HTTP server; never inspect ports or search for a
browser binary. The focused verifier is the only execution step and successful
verification ends the task immediately.

## Fixed architecture

Use one `Page` with one root `VerticalList`. Render three to six adjacent
`ListItem` rows. State lives above the list and records remain mounted when a
command changes their status. Use only `Page`, `VerticalList`, `ListItem`,
`VerticalMenu`, `VerticalMenuButton`, `TooltipMode`, `VerticalMenuCorner`,
`getVerticalMenuAnchorProps`, `Toast`, and one optional semantically correct
filled accessory icon.

Import `App` and styles once. No router is needed. Do not add ScrollView,
Panel, Container, Button, ButtonRail, dividers, authored list gaps, section
headers, filters, or footer content.

Use only `headerText` on Page. Do not put counts or status in
`headerMetadata`; the current rows are the source of truth.

## Row content

Each ListItem has one concise identity title and one complementary subtitle.
The title is exactly one record field, not a template that joins an internal ID
with a site/person/name. Keep authored mock identities to at most two words and
9 characters; shorten mock names rather than accepting truncation at a narrow
responsive width. Do not model mock fields that the interface never renders or
uses.
Use timestamp only for a real concise point in time. Do not join multiple facts
into title/subtitle/timestamp, add a navigation arrow, restyle internals, or
place an interactive child in the row. Let VerticalList own row spacing and
left/right inset.

Keep subtitle to two compact groups at most and 18 characters total. When it
contains two fields, separate them visibly with ` · `, such as `HVAC · Open`;
never concatenate facts with an unstructured space. Do not combine service,
severity, assignment, and state. Severity may use the one leading filled icon.
Keep timestamp separate.

The row itself is the menu trigger. Set `ariaLabel="Open actions"` on every
ListItem. ListItem appends its visible title and subtitle to this prefix when it
builds the accessible name, so do not repeat the record name in `ariaLabel` or
use a template such as `Open actions for ${record.name}`. Keep one
`openRecordId` state.
For each row:

- `onClick` sets that row as open;
- `tooltipMode` is `TooltipMode.ALWAYS` only for the open row and
  `TooltipMode.NONE` otherwise;
- `tooltipContent` is that row's `VerticalMenu`;
- spread `getVerticalMenuAnchorProps(VerticalMenuCorner.ABOVE_RIGHT)` onto the
  same ListItem.
- store each ListItem's public element ref by record id so dismissal can restore
  focus explicitly.

Never render VerticalMenu as a sibling of ListItem or inside an authored dock.
It must travel through the trigger's tooltip portal. Opening it must not change
VerticalList size, row position, scroll extent, or page geometry.

## Menu behavior

VerticalMenu contains two or three short `VerticalMenuButton` commands. Each
visible command label is at most 10 characters so an icon-bearing row remains
on one line; use `Accept`, not `Acknowledge`. Use filled toolkit icons only when
semantically exact; never use emoji or Unicode text glyphs as icons. On item
activation:

1. stop propagation so the row does not reopen;
2. update the selected record state;
3. clear `openRecordId`;
4. show concise Toast feedback for the completed result.

`onDismissRequest` clears `openRecordId`. Tooltip infrastructure keeps the
trigger mounted, and VerticalMenu owns the transient browser-history entry so
system Back reaches this callback before page navigation. The application must
still restore focus explicitly; do not add its own history entry or Back
listener:

```tsx
const rowRefs = useRef(new Map<string, HTMLDivElement>());
```

Assign the row ref into that map. Put the state clear and `.focus()` call
directly inside `onDismissRequest` and each command handler rather than hiding
them behind another abstraction; this keeps the dismissal contract explicit at
every exit. Each menu button uses its actual public prop:

```tsx
<VerticalMenuButton
  text="Assign"
  icon={assignFilled}
  onClick={event => {
    event.stopPropagation();
    updateIncident(incident.id, 'Assigned');
    setOpenRecordId(null);
    requestAnimationFrame(() => {
      rowRefs.current.get(incident.id)?.focus({preventScroll: true});
    });
    Toast.show('Incident assigned');
  }}
/>
```

Use the same explicit state clear and focus call in `onDismissRequest`.

Do not pass `title` to VerticalMenuButton; its required label prop is `text`.
Do not remove/archive the focused record from the rendered collection during
dismissal; update its visible status so focus has a stable host. Back/Escape
closes the menu before page navigation.

A retained row must never reopen a menu whose commands are all disabled or
already complete. Preserve at least one meaningful enabled command in every
reachable record state. Prefer a truthful reversible command such as `Seat
party` becoming `Return party`, or replace the completed command with the next
valid operation. Do not apply the same terminal-state `disabled` expression to
every VerticalMenuButton.

## CSS

Only root document containment is normally required:

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
```

Do not style ListItem, VerticalList, menu, button, icon, tooltip, generated
classes, roles, data/ARIA attributes, or their descendants. Do not add a top
margin/padding/spacer beyond `VerticalList insetForHeader`.

## Verification

Run only `../scripts/verify-app.mjs src` from the application workspace. It
checks exactly one VerticalList, the anchored-menu contract, focus restoration,
typecheck, toolkit structure, and the production build. Zero findings are required.
After it succeeds, return immediately without starting a server.
