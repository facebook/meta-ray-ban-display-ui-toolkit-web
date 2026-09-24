---
name: uit-overlays-feedback-web
description: Build, debug, or review UI Toolkit for Meta Ray-Ban Display Tooltip, TooltipContainer, VerticalMenu, ContextMenu, Modal, Toast, Scrim, and portal behavior. Use for anchored positioning, focusable tooltip content, popup dismissal, menu item activation, focus restoration, modal decisions, queued toast, text-over-media protection, overlay z-order, Back/Escape precedence, or flicker/reopen bugs.
---

# UI Toolkit for Meta Ray-Ban Display overlays and feedback

Read [../building-uit-interfaces-web/references/overlays-feedback-status.md](../building-uit-interfaces-web/references/overlays-feedback-status.md).

Read [references/overlay-components.md](references/overlay-components.md) for
component selection, ownership, event flow, and dismissal patterns.

## Portal and anchor ownership

`App` supplies the floating portal root. Use component tooltip/menu APIs; do not portal directly to `document.body` or manually compute fixed coordinates.

Tooltips provide short context for an anchored target. Use them for icon-only/unfamiliar controls, not to repeat visible labels or hold essential instructions. They must track moving/scrolled anchors and choose a fitting placement.

VerticalMenu and ContextMenu are temporary focusable tooltip content—not inline layout. Use controlled state and menu item components.

VerticalMenu has a compact fixed-width action row. Keep labels to short
commands that remain within two lines and normally expose no more than three
priority actions. If four or more commands or explanatory labels are required,
use a dedicated route or choose a smaller priority subset; do not create a menu
that fills the display or places its last item in the fading/bottom edge.

Choose the anchor corner by the trigger's screen edge, not by label semantics.
A last/right-edge trigger in the standard bottom-docked ButtonRail uses
`ABOVE_RIGHT`: the menu grows toward the screen interior and upward into the
available content area. Use `BELOW_RIGHT` only when the trigger is genuinely
near the top and there is verified room below it. A left-edge trigger uses the
corresponding `*_LEFT` corner. Verify the material and glow retain space from
both display edges after focus expansion.

## Dismissal order

Back/Escape dismisses the topmost transient UI before route history. Item activation closes its menu and restores focus to the trigger. Stop propagation where a portal item click would bubble to and reopen the trigger.

For VerticalMenu item activation, accept the click event and call
`event.stopPropagation()` before changing the controlled open state. Do not use
a literal `setTimeout` to sequence dismissal and feedback. Track whether focus
must return, close synchronously, and restore through the trigger's public
handle in `useLayoutEffect`.

Back/Escape dismissal must arm the same focus-restoration flag as item
activation before closing. `onDismissRequest={() => setMenuOpen(false)}` is
insufficient: it removes the focused item without telling the layout effect to
return focus to the trigger.

Do not leave focus nowhere, on hidden popup content, or behind an active overlay supplied by separate host infrastructure.

## Modal and Toast

Despite its name, the public UI Toolkit for Meta Ray-Ban Display `Modal` is a Panel-based content
component, not a dialog presenter. It does not portal, paint a route scrim,
trap focus, own open/dismiss state, intercept Back, or position itself above a
Page. Use its supported title/body/media/list/buttons anatomy only where a
Modal surface is already part of the route/carousel composition or is hosted by
separate presentation infrastructure. Do not conditionally append it beside a
Page scroller and expect a blocking popup. For an application-owned blocking
decision, use a dedicated route and system Back unless supported host
presentation infrastructure is actually available. Keep one panel surface;
horizontal actions use ButtonGroup/Rail. Do not nest another panel/modal or add
an app back button.

Use Toast for brief completed-action feedback. `App` already provides the presenter. Toast requests queue and show one at a time in order. Do not use Toast for recoverable blocking errors, actions, or long instructions.

## Scrim

Use Scrim between media and overlaid text/controls; foreground content must be above it. Do not add a second rounded text background unless a distinct static material surface is actually required.

Validate alternate anchor edges, scroll tracking, portal clipping, focus entry/exit, Back dismissal, item activation, trigger focus return, rapid reopen, Modal content placement/actions, ordered Toast queue, and target WebView z-order/compositing.
