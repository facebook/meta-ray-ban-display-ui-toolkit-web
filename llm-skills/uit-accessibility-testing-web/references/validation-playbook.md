# UI Toolkit for Meta Ray-Ban Display validation playbook

## Establish the contract

Inventory routes, transient surfaces, focusable targets, asynchronous states,
data-driven content, responsive regions, and custom materials. For each, record
the semantic owner, expected initial focus, directional neighbors, Back behavior,
and focus/scroll restoration target. Test the public API contract rather than
implementation selectors.

Audit authored styling first. Colors, spacing, corners/shapes, typography,
component sizes, elevation, opacity, and motion must reference semantic toolkit or
application theme tokens. Flag copied resolved values even when they currently
match the design system. Numeric values are acceptable for domain data and
API-defined normalized quantities, not for recreating design dimensions.

Snapshot or checksum the prepared harness dependencies and validators before a
generation. Verify them again afterward. Any mutation to installed packages,
package-manager caches, build tools, or validation scripts disqualifies the
candidate even if its final build passes.

Reject token references with copied literal fallbacks, such as a toolkit spacing or
color variable followed by its current resolved value. A missing required token
should fail visibly during development rather than silently preserve stale
design values.

## Semantic and accessibility pass

- Use semantic elements and heading order independent of visual appearance.
- Give icon-only actions outcome-oriented accessible names.
- Give meaningful imagery accurate alt text; hide decorative duplicates.
- Expose current value, range, status, and selection where applicable.
- Ensure visual-only RadioButton, Switch, SliderBar, SwipeIndicator, and status
  visuals do not become duplicate interactive widgets.
- Keep one semantic target per action; reject nested focusable controls.
- Do not encode warning, success, selection, or availability by color alone.
- Verify live announcements are useful, singular, and not emitted per frame.

Use automated accessibility checks as a baseline, then inspect the accessibility
tree and operate the complete task without touch or a mouse.

## Directional focus pass

Start from a fresh route, restored route, and route reached through every entry
point. Navigate slowly and with rapid key repeat in all directions. Verify:

- one intentional default focus target;
- no focus on disabled, hidden, decorative, or off-route elements;
- spatially predictable neighbors and no unexplained jumps;
- focused content remains wholly visible, including expansion/glow;
- first/last scrollable child reaches the true start/end immediately;
- popup focus enters, remains within its contract, dismisses before navigation,
  and returns to its trigger;
- route history restores the previously focused logical item and scroll state;
- dynamic insertion/removal chooses a deterministic surviving target.

## State matrix

For each applicable component capture idle, focused, pressed, disabled,
selected, loading, success/error, overflow, popup-open, partial-focus extremes,
handoff, interrupted animation, and restored state. Combine these with short,
long, localized, empty, and failed-media content. Do not validate only a single
happy-path viewport.

For custom materials, vary host aspect ratio, shape, content density, focus
origin, press interruption, and surrounding real-world brightness. Verify that
all layers share the host shape and one synchronized transition.

## Responsive and visual pass

Resize across materially different aspect ratios without assuming a particular
device resolution. Look for fixed dimensions, viewport-specific branches,
nested scroll regions, clipped focus effects, excess list tail space,
carousel/card expansion clipping, and overlays detached from anchors. Token
usage does not replace responsive layout; tokens provide design values while
parent constraints determine available space.

Before route review, assert that `html`, `body`, the framework mount node, and
`[data-app-root]` all have nonzero viewport bounds. Compare the primary
scroller's `scrollWidth` with its client width; investigate overflow even when
CSS clipping makes the scrollbar invisible. During D-pad traversal, assert the
focused rectangle intersects the visible owning scroll viewport after every
move.

Inspect computed backgrounds on `html`, `body`, the mount node, `App`, and the
route root. The complete window must resolve to
`--uit-color-background-window`, including during route transitions. Reject a
transparent/white backing surface, raw full-screen colors, images, or
decorative gradients; validate local semantic legibility surfaces
independently instead.

Review the whole scroll extent. On an emulator, allow animations and assets to
settle after every state change before judging a static frame. Record video for
one-frame flashes, initial-position jumps, tooltip jitter, accessory replacement,
and partial-focus handoff defects; inspect individual frames around the event.

Maintain a screenshot manifest for the untouched candidate. Require evidence
for every route/pager page at top, middle, and bottom; first/middle/last focus;
all open and dismissed transient surfaces; meaningful selected, disabled,
changed, empty, and error states; bottom-action focus positions; forward and
restored-Back states; and every tested viewport. Review each image for the toolkit
component choice, hierarchy, spacing, clipping, materials, text fit, focus,
contrast, and edge behavior. An uncaptured surface/state is unverified and
cannot contribute to an acceptance streak.

## Target runtime and performance

Validate in the supported Android WebView host in addition to a desktop browser.
Check masks, blend modes, gradients, fonts, portal z-order, window-background
coverage, and compositing. Profile continuous motion: avoid per-frame
React renders, layout thrashing, repeated material creation, and invisible
animations continuing in the background.

## Defect ownership

Minimize a failure to component, app composition, focus coordinator, material,
portal, or host behavior. Fix the lowest correct public layer. Never compensate
with selector overrides, arbitrary offsets, forced remounts, synthetic key
events, or host-only timing delays. Add a behavior-focused regression that
would fail for the original defect.

## Release gate

Require formatting, lint, type checking, targeted behavior tests, production
build, package-export/import validation, accessibility checks, complete D-pad
walkthrough, responsive inspection, and target-runtime validation. Document any
unavailable environment explicitly; do not silently treat desktop rendering as
device proof.
