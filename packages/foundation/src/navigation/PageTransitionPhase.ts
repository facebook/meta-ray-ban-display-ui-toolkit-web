/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Shared page-transition phase vocabulary.
 *
 * `PageTransition` writes `data-page-transition-phase` onto each page it hosts,
 * and other modules match against it. Keeping the selector here rather than in
 * `PageTransition.tsx` means a consumer that only needs the phase name does not
 * take a dependency on the component module: this file is a leaf with no
 * imports, so `utils/` can read it without pointing at `navigation/`.
 *
 * `PageTransition.types.ts` is deliberately not the home for this — it declares
 * types only, and this is a runtime value.
 */

/**
 * Matches a page still in the hidden preparation phase, before it becomes
 * visible and animatable.
 *
 * A page in this phase is mounted but not yet shown, so forced layout inside it
 * is work that lands in a frame the user cannot see. Consumers use this to defer
 * measurement until the phase advances. Import this rather than repeating the
 * literal: a phase rename should be a compile-time break, not a selector that
 * silently stops matching.
 */
export const PREPARING_ENTER_PHASE_SELECTOR =
  '[data-page-transition-phase="preparingEnter"]';
