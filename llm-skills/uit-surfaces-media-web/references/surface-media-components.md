# Surface and media component guide

## Container

Container combines InteractableBase with material/shape/clipping/content presentation. Important advanced props:

- `material`, `shapeProvider`, `clipContent`;
- responsive `width`/`height`;
- `visualStateOverride` for externally driven render state;
- `materialTransition` for scrubbed/scripted state transition;
- interaction-to-visual-state and content-scale mapping;
- custom scale/alpha and scale callback;
- synchronized state-change animations.

Container is an unopinionated host. Its product content is supplied through
`children`; it does not have `title`, `subtitle`, `text`, or `icon` convenience
props. Compose ordinary semantic layout and `TextView` children inside it. If
the design needs standard row anatomy, use `ListItem`; if it needs a standard
action, use `Button`. Do not guess higher-level component props onto
`Container`.

Use advanced state overrides for coordinated infrastructure, not to fake focus. Ordinary focus/press derives from interaction. Polymorphic `as` preserves semantic element/router-link props.

The whole Container is one action. Its accessible label and visible content
must describe the actual handler outcome. Exercise every state in which it is
focusable; do not leave a conditional handler that can return without a result.

Do not place `Container`, `StaticContainer`, `Button`, `Surface`, `Chip`, `Tag`,
or `Header` inside a Container. Inset authored non-full-bleed content with
`var(--uit-spacing-large)`; let full-bleed content use Container clipping.

## StaticContainer

Renders a material in a fixed `visualState`; background style may be none/primary/secondary. It supports shape, clipping, smooth-corner opt-out, responsive dimensions, content class, and coordinated layout-transition inputs for intrinsic content changes.

Use `backgroundStyle=NONE` when clipping is needed without visible background. Do not attach focus/press expectations.

StaticContainer is not a generic replacement skin for another toolkit component.
Do not put one short category, count, status, or action label in a rounded
full-width StaticContainer to imitate a stretched Tag, Chip, Header, Button, or
row. Use the real intrinsic component or ordinary text hierarchy.

The same prohibition applies to every surface and every toolkit component: never
combine foundation primitives, the toolkit components, custom materials, or generic
code into a local reconstruction/workaround of an existing component or an
unsupported variant of it. Use a different semantic pattern or treat the need
as a library API gap.

Do not place `Container`, `StaticContainer`, `Button`, `Surface`, `Chip`, `Tag`,
or `Header` inside a StaticContainer. Inset authored non-full-bleed content with
`var(--uit-spacing-large)`.

## Panel

Panel derives Container behavior but is non-focusable/non-clickable by default
and keeps content scale stable. It is one backdrop for a coherent informational
region, not a row or item surface. Do not stack or repeat Panels to represent a
list of records, fields, settings, statuses, or actions. Use ListItem for a
supported list row, Container for one bespoke interactive item, and ordinary
semantic layout inside one Panel when several related facts need a shared
backdrop. If infrastructure makes a Panel interactive, the whole backdrop is
one target and children remain noninteractive. Use the documented semantic
Panel content-inset and corner-radius tokens.

## Surface

Surface offers semantic radii XXSMALL–XLARGE, optional background, dimensions, clipping, and interactable state. It is a compatibility/lower-emphasis primitive. Prefer Container for new custom actionable regions.

Do not place `Container`, `StaticContainer`, `Button`, `Surface`, `Chip`, `Tag`,
or `Header` inside a Surface. Inset authored non-full-bleed content with
`var(--uit-spacing-large)`.

## Rounded inset content

An inset image or other rounded child must be geometrically concentric with its
rounded owner. Choose the semantic corner token equal to the owner's radius
minus the inset token. The standard medium outer corner plus large inset uses
the xx-small inner corner. If an exact token pairing is unavailable, change the
radius/inset combination or make the content full bleed; do not use a literal,
an approximate radius, or another nested material component.

## Card

Card is Container-based arbitrary content with `topScrim`/`bottomScrim` (`NONE`, `SMALL`, `MEDIUM`, `TALL`, `FULL`). Use `CardBelowScrim`/ordinary media for background content and `CardAboveScrim` for text/control overlay requiring legibility. The entire Card is one destination; descendants should not be independent actions.

Choose scrim size based on foreground region, not image darkness in one asset. Keep text inside protected region and test different imagery.

## CardStack

Stack type:

- interactive: primary Card owns interaction; maximum two background cards;
- display: static collection visualization; maximum three background cards.

Aspect ratio is square or portrait. `backgroundCards` accept image or custom content. Width is numeric; derive from a responsive measured frame. Optional height/max bounds constrain layout. Scrims apply to primary Card.

## Carousel

Each child is an item. Important props:

- `itemGap` (prefer default token-derived gap);
- `onItemCentered`;
- optional dot/text pagination;
- vertical center/bottom alignment;
- indicator under content or bottom overlay with distance;
- initial index, fading-edge length;
- progress-indicator customization;
- handle `scrollToPosition` centers/focuses and reports item.

Items must be focusable and sized so first/last centered focus does not clip. Let Carousel own centering and indicator state.

## MediaWrapper

Children are content in an owned dark anchor slot at top/bottom; the wrapper manages the gradient into surrounding media. `SMALL` and `LARGE` choose gradient extent. This is not merely a gradient overlay and is not interchangeable with Scrim.

## Scrim

Directional gradient (`LEFT`, `RIGHT`, `TOP`, `BOTTOM`, `FULL`) placed between media and foreground. It is visual-only. Ensure DOM/z-order puts foreground content above it.

## Vignette

Four independent visual edge fades over panned/zoomed media. `enabledEdges`, global `animate`, and per-edge animation overrides follow viewport/media-boundary state. On restored state, disable animation when a synchronous final frame is required.

## Review matrix

Check semantic primitive selection, absence of repeated Panel-as-item layouts,
nested material primitives and interactivity, shape/clipping at all states,
token-based surface insets, concentric inner corners, custom material ownership,
arbitrary Card content, scrim z-order/coverage, CardStack limits/expansion,
Carousel first/last/indicator geometry, MediaWrapper slot contrast, and Vignette
edge truth during pan/zoom.
