/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * QuickReplyButton public API for Meta Ray-Ban Display.
 */

import type { ContainerProps } from '@wearables-ui-toolkit/foundation/components/Container';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';

export interface QuickReplyButtonProps
  extends Omit<
    ContainerProps,
    | 'children'
    | 'width'
    | 'height'
    | 'materialTransition'
    | 'visualStateOverride'
    | 'visualStateForInteractionStateFn'
    | 'contentScaleForStateFn'
    | 'stateChangeAnimations'
  > {
  /** Button text */
  title?: string;

  /** Icon. Reveals on focus/press. */
  icon?: IconSource;
}
