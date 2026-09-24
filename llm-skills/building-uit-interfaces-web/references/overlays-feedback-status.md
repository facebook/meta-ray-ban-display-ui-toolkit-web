# Overlays, feedback, and status

## Contents

- [Tooltips](#tooltips)
- [Menus](#menus)
- [Modals](#modals)
- [Toast](#toast)
- [Determinate status](#determinate-status)
- [Indeterminate loading and shimmer](#indeterminate-loading-and-shimmer)

## Tooltips

Use tooltip props inherited by interactive components (`tooltipText`, `tooltipMetadata`, `tooltipContent`, `tooltipMode`, `tooltipPosition`) instead of manually positioning a popup.

Use focused tooltips primarily for icon-only or unfamiliar controls. Do not repeat a fully visible button title or put essential instructions only in a tooltip.

The tooltip is anchored to its target and must track target movement/scroll. Preferred placement may change to fit the viewport. Use focusable tooltip content only for composite popups such as menus, and ensure back/navigation dismissal.

## Menus

`VerticalMenu` and `ContextMenu` are temporary anchored content. Never place them inline in normal page layout.

Open from a `Button` or `Container`, keep open state controlled, and dismiss when:

- an item activates;
- Back/Escape is pressed;
- focus/navigation exits the menu according to the component contract.

Restore focus to the trigger after dismissal. Stop item click propagation when otherwise it would reach the trigger and reopen/toggle the menu.

Use `VerticalMenuButton`, `ButtonContextMenuItemView`, or `EmojiContextMenuItemView` rather than custom rows unless a documented custom menuitem contract is required. Keep commands short and object-specific. Do not use popup menus as permanent route navigation or open a second overlay from a menu item.

## Modals

`Modal` owns one Panel-based content surface and supports title/subtitle,
icon/avatar/logo/banner, list content, and an action slot. It is not a dialog
presenter: it does not portal, add a scrim, trap focus, own open state, or
intercept Back. Rendering it conditionally only inserts/removes that surface at
its authored layout position.

Put horizontal actions in `ButtonGroup` or `ButtonRail`. Do not nest another
Modal or Panel, rearrange its anatomy, or add an app back button. Use Modal as
route/carousel content or through separate host presentation infrastructure.
For an application-owned blocking decision, prefer a dedicated route and
system Back; do not append Modal beside Page content and expect a popup.

Use Toast for routine completion feedback rather than creating a confirmation
route or host-presented Modal.

## Toast

Call `Toast.show`; `App` already mounts the presenter. Do not render a second `ToastContainer` in ordinary applications.

Toasts confirm a completed non-blocking action with brief message, optional metadata, and icon. Subsequent presentations queue and appear one at a time in request order. Cancel by identifier when the feedback becomes obsolete.

Do not put actions or long instructions in Toast. Use an actionable route, or a
Modal hosted by actual presentation infrastructure, for errors requiring
recovery.

## Determinate status

Use a determinate component only when the value has a meaningful bound:

- `ProgressIndicator`: horizontal track; normal/thin;
- `ProgressRing`: compact full circle;
- `CircularProgressBar`: partial arc for a tile/custom square;
- `SliderBar`: visual bounded value within a higher-level control;
- `VolumeIndicator`: application-controlled volume feedback;
- `ZoomIndicator`: application-controlled zoom feedback.

These are visual status components, not generic interaction targets. Supply accurate ARIA labels/value semantics and keep state controlled by application data. Use parent sizing for responsive circular progress rather than hardcoding current-device pixels.

## Indeterminate loading and shimmer

Use `IndeterminateLoader` when completion cannot be estimated. Choose the semantic size that fits its host and remove it as soon as the operation settles. Loading should not steal focus unless the flow itself moves focus.

Use `Shimmer` when the future content structure is known before data arrives. Compose a small number of `ShimmerItem` shapes that represent the major container regions of the final UI. For a list row, use a separated avatar-like shape and a main content-container shape. Prioritize container-type shapes over reproducing each line of text.

Do not shimmer for negligible waits, use shapes unrelated to the final layout, or remount the entire focused region when loading resolves. Prefer a stable host and a controlled transition from loading to content.
