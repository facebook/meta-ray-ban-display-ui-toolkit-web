/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  HTMLAttributes,
  KeyboardEventHandler,
  ReactElement,
} from 'react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';

/** An icon-only action shown in a {@link SwipeToReveal} action tray. */
export interface SwipeToRevealAction {
  icon: IconSource;
  contentDescription: string;
  onClick: () => void;
}

export interface SwipeToRevealProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onKeyDownCapture' | 'onKeyUpCapture'
> {
  /**
   * The focusable element placed in the slot. ListItem, Card, and Chip are
   * typical children. The SwipeToReveal shell itself is not focusable.
   */
  children: ReactElement;

  /** Ordered action tray. One action is required and at most three are supported. */
  actions: readonly [
    SwipeToRevealAction,
    SwipeToRevealAction?,
    SwipeToRevealAction?,
  ];

  onKeyDownCapture?: KeyboardEventHandler<HTMLDivElement>;
  onKeyUpCapture?: KeyboardEventHandler<HTMLDivElement>;
}
