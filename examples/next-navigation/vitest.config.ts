/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from 'vitest/config';

// Keeps `yarn workspace ... test` scoped to this sample instead of resolving
// the repository-wide config. The tests cover pure routing and state modules.
export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
