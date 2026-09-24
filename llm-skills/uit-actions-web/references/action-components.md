# Action component guide

## Button

### Anatomy and API

`Button` is a `Container`-based action. It can show one leading identity mode (icon or Avatar), `title`, `subtitle`, a closed `TrailingTag`, and optional avatar status/badge. `alwaysShowText` keeps text visible while unfocused; otherwise text expands on focus. `enforceMaxWidth` enables constrained truncation. Icon rotation can update immediately or animate. `showIconActiveIndicator` is for an icon-state treatment and competes with ordinary text content.

Inherited interaction props cover `disabled`, activation, semantic element selection, material/shape, focus eligibility, tooltip content/mode/position, and partial-focus behavior.

`ButtonHandle.animateActionTransition` is for a completed-action icon/title morph with no declarative equivalent. Prefer normal props for ordinary state changes. `getElement()` supports focus restoration/measurement.

### Use and pairing

- Put action peers in `ButtonRail` or `ButtonGroup`.
- For text submission beside `InputTextView`, use its built-in action through
  `onSend` and `actionLabel`. Do not add a separate Button or wrap the field's
  action in a rail/group; InputTextView owns its spacing, disabled-empty state,
  and focus traversal.
- For page-level actions, place that rail/group in a bottom dock outside the
  single vertical scroller. Give the dock bottom padding
  `var(--uit-spacing-xsmall)` and let the scroller's viewport end above it.
- A rail/group is not a tab strip. Use SubNavigationPager for peer content.
- Pair icon-only actions with focused Tooltip when the glyph is unfamiliar.
- Pair disabled state with disabled-click Tooltip only when users need to understand why an attempted action is unavailable.
- Use Avatar mode when a person/entity is the action identity.
- Make every label name the result that actually occurs. A chart, map, guide,
  scan, message, or waitlist action must perform that capability or open that
  exact destination; do not route it to an unrelated record merely to make the
  control navigate somewhere.
- Ensure every branch of an enabled handler completes a product operation.
  Toast may confirm the result, but a branch that only shows feedback and
  returns is still a no-op.
- Every conditional title must correspond to an implemented handler branch. Do
  not display “Join waitlist,” “Share,” or another capability when the handler
  only reserves/cancels, toggles unrelated copy, or is disabled with no path to
  that operation.
- Keep one focus stop for one operation on a route. Do not duplicate Save,
  Observe, Reserve, or another handler once in scrolling content and again in
  the bottom action dock merely to influence initial focus.
- Label a reversible state with the next command, such as Remove from saved or
  Mark unobserved, rather than leaving an enabled button titled Saved,
  Favorited, Observed, or Reserved. Match its icon to that next operation, not
  merely the current state.
- A plural Browse/View collection action opens that collection. It must not
  choose the first record and route to its detail page; either open the
  collection or name the specific destination.
- Never invent local toggle buttons merely to create focus stops through long
  content. A note action must open or save actual note content; a report action
  must collect and submit a report; an acknowledgement must update retained
  domain state; and Show/Hide must actually change the referenced content's
  visibility. Changing only the button's label is not an outcome.
- A Share action invokes the platform share capability or an explicit product
  sharing flow. It must not toggle unrelated directions/help copy and call that
  sharing. Likewise, feedback saying “copied” requires a successful clipboard
  write.
- Never render a PIN, access code, password, or other secret in visible copy
  while labeling it Hidden. The concealed state omits/masks the value; Reveal
  and Hide change the actual rendered and accessible content.

### Avoid

- Long labels/subtitles that turn an action lane into a reading surface.
- A Button for persistent status or navigation-row anatomy.
- Competing icon/avatar modes.
- App-owned width, height, min/max size, flex growth/shrink, expansion width,
  internal icon margins, scale, opacity, or material timers. Button always
  keeps its component-owned intrinsic dimensions; shorten copy or change the
  surrounding composition rather than using `width` or `enforceMaxWidth`.
- Imperative action transition for state that should remain declarative and reversible.

## ButtonGroup

`ButtonGroup` arranges compatible sizable action children without scrolling. `alignment` is start/center/end. `onChildFocusChange` reports the group and focused child. The group itself is not an action/accessibility target; children own semantics.

On a Page, ButtonGroup follows the same bottom-dock placement as ButtonRail. It
does not sit above/inside a list and does not switch peer content pages.

Use for two or three compact actions that always fit, especially modal decisions. It accounts for focused/default child width and scale; do not reproduce spacing with flex `gap`. Children must follow the supported sizable contract.

## ButtonRail

`ButtonRail` owns a focus-following horizontal viewport, fading edges, and scroll positioning. Key props:

- `anchorIndex`: child the rail tries to center when focused; provide content on both sides.
- `centerContentWhenSmallerThanWidth`: centers a short rail by default; false makes it start-aligned.
- `centerFocusedView`: static focus cursor; stronger behavior that supersedes anchoring.
- `onScrollChange`: current offset and delta.
- `onChildFocusChange`: focused child or null.

Handle methods:

- `skipAnimationForNextFocusMovement()`: one-shot for programmatic focus placement/restoration.
- `resetScrollPositionIfNoFocusedChild(animated)`: restore default only when no child owns focus.
- `updateScrollPosition(animated)`: recompute for the last focused child after layout/content changes.

Keep the viewport edge-to-edge and leave overflow visible for child scale/glow. Test content shorter/equal/longer than viewport, first/last focus, programmatic focus, resize, and fast traversal.

For a Page, the rail viewport reaches both display edges in a bottom action
dock. It is not a child of VerticalList/ScrollView. The content viewport stops
before the rail, and `--uit-spacing-xsmall` remains between the button region
and display bottom.

## ButtonDivider

Divider is non-focusable section structure inside a ButtonGroup/Rail. It has no action semantics. Use on both sides of an anchored element only when the anchor is genuinely a distinct logical section. Never insert it solely for symmetry.

## QuickReplyButton

Quick reply is a compact response action intended for ButtonRail. `title` and `icon` support:

- text only;
- icon only (requires accessible label; icon is centered);
- text plus an icon that reveals with focus.

Keep content conversational and immediately sendable. Do not use for generic commands, destinations, long copy, or multi-step flows.

## ActionHint

ActionHint is a `StaticContainer`-based, non-interactive short cue with optional icon. It explains a continuation or input affordance; it does not receive focus or trigger behavior. The actual gesture/action belongs to the owning surface.

## Review matrix

For each action region verify:

- text-only, icon-only, mixed content, and long-but-supported labels;
- idle/focused/pressed/disabled and focus retained after activation;
- Tooltip placement and disabled-click feedback;
- first/middle/last rail item and focus-scale clipping;
- compact rail alignment, anchor, and static cursor modes;
- fast D-pad expansion hesitation and rapid reversal;
- semantic labels and exactly one activation per press.
