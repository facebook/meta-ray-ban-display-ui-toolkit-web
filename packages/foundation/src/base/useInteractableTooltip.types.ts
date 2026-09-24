/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  Dispatch,
  MutableRefObject,
  ReactNode,
  SetStateAction,
} from 'react';
import type { InteractionState } from './Interactions';
import type { TooltipMode } from './TooltipMode';

export interface UseInteractableTooltipParams {
  interactionState: InteractionState;
  interactionStateRef: MutableRefObject<InteractionState>;
  onStateChangeRef: MutableRefObject<
    ((prevState: InteractionState, newState: InteractionState) => void) | undefined
  >;
  tooltipMode: TooltipMode;
  tooltipText?: string;
  tooltipContent?: ReactNode;
  tooltipFocusable: boolean;
  tooltipHidesFocusState: boolean;
}

export interface InteractableTooltipState {
  showTooltip: boolean;
  isTooltipMounted: boolean;
  tooltipHasFocus: boolean;
  showTooltipRef: MutableRefObject<boolean>;
  tooltipHidesFocusStateRef: MutableRefObject<boolean>;
  setTooltipHasFocus: Dispatch<SetStateAction<boolean>>;
  showDisabledClickTooltip: () => void;
  dismissTooltip: () => void;
  handleTooltipExited: () => void;
}
