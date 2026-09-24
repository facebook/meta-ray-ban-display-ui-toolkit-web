/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { MaterialLibrary as FoundationMaterialLibrary } from '@wearables-ui-toolkit/foundation';
import { createContentFocusContainerMaterial } from './ContentFocusContainerMaterial';

/** MRBD material factories, including the shared foundation materials. */
export const MaterialLibrary = {
  ...FoundationMaterialLibrary,

  /** Focus treatment for containers whose content supplies the fill. */
  contentFocus: createContentFocusContainerMaterial,
};
