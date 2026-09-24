/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ReactNode } from 'react';
import type { ContainerProps } from './Container.types';

/**
 * Panel props.
 * Panel is non-focusable and non-clickable by default.
 */
type PanelInteractionProp =
  | 'contentScaleForStateFn'
  | 'interactive';

export interface PanelProps extends Omit<
  ContainerProps,
  PanelInteractionProp
> {
  /** Panel content. */
  children?: ReactNode;
}
