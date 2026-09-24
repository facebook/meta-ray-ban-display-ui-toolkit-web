# Production application patterns

## Contents

- [List-first route](#list-first-route)
- [Information route](#information-route)
- [Action route](#action-route)
- [Media destination](#media-destination)
- [Tabbed route](#tabbed-route)
- [Settings](#settings)
- [Transient commands](#transient-commands)
- [Loading and replacement](#loading-and-replacement)

## List-first route

Use `Page` plus an edge-to-edge `VerticalList`. Rows should be declared from application data in production; keep stable keys and avoid remounting focused rows.

```tsx
<Page headerText="Saved places" enableSystemBarInset={false}>
  <VerticalList insetForHeader ariaLabel="Saved places">
    {places.map(place => (
      <ListItem
        key={place.id}
        title={place.name}
        subtitle={place.distanceLabel}
        icon={bookmarkFilled}
        onClick={() => openPlace(place.id)}
      />
    ))}
  </VerticalList>
</Page>
```

Do not wrap rows in cards, add chevrons, or add row gaps. Restore the focused row and scroll offset when navigating back.

When a list route has multiple logical groups, keep one VerticalList and keep
its rows adjacent. Do not insert Header, ContainerHeader, or Panel between rows.
Express essential grouping through useful row content and ordering, or move a
genuinely distinct collection to a dedicated route. Never create a ScrollView
containing one VerticalList per group.

## Information route

Use one Panel/StaticContainer behind substantial free-floating copy. Keep component examples or distinct controls outside that background only when they are separate regions.

```tsx
<Page headerText="Trail conditions">
  <ScrollView insetForHeader ariaLabel="Trail conditions">
    <Panel width="100%" className="conditions-panel">
      <div className="conditions-content">
        <TextView as="h2" textStyle={TextStyle.BODY2_EMPHASIZED}>North overlook</TextView>
        <TextView as="p" textStyle={TextStyle.BODY2} textColor={TextColor.SECONDARY}>
          Exposed sections may be windy after sunset.
        </TextView>
      </div>
    </Panel>
  </ScrollView>
</Page>
```

```css
.conditions-content {
  display: flex;
  flex-direction: column;
  gap: var(--uit-spacing-medium);
  padding: var(--uit-spacing-large);
}
```

Do not add another rounded wrapper around `.conditions-content`.

## Action route

Place a full-width `ButtonRail` in a bottom action dock outside the route's
single scroller. The scroller fills the remaining height and stops above the
rail. Keep the dock edge-to-edge and use `var(--uit-spacing-xsmall)` below the
buttons for rubber-band clearance.

```tsx
<div className="action-page-shell">
  <ScrollView insetForHeader ariaLabel="Route details">
    {/* Content ends above the action dock. */}
  </ScrollView>
  <div className="action-dock">
    <ButtonRail>
      <Button title="Save" icon={bookmarkFilled} onClick={save} />
      <Button title="Share" icon={shareFilled} onClick={share} />
      <ButtonDivider />
      <Button title="Delete" icon={trashFilled} onClick={remove} />
    </ButtonRail>
  </div>
</div>
```

Use the divider only because Delete belongs to a distinct destructive section. Do not inset the rail viewport.

```css
.action-page-shell {
  block-size: 100%;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  min-inline-size: 0;
}

.action-dock {
  min-inline-size: 0;
  padding-block-end: var(--uit-spacing-xsmall);
}
```

Do not use the rail/group to switch peer content; use SubNavigationPager.

## Media destination

Use `Card` when media/custom content is one destination and the component should own focus highlighting and scrim layers:

```tsx
<Card width="100%" bottomScrim={ScrimType.MEDIUM} onClick={openRoute}>
  <img className="route-photo" src={photoUrl} alt="Rocky coast at sunrise" />
  <CardAboveScrim className="route-label">
    <TextView as="h2" textStyle={TextStyle.BODY2_EMPHASIZED}>Coastal sunrise</TextView>
    <TextView as="p" textStyle={TextStyle.META1} textColor={TextColor.SECONDARY}>
      Waterfront route · 3.8 miles
    </TextView>
  </CardAboveScrim>
</Card>
```

Use a Carousel for horizontal paging among multiple arbitrary destinations. Keep focused expansion visible and position the optional indicator near item content.

## Tabbed route

Use `SubNavigationPager` as the route root instead of `Page`:

```tsx
<SubNavigationPager
  items={tabs}
  currentPageIndex={activeIndex}
  onPageChange={(nextIndex) => setActiveIndex(nextIndex)}
  ariaLabel="Activity sections"
>
  <RecentActivity />
  <SavedPlaces />
  <Alerts />
</SubNavigationPager>
```

Keep the item count equal to child page count. Do not manually render `SubNavigation`, add a separate Header, or wrap child pages in Page.

## Settings

Use one route-level VerticalList. Put every labeled ListItem in that single
adjacent flow, and let each row own its presentational control:

```tsx
<VerticalList ariaLabel="Settings">
  <ListItem
    title="Activity alerts"
    subtitle={alertsEnabled ? 'On' : 'Off'}
    showSwitch
    checked={alertsEnabled}
    onCheckedChange={setAlertsEnabled}
  />
  <ListItem
    title="Media volume"
    showSlider
    sliderValue={volume}
    sliderIncrementPercentage={0.1}
    onSliderValueChange={setVolume}
  />
</VerticalList>
```

Do not place a standalone Switch/Slider next to a separately focusable label.

## Transient commands

Open a menu from its trigger and return focus on close:

```tsx
<Button
  ref={triggerRef}
  title="Route actions"
  alwaysShowText
  onClick={() => setMenuOpen(open => !open)}
  tooltipMode={menuOpen ? TooltipMode.FOCUSED : TooltipMode.NONE}
  tooltipFocusable
  tooltipContent={(
    <ContextMenu onDismiss={() => setMenuOpen(false)}>
      <ButtonContextMenuItemView title="Save route" icon={bookmarkFilled} onClick={saveAndClose} />
      <ButtonContextMenuItemView title="Archive" icon={archiveFilled} onClick={archiveAndClose} />
    </ContextMenu>
  )}
/>
```

Ensure `saveAndClose`/`archiveAndClose` stop propagation when necessary, close the popup, then restore trigger focus before paint.

## Loading and replacement

Preserve layout and focus ownership during async transitions:

- show `Shimmer` for known pending structures;
- use `IndeterminateLoader` for unknown operation completion;
- keep the focused parent mounted when status/icon/loading content swaps;
- memoize material/shape configuration;
- use declarative state changes so components run their built-in transitions;
- return focus to an equivalent valid target if loaded content necessarily replaces the old target.
