---
name: uit-actions-web
description: Build or review UI Toolkit for Meta Ray-Ban Display actions using Button, ButtonRail, ButtonGroup, ButtonDivider, QuickReplyButton, ActionHint, and the InputTextView built-in action. Use for horizontal actions, text submission, overflowing rails, anchors, centered focus cursors, disabled actions, tooltips, icon-only actions, reply suggestions, action transitions, or action-layout bugs.
---

# UI Toolkit for Meta Ray-Ban Display actions

Read [../building-uit-interfaces-web/references/actions-lists-controls.md](../building-uit-interfaces-web/references/actions-lists-controls.md).

Read [references/action-components.md](references/action-components.md) for prop-level behavior, pairings, and component-specific review rules.

Use these references before library source. Inspect one exact public type only
when a selected prop remains unresolved or typecheck reports a mismatch; do not
browse implementation or examples preemptively.

## Selection

- `Button`: one immediate command.
- `ButtonRail`: flexible full-width horizontal lane; preferred when actions may overflow.
- `ButtonGroup`: small non-scrolling related set.
- `ButtonDivider`: logical section boundary inside a rail/group.
- `QuickReplyButton`: concise ready-to-send response/reaction inside a rail.
- `ActionHint`: visual-only instruction/continuation cue.

## Required patterns

- Every horizontal action row uses ButtonRail or ButtonGroup. The built-in
  `InputTextView` action is part of that component's supported anatomy and is
  not a peer action row; use `onSend` and `actionLabel` instead of adding a
  separate Button.
- Never put two or more peer Buttons in a flex/grid `div`; use ButtonGroup when
  they fit or an edge-to-edge ButtonRail in the page's bottom action region.
- Dock page-level ButtonRail/ButtonGroup actions at the display bottom, outside
  the route scroller. The content owner ends above the actions; the action dock
  uses `var(--uit-spacing-xsmall)` below the buttons for rubber-band clearance.
- Never put a rail/group at the top of a list or beneath the Page header.
- Do not use ButtonRail/ButtonGroup for tabs, filters that swap peer pages, or
  other subnavigation. Use SubNavigationPager.
- Rails reach both screen edges; do not add horizontal page inset or another scroller.
- Use filled, semantically accurate icons. Never use gesture icons as ordinary actions.
- A More/overflow trigger uses the filled ellipsis asset. Upload/share arrows,
  download icons, and navigation glyphs communicate different commands and are
  not interchangeable. Verify each icon against its exact label and direction.
- A More trigger at the right edge of the standard bottom rail uses
  `VerticalMenuCorner.ABOVE_RIGHT` so its popup opens upward and inward.
- Give icon-only controls an accessible label.
- Let Button own icon dimensions, text expansion, focus scale, material, and press motion.
- Let every Button render at its component-owned intrinsic width and height.
  Do not pass `width`, set `enforceMaxWidth`, size its class/style, place it in
  a stretching grid track, or allow a flex parent to grow or shrink it. Keep
  intrinsic flex items inflexible and let ButtonRail/ButtonGroup handle
  available space; shorten copy rather than resizing the control.
- During fast D-pad traversal, allow component-owned expansion hesitation to reduce visual noise; do not force labels open with app timers.
- Use `disabled` for unavailable actions. Add `TooltipMode.DISABLED_CLICK` when attempted-action feedback is required.
- Keep one focused action and one semantic activation per press.
- Keep a focused Button mounted when its command changes state. If activation
  changes the rail's available actions, update the stable Button or explicitly
  focus the intended successor before removing it; never allow conditional
  replacement to reset page focus or move the content scroller.
- Do not expose two differently named peer actions that invoke the same handler
  and outcome. A completed/done label is state, not an enabled command; omit or
  disable it instead of leaving a no-op action focusable.
- Keep enabled titles verb-led and describe what the next press does. State
  phrases such as “visible,” “noted,” “logged,” or “copied” are not toggle
  commands; use “Show/Hide,” “Add/Remove,” or another accurate pair. An Add/Log
  action must call a capability for the named object, not an unrelated status
  update whose handler merely has a plausible name.
- Every action must change real application state, navigate to a genuine
  destination, open/dismiss real temporary content, or invoke the product
  capability named by its label. Toast is feedback after an outcome, never the
  outcome itself. Hiding `Toast.show` behind a `notify`, `confirm`, `log`, or
  similar wrapper does not make a placeholder action valid. Exercise every
  action and verify a persistent or navigational result beyond the Toast.
  Likewise, setting transient `notice`, `message`, or `feedback` text is not an
  outcome for a command that claims to open, check, jump, contact, log, or
  otherwise perform work.

## Rail modes

- Default: compact content centered; overflow follows focus.
- `centerContentWhenSmallerThanWidth={false}`: compact content starts at the leading edge.
- `anchorIndex`: designated child tries to remain centered; include enough content on both sides and preserve expanding labels.
- `centerFocusedView`: fixed central focus cursor, including edge actions; use only with explicit need.
- Do not combine `anchorIndex` and `centerFocusedView`; focused centering wins.

Use ButtonDivider only between logical sections, such as settings and destructive actions. Do not place a divider between peers or use it decoratively.

## Avoid

- vertically stacking primary buttons;
- arbitrary flex rows of buttons;
- nested rounded wrappers;
- wrapper scale/opacity animations;
- long QuickReplyButton sentences;
- ActionHint as a button;
- icon sizing/margin overrides inside a Button;
- multiple controls appearing focused;
- initial page load animating every button from collapsed to expanded.

Validate first/middle/last rail positions, overflow fades, rapid D-pad movement, focus expansion at edges, disabled activation, press interruption, and return focus after overlays/routes.
