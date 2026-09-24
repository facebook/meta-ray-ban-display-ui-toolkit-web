#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

if (process.env.WUI_NPM_VALIDATED_PREPACK !== '1') {
  throw new Error(
    'Direct workspace npm pack is unsupported; use the validated staged package pipeline.',
  );
}
