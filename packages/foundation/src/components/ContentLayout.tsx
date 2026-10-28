/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { forwardRef, type HTMLAttributes } from 'react';

/** Optional independent content reference box; surface padding supplies an inset origin. */
export const ContentLayout = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function ContentLayout({ style, ...props }, ref) {
    return <div {...props} ref={ref} style={{ position: 'relative', boxSizing: 'border-box', ...style }} />;
  },
);
