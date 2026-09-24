/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { HTMLAttributes } from 'react';

/**
 * Shared base props for standalone toolkit components that are not interactable.
 *
 * Extending this gives a component the full standard DOM attribute surface
 * (className, style, aria-*, data-*, event handlers, etc.) on its root
 * element, without each component hand-redeclaring the same allowlist.
 *
 * Consumers should spread the unrecognized rest props onto the root element
 * so these attributes reach the DOM.
 */
export interface UITCommonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Toolkit custom data attributes. React's HTMLAttributes does not type arbitrary
   * data-uit-* keys, so they are declared explicitly here.
   */
  [key: `data-uit-${string}`]: string | number | boolean | undefined;
}
