---
name: uit-surfaces-media-web
description: Build or review UI Toolkit for Meta Ray-Ban Display Container, StaticContainer, Panel, Surface, Card, CardStack, Carousel, MediaWrapper, Scrim, and Vignette compositions. Use for interactive/static materials, information grouping, custom widgets, image cards, arbitrary card content, media collections, horizontal paging, text-over-media contrast, pannable-media edges, responsive sizing, clipping, or nested-container problems.
---

# UI Toolkit for Meta Ray-Ban Display surfaces and media

Read [../building-uit-interfaces-web/references/content-surfaces-media.md](../building-uit-interfaces-web/references/content-surfaces-media.md). Apply `uit-materials-web` for custom paint or color.

Read [references/surface-media-components.md](references/surface-media-components.md) for prop-level composition and media-layer behavior.

## Choose correctly

- Semantic component first.
- Container: whole custom content region is one interactive target.
- StaticContainer: non-interactive material renderer in an explicit visual state.
- Panel: one backdrop behind a coherent informational region; use its
  documented semantic corner-radius and content-inset tokens.
- Surface: uncommon lower-emphasis secondary interactive surface; avoid for new primary work.
- Card: featured arbitrary content as one destination, optionally over media/scrims.

A page-level Panel backdrop typically reaches both left and right screen edges;
set `width="100%"` on that Panel rather than relying on its default width, and
inset its non-full-bleed children with `var(--uit-spacing-large)` rather than
insetting the Panel frame. Modal is intentionally different: the Modal surface
is inset from the screen edges, with its content inset inside that surface.

Do not simulate Tags, Chips, Headers, Buttons, list rows, or any other toolkit
component with `StaticContainer`, Container, Surface, Panel, rounded generic
HTML, custom code/materials, or a combination of the toolkit components. Changing or
combining primitives does not legalize unsupported sizing, anatomy, behavior,
or visuals.
A full-width rounded material containing only a short genre, quantity, or state
label is a fake stretched compact component. Use the semantic component at its
intrinsic size when its meaning fits, or use ordinary text/layout. Use
StaticContainer only when a real non-interactive material region is required,
not as an escape hatch from another component's contract.

Container accepts custom `children`; it is not a precomposed row and has no
`title`, `subtitle`, `text`, or `icon` shortcut props. Use ListItem or Button
when their standard anatomy matches the design. A Container's visible and
accessible label must describe its actual handler outcome, and it must not
remain focusable in a state where that handler can do nothing.

An interactive Container cannot contain interactive children. Panel is a
backdrop, not an item primitive: never use repeated Panels to simulate rows,
records, facts, settings, or actions. Use ListItem for supported list rows or
Container for a bespoke interactive item. Never double rounded rectangles
merely to put content inside a surface.

Treat `Container`, `StaticContainer`, and `Surface` as equal material-owning
parents for composition rules. Never place `StaticContainer`, `Container`,
`Button`, `Surface`, `Chip`, `Tag`, or `Header` inside any of those parents, and
never nest any other member of that set inside another member. The outer
component must be the sole owner of the material, shape, clipping, interaction
boundary, and semantic role. Use ordinary semantic layout for its content.
`Header` is page-owned infrastructure and must be configured through `Page`
rather than authored in surface content.

These surface components do not replace content layout. Wrap non-full-bleed
content in one semantic layout and inset it from every `Container`,
`StaticContainer`, `Surface`, or `Panel` edge with
`var(--uit-spacing-large)`. Do not rely on padding outside the component: outer
route spacing positions the surface, while the internal inset protects its
content from the material edge. Full-bleed media instead uses the owning
component's clipping.

If an inset child has rounded corners, those corners must remain concentric with
the parent's corners. Select the semantic corner token that represents the
parent radius minus the tokenized inset. For the common medium-radius parent
and large inset, use `var(--uit-corner-radius-xxsmall)` on the inner content.
Do not reuse the parent's radius, estimate a visually similar radius, or add a
second container merely to obtain clipping. If the subtraction does not map to
an available corner token, change the supported radius/inset combination or
make the media full bleed.

Author short eyebrow, category, and field-label strings in all caps when they
use the secondary text color. Keep headings, body copy, values, actions, and
long metadata in their normal casing.

## Media

- Use real imagery, not CSS gradients pretending to be images.
- Use semantically relevant, deterministic imagery. Never use random-image or
  seeded-placeholder services for content-specific records.
- Card accepts arbitrary content. Use `CardAboveScrim` for foreground content protected by built-in scrims.
- Card is a focusable interactive destination, not a decorative image frame.
  Give it a truthful action and accessible label. Use a non-interactive media
  or StaticContainer composition when the region has no action.
- Card scrim layers are positioned inside the Card and do not size it. Before
  placing a full-bleed image in a Card, give the Card a nonzero responsive
  inline size and a nonzero block-size or content-derived aspect ratio. An
  image whose inline/block sizes are both `100%` cannot establish its own
  parent's geometry. In Carousel, size each child destination as well as the
  Carousel's available region; assert every settled item and Card rectangle is
  nonzero.
- Focus/press highlights must remain visible without obscuring opaque card content.
- CardStack is one media collection destination; background cards are not actions. Leave focus expansion room and stack vertically if side-by-side clips.
- Carousel pages horizontally through arbitrary items, not just image cards. Size responsively and keep pagination near content.
- Every Carousel child destination must be focusable and meaningfully labeled so focus-driven centering works; do not customize its internal layout/spacing machinery from application code.
- Scrim protects arbitrary foreground content. MediaWrapper instead owns a dark content slot plus the gradient that blends that slot into media; do not treat them as interchangeable. Foreground text must render above a standalone scrim.
- Vignette indicates offscreen media edges during pan/zoom; it is not a text scrim.

## Avoid

- static Container when StaticContainer fits;
- actionable Panel or repeated Panel-as-item compositions when Container or
  ListItem fits;
- Surface as default new primitive;
- nested rounded image/content wrappers;
- nonconcentric corners on inset rounded content;
- multiple actions inside one Card;
- independent actions on CardStack background cards;
- clipped Carousel focus scale;
- zero-size Card/Carousel items or invisible focus targets;
- display-only Card with no truthful activation outcome;
- hardcoded CardStack width; measure responsive available space when numeric width is required;
- permanent vignette edges at reached media boundaries.

Validate every state, responsive size, shape/clipping, image load, content contrast, first/last carousel item, indicator spacing, focus expansion, and device compositing.
