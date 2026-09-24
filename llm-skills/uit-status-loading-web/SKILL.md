---
name: uit-status-loading-web
description: Build or review UI Toolkit for Meta Ray-Ban Display determinate and indeterminate state using ProgressIndicator, ProgressRing, CircularProgressBar, IndeterminateLoader, Shimmer, ShimmerItem, InputTextView loading, VolumeIndicator, ZoomIndicator, status indicators, badges, loading icons, and dynamic replacement. Use for progress, loading skeletons, operation state, field loading, volume/zoom feedback, accessibility announcements, or focus stability during async updates.
---

# UI Toolkit for Meta Ray-Ban Display status and loading

Read [../building-uit-interfaces-web/references/overlays-feedback-status.md](../building-uit-interfaces-web/references/overlays-feedback-status.md).

Read [references/status-components.md](references/status-components.md) for
component-by-component state modeling and replacement behavior.

## Selection

- Known completion: ProgressIndicator (horizontal), ProgressRing (compact circle), CircularProgressBar (partial arc), or a component's built-in progress mode.
- Unknown completion: IndeterminateLoader, or a component's built-in loader when available.
- Known future layout awaiting data: Shimmer plus ShimmerItem.
- Volume change feedback: VolumeIndicator.
- Zoom change feedback: ZoomIndicator.
- Compact semantic state: component status slot, Avatar status, NotificationBadge, Chip.

Status components display application-controlled state; they are not generic controls. Use ListItem slider, IsolatedControl, or Scrubber when users adjust a value.

## Loading behavior

- Keep focus on a stable parent while icon/loading/content changes.
- For `InputTextView`, use `showLoader` and a localized `loadingLabel` for
  unknown-duration field work. Use a labeled sibling `ProgressIndicator` for
  known completion; do not show both for the same operation.
- Do not let loading steal focus unless the flow intentionally moves it.
- Remove loaders immediately when settled.
- Build shimmer from a few major container-shaped placeholders that resemble final structure; prioritize container forms over every text line.
- Leave visual separation between avatar-like and content shapes.
- Crossfade/transition to loaded content without remounting the focused region when possible.

## Accessibility and performance

Provide accurate labels/value semantics. Do not announce decorative duplicate progress. Parent-size circular indicators responsively. Avoid per-frame React state and pause continuous animation when invisible/hidden.

Validate zero/middle/full, unknown-to-known transitions, loading/loaded/error/empty, rapid updates, focus retention, reduced motion, hidden-tab behavior, shimmer geometry, semantic status descriptions, and WebView animation smoothness.
