---
name: uit-theming-color-web
description: Apply or review UI Toolkit for Meta Ray-Ban Display themes, semantic colors, typography, spacing, radii, opacity, component color variants, and custom color ramps. Use when changing application appearance, selecting tokens, customizing a subtree, creating gradient steps, checking additive-display contrast, migrating token names, or deciding between CSS theme overrides and a custom ContainerMaterial.
---

# UI Toolkit for Meta Ray-Ban Display theming and color

The toolkit exposes semantic theme roles as `--uit-*` CSS custom properties and constrained component enums. Choose roles by meaning, not by matching a screenshot's RGB value.

Read:

- [Theming and customization](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/theming-and-customization/)
- [../building-uit-interfaces-web/references/tokens-materials-motion.md](../building-uit-interfaces-web/references/tokens-materials-motion.md)
- [../uit-materials-web/references/color-gradient-recipes.md](../uit-materials-web/references/color-gradient-recipes.md) for material ramps.

## Choose the customization surface

- App/subtree-wide semantic role change: override supported `--uit-color-*` or `--uit-spacing-*` roles on `[data-app-root]` or a scoped ancestor. Use `--uit-corner-radius-*` tokens in authored CSS without redefining them.
- Text role: use `TextColor` and `TextStyle`/`TextAppearance`.
- Component content role: use `SubtitleTextColor`, `TimestampTextColor`, `IconTintColor`, or the component's variant enum.
- `StaticContainer`, `Container`, or `Surface` material paint across their
  supported visual states: pass a compatible `ContainerMaterial`. The API
  name does not make `Container` the privileged or default material host.
- One-off layout arrangement: CSS using spacing tokens; do not repaint component internals.

## Theme rules

- Render inside `App`, which loads the toolkit stylesheet.
- Set the document window (`html`, `body`, and the mount root) to
  `var(--uit-color-background-window)`. `App` already paints its full root
  with that token; do not override `[data-app-root]` to transparent.
- Use only current `--uit-` token names.
- Override semantic roles, never internal CSS-module selectors.
- Do not create arbitrary light/dark modes; the display system has one intended theme model.
- Do not hardcode font family, size, weight, line height, or letter spacing.
- Use the full toolkit spacing scale. Authored text/content inside Panel uses
  `--uit-spacing-large`; do not copy its resolved length or substitute another
  spacing token.
- Use semantic corner-radius/shape APIs rather than CSS radius on the toolkit surfaces.
- Use enabled/disabled and elevation roles rather than literal opacity/blur values.
- Reference semantic tokens for colors, spacing, corners, typography, sizes,
  elevation, opacity, and motion. Never transcribe their current resolved values.
- The rule applies inside responsive functions and decorative CSS too.
  `min(560px, 100%)`, `min(100%, 20em)`, `minmax(140px, 1fr)`, `gap: 2px`, an
  `8px` dot, or a literal shadow blur are still hardcoded values. Switching to
  `em`, `rem`, or `ch` does not make an arbitrary value a token. Use the toolkit tokens, flexible
  zero-based tracks, percentages, or runtime measurement from actual available
  space. Do not invent a pixel value merely because it sits inside `min()`,
  `max()`, `clamp()`, grid, or shadow syntax.

## Color rules

- Keep the entire page on the toolkit window background. Use container materials
  for component depth and interaction; do not substitute a transparent page
  or a raw authored page color.
- Use semantic positive/warning/negative/info roles only for matching meaning.
- Do not communicate state by color alone; pair it with icon, text, shape, or state semantics.
- Prefer filled toolkit icons and semantic tint enums.
- Secondary text and icons require the semantic secondary color and its
  compositing behavior as one contract. Prefer `TextColor.SECONDARY`,
  `IconTintColor.SECONDARY`, or the component's equivalent semantic enum. For
  custom HTML or `currentColor` SVG content, apply
  `uit-color-text-secondary` or `uit-color-icon-secondary`. These public CSS
  classes supply both the corresponding color token and required platform
  blend mode. CSS cannot apply `mix-blend-mode` from within a `color`
  declaration, so do not apply `--uit-color-text-secondary` or
  `--uit-color-icon-secondary` alone. The blend behavior is not a customizable
  design token.
- `mix-blend-mode` is not inherited. Put the secondary utility on the element
  that paints the foreground, or an intentional wrapper whose entire rendered
  subtree should blend. Do not apply the icon utility to untinted full-color
  artwork.
- Test custom colors in idle, focused, pressed, disabled, and partial-focus extremes.

## Typography

Use `TextView` with the appropriate semantic element, or apply a `uit-text-*`/`TextAppearance` class for custom markup. Appearances include numeral, display, heading, body, emphasized body, label, emphasized label, and metadata levels.

Typography appearance and semantic color are separate choices. Custom
secondary text needs both a `uit-text-*` appearance class and
`uit-color-text-secondary`; `TextView` applies the color contract when passed
`TextColor.SECONDARY`.

Do not select a heading appearance without correct document hierarchy. Test localization and line limits instead of freezing widths around English strings.

## Material color customization

Use `MaterialLibrary.themedPrimary(theme)` when recoloring the standard
material used by `StaticContainer`, `Container`, or `Surface`. Supply a
designed six-role ramp from the application's approved semantic material
palette: idle fill, four focused gradient steps, and glow tint. Do not scatter
literal colors through component code or approximate a ramp using one color
plus opacity. The host determines whether visual state comes from interaction
or an explicitly selected static state; the material's layer roles and
ownership rules are otherwise the same.

Use the materials skill for layer roles, focus-origin behavior, blend modes, and validation. A CSS token override changes semantic application styling; a material changes an interactive surface's stateful paint system. Do not use one as an accidental substitute for the other.
