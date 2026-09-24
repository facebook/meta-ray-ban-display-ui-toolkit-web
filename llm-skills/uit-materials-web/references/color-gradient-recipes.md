# Material color and gradient recipes

## Contents

- [Use themed materials first](#use-themed-materials-first)
- [Six-color theme roles](#six-color-theme-roles)
- [Constructing gradient steps](#constructing-gradient-steps)
- [Contrast and additive-display behavior](#contrast-and-additive-display-behavior)
- [Review procedure](#review-procedure)

## Use themed materials first

For a colored standard interaction material, use `MaterialLibrary.themedPrimary` with an `OutboundMessageMaterialTheme`:

```ts
interface OutboundMessageMaterialTheme {
  idleFill: string;
  gradientStep1: string;
  gradientStep2: string;
  gradientStep3: string;
  gradientStep4: string;
  glowTint: string;
}
```

This replaces the idle fill, focused radial gradient, and inner-glow tint while retaining the standard noise, pressed overlay, glow stroke, state timing, shape behavior, and partial-focus support.

Prefer built-in `themedPrimaryBlue`, `themedPrimaryGreen`, `themedPrimaryRed`, `positive`, `negative`, `themedSecondary`, or `system` when their semantics fit.

## Six-color theme roles

- `idleFill`: resting material. It must remain quiet enough that focus is clearly distinguishable and content remains readable.
- `gradientStep1`: brightest/chroma-rich focus core.
- `gradientStep2`: transition color after the core.
- `gradientStep3`: deep falloff toward the outer region.
- `gradientStep4`: darkest outer extent, often close to the surrounding surface.
- `glowTint`: edge illumination/inner glow. Usually related to step 1 but may be adjusted for readable luminous contrast.

The default radial focus gradient is elliptical and intentionally offset. Partial focus shifts its origin, so evaluate the complete gradient—not just a color strip.

## Constructing gradient steps

Do not derive steps by changing alpha on one RGB value. Alpha mixes unpredictably with transparent real-world backgrounds and may flatten the material.

Use a perceptual color space such as OKLCH to construct a monotonic ramp:

1. Choose a hue/chroma that represents the intended semantic or product role.
2. Select `step1` as the luminous focus core while preserving foreground-content contrast.
3. Reduce lightness and usually chroma progressively for steps 2–4.
4. Keep hue stable unless an intentional multi-hue material is designed and reviewed.
5. Make step 3/4 deep enough to merge into the idle/surrounding surface without a visible ring.
6. Set `glowTint` from the bright side of the ramp, then test it with `screen`/overlay blending.
7. Choose `idleFill` independently; it need not equal any focused step.

A practical starting relationship is:

- step 1: highest lightness and chroma;
- step 2: medium lightness, slightly reduced chroma;
- step 3: low lightness, materially reduced chroma;
- step 4: very low lightness, subdued chroma;
- glow tint: near step 1, tuned for edge visibility.

This is a role recipe, not fixed numeric values. Use an approved color-ramp/contrast pipeline when available. Do not claim that one seed color can safely generate a complete accessible material unless the actual pipeline enforces perceptual spacing and contrast.

## Contrast and additive-display behavior

The display adds emitted light to the real world. Pure assumptions about an opaque black page background are unsafe.

- Test foreground text/icons over idle, focus core, gradient falloff, pressed overlay, and partial-focus extremes.
- Preserve enough dark material body for light foreground content.
- Avoid broad pale/white focused fills that wash out content.
- Ensure disabled opacity remains distinguishable without becoming invisible.
- Check semantic positive/negative hues for meaning and readable contrast; do not use color as the only state cue.
- Evaluate glow and gradient against varied bright/dark backgrounds on device.
- Use scrims/material backdrops behind paragraphs or media-overlay text.

Do not put arbitrary custom color literals into component CSS. Feed a custom
material configuration from an approved, named application material palette;
ordinary application colors should use semantic `--uit-color-*` variables or
component enums. Keep raw source colors confined to the palette-generation or
theme-definition boundary, never copied into component implementations.

## Review procedure

Create a matrix covering:

- small button, wide ListItem/Container, tall card-like host;
- default, focused, pressed, disabled host;
- focus origin centered and shifted to every supported direction;
- icon-only, text-only, and mixed foreground content;
- smooth rounded and any custom shape;
- real device backgrounds with varied brightness;
- rapid focus/press interruption.

Look for:

- visible banding or hard rings between steps;
- hue drift or muddy midpoints;
- focus core obscuring text/icons;
- glow stroke disappearing at one edge;
- idle state competing with focused neighbors;
- pressed state reading as a second unrelated material;
- partial focus exposing an unbalanced bright edge;
- blend modes producing a different result in WebView.

Keep color changes and layer-geometry changes separate during review so failures can be attributed correctly.
