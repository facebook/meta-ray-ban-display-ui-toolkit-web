# Accessibility, performance, and validation

## Contents

- [Accessibility](#accessibility)
- [Focus and interaction](#focus-and-interaction)
- [Responsive and visual review](#responsive-and-visual-review)
- [Performance](#performance)
- [WebView validation](#webview-validation)
- [Required state matrix](#required-state-matrix)
- [Final compliance checklist](#final-compliance-checklist)

## Accessibility

- Use semantic components and elements. A navigation row may render as a router link through the component's polymorphic `as` support.
- Give every icon-only action an `aria-label` matching its result.
- Give meaningful Avatars and images accurate `alt`; use empty alt/`aria-hidden` only for decoration already described by a parent.
- Give status indicators/icons content descriptions when they communicate state.
- Label scroll regions, lists, pagers, menus, and control groups.
- Keep a visual-only `Switch`, `RadioButton`, `SliderBar`, `PaginationIndicator`, `SwipeIndicator`, progress indicator, volume indicator, or zoom indicator out of the focus order. Put interaction and semantics on its owning parent.
- Do not expose duplicate nested widgets when a parent owns a presentational control.
- Make menus/modals reachable, focus-contained where appropriate, dismissible through Back/Escape, and focus-restoring.
- Preserve semantic heading order even when a different toolkit text appearance is selected.
- Test localized/longer strings and supported line limits. Do not design widths around English text.

## Focus and interaction

Test only with keyboard/D-pad paths considered primary:

1. Initial entry chooses the intended first eligible target.
2. Up/down/left/right reaches every target in a predictable geometric order.
3. Fast repeated direction input keeps focus, scroll, and animation synchronized.
4. At a list's first/last item, focus reaches the true scroll boundary immediately.
5. When no next target exists, the owning scroller consumes remaining movement before rubber-band feedback.
6. Enter/D-pad OK produces transient press feedback and one semantic activation.
7. Disabled actions render reduced opacity, do not activate, and provide attempted-action explanation when required.
8. Back dismisses the topmost transient surface before changing routes.
9. Back navigation restores route, focus, scroll, and pager/carousel state before the old page is visible.
10. No state update leaves focus on `body`, a hidden node, or an unmounted element.

## Responsive and visual review

Inspect the full scrollable route, not only the initial viewport. Look for:

- a zero-height `html`, `body`, `#root`, or `[data-app-root]` containing block;
- a document, app, or route root that exposes a white/transparent WebView
  backing surface instead of the toolkit window-background token;
- `scrollWidth` greater than viewport width, including overflow merely hidden
  by a parent;
- clipped focused scale/glow at every edge;
- incorrect nested rounded rectangles;
- text clipped by an inner wrapper instead of the component surface;
- miscentered icons, badges, counts, tooltips, and scrollbars;
- unintended row gaps, page/list insets, or bottom scroll range;
- duplicated row/detail facts or equivalent adjacent labels such as “Due today
  · Today” and “Wilts May 12 · May 12”;
- grammar, article, pluralization, or punctuation errors in default, changed,
  empty, error, and generated-count copy;
- overlap between fading edges and headers/content;
- excessive blank space between content and indicators/actions;
- unstable layout during controlled state changes;
- synthetic gradients pretending to be imagery;
- low contrast over real media or the window background;
- absolute/fixed sizes that fail at a different viewport.

Use actual images where imagery/identity is required. Wait for images, fonts, and the toolkit animations to settle before capturing evidence. Device emulators may render animations slowly; allow several seconds after each change. For transient animation defects, record the screen and inspect frames rather than relying on one screenshot.

## Performance

- Avoid per-frame React state. Use CSS transforms/opacity or the toolkit motion primitives.
- Keep material and shape-provider instances stable with `useMemo`, one material instance per mounted host.
- Use stable keys in lists; do not remount focused rows on data updates.
- Memoize complex props/callbacks passed into frequently rendering or animated regions when it prevents real rerenders; do not obscure straightforward code without need.
- Keep animated layers mounted and update declarative state.
- Preload likely lazy routes with the toolkit route-preload APIs where startup/navigation latency warrants it.
- Avoid unnecessarily eager Pager page mounting; follow the documented lifecycle/unmount behavior.
- Keep SVG/filter/mask layers bounded and test on low-power device hardware.

## WebView validation

Desktop Chrome is useful but insufficient. Validate the production WebView for:

- SVG mask and clip paths;
- blend modes and material composition;
- filters/backdrop effects;
- Noto Sans resolution and text metrics;
- animated SVG/media;
- portal coordinate spaces and anchor tracking;
- scroll/fading-edge compositing;
- focus expansion at viewport boundaries;
- route history/back behavior.

Element-only DevTools screenshots can misrepresent negative-stacked or masked layers. Capture the full device frame and crop component bounds when needed. Do not change geometry to chase an aliasing-only desktop/device difference.

## Required state matrix

Validate every applicable state, not merely the default screenshot:

| Area | States |
|---|---|
| Interactive component | idle, focused, pressed, focus retained after activation, disabled |
| Selection/control | unchecked/checked, minimum/middle/maximum, rapid value changes |
| Dynamic content | loading, loaded, empty, error, content/accessory transition |
| Scrolling | top, middle, bottom, fading edge active/inactive, first/last focus |
| Rail/carousel/pager | first, middle, last, overflow, focus expansion, transition interrupted |
| Popup | closed, open, alternate anchor edge, item activation, Back dismissal, focus return |
| Route | first entry, forward navigation, back restore, reload/deep link |
| Responsive layout | target viewport plus at least one materially different width/height |

## Final compliance checklist

- `html`, `body`, and the mount root establish a nonzero full-viewport
  containing block.
- The complete document and app window use
  `--uit-color-background-window`; no root override exposes a transparent or
  white backing surface.
- Entire application surface inside `App`, which loads the toolkit styles.
- Each route uses `Page` or `SubNavigationPager`, not both.
- No in-app back button.
- Semantic toolkit component chosen before foundation/generic HTML.
- Only filled, semantically appropriate icons; no gesture-icon misuse.
- No hardcoded device dimensions, component colors, typography, radii, or
  internal spacing; token references do not carry copied literal fallbacks.
- Routine authored text uses `BODY2`, `BODY2_EMPHASIZED`, label, or metadata
  styles. Larger body, heading, display, and numeral styles have a specific
  product justification and were verified across the complete device surface.
- Every Chip, Tag, Button, and AppBadge retains its intrinsic width and height;
  no prop, CSS, flex/grid rule, transform, or wrapper resizes it. Header is
  rendered only by Page, remains intrinsically sized, and never appears in
  authored content, lists, or rows.
- No custom code, generic HTML/CSS, material, foundation primitive, or
  composition of the toolkit components imitates, reconstructs, approximates, or works
  around any other toolkit component's appearance, anatomy, intrinsic sizing,
  material, clipping, focus, interaction, animation, or state contract.
- Unsupported component behavior is recorded as an API gap or addressed with a
  genuinely different semantic pattern; it is never synthesized locally.
- Toolkit token variables use `--uit-` names.
- Long free-floating text has one appropriate material background.
- No doubled rounded containers.
- `Container`, `StaticContainer`, and `Surface` each remain the sole material
  owner: none contains `StaticContainer`, `Container`, `Button`, `Surface`,
  `Chip`, `Tag`, or `Header`, and no member of that set nests another.
- Media-overlay text has a real toolkit scrim/material beneath it, and every image
  was visually verified to match its subject and alt text.
- All ListItems are in VerticalList with no extra row spacing or navigation chevrons.
- Every runtime timestamp value is a point in time rather than a duplicated
  status, and all user-facing copy passes grammar/pluralization review.
- Exactly one vertical scroll owner exists per route or pager child.
- A route containing `ListItem` uses one root `VerticalList`; no `VerticalList`
  or `ListItem` appears inside `ScrollView` or authored vertical overflow.
- Page-level horizontal actions use a bottom-docked ButtonRail/ButtonGroup
  outside the vertical owner; the owner stops above it, the dock has
  `--uit-spacing-xsmall` bottom clearance, and rails are edge-to-edge.
- ButtonRail/ButtonGroup is not used as a substitute for SubNavigationPager.
- Visual-only controls do not pretend to be standalone interactions.
- Interactive parent contains no interactive descendants.
- Popups use App portal/anchor infrastructure and dismiss before route back.
- Focus order, boundary scrolling, and restoration verified with rapid D-pad input.
- Layout works beyond the current emulator size.
- All applicable states and full scroll extent visually reviewed.
- Formatting, lint, tests, production build, and package-export validation pass.
- Structural validation reports zero findings; none are waived or reclassified
  by the application author.
