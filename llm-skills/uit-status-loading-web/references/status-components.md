# Status and loading component guide

## Model state before choosing a component

Represent operation state explicitly: idle, loading with unknown completion,
loading with known completion, success, empty, and error as applicable. Do not
infer loading from missing data when empty is a valid result. Status visuals
display that model; they must not become an unrelated focus target.

Use semantic toolkit tokens for color, dimensions, spacing, typography, opacity,
shape, and motion. Do not copy resolved indicator sizes or animation timings.

## ProgressIndicator

Use for known linear completion where horizontal space communicates progress
clearly. Pass the source units directly through `value`, `minimumValue`, and
`maximumValue`; the component clamps the range and derives the percentage.
Provide `aria-label` or connect visible naming text with `aria-labelledby`.
Set `animated` only when the value does not already update smoothly, and turn it
off when `usePrefersReducedMotion()` is true. Set
`announceUpdatesForAccessibility={false}` for rapidly updating repeated bars or
when nearby status text already announces the same work. `isActive` changes the
visual treatment; it does not mean complete. Avoid fake progress that repeatedly
stalls near completion.

```tsx
<TextView id="download-progress" textStyle={TextStyle.META1}>
  Downloading update
</TextView>
<ProgressIndicator
  value={bytesReceived}
  maximumValue={bytesTotal}
  animated={!prefersReducedMotion}
  aria-labelledby="download-progress"
/>
```

## ProgressRing

Use for compact known completion when a circular form better fits the owning
component. It is status, not a dial. Keep it associated with the task it
describes and avoid a separately focusable duplicate label.

## CircularProgressBar

Use for known progress represented by a circular/partial-arc presentation. Let
the component and parent layout determine token-based sizing. Do not hardcode
track geometry or replace the public API with custom SVG/CSS arcs.

## IndeterminateLoader

Use only when work is active but completion cannot be estimated. Pair it with
concise status text when context is not otherwise obvious. Replace it promptly
with content, error, or empty state. A loader that remains indefinitely without
status or recovery is not acceptable.

## Shimmer and ShimmerItem

Use when the final layout is known and preserving its visual structure reduces
perceived instability. Compose a small number of major container-like
`ShimmerItem` shapes matching the final hierarchy; prioritize cards, rows,
avatars, and content blocks rather than tracing every text line. Keep adjacent
shapes visibly separated using spacing tokens.

Shimmer is decorative. Describe the loading region through the stable parent,
avoid exposing every placeholder as accessibility content, and replace the
skeleton without remounting the focused region when possible. Do not use shimmer
when no future structure can be predicted; use IndeterminateLoader instead.

## Component-integrated loading and status

Prefer a component's built-in loading/status/accessory mode over manually
overlaying an indicator. Chip, Avatar, ListItem, buttons, and other components
can transition accessories while retaining their anatomy. `InputTextView`
provides `showLoader` plus `loadingLabel` for unknown-duration field work; keep
it mounted and use a labeled sibling `ProgressIndicator` instead when completion
is measurable. Do not show both for the same operation. Preserve the stable
label and focus identity across `none`, avatar, icon, loading, and final states.
Do not absolutely position replacements or animate application layout offsets.

Use NotificationBadge for a compact count/status attached to an owning identity.
Allow its anatomy to center and pad text; do not size or nudge the text from app
CSS. Use the supported overflow representation rather than squeezing arbitrary
digits into the badge.

## VolumeIndicator and ZoomIndicator

Use these transient indicators for their named system-like feedback, driven by
the application's current value. They communicate change; they are not direct
controls. Pair volume adjustment with an actual supported control/input source,
and zoom feedback with the media/camera operation it describes.

## Dynamic replacement

- Keep one stable semantic owner and focus key.
- Update state atomically so stale status and new content do not overlap.
- Avoid React state on every animation frame.
- Do not animate every control from a fabricated collapsed state on route load.
- Respect reduced motion and pause continuous work when hidden.
- Announce meaningful phase changes without flooding live regions.
- Retain prior usable content during background refresh when that is less
  disruptive than replacing the whole route with a loader.

## Validation matrix

Test zero, intermediate, complete, invalid values, unknown-to-known transition,
loading-to-success/error/empty, rapid updates, cancellation, retry, background
refresh, focus retention, route return, reduced motion, hidden tab, long status
text, responsive parent sizes, WebView animation smoothness, and accessibility
announcement frequency.
