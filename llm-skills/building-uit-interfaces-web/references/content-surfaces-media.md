# Content, surfaces, and media

## Contents

- [Text and legibility](#text-and-legibility)
- [Mixed-content text stacks](#mixed-content-text-stacks)
- [Icons](#icons)
- [Identity and badges](#identity-and-badges)
- [Choosing a surface](#choosing-a-surface)
- [Cards and collections](#cards-and-collections)
- [Media contrast](#media-contrast)

## Text and legibility

Use `TextView` or a `TextAppearance` class for all composed text. Select the correct semantic HTML element independently of appearance:

`TextView`'s public prop is `textStyle`; it has no `appearance` prop. Pass a
`TextStyle` value to `textStyle`, as below. Use a `TextAppearance` string only
as a CSS class on an ordinary semantic element when that separate pattern is
actually needed; never pass it as a guessed component prop.

```tsx
<TextView as="h2" textStyle={TextStyle.BODY2_EMPHASIZED}>
  Trail conditions
</TextView>
<TextView as="p" textStyle={TextStyle.BODY2} textColor={TextColor.SECONDARY}>
  The north overlook is open.
</TextView>
```

Do not set custom font family, size, weight, line height, letter spacing, or
literal color to imitate the toolkit. Use sentence case except for genuine names,
concise established metadata, and secondary-color eyebrow/category/field
labels. Author those short labeling strings in all caps; do not transform
ordinary headings, body copy, values, actions, or long metadata to all caps.
Always assign these labels an explicit semantic `TextStyle` appropriate to the
chosen stack; do not rely on the default `TextView` appearance.

Build routine product hierarchy with `TextStyle.BODY2`,
`BODY2_EMPHASIZED`, label, and metadata styles. `BODY2` is the normal body size
and practical ceiling. A semantic heading does not need a heading appearance;
use `as="h2"` with `BODY2_EMPHASIZED` when the document structure calls for a
heading but the interface does not need larger text. `BODY1`, heading, display,
and numeral styles are exceptional and require a concrete product need plus
on-device visual justification. A rare primary numeric readout is the common
exception.

`TextView` does not create vertical stack spacing by itself. Give stacked text
semantic block elements (`as="p"`, the appropriate heading element, and so on)
and put them in an explicit column layout with token spacing. Two default
inline TextViews placed next to one another will concatenate; padding on their
parent does not create spacing between them.

Long free-floating paragraphs may need a material backdrop for reliable
legibility and grouping. One `Panel` or `StaticContainer` behind the text is
appropriate. Do not then add another rounded rectangle immediately around the
text.

Use `ReadMoreTextView` to clamp optional supporting copy. It fades the underlying text with a mask and displays a non-interactive label. The application must provide the separate expanded reading flow; do not attach action semantics to the label itself. Never clamp required instructions.

Use `TextSwitcher` for a short in-place value whose continuity benefits from a crossfade. Do not use it for paragraphs or rapidly changing telemetry.

Render one representation of a point in time. Do not place relative and
absolute forms of the same timestamp together (for example, “2 hours ago ·
Wed, Aug 12, 4:20 AM”); choose the form that best supports the task and expose
the other only in a distinct detail when genuinely needed.

### Mixed-content text stacks

For routine custom content, start with this compact stack:

- title: `TextStyle.BODY2_EMPHASIZED`
- body: `TextStyle.BODY2`
- supporting context: `TextStyle.META1` or `TextStyle.META2`
- token spacing chosen for the relationship between those elements

Keep semantic HTML structure independent from visual size. The larger stacks
below are established specialized hierarchies, not default recipes. Use them
only when the product specifically calls for that editorial hierarchy and the
complete surface has been verified on-device. Do not select one simply because
custom content contains a title, body, and metadata.

Primary text stack:

- `TextStyle.HEADING1`
- `TextStyle.BODY1`
- `TextStyle.META1`
- outer spacing: `calc(var(--uit-spacing-large) + var(--uit-spacing-xsmall))`

Secondary text stack:

- `TextStyle.HEADING2`
- `TextStyle.BODY2`
- `TextStyle.META1`
- `TextStyle.META2`
- outer spacing: `calc(var(--uit-spacing-large) + var(--uit-spacing-xsmall))`

News text stack:

- eyebrow: all-caps copy with `TextStyle.META2` and `TextColor.SECONDARY`
- lead: `TextStyle.BODY1`
- detail: `TextStyle.LABEL`
- source: `TextStyle.META3`
- outer spacing: `calc(var(--uit-spacing-large) + var(--uit-spacing-xsmall))`
- lead-to-detail spacing: `var(--uit-spacing-small)`

“Outer spacing” separates the stack's major text roles. The tighter
lead-to-detail spacing keeps those two lines perceptually grouped. Use these
token expressions directly; do not replace them with resolved lengths.

## Icons

Icon props accept `IconSource`:

- an inline vector source (`viewBox` and paths);
- a bare URI string, tinted as a monochrome mask;
- `{ uri, tinted: true }` for a tinted asset;
- `{ uri, tinted: false }` for full-color artwork.

Prefer filled icons from `@wearables-ui-toolkit/icons`. Choose an icon that directly represents the action/content; do not settle for a vaguely related symbol. Gesture icons are reserved for explaining their specific gestures and must not be used as ordinary controls or decoration.

Let the host component own icon size, margin, tint, and centering. Do not pass JSX into an `IconSource` prop or style an internal icon. Use dedicated custom-content slots only where the component explicitly provides one.

Use `IconImage` for a genuinely standalone icon. Add `aria-hidden` when decorative; label its meaningful parent rather than creating an unlabeled visual.

## Identity and badges

Use real imagery for known people. `Avatar` supports:

- semantic sizes and circle/rounded-rectangle shape;
- primary image or custom content;
- duo identity with a secondary image/content;
- image or custom-content badge;
- semantic status indicator with optional glyph;
- placeholder style and optional stroke.

Always provide useful `alt` text unless decorative. Do not fake avatar imagery with gradients or substitute a generic icon when a real identity is available. Do not fake badge/status cutouts with a painted dark circle.

Use an app-style badge as an owned badge slot. For custom app badge content, put a filled icon in a circular `StaticContainer` material and center/inset it within the Avatar-owned badge box. Do not add an extra clipping wrapper around the Avatar itself.

Use:

- `AppBadge` for compact supporting app identity;
- `NotificationBadge` for a short unread count attached to another object;
- `Tag` for static category/attribute metadata;
- `Chip` for compact non-interactive status/metadata with optional icon, avatar, loading, or metadata.

Badges, tags, and chips are not buttons. If users can activate something, choose an interactive semantic component.
Do not imitate Tag/Chip anatomy with repeated `StaticContainer` text pills,
especially inside Panel. Choose the semantic metadata component or plain text
instead of manufacturing a collection of nested mini-surfaces.
Render each fact once. Chips may summarize metadata that is not otherwise
visible in the same region; they must not repeat type, color, temperature,
duration, vessel, or other values already rendered as nearby text.

## Choosing a surface

Choose in this order:

1. A semantic component such as `Card`, `ListItem`, `ControlTile`, or `Modal`.
2. `Container` when the entire custom content region is one interactive target.
3. `StaticContainer` when a material needs rendering without interaction.
4. `Panel` as one backdrop for a coherent informational region.
5. `Surface` only for an established lower-emphasis pattern that specifically requires it.

### Composition invariants

Never nest `StaticContainer`, `Container`, `Button`, `Surface`, `Chip`, `Tag`,
or `Header` inside another member of that set. One component owns the material,
corner shape, clipping, interaction boundary, and semantic role; its children
use ordinary semantic layout. Configure `Header` through `Page`; do not author
it inside content.

Inset non-full-bleed content inside `Container`, `StaticContainer`, `Surface`,
and `Panel` with `var(--uit-spacing-large)`. A full-bleed image may instead rely
on the owning component's clipping.

Rounded inset content must remain concentric with the parent's rounded shape.
Select the semantic inner-corner token whose radius is the parent radius minus
the tokenized inset. A medium-radius owner with a large inset therefore pairs
with `var(--uit-corner-radius-xxsmall)`. Never reuse the parent radius, invent a
literal radius, or approximate between tokens. If no exact token pairing
exists, choose a supported radius/inset combination or use full-bleed content.

### Container

`Container` is the interactive material host and foundation for many components. It coordinates common input, focus/press/disabled/partial-focus states, material transitions, clipping, and content presentation. It is also valid standalone—for example, a weather region whose entire content opens a detailed forecast.

Container does not provide higher-level `title`, `subtitle`, `text`, or `icon`
props. Supply custom content through ordinary semantic `children`. If the
content is actually standard row anatomy, use `ListItem`; if it is a standard
action, use `Button`. If the Container is interactive, its descendants must not
be separate focus targets. Its visible label and accessibility description
must match the handler's real outcome, and every focusable state must produce
that outcome. Do not use it merely to render a static background.

### StaticContainer

`StaticContainer` renders any compatible material in a caller-selected static visual state without focus or press state management. It may contain children and optionally clip them to its shape. It is a renderer, not a general interaction surface and not the same informational pattern as `Panel`.

### Panel

`Panel` is a backdrop for a coherent informational region. Use
`--uit-spacing-large` for authored text/content inset and the documented
corner-radius token. Never copy currently resolved spacing or radius values
into application CSS.

A page-level Panel backdrop typically extends fully to the left and right
screen edges. Do not place it inside the route's ordinary horizontal content
padding. Its non-full-bleed children remain inset from the Panel edge with
`var(--uit-spacing-large)`. A `Modal` follows different geometry: the Modal
surface itself is inset from the screen edges, and its internal content still
uses the required content inset.

Panel is not a list or item primitive. Never stack Panels to simulate records,
fields, settings, statuses, actions, or list rows. Put related noninteractive
content in ordinary semantic layout inside one Panel. Use `ListItem` for a
supported list row and `Container` for a bespoke interactive item. A Panel is
static by default; infrastructure may make the entire backdrop one focus/press
target, but it then cannot contain focusable or interactive children. Do not
rebuild specialized components such as `Modal` from a bare Panel.

Do not place a series of `Container` fact or action tiles inside one Panel.
That composition creates nested rounded surfaces and turns the informational
backdrop into an item collection. Keep coherent information in plain semantic
layout inside the Panel, then place genuinely distinct interactive
destinations outside it using the component appropriate to each destination.

Within that backdrop, give every fact one clear location. Do not repeat a date,
status, quantity, or identity in adjacent labels or delimiter-separated values;
for example, “Wilts May 12 · May 12” is one fact stated twice rather than useful
supporting detail.

### Surface

`Surface` is a lower-emphasis alternative to `Container` for secondary interactive content. It is uncommon and may be removed. Prefer `Container` or a higher-level component for new work.

## Cards and collections

`Card` accepts arbitrary content—not only images. It is one interactive destination and can layer content above built-in top/bottom scrims. Use `CardAboveScrim` for text/controls that need protection from visual content. The focus/press highlight is designed to remain visible over opaque content without obscuring it.

For image-backed custom content, use a real image and dim/subdue it if it functions as texture. Do not fake photography with CSS gradients. Do not put the image in a second rounded inner container.
Use an asset whose subject actually represents the product content. Do not use
random-image endpoints or seed-based placeholder photography for a named
person, place, product, task, event, or record: a technically real but unrelated
photo damages hierarchy and meaning. Bundle/generate an appropriate asset, use
a stable content-matched URL, or omit imagery when none is available.

`CardStack` represents a collection of related media (album, gallery, playlist) as one destination. The background cards preview the collection and are not independent actions. Use at most two background cards for interactive stacks or three for display stacks. Give focus expansion room; stack vertically when side-by-side expansion clips.

`Carousel` pages horizontally through arbitrary items. Items may be Cards, Containers, or other content. It can show dots or text position indicators. Size items responsively, leave focus-scale room at both horizontal edges, and keep the indicator visually near the content. Do not create a large empty region between items and indicator.

## Media contrast

- `Card` scrims: use when the media is already in a Card.
- `Scrim`: place a directional gradient between arbitrary media and overlaid foreground content. Foreground content must be above the scrim in z-order.
- `MediaWrapper`: use when authored content sits in a dark top/bottom content slot over media. It owns both the solid content anchor and the gradient that fades that anchor into the media; it is not interchangeable with a standalone Scrim.
- `Vignette`: use at edges of zoomed/pannable media to indicate more content exists beyond enabled edges. Disable an edge when that media boundary is reached.

Do not use `Vignette` for text legibility. Do not add a scrim where no variable media competes with foreground content. Keep decorative image `alt=""` and `aria-hidden="true"` when the surrounding accessible label already describes the destination.

Naming an authored overlay class “scrim” does not create contrast. Use the toolkit
Scrim/Card scrim layer or a token-driven material that actually paints the
required fade, keep text above it, and inspect the result over the lightest and
darkest parts of every real image. Verify the downloaded asset itself matches
the subject and alt text; a stable stock-image URL is not evidence of semantic
relevance.
