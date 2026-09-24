---
name: uit-text-input-web
description: Build, compose, or review free-form text entry for UI Toolkit for Meta Ray-Ban Display using InputTextView. Use for controlled or uncontrolled text, device-host input handoff, multiline growth and scrolling, the built-in send action, loading state, submission progress, accessibility, focus traversal, or text-entry layout bugs.
---

# UI Toolkit for Meta Ray-Ban Display text input

Read [references/text-input-components.md](references/text-input-components.md) for the public API, supported compositions, state ownership, focus and scrolling behavior, and validation matrix.

Use `InputTextView` as the semantic free-form text-entry surface. Do not recreate it from a textarea, Container, and Button.

## Select the supported pattern

- Text entry without submission: omit `onSend`; Enter retains multiline behavior.
- Text entry with its component-owned action: provide `onSend` and a localized `actionLabel`. The action is shown by default and disables itself while text is empty.
- Enter submission without a visible action: provide `onSend` and set `showActionButton={false}`.
- Unknown-duration work associated with the field: use the built-in `showLoader` and `loadingLabel` props.
- Known completion: render a labeled sibling `ProgressIndicator`; do not place it inside the field or use the indeterminate loader for measurable work.

Keep application or host-specific input behavior outside the component. Use `inputProps` for supported textarea attributes and semantics rather than querying or styling its internal DOM.
