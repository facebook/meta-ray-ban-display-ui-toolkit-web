/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { forwardRef, memo } from 'react';
import {
  Pager,
  type PagerHandle,
  type PagerProps,
} from '@wearables-ui-toolkit/mrbd';

type LauncherPagerProps = Omit<PagerProps, 'useBackButtonForHome'>;

/**
 * Pager whose page changes are owned by launcher route history.
 *
 * Launcher navigation records every non-home page in browser history. Disabling
 * Pager's transient Back entry here keeps one owner and one traversal for Back
 * across horizontal, vertical, and future launcher pagers.
 */
export const LauncherPager = memo(forwardRef<PagerHandle, LauncherPagerProps>(
  function LauncherPager(props, ref) {
    return <Pager {...props} ref={ref} useBackButtonForHome={false} />;
  },
));
