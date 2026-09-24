# Actions, lists, and controls

## Contents

- [Buttons and horizontal actions](#buttons-and-horizontal-actions)
- [ListItem](#listitem)
- [Visual-only controls](#visual-only-controls)
- [Adjustment controls](#adjustment-controls)
- [Tiles](#tiles)
- [Menus and reveal actions](#menus-and-reveal-actions)

## Buttons and horizontal actions

Use `Button` for an immediate command. Keep titles concise and sentence case. It supports text, subtitle, icon, avatar/badge/status, trailing tag, disabled appearance, tooltips, custom material, and focus/press transitions.

Button text describes a command; it is not record anatomy. Do not place a
paragraph, step description, or serialized record in `subtitle`. When users
need to browse peer records, use `ListItem` in a dedicated `VerticalList`
route. When variable command copy can grow, pass `enforceMaxWidth` and still
verify the Button's resting and focused rectangles remain within its available
inline space.

The command must have a real outcome matching its title. A Toast may confirm a
state change, navigation, dismissal, or external capability, but it cannot be
the only result. Do not evade this rule through a helper named `notify`,
`confirm`, `log`, or similar; activate every control and verify the underlying
state or destination actually changed.

An icon-only button requires `aria-label`. Never alter the internal icon size/margin to fix alignment; report/fix the component if its owned slot is wrong.

For an unavailable command, use `disabled` plus disabled-click tooltip feedback when an attempted action needs explanation:

```tsx
<Button
  title="Sending"
  icon={sendFilled}
  alwaysShowText
  disabled
  tooltipText="Action unavailable"
  tooltipMode={TooltipMode.DISABLED_CLICK}
/>
```

An optional disclosure is unavailable when its content is absent. Omit or
disable that action instead of rendering “Show … / No …” as a focus target.
Use one accurately labeled Show/Hide control; do not make the content heading
and a second Button toggle the same disclosure.

Every horizontal action row uses:

- `ButtonGroup` for a small set that fits and stays together;
- `ButtonRail` for flexible/overflowing actions, generally preferred.

`ButtonRail` must reach the left and right display edges. It supports:

- centered compact content by default;
- start alignment with `centerContentWhenSmallerThanWidth={false}`;
- an `anchorIndex` reference that the rail tries to center;
- `centerFocusedView` for a fixed central focus cursor, only with a strong design reason;
- focus/scroll callbacks and an imperative handle;
- `ButtonDivider` between logical sections.

For ordinary Page actions, place ButtonRail or ButtonGroup in a bottom action
dock outside VerticalList/ScrollView. Use a full-height grid/flex shell so the
single vertical owner consumes remaining space and ends above the dock. The
dock has no horizontal inset and uses `var(--uit-spacing-xsmall)` below its
buttons for rubber-band clearance. Never place page actions at the top of a
list or underneath the header.

Keep a focused rail command mounted when its controlled state changes. For a
Start/Pause/Resume sequence, prefer one Button whose title, icon, and handler
update in place. If the product must replace the node, explicitly transfer
focus to the successor without changing the content scroll offset.

Rails/groups execute commands. They do not select peer content pages or stand
in for tabs; that hierarchy belongs to SubNavigationPager.

For `anchorIndex`, include enough content on both sides to permit centering. Labels on anchored buttons should still expand on focus. `centerFocusedView` overrides anchoring; do not combine them.

Use `ButtonDivider` as a section divider—such as settings versus actions—not decoration and not between each peer. Do not add dividers to a button example merely to fill space.

Use filled semantic icons. Do not use gesture icons in rails or ordinary actions.
Use a filled ellipsis icon for a More/overflow trigger. Do not substitute an
upload, share, download, navigation, or gesture glyph. Likewise, Download and
Share actions need directionally correct, distinct icons.

## ListItem

`ListItem` is a complete interactive row. Put consecutive rows directly in `VerticalList`, without extra spacing or custom wrappers.

Capabilities include:

- title and one/two-line subtitle with separate accessible descriptions;
- semantic subtitle colors and a secondary-line icon;
- leading filled icon or avatar, including duo/badge/placeholder/status content;
- timestamp in accessory, accessory-top, or subtitle position with semantic color and accessibility text;
- one primary trailing treatment: switch, radio, timestamp, status, supported tag, or accessory icon;
- status dot plus described status icons;
- full-width slider mode with min/max/value/step/callback;
- inherited material, shape, disabled, focus, click, semantic element, and ARIA behavior.

Timestamp means a concise point in time. Price, quantity, unit, location,
category, availability, and status do not belong in that slot; use supporting
text, a supported status treatment, or the destination route.

Do not:

- add chevrons or arrows to communicate navigation;
- combine competing trailing modes;
- resize a component-owned status/accessory icon;
- place independent rows in arbitrary flex/grid flows;
- add a rounded container behind each row;
- add row gaps, separators, or margins not supplied by the component.

Use radio rows as a mutually exclusive group and update state only when the selected row reports checked. Use switch rows for independent binary settings.
Treat an inline subtitle timestamp as the row's one trailing treatment too; do
not add an accessory icon, switch, radio, status treatment, or trailing tag
beside it. A `secondaryIcon` must identify a distinct supporting fact, not act
as a second status/action glyph. For a passive boolean status, omit the icon in
the inactive state unless both states have distinct, necessary meaning.

Inspect realistic rows in the rendered viewport. If ordinary records
systematically ellipsize, shorten the subtitle to its essential fact and remove
redundant trailing decoration; increasing row height or accepting a wall of
ellipsis is not a finished information hierarchy.
Use one `onCheckedChange` state path for integrated radio/switch rows; do not
also mutate the same value from `onClick`. Each independently named switch owns
independent state and every exposed preference must affect the behavior or
presentation it describes.

Do not place a full filter form before a record collection. Three or more
persistent filter rows displace the primary records and make routine browsing
laborious. Use one concise popup trigger, a dedicated filter route, or peer
subnavigation when the filters represent stable top-level categories.
Do not repeat a filter title as its subtitle; omit supporting copy unless it
adds information that changes the choice.

## Visual-only controls

Public `Switch`, `RadioButton`, and ordinary `SliderBar` rendering are presentational building blocks. They show state but do not constitute a complete labeled interaction.

Preferred compositions:

```tsx
<VerticalList ariaLabel="Settings">
  <ListItem
    title="Activity alerts"
    showSwitch
    checked={alertsEnabled}
    onCheckedChange={setAlertsEnabled}
  />
  <ListItem
    title="Scenic route"
    showRadioButton
    checked={selectedRoute === 'scenic'}
    onCheckedChange={(checked) => {
      if (checked) setSelectedRoute('scenic');
    }}
  />
</VerticalList>
```

The parent owns the label, role, focus, and change behavior; the child glyph is decorative/presentational. Do not expose two nested focus stops.

## Adjustment controls

- `SliderBar`: bounded visual value/progress inside a higher-level control. Default/thin, vertical/horizontal, idle/focused presentation.
- `ListItem showSlider`: labeled full-row value adjustment.
- `IsolatedControl`: compact icon + slider as one focus target; supports controlled/uncontrolled state and D-pad increments.
- `Scrubber`: media-only seeking with duration semantics, timestamps, focused handle tooltip, and continuous/committed callbacks.

For `Scrubber`, `value` is 0–100. `onValueChange` receives each update; `onValueChanged` receives committed keyboard steps and the final pointer value. Use `showTooltip` when focused value feedback is needed. `timestampPosition` only moves persistent elapsed/total labels; the focused tooltip remains above the handle.

Do not suppress component-owned sizing or tooltip positioning with CSS. Initial focus and rapid left/right changes must update smoothly without flashing or stale measurement.

## Tiles

Use `ControlTile` for a compact setting, toggle, or progress adjustment. It is already an interactive material surface; never wrap it in another rounded panel/container.

Use `AppControlTile` for a prominent destination identified by an app icon or person. App icon and avatar treatments are mutually exclusive. Icon-only/avatar-only media centers automatically and still needs a descriptive accessible label. Optional title, status, avatar badge/presence, custom tile material, and icon-container material are supported.

For app-style icons, use a compatible circular material container with an appropriately inset, centered filled icon. Do not use a bare awkward glyph or independently position the icon.

## Menus and reveal actions

`SwipeToReveal` wraps a `ListItem` inside a `VerticalList`; a normal ListItem may coexist in the same list. Expose one to three contextual secondary actions. Keep the primary/essential action on the row itself.

`VerticalMenu` is not standalone page content. Open it from `Button` or `Container` using `tooltipContent`, `tooltipFocusable`, and `getVerticalMenuAnchorProps`. Back or navigation beyond the menu dismisses it.

`ContextMenu` follows the same temporary anchored-popup model. Item activation should close the menu and return focus to the trigger. Prevent the menu item click from bubbling into a trigger that toggles the menu.
