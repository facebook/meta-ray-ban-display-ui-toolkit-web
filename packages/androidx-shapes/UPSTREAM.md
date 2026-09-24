# Upstream source and port information

This package contains a TypeScript derivative of AndroidX
`androidx.graphics.shapes`, developed as part of the Android Open Source
Project.

## Upstream

- Project: AndroidX `graphics-shapes`
- Version: `1.1.0`
- Maven coordinate: `androidx.graphics:graphics-shapes:1.1.0`
- Source artifact SHA-1: `b6203a8ca381b832ddccc476fb40407ff4e7e802`
- Source tree:
  https://android.googlesource.com/platform/frameworks/support/+/androidx-main/graphics/graphics-shapes/src/commonMain/kotlin/androidx/graphics/shapes/
- Copyright: `Copyright 2022 The Android Open Source Project`
- License: Apache License, Version 2.0

## Derived files

- `src/AndroidXShapes.ts`
- `src/AndroidXShapes.types.ts`

Other files in this package, including `src/index.ts` and `vite.config.ts`, are
Meta-authored package integration code rather than translations of AndroidX
source.

## Modifications by Meta

Meta Platforms, Inc. made the following changes to the upstream work:

- translated the required rounded-polygon, corner-rounding, cubic-curve, and
  geometry logic from Kotlin to TypeScript;
- represented source data with TypeScript interfaces and numeric tuples;
- limited the exported API to the geometry required by UI Toolkit for Meta Ray-Ban Display;
- serialized the resulting cubic curves as SVG path data; and
- adapted numeric formatting and edge-case handling for JavaScript execution.

These modifications remain licensed under the Apache License, Version 2.0. See
`LICENSE` for the complete terms and `NOTICE` for attribution.
