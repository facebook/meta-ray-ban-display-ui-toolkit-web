/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Options as ReactPluginOptions } from '@vitejs/plugin-react';

const reactCompilerConfig = {
  target: '19',
};

export function reactWithCompilerOptions(): ReactPluginOptions {
  if (process.env.UIT_REACT_COMPILER === '0') {
    return {};
  }

  return {
    babel: {
      plugins: [['babel-plugin-react-compiler', reactCompilerConfig]],
    },
  };
}
