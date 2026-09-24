# Public API and source map

## Contents

- [Source-of-truth workflow](#source-of-truth-workflow)
- [Shared contracts](#shared-contracts)
- [Component type locations](#component-type-locations)
- [Advanced API locations](#advanced-api-locations)

## Source-of-truth workflow

For any component:

1. Confirm it is exported in `packages/mrbd/package.json` and `packages/mrbd/src/index.ts`.
2. Read its public `.types.ts` completely.
3. Read its component implementation for defaults, mutual exclusions, role/ARIA behavior, and controlled/uncontrolled semantics.
4. Read focused tests under `packages/mrbd/src/__tests__/` for edge behavior.
5. Read production documentation and the corresponding public composition.

Do not infer callback names, value ranges, defaults, mutual exclusions, or handle methods.

Import runtime constants and enums such as text appearances, colors, styles,
modes, positions, and corners from the package root. A component subpath is
safe for its named component and type-only contracts, but its declaration file
can expose type-module constants that the corresponding JavaScript subpath does
not re-export. Type checking alone will not reveal that mismatch; the
production bundle will. Prefer one root import for the toolkit components and
runtime values, plus the documented `/react-router` and explicit icon SVG
subpaths. `App` loads toolkit styles automatically; do not add a toolkit-wide
stylesheet import.

## Shared contracts

- `UITCommonProps`: basic class/style/DOM surface.
- `InteractableBaseProps`: polymorphic `as`, disabled/interactive/focusable/pressable/clickable, activation, long press, state callbacks, tooltip props, partial-focus axes, invalid-direction/handoff callbacks.
- `ContainerProps`: InteractableBase plus material, shape, clipping, width/height, visual-state mapping, scale/alpha, state animations.
- `StaticContainerProps`: DOM attributes plus material, static visual state, shape, background style, clipping, layout transition.
- `IconSource`: inline vector or URI-based tinted/untinted asset.
- Polymorphic components such as Container/ListItem retain the selected element/component's props and ref type.
- Imperative handles are for behavior without a declarative equivalent; prefer props/state otherwise.

## Component type locations

All paths are relative to `packages/mrbd/src/`.

### Foundation application/navigation/components

| API | Type/source location |
|---|---|
| `App` | `foundation/app/App.tsx` |
| `Container` | `foundation/components/Container.types.ts` |
| `StaticContainer` | `foundation/components/StaticContainer.types.ts` |
| `Panel` | `foundation/components/Panel.types.ts` |
| `Surface` | `foundation/components/Surface.types.ts` |
| `ScrollView` | `foundation/components/ScrollView.types.ts` |
| `VerticalList` | `foundation/components/VerticalList.types.ts` |
| `Pager`, `PagerPage` | `foundation/components/Pager.types.ts` |
| `Carousel` | `foundation/components/Carousel.types.ts` |
| `Card` | `foundation/components/Card.types.ts` |
| `CardStack` | `foundation/components/CardStack.types.ts` |
| `TextView` | `foundation/components/TextView.types.ts` |
| `TextSwitcher` | `foundation/components/TextSwitcher.types.ts` |
| `Shimmer`, `ShimmerItem` | `foundation/components/Shimmer.types.ts` |
| `MediaWrapper` | `foundation/components/MediaWrapper.types.ts` |
| `Vignette` | `foundation/components/Vignette.types.ts` |
| `IconImage` | `foundation/components/IconImage.tsx` |
| `IconWithContainerMaterial` | `foundation/components/IconWithContainerMaterial.tsx` |

### Actions, lists, and controls

| API | Type/source location |
|---|---|
| `Button` | `mrbd/ui/Button.types.ts` |
| `ButtonGroup` | `mrbd/ui/ButtonGroup.types.ts` |
| `ButtonRail` | `mrbd/ui/ButtonRail.types.ts` |
| `ButtonDivider` | `mrbd/ui/ButtonDivider.types.ts` |
| `QuickReplyButton` | `mrbd/ui/QuickReplyButton.types.ts` |
| `ActionHint` | `mrbd/ui/ActionHint.types.ts` |
| `ListItem` | `mrbd/ui/ListItem.types.ts` |
| `SwipeToReveal` | `mrbd/ui/SwipeToReveal.types.ts` |
| `Divider` | `mrbd/ui/Divider.types.ts` |
| `Switch` | `mrbd/ui/Switch.types.ts` |
| `RadioButton` | `mrbd/ui/RadioButton.types.ts` |
| `SliderBar` | `mrbd/ui/SliderBar.types.ts` |
| `Scrubber` | `mrbd/ui/Scrubber.types.ts` |
| `IsolatedControl` | `mrbd/ui/IsolatedControl.types.ts` |
| `ControlTile` | `mrbd/ui/ControlTile.types.ts` |
| `AppControlTile` | `mrbd/ui/AppControlTile.types.ts` |
| `WebAppIcon` | `mrbd/ui/WebAppIcon.types.ts` |
| `InputTextView`, `InputTextViewSize` | `mrbd/ui/InputTextView.types.ts` |

### Content and identity

| API | Type/source location |
|---|---|
| `Avatar` | `mrbd/ui/Avatar.types.ts` |
| `AppBadge` | `mrbd/ui/AppBadge.types.ts` |
| `NotificationBadge` | `mrbd/ui/NotificationBadge.types.ts` |
| `Chip` | `mrbd/ui/Chip.types.ts` |
| `Tag` | `mrbd/ui/Tag.types.ts` |
| `ContainerHeader` | `mrbd/ui/ContainerHeader.types.ts` |
| `ReadMoreTextView` | `mrbd/ui/ReadMoreTextView.tsx` |

### Page, overlays, and feedback

| API | Type/source location |
|---|---|
| `Page` | `mrbd/ui/Page.types.ts` |
| `Header` | `mrbd/ui/Header.types.ts` |
| `SubNavigation` | `mrbd/ui/SubNavigation.types.ts` |
| `SubNavigationPager` | `mrbd/ui/SubNavigationPager.types.ts` |
| `PaginationIndicator` | `mrbd/ui/PaginationIndicator.types.ts` |
| `SwipeIndicator` | `mrbd/ui/SwipeIndicator.types.ts` |
| `Tooltip` | `mrbd/ui/Tooltip.types.ts` |
| `TooltipContainer` | `mrbd/ui/TooltipContainer.types.ts` |
| `VerticalMenu` | `mrbd/ui/VerticalMenu.types.ts` |
| `VerticalMenuButton` | `mrbd/ui/VerticalMenuButton.types.ts` |
| `ContextMenu` | `mrbd/ui/ContextMenu.types.ts` |
| Context-menu item views | `mrbd/ui/ContextMenuItemView.types.ts` |
| `Modal` | `mrbd/ui/Modal.types.ts` |
| `Toast` | `mrbd/ui/Toast.types.ts` |
| `Scrim` | `mrbd/ui/Scrim.types.ts` |

### Status and loading

| API | Type/source location |
|---|---|
| `ProgressIndicator` | `mrbd/ui/ProgressIndicator.types.ts` |
| `ProgressRing` | `mrbd/ui/ProgressRing.types.ts` |
| `CircularProgressBar` | `mrbd/ui/CircularProgressBar.types.ts` |
| `IndeterminateLoader` | `mrbd/ui/IndeterminateLoader.types.ts` |
| `VolumeIndicator` | `mrbd/ui/VolumeIndicator.types.ts` |
| `ZoomIndicator` | `mrbd/ui/ZoomIndicator.types.ts` |

## Advanced API locations

- Interactions/visual states: `foundation/base/Interactions.types.ts`.
- Focus/partial focus: `foundation/base/InteractableBase.types.ts`, `FocusCoordinator.types.ts`.
- Materials/layers: `foundation/material/ContainerMaterial.types.ts`, `foundation/material/layers/`.
- Material factories: `foundation/material/MaterialLibrary.ts`.
- Shape providers: `foundation/material/ShapeProvider.ts`.
- Motion: `foundation/motion/Animations.types.ts`, `foundation/motion/useSpringAnimation.ts`.
- Page transitions/back/focus retention/preloading: `foundation/navigation/`.
- React Router adapter: `packages/mrbd/src/react-router/`.
- Theme tokens/appearances: `foundation/theme/` and exported `styles.css`.
