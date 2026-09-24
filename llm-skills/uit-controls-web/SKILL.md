---
name: uit-controls-web
description: Build or review UI Toolkit for Meta Ray-Ban Display settings and value controls using Switch, RadioButton, SliderBar, Scrubber, IsolatedControl, ControlTile, AppControlTile, and ListItem control modes. Use for binary settings, mutually exclusive choices, sliders, media seek, D-pad value adjustment, progress tiles, app/person shortcuts, controlled state, or control accessibility.
---

# UI Toolkit for Meta Ray-Ban Display controls

Read [../building-uit-interfaces-web/references/actions-lists-controls.md](../building-uit-interfaces-web/references/actions-lists-controls.md).

Read [references/control-components.md](references/control-components.md) for value ranges, modes, callbacks, pairings, and state semantics.

## Visual controls versus interaction hosts

Public `Switch`, `RadioButton`, and ordinary `SliderBar` are visual building blocks. For user interaction, compose through a labeled parent such as `ListItem` so the page exposes one large focus target and one accessibility node.

- Switch: independent binary setting, never a one-time command.
- Radio: one choice in a labeled mutually exclusive set.
- SliderBar: bounded value/progress presentation.
- ListItem slider: labeled full-row adjustment.
- IsolatedControl: compact icon + bounded value as one focus target.
- Scrubber: media seek position with time semantics.
- ControlTile: compact setting/toggle/progress surface.
- AppControlTile: prominent app, destination, or person shortcut.

## State ownership

Use controlled React state where application data is authoritative. Avoid duplicate focusable child controls. Keep the host mounted while the value/accessory changes so the toolkit can animate the transition.

Every independently labeled setting owns independent state unless the product
explicitly presents them as one synchronized setting. Do not bind two switches
to one boolean merely to populate a screen. A setting must change observable
application behavior or presentation; persisting a value and showing a Toast
without consuming that value is not an implementation.

For an integrated switch/radio `ListItem`, use one state transition path,
normally `onCheckedChange`. Do not attach the same mutation to both `onClick`
and `onCheckedChange`, which can update and announce twice for one activation.

For Scrubber, values are 0–100. Use `onValueChange` for live updates and `onValueChanged` for committed updates. Persistent timestamp placement is independent of the focused handle tooltip.

When `ControlTile.lockFocus` is enabled for continuous adjustment, left/right remains with the tile and calls increment/decrement; provide a clear release/navigation model and handle programmatic focus loss. Circular and horizontal progress modes are mutually exclusive.

## Tiles

Tiles are already material surfaces; do not wrap them in another rounded Container/Panel. AppControlTile app identity should use an actual app-style icon, often within a circular icon material, or a real Avatar. Icon/avatar-only tiles need descriptive labels.

## Avoid

- standalone unlabeled visual controls as input;
- a separately focusable label plus control;
- a SliderBar where Scrubber time semantics matter;
- a compact IsolatedControl when the value needs a descriptive setting row;
- generic/poorly centered icons in AppControlTile;
- fixed tile sizes tied to one display;
- custom key handlers that bypass component interaction;
- using VolumeIndicator/ZoomIndicator as the input control.

Validate min/mid/max, checked/unchecked, disabled, rapid left/right, initial tooltip alignment, controlled-state latency, focus retention during value changes, accessible value announcements, and responsive tile layouts.
