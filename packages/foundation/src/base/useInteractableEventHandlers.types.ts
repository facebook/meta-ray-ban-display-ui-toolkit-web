/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  FocusEvent,
  FocusEventHandler,
  KeyboardEvent,
  KeyboardEventHandler,
  MouseEvent,
  MouseEventHandler,
  MutableRefObject,
} from 'react';
import type { InteractableActivationEvent } from './InteractableBase.types';
import type { InvalidFocusDirection } from './FocusCoordinator';
import type { InteractionState } from './Interactions';

export interface UseInteractableEventHandlersParams {
  isFocusable: boolean;
  isPressable: boolean;
  isClickable: boolean;
  interactionStateRef: MutableRefObject<InteractionState>;
  isPressedRef: MutableRefObject<boolean>;
  currentDirectionalKeyDownRef: MutableRefObject<string | null>;
  internalSetPressed: (pressed: boolean) => void;
  setFocusedFromCoordinator: (
    focused: boolean,
    recordFocusChange: boolean,
    forceNotify?: boolean,
  ) => void;
  showDisabledClickTooltip: () => void;
  onClick?: MouseEventHandler<HTMLElement>;
  onActivate?: (event: InteractableActivationEvent<HTMLElement>) => void;
  onLongPress?: (
    event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>,
  ) => void;
  onFocusProp?: FocusEventHandler<HTMLElement>;
  onBlurProp?: FocusEventHandler<HTMLElement>;
  onMouseDownProp?: MouseEventHandler<HTMLElement>;
  onMouseUpProp?: MouseEventHandler<HTMLElement>;
  onMouseLeaveProp?: MouseEventHandler<HTMLElement>;
  onKeyDownProp?: KeyboardEventHandler<HTMLElement>;
  onKeyUpProp?: KeyboardEventHandler<HTMLElement>;
  onInvalidFocusDirection?: (direction: InvalidFocusDirection) => void;
}

export interface InteractableEventHandlers {
  releasePressed: () => void;
  handleFocus: (event: FocusEvent<HTMLElement>) => void;
  handleBlur: (event: FocusEvent<HTMLElement>) => void;
  handleMouseDown: (event: MouseEvent<HTMLElement>) => void;
  handleMouseUp: (event: MouseEvent<HTMLElement>) => void;
  handleMouseLeave: (event: MouseEvent<HTMLElement>) => void;
  handleClick: (event: MouseEvent<HTMLElement>) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  handleKeyUp: (event: KeyboardEvent<HTMLElement>) => void;
}
