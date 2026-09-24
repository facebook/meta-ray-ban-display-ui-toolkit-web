/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StaticContainerProps } from '@wearables-ui-toolkit/foundation';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';

export interface ActionHintProps extends Omit<StaticContainerProps, 'children' | 'material'> {
  /** Hint text. Defaults to an empty string when omitted. */
  text?: string;

  /** Optional leading icon source */
  icon?: IconSource;
}
