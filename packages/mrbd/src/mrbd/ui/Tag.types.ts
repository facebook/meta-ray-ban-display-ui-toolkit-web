/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StaticContainerProps } from '@wearables-ui-toolkit/foundation';

/**
 * Tag inherits the full DOM/extensibility contract (HTMLAttributes, ...rest
 * forwarding) from StaticContainerProps, so consumers can pass standard DOM
 * props (onClick, data-*, title, etc.) which the component forwards to the root.
 */
export interface TagProps extends Omit<StaticContainerProps, 'children'> {
  /** The text to display in the tag. */
  text?: string;
}
