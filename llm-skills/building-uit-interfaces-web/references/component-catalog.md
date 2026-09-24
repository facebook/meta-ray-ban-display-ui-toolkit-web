# Public component catalog

## Contents

- [Application and navigation](#application-and-navigation)
- [Actions](#actions)
- [Lists and menus](#lists-and-menus)
- [Controls and tiles](#controls-and-tiles)
- [Text entry](#text-entry)
- [Content and identity](#content-and-identity)
- [Surfaces and media](#surfaces-and-media)
- [Feedback and overlays](#feedback-and-overlays)
- [Status and loading](#status-and-loading)
- [Foundation and advanced APIs](#foundation-and-advanced-apis)
- [Common component pairings](#common-component-pairings)

Check `packages/mrbd/package.json` for the current public subpath export list and `packages/mrbd/src/index.ts` for exported enums/types. Read the component's `.types.ts` before coding.

## Application and navigation

| Component | Use | Key capabilities | Do not |
|---|---|---|---|
| `App` | Required application root | Theme/font setup, focus provider, portal root, toast presenter | Build a partial custom shell or mount a second toast presenter |
| `Page` | Ordinary route surface | Header props, avatar/icon/loading header variants, content/system inset relationship | Add an app back button; combine with `SubNavigationPager` |
| `Header` | Page context through `Page` | Text, metadata, icon, avatar/duo/badge/status, loading transitions | Render directly in application content or use as a list/section heading |
| `ScrollView` | Generic single-axis scrolling for routes without ListItem | Vertical/horizontal orientation, fading edges, optional scrollbar, header inset, focused-child scrolling | Add artificial trailing fade space; contain VerticalList/ListItem or another same-axis scroller |
| `VerticalList` | Scrolling vertical rows | ScrollView behavior plus list content container and design-system row insets | Add page horizontal inset or row gaps; wrap in another vertical scroller by default |
| `Pager` / `PagerPage` | Directional peer pages | Horizontal/vertical paging, lifecycle, focus handoff, controlled/uncontrolled index, locking, optional unmount | Use for browser route history; nest same-axis pagers |
| `SubNavigationPager` | Top-level tabbed route instead of `Page` | Synchronized tabs/pages, focus handoff, auto-hide, locking | Wrap it or children in `Page`; manually pair separate `SubNavigation` and `Pager` |
| `SubNavigation` | Internal tab header of `SubNavigationPager` | Icon/label items, active/loading state, visibility | Use standalone in an application screen |
| `PaginationIndicator` | Visual page position | Dot or text mode | Use as a navigation control |
| `SwipeIndicator` | Visual continuation cue | Up/down direction, prompt, optional scrim, nudge | Make it focusable, clickable, or responsible for the action |
| `PageTransition` and React Router adapter | Route animation and focus/history coordination | Forward/back direction, focus and scroll restoration, route preloading | Replace history entries for ordinary forward navigation |

## Actions

| Component | Use | Key capabilities | Do not |
|---|---|---|---|
| `Button` | One immediate action | Text, subtitle, icon, avatar, badge/status, trailing tag, disabled feedback, custom material, action transition | Use for static status; place directly in an arbitrary horizontal flex row |
| `ButtonRail` | Bottom-docked full-width action lane, especially overflow | Focus-following scroll, fades, compact centering/start alignment, anchor, centered cursor, callbacks/handle | Put under the header/inside scroll content, inset left/right, use as subnavigation, or use gesture icons |
| `ButtonGroup` | Bottom-docked small non-scrolling set of related actions | Start/center/end alignment, focus-aware sizing | Put atop a list, use for many/overflowing actions, or substitute for SubNavigationPager |
| `ButtonDivider` | Section boundary within rail/group | Separates logical sections such as settings from actions | Put between every peer or use decoratively |
| `QuickReplyButton` | Short ready-to-send response/reaction in a rail | Text-only, icon-only, or text with focus-revealed icon | Use as general navigation or for long sentences |
| `ActionHint` | Non-interactive hint about continuation/gesture | Optional filled icon and short text | Make it a button or repeat obvious instructions |

## Lists and menus

| Component | Use | Key capabilities | Do not |
|---|---|---|---|
| `ListItem` | Complete row for navigation, setting, selection, adjustment, or status | Title/subtitle, semantic colors, timestamps, leading icon/avatar, secondary icon, one trailing treatment, switch/radio/slider modes, tags/status, custom material | Add margins/gaps, a nested rounded wrapper, navigation chevrons, or competing trailing modes |
| `SwipeToReveal` | One to three contextual actions behind a row | Required primary action plus two optional actions | Hide the row's only essential action; use outside a `VerticalList` row flow |
| `VerticalMenu` / `VerticalMenuButton` | Temporary compact action popup from an anchor | Four anchor corners, automatic first focus, back/navigation dismissal | Render inline, permanently, or as route navigation |
| `ContextMenu`, `ContextMenuItemView`, `ButtonContextMenuItemView`, `EmojiContextMenuItemView` | Temporary object-specific commands | Button/emoji items, scrolling, dismissal reasons | Render inline, open another overlay from an item, or leave focus outside while open |
| `Divider` | Supported structural separation where the pattern calls for it | Horizontal/vertical orientation | Insert between ordinary ListItems or rail peers without a logical section boundary |

## Controls and tiles

| Component | Use | Key capabilities | Do not |
|---|---|---|---|
| `Switch` | Visual binary state | Checked/unchecked, animation | Treat the public component as standalone interaction; use a parent such as `ListItem` |
| `RadioButton` | Visual selected state | Checked/unchecked | Treat standalone as interactive; omit mutually exclusive group semantics |
| `SliderBar` | Visual bounded value/progress | Min/max/value, default/thin, horizontal/vertical, focused visual state | Treat standalone as the primary control; use `ListItem` or `IsolatedControl` for adjustment |
| `Scrubber` | Media seek position | 0–100 value, duration labels, top/bottom timestamps, focused tooltip, continuous/committed callbacks | Substitute generic slider when time semantics matter |
| `IsolatedControl` | One compact focusable value control | Icon, controlled/uncontrolled value, D-pad step, optional click, imperative set | Use when a labeled setting row is required |
| `ControlTile` | Compact interactive setting/toggle/progress tile | Checked state, linear/circular progress, directional adjustment, custom icon material | Put inside another rounded surface or use for dense settings |
| `AppControlTile` | Prominent shortcut to an app, destination, or person | Icon/avatar identity, optional title/status, app-icon material, badges/presence, responsive size | Use generic imagery, omit an accessible label for icon-only, or wrap in another surface |
| `WebAppIcon` | Display-only manifest-themed web-app identity | Monochrome artwork treatment, generated or explicit palette, focus lighting, standard fallback | Use artwork that already includes its final background/color treatment or wrap it in another material surface |

## Text entry

| Component | Use | Key capabilities | Do not |
|---|---|---|---|
| `InputTextView` | Free-form text entry with host input handoff | Controlled/uncontrolled text, localized hint sizing, one-to-three-line growth, internal overflow scrolling, built-in action, field loading, textarea semantics | Rebuild from textarea/Container/Button, add a separate send Button, style internal anatomy, or nest in another material owner |

## Content and identity

| Component | Use | Key capabilities | Do not |
|---|---|---|---|
| `TextView` | Semantic text | Display/heading/body/label/meta/numeral appearances, semantic colors, semantic HTML element | Hardcode font family, size, weight, line-height, or additive-display color |
| `ReadMoreTextView` | Clamp supporting copy | Line clamp, text appearance/color, overflow label/callback | Treat the label as the expansion control; clamp mandatory instructions |
| `TextSwitcher` | Crossfade a changing short value | Duration, first-view behavior, animation opt-out, own static material | Wrap in another rounded container or use for paragraphs/rapid telemetry |
| `IconImage` | Standalone toolkit icon renderer | Inline vector, tinted URI mask, untinted full-color URI | Pass JSX to icon props or override host-owned slot sizing |
| `IconWithContainerMaterial` | Icon with a material backdrop | Toolkit icon plus material/shape host | Recreate with mismatched independently sized layers |
| `Avatar` | Person/entity identity | Semantic sizes, circle/rounded rectangle, portrait or custom content, duo, badge, status, placeholder, stroke | Substitute a generic UI glyph for a known person or fake badge cutouts |
| `AppBadge` | Compact supporting app identity | Centered icon and shape | Make interactive or add another circular backdrop |
| `NotificationBadge` | Unread marker/count attached to another object | Short numeric/string content | Use long text, exact large values, or standalone |
| `Tag` | Static category/attribute label | Concise text with owned material | Add click behavior or sentence-length text |
| `Chip` | Compact non-interactive status/metadata | Emphasized/deemphasized/elevated, icon/avatar/loading/metadata, animated leading-content transitions | Make clickable, use paragraph text, or animate without real state change |
| `ContainerHeader` | Identity/title inside a larger Container-owned region | Icon/avatar, title/subtitle, badge/status | Use as Page header, a VerticalList section label, or a standalone arbitrary heading |

## Surfaces and media

| Component | Use | Key capabilities | Do not |
|---|---|---|---|
| `Container` | Interactive material building block or standalone actionable region | Material host, focus/press/disabled/partial-focus states, clipping, scale/alpha, custom shape/material | Use only for static paint; put focusable children inside an interactive Container |
| `StaticContainer` | Non-interactive material renderer | Children, custom material, explicit static visual state, background modes, shape/clipping | Use for focus/press behavior or nest another rounded surface |
| `Panel` | One backdrop for a coherent informational region | Panel material, semantic corner token, clipping, responsive sizing | Repeat as rows/items/fields, use as a generic button, or nest rounded surfaces |
| `Surface` | Legacy/lower-emphasis secondary interactive content | Optional background, semantic radii, inner-shadow treatment | Choose for new primary surfaces; prefer `Container` or semantic components |
| `Card` | Featured content as one destination | Arbitrary children, top/bottom scrims, above/below-scrim layers, content-preserving focus highlight | Add fake gradient photography, a nested rounded image wrapper, or multiple actions |
| `CardStack` | One destination representing a media collection | Primary card, 2 interactive or 3 display background cards, square/portrait | Make background cards independent actions; put expanding stacks side-by-side where they clip |
| `Carousel` | Horizontal paging through arbitrary items | Centered items, dot/text indicator, under/overlay placement, vertical alignment, handle | Clip focused items, constrain height with excess indicator gap, assume only cards/images |
| `MediaWrapper` | Anchor content in a dark top/bottom slot that gradients into media | Child content routing, small/large gradient, top/bottom | Substitute a standalone Scrim; use when Card's built-in scrim already fits |
| `Scrim` | Directional gradient between media and foreground content | Left/right/top/bottom/full | Place text below it in z-order; add another rounded text background unnecessarily |
| `Vignette` | Indicate offscreen media while panning/zooming | Independent/animated edge fades | Use for text contrast or fully visible static media |

## Feedback and overlays

| Component | Use | Key capabilities | Do not |
|---|---|---|---|
| `Tooltip` / `TooltipContainer` | Short anchored context | Text/metadata/custom content, tail and anchor positions, focus modes | Repeat visible labels or put essential instructions only here |
| `Modal` | Blocking information or decision | Text, icon/avatar/logo/banner/list, action slot, supported content modes | Use for routine confirmations; nest panels/modals; add app back button |
| `Toast` | Brief non-blocking confirmation | Message, metadata, icon, cancel; queued FIFO presentation | Use for recoverable blocking errors, buttons, or long instructions |

## Status and loading

| Component | Use | Key capabilities | Do not |
|---|---|---|---|
| `ProgressIndicator` | Horizontal determinate progress | Range/value, normal/thin, active/inactive, animation, accessible announcement | Use for unknown duration or direct adjustment |
| `ProgressRing` | Compact circular determinate progress | Small/large, animation, accessibility | Put detailed content inside or use as input |
| `CircularProgressBar` | Partial-arc determinate progress in tile/custom square | Parent-sized or explicit square, stroke/arc configuration | Hardcode size when parent can size it; tune geometry casually |
| `IndeterminateLoader` | Unknown-duration operation | Four semantic sizes and declarative animation | Leave visible after completion or use when progress is known |
| `Shimmer` / `ShimmerItem` | Skeleton matching pending UI | Arbitrary placeholder composition, radius/dimensions, clipping, timing/repeat/static progress | Recreate every text line; use shapes unlike final layout; let shapes touch accidentally |
| `VolumeIndicator` | Visual volume feedback | Icon/custom/no icon, range/value, animation, accessibility | Use as the input control or for unrelated progress |
| `ZoomIndicator` | Visual zoom feedback | Icon/custom/no icon, range/value, animation, accessibility | Use as the input control or generic vertical progress |

## Foundation and advanced APIs

- `InteractableBase`: low-level polymorphic focus/press/activation/tooltip/partial-focus host. Prefer `Container` or a semantic component.
- Materials: `MaterialLibrary`, `ContainerMaterial`, layer factories, canvas helpers, `RoundedRectangleShapeProvider`, `CornerRadius`. Use supported factories first.
- Motion: durations, interpolators, springs, reduced-motion helpers, `useSpringAnimation`. Keep animation hot paths out of React state.
- Navigation: focus provider, back handler, route preload APIs, focus retention, transitions, React Router adapter.
- Portals: `FloatingPortalRootProvider` is already supplied by `App`; ordinary apps should not replace it.
- Smooth-corner helpers: use only for advanced component/shape implementation, not to repaint semantic components.

## Common component pairings

| Need | Pairing |
|---|---|
| Ordinary route with generic scroll content | `App` → router adapter → `Page` → `ScrollView` |
| Menu/settings/navigation route | `Page` → edge-to-edge `VerticalList` → `ListItem` |
| Tabbed peer route | `SubNavigationPager` → one child per `SubNavigationItem`; no `Page` |
| Page-level horizontal actions | bottom action dock (`--uit-spacing-xsmall` bottom clearance) → `ButtonRail`/`ButtonGroup` → Buttons |
| Compact modal actions | `Modal` → `ButtonGroup` → `Button` |
| Binary setting | `VerticalList` → `ListItem showSwitch`; standalone `Switch` only as visual state |
| Single choice | labeled group → `VerticalList` → `ListItem showRadioButton` |
| Labeled bounded adjustment | `VerticalList` → `ListItem showSlider` |
| Compact bounded adjustment | `IsolatedControl` with semantic icon/label |
| Free-form text entry | controlled or uncontrolled `InputTextView` with localized `hint` and textarea semantics in `inputProps` |
| Text entry with submission | `InputTextView` with `onSend` and localized `actionLabel`; use its built-in action rather than a separate Button |
| Text-entry work with known completion | stable `InputTextView` plus a labeled sibling `ProgressIndicator` |
| Media seek | `Scrubber` with duration, tooltip, and controlled callbacks |
| Contextual row commands | `VerticalList` → `SwipeToReveal` → `ListItem` |
| Anchored object commands | `Button`/`Container` tooltip content → `ContextMenu` or `VerticalMenu` |
| Featured media destination | `Card` → media below scrim + `CardAboveScrim` text |
| Media collection destination | `CardStack` with primary content and related background cards |
| Horizontal content browser | `Carousel` → focusable `Card`/`Container`/other destinations + optional indicator |
| Text over arbitrary media | media + `Scrim` + foreground content, or `MediaWrapper` for its anchored content-slot pattern |
| Pannable/zoomed media | media + sibling `Vignette`; viewport state drives each edge |
| Informational copy | `Panel` using its content-inset token → `TextView` hierarchy |
| Custom actionable widget | one `Container` around non-focusable authored content |
| Static custom material content | `StaticContainer` around non-interactive authored content |
| Person identity | `Avatar`; pair with `ListItem`, `Header`/`Page`, `Chip`, `Button`, or `AppControlTile` |
| App identity on person/avatar | Avatar badge slot → `AppBadge` or custom circular material/icon content |
| Brief completion feedback | `Toast.show`; presenter already supplied by `App` |
| Known progress | semantic determinate progress component; pair with parent label/status text |
| Unknown progress | `IndeterminateLoader` inside stable host; preserve focus |
| Known pending layout | `Shimmer` → major `ShimmerItem` container shapes |
