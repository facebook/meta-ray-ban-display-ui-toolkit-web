# Content and identity component guide

## TextView and appearances

`TextStyle` exposes these exact members: `NUMERAL1`, `NUMERAL2`, `DISPLAY1`,
`HEADING1`, `HEADING2`, `BODY1`, `BODY1_EMPHASIZED`, `BODY2`,
`BODY2_EMPHASIZED`, `LABEL`, `LABEL_EMPHASIZED`, `META1`,
`META1_EMPHASIZED`, `META2`, `META2_EMPHASIZED`, and `META3`. Do not infer a
generic `METADATA` or other alias. `TextColor` is semantic: primary, secondary,
placeholder, active-hover, accent. `as` selects span/p/div/heading/label
semantics.

Pass `TextStyle` through `textStyle`. `TextView` does not expose an
`appearance` prop; `TextAppearance` values are CSS class names for ordinary
semantic markup, not interchangeable component-prop values.

Use `BODY2` and `BODY2_EMPHASIZED` for routine content, including most visual
titles, with label and metadata styles for supporting hierarchy. Keep semantic
heading markup independent from visual size. `BODY1`, heading, display, and
numeral styles are exceptional rather than a default hierarchy; large numeral
styles are only for rare primary numeric readouts.

Render authored eyebrow/category/field labels in all caps with
`TextColor.SECONDARY`. Authored subtitles and supporting labels also use
secondary text color; their related title/value remains primary. Use the
component's built-in subtitle treatment when one exists rather than overriding
component internals.

Never target `TextView` or another toolkit component's rendered descendants,
generated classes, roles, attributes, pseudo-elements, or internal state from
application CSS/DOM code. Use documented public props such as `textColor` for
the component instance being authored. A public root `className` does not grant
access to internal anatomy.

When a visible heading already supplies the object identity, supporting body
copy starts with new capability, state, or context. Do not repeat the title as a
substring of the first sentence with only an adjective or category added.

## IconImage

IconSource supports:

- inline vector viewBox/paths rendered as currentColor;
- URI string shorthand for tinted monochrome mask;
- `{uri, tinted: true}` mask;
- `{uri, tinted: false}` full-color image.

Full-color app/brand imagery may need dedicated media props rather than an icon slot. Standalone IconImage is decorative unless assigned/owned by a meaningful labeled parent.

For a required icon whose exact public name is unknown, run
`../scripts/find-filled-icon.mjs <concept> [<concept> ...]` once from the
application workspace, quoting multi-word concepts. It queries the package's
public manifest and prints a small filled-icon candidate set for every concept.
Choose a result only when its meaning matches the action/content; omit optional
decoration when none matches. Do not browse icon directories, search export
barrels, or substitute an outline or gesture icon.

## Avatar

Sizes range from XXSMALL through XXXLARGE; use semantic size rather than pixels. Shapes are circle or rounded rectangle. Styles include standard/surface/transparent/translucent. Primary and secondary content override image URLs/placeholders. A secondary source/content creates duo layout.

Badge content/image and status indicator occupy the supporting badge area and should not communicate competing meanings simultaneously. Status types include active, inactive, notification, unread, positive, negative, warning, caution. Provide localized status labels when defaults are inappropriate and an icon only when the dot backdrop exists.

`showStroke` adds the supported glow stroke; do not create an outside border.

## AppBadge and NotificationBadge

AppBadge is a static icon badge with optional custom shape. It is decorative in many compositions; expose its meaning through the decorated control.

NotificationBadge has fixed height, at least square width, and grows for a short single-line value. Use compact counts such as 1, 12, 99+. Include count context in the owning control's label. Do not place long exact values in it.

## Tag and Chip

Tag is a concise static category/attribute. Although inherited DOM props may technically forward events, do not turn it into an action; choose Button/Container.

Chip styles:

- emphasized: primary hierarchy/header-like label;
- deemphasized: subtle tooltip/metadata label;
- elevated: higher-emphasis transient/status content.

Chip supports text/max lines, metadata, and exactly one leading mode: icon, Avatar, or loader. Avatar can include duo/badge/status. Prop changes trigger built-in transitions; keep identity fields coherent and avoid simultaneous incompatible modes.

Chip, Tag, and AppBadge are intrinsic compact elements in both axes.
Application layout never assigns or constrains their width/height and never
scales them. A flex column's default cross-axis stretch can turn them into
full-width bars; align the compact group to flex-start. Keep row children at
their intrinsic basis and wrap the group rather than growing or shrinking the
components. Header is also intrinsically sized, but Page is its only owner;
never render it directly or use it as an arbitrary content/list heading. Do not
represent a detail page's routine genre, quantity, and state as a vertical
stack of rounded metadata bars. Prefer the body/metadata text hierarchy unless
the value is a genuinely compact badge-like status.

## Header and ContainerHeader

Header is page-only route context configured through Page. It supports
text/max lines, metadata, one leading mode (icon/avatar/loading), rich Avatar
content, and a combined accessible label. Do not render it directly as
arbitrary application content or a list/section heading.

ContainerHeader is identity inside a larger Container-owned region. It
supports title/subtitle and icon or Avatar/badge/status. It is not a route
header, a standalone arbitrary heading, or a VerticalList section label, and
it does not create another surface.

## ReadMoreTextView

Use for optional long supporting text. `maxLines`, semantic text style/color, custom read-more label, overflow callback, and handle behavior are defined by current API. The component masks text beneath its affordance so it works on any background. It does not own the navigation/expanded content action.

## TextSwitcher

Static material surface for one short value. `text` changes crossfade; `duration`, `animated`, and first-view policy control behavior. Keep the component mounted and update the text prop. Do not wrap it in another rounded material.

## Review matrix

Validate semantic hierarchy, localization, max lines, icon tint/full color, Avatar load/error/placeholder, duo/badge/status cutouts, decorative versus meaningful accessibility, 1/2/3-character counts, Chip mode transitions after scroll, read-more masking on multiple materials, and rapid TextSwitcher updates.
