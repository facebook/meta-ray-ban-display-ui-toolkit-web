/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';

/**
 * A minimal vector icon for tests that need an `IconSource` handle. It renders
 * as an inline `<svg>` with a single non-empty path, so icon-presence and
 * inline-vector assertions hold without depending on any bundled icon set.
 */
export const TEST_ICON: IconSource = {
  viewBox: '0 0 24 24',
  paths: [{ d: 'M4 4h16v16H4z' }],
};
