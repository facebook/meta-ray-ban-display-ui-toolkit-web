---
name: uit-content-identity-web
description: Build or review UI Toolkit for Meta Ray-Ban Display text, icons, avatars, app badges, notification badges, tags, chips, container headers, ReadMoreTextView, TextSwitcher, and IconImage. Use for typography hierarchy, icon sources/tint, person or duo identity, avatar status/badges, app identity, unread counts, metadata, loading chips, clamped copy, or content accessibility.
---

# UI Toolkit for Meta Ray-Ban Display content and identity

Read [../building-uit-interfaces-web/references/content-surfaces-media.md](../building-uit-interfaces-web/references/content-surfaces-media.md) and apply the theming/color skill for token decisions.

Read [references/content-components.md](references/content-components.md) for complete identity, badge, icon, and dynamic-text behavior.

## Text

Use `TextView` with its public `textStyle={TextStyle.*}` prop, or apply a toolkit
text-appearance class to an ordinary semantic element; `TextView` has no
`appearance` prop. Select semantic HTML separately through `as`. Do not
hardcode font metrics, letter spacing, or literal text colors. Test
localization and max-line behavior.

Build almost every authored hierarchy from `TextStyle.BODY2`,
`BODY2_EMPHASIZED`, label, and metadata styles. `BODY2` is the normal body size
and practical ceiling for routine UI. Semantic heading markup does not require
a visually large heading style. `BODY1`, display, heading, and numeral styles
are exceptional; require a concrete product need and on-device verification.
A rare primary numeric readout is the usual exception.

Write only product content. Do not expose implementation or design-system
rationale such as “uses the toolkit,” “focus moves,” “rail scrolls,” “additive
display,” or “Back preserves scroll.” Those statements belong in engineering
documentation and tests, not in the shipped interface. If input instructions
are a genuine product requirement, phrase them as concise user help rather
than a component implementation description.

Use a single Panel/StaticContainer behind long free-floating copy for additive-display legibility. Do not add a second rounded text container.

`ReadMoreTextView` clamps optional supporting copy and renders a non-interactive overflow label. The application owns the expanded reading flow. `TextSwitcher` crossfades a short changing value; do not use for paragraphs or high-frequency telemetry.

## Icons

Use filled, semantically accurate toolkit icons. `IconSource` supports inline vectors, tinted URI masks, and untinted full-color URI assets. Let the host component own size, alignment, and tint. Never pass JSX into icon props or use gesture icons outside their instructional meaning.

Public filled SVG imports use
`@wearables-ui-toolkit/icons/svg/<semantic-name>__filled.svg`. Do not browse an
icon directory during application generation. Use an exact asset already
established by product requirements or this guidance; otherwise omit the
optional icon. Decoration is not a reason to delay the first working pass or
substitute a semantically weak glyph.

## Avatar and badges

Use real images for known people. Avatar supports semantic sizes/shapes, custom content, duo identities, badges, placeholders, stroke, and semantic status with optional glyph.

- Supply useful alt text unless decorative.
- Use actual images for both halves of a known duo.
- Use the Avatar-owned badge slot.
- For a custom app badge, center/inset a filled icon in a circular StaticContainer material.
- Do not fake cutouts or add a second clipping wrapper.

Use AppBadge for compact supporting app identity, NotificationBadge for a short count attached to another object, Tag for a static category, and Chip for static compact status/metadata. These are not buttons. Fold decorative badge meaning into the accessible label of the object it decorates rather than creating a separate focus stop.

Chip, Tag, and AppBadge always keep their component-owned intrinsic width and
height. Never force one larger or smaller in either axis with props, style,
CSS, flex/grid sizing, transforms, or a constraining wrapper. In a flex column,
align compact children to flex-start; in a row, keep them inflexible at their
intrinsic basis and wrap the owner when necessary. Header also owns its
intrinsic size, but only Page renders it; application content never places or
styles Header directly and never uses it for a section, list, or row. Do not
turn a sequence of ordinary genre, page-count, and status facts into full-width
rounded bars; use a compact inline grouping or the body/metadata text hierarchy
instead.

Do not work around intrinsic sizing by drawing a Chip/Tag/Header-like pill with
StaticContainer, Container, Surface, Panel, or styled HTML. A short fact inside
a full-width rounded material is a fake compact component regardless of which
primitive paints it. Use one real intrinsic component or ordinary text.

Chip leading modes (none, icon, avatar, loading) are mutually exclusive and animate declarative changes. Avoid cycling them without real application state.

ContainerHeader belongs inside a larger Container-owned region. It is not an
arbitrary standalone heading or a VerticalList section label. Page configures
Header and owns route identity; application content does not render Header
directly.

Keep the Page header to a concise route identity and brief supporting metadata.
Do not concatenate every title, timestamp, duration, channel, and location into
the fixed overlay. Verify its rendered bounds at the narrowest viewport and
move overflow-prone facts into the body.

Header title, metadata/subtitle, and textual status are each at most two words.
Metadata/status are optional and omitted unless their high-value context
materially changes interpretation or the next action. They are not overflow
space for routine facts. SubNavigationPager tab titles are one word.

Validate meaningful/decorative accessibility, icon-only labels, 1/2/3-digit badge centering, long text, avatar loading/fallback, duo/badge/status combinations, state transitions after scroll, and additive-display contrast.
