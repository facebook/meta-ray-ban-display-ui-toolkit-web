# Overlay and feedback component guide

## Shared overlay contract

Render inside `App` so floating content uses the supported portal and focus
infrastructure. The trigger owns open state and the relationship to its content.
Keep the trigger mounted while its overlay is open. Use the component's anchor
and placement APIs rather than viewport coordinates or transforms copied from a
screenshot.

The corner names describe which menu corner follows the anchor. For a trigger
at the right end of the standard bottom-docked rail, choose `ABOVE_RIGHT` so
the menu opens upward and toward the interior; `*_LEFT` can push the menu/glow
into the right display edge. `BELOW_RIGHT` applies only to a genuinely top-edge
trigger with verified room below it. Reverse the horizontal choice for a
left-edge trigger.

Back/Escape handling is a stack:

1. dismiss the topmost transient surface;
2. restore focus to the surviving trigger;
3. navigate route history only when no transient surface remains.

Tokenize overlay spacing, shapes, typography, colors, elevation, and motion.
Do not copy the resolved values of those tokens into positioning CSS.

## Tooltip and TooltipContainer

Use `Tooltip` for short, supplemental meaning attached to a target, especially
an unfamiliar icon-only action. Do not repeat a visible label, hide essential
instructions exclusively in a tooltip, or make a basic tooltip interactive.

Use `TooltipContainer` when the anchored content itself needs supported focus or
interaction behavior. The container must follow its anchor through scroll,
focus expansion, and responsive layout. Validate every supported placement near
all viewport edges; allow collision handling to select a fitting placement.

## VerticalMenu

`VerticalMenu` is temporary menu content presented from a Button, Container, or
other supported trigger. It is not an inline list or standalone route section.
Use its item component for one action per row, concise labels, filled semantic
icons where useful, and disabled state where an unavailable command must remain
visible. Omit navigation chevrons.

The row width is component-owned and intentionally compact. Use short verb-led
labels that fit in at most two lines and normally limit the popup to three
priority actions. Four tall rows can consume the whole display and put the last
action in a clipped/faded edge; move the longer command set to a route.

On item activation, commit the command once, close the menu, stop any event that
would reopen the trigger, and restore focus to that trigger. Use a route when the
content is persistent or too extensive for a transient menu.

The item handler must own portal event flow explicitly:

```tsx
const activateMenuItem = (event: React.MouseEvent, action: () => void) => {
  event.stopPropagation();
  shouldRestoreFocus.current = true;
  setMenuOpen(false);
  action();
};
```

Pass the event from each `VerticalMenuButton` `onClick`. A handler that merely
sets `menuOpen` to false can bubble to a trigger that toggles the same state,
causing the menu to flicker closed and immediately reopen. Do not mask that
race with a timeout.

For a Button trigger, use the exact public handle type:

```tsx
const triggerRef = useRef<ButtonHandle>(null);

useLayoutEffect(() => {
  if (!menuOpen && shouldRestoreFocus.current) {
    shouldRestoreFocus.current = false;
    triggerRef.current?.getElement()?.focus({ preventScroll: true });
  }
}, [menuOpen]);
```

Pass `ref={triggerRef}` without `as never`, `as any`, `@ts-ignore`, or another
type suppression. `ButtonHandle` is not an `HTMLButtonElement`; calling
`.focus()` on the handle crashes at runtime. Verify the exact trigger is active
after both item activation and Back/Escape dismissal.

## ContextMenu

Use `ContextMenu` for actions applying to one selected object or region. Open it
from that object's Button/Container interaction, not inline and not as a global
navigation menu. Keep actions contextual, ordered, and short. A destructive
action needs an accurate semantic treatment and suitable confirmation policy;
color alone is insufficient.

The selected object remains the focus-restoration target after dismissal. If an
item navigates, dismiss the menu before changing routes so the outgoing portal
cannot flicker or regain focus.

## Modal

`Modal` is a Panel-derived content surface with supported title, subtitle,
leading media, list, and buttons anatomy. It is not itself overlay
infrastructure: it has no `open`/`visible` contract, portal, scrim, focus trap,
Back interception, or opener-focus restoration. Conditional rendering only
mounts/unmounts the Panel where it appears in layout.

Use it as content inside a route/carousel or through separate infrastructure
that explicitly owns presentation. Do not append it outside a Page's bounded
vertical owner and assume it will float above the route. For a blocking
application decision, prefer a dedicated route and let system Back dismiss that
route unless a supported host presenter is in scope. Use one Modal surface and
its `buttons` slot with ButtonGroup/ButtonRail; do not nest another focusable
parent surface or add an application back button.

## Toast

Use Toast for brief, non-blocking confirmation of an action that already
completed. Present through the App-level presenter. Subsequent presentations
queue and appear one at a time in order. Avoid actions, long instructions,
progress that requires continued updates, or errors that require recovery.

Repeated operations should produce meaningful feedback without creating an
unbounded or stale queue. Announce important confirmation once; do not create a
duplicate live-region message elsewhere.

## Scrim

Place `Scrim` between media and foreground content when contrast must hold over
unpredictable imagery. The media is below it and the text/controls are above it.
Select supported edges/strength through component APIs and semantic tokens; do
not paint an opaque color patch or introduce another rounded container merely to
mask the media.

Scrim differs from Vignette: Scrim protects foreground legibility, while
Vignette communicates that pannable media continues beyond selected edges.

## Validation matrix

Test trigger open, outside dismissal where supported, Back/Escape, item
activation, disabled item, rapid close/reopen, route change, anchor scrolling,
focus expansion, each viewport edge, nested transient precedence, focus return,
Modal route/content placement and action behavior, long/localized labels,
reduced motion, and target WebView compositing.
