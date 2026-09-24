# Control component guide

## Switch and RadioButton

The public components accept visual state (`checked`, plus Switch animation) but intentionally do not expose a complete interaction callback. Use them when a higher-level toolkit component owns the input semantics. For ordinary settings/choice UI, use ListItem's integrated switch/radio modes.

Radio choices need a labeled mutually exclusive group and one selected value. Independent settings use switches. A one-time command uses Button/ListItem, not Switch.

Each row has one callback path and one source of truth. Use
`onCheckedChange`; do not duplicate the mutation in `onClick`. Separate switch
labels require separate state unless they intentionally mirror one setting.
Verify every setting's value is read by the feature it claims to configure,
including after reload when persistence is promised.

## SliderBar

SliderBar visualizes `[minimumValue, maximumValue]` with a clamped `value`. Modes:

- state: idle or focused;
- size: default (cross-axis focus expansion) or thin (constant compact size);
- orientation: horizontal or vertical;
- `animated`: progress-fill transition;
- `shouldExpandOnFocus`: visual expansion policy;
- `disabled`: unavailable appearance.

Although a low-level `onChange` can opt the bar into keyboard slider semantics, production UI should normally use ListItem slider or IsolatedControl so label, focus, value, and adjustment are one established pattern.

## Scrubber

Scrubber is a controlled 0–100 media seek control. Key behavior:

- `durationSeconds=0` hides the persistent timestamp row;
- `timestampPosition` places elapsed/total above or below the track;
- `showTooltip` shows current time/percentage above the handle while focused;
- `onValueChange` fires for every pointer/keyboard update;
- `onValueChanged` fires for committed steps/end;
- `hideScrim` removes interaction scrim only for an intentional media composition;
- `disabled` prevents seeking.

Use live callback for preview and committed callback for expensive seek persistence/network work. Keep handle Tooltip independent of persistent timestamp placement. Test initial focus measurement and rapid key updates.

## IsolatedControl

One focus target combining optional icon and slider. It supports:

- controlled `value` or uncontrolled `defaultValue`;
- min/max and fractional step;
- `onValueChanged` for left/right updates;
- optional click; it is not clickable by default;
- declarative animation;
- handle `setValue(value, animated)` and root access.

Left/right belongs to adjustment; up/down remains focus navigation. Use an accurate accessible label and do not expect horizontal focus to escape while focused.

## ControlTile

One compact setting/action surface with title/icon and mutually exclusive state modes:

- `checked: boolean` creates toggle semantics; null/undefined is not toggleable;
- circular progress around icon;
- horizontal progress replacing title treatment;
- optional icon swap animation and progress visibility animation;
- normal/checked icon materials and semantic tints;
- `lockFocus` plus increment/decrement for continuous adjustment.

Circular and horizontal progress are mutually exclusive. Checked icon material may differ from ordinary icon material; passing null for checked material preserves the regular one. Keep icon identity stable with `iconAnimationKey` when animating swaps.

## AppControlTile

One prominent destination. Choose either Avatar identity or app icon/custom icon content; Avatar wins when both are supplied. Title omission centers identity. A status icon/media below title limits title layout. Long titles may use supported marquee, but prefer concise names.

App icon treatment can receive its own `iconContainerMaterial` and `shapeProvider`; use a circular material and correctly inset filled glyph for an app-like result. Tile itself can receive a separate material. Use memoized independent material instances.

Avatar mode supports badge, status/glyph, shape, placeholder, and custom primary content. Icon-only/avatar-only tiles require explicit accessible labels.

## Pairings

- Settings list: VerticalList + ListItem integrated controls.
- Compact global adjustment: IsolatedControl.
- Playback seek: Scrubber plus media state.
- Dashboard/quick controls: responsive ControlTile layout.
- App/person destinations: AppControlTile.
- Read-only progress: status/loading components rather than interactive controls.

## Review matrix

Check min/mid/max/out-of-range clamping, controlled/uncontrolled updates, checked/unchecked/null, disabled, rapid direction input, focus locking/release, progress-mode exclusivity, accessible role/value/action, icon/title transitions, and responsive layout.
