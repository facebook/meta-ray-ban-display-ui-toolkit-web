/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useEffect, useRef } from 'react';
import type {
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
} from 'react';
import {
  claimFocusedInteractable,
  directionForArrowKey,
  dispatchPartialFocusHandoff,
  focusElementFromTarget as elementFromFocusTarget,
  getFocusOwner,
  releaseFocusedInteractable,
  rememberBlurredInteractableElement,
  shouldRetainFocusedInteractableOnBlur,
} from './FocusCoordinator';
import {
  registerPressReleaseCallbacks,
  unregisterPressReleaseCallbacks,
} from './GlobalPressReleaseManager';
import { InteractionConstants } from './Interactions';
import type {
  InteractableEventHandlers,
  UseInteractableEventHandlersParams,
} from './useInteractableEventHandlers.types';

export type {
  InteractableEventHandlers,
  UseInteractableEventHandlersParams,
} from './useInteractableEventHandlers.types';

export function useInteractableEventHandlers({
  isFocusable,
  isPressable,
  isClickable,
  interactionStateRef,
  isPressedRef,
  currentDirectionalKeyDownRef,
  internalSetPressed,
  setFocusedFromCoordinator,
  showDisabledClickTooltip,
  onClick,
  onActivate,
  onLongPress,
  onFocusProp,
  onBlurProp,
  onMouseDownProp,
  onMouseUpProp,
  onMouseLeaveProp,
  onKeyDownProp,
  onKeyUpProp,
  onInvalidFocusDirection,
}: UseInteractableEventHandlersParams): InteractableEventHandlers {
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const activeKeyboardPressKeyRef = useRef<string | null>(null);
  const dispatchingKeyboardClickRef = useRef(false);
  // The event that started the current press, forwarded when the long-press
  // timer fires (the originating event is no longer in scope by then).
  const pressOriginEventRef = useRef<
    MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement> | null
  >(null);

  const clearLongPressTimeout = useCallback(() => {
    if (longPressTimeoutRef.current == null) {
      return;
    }

    clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = null;
  }, []);

  const startLongPressTimeout = useCallback(() => {
    clearLongPressTimeout();
    longPressTriggeredRef.current = false;

    if (onLongPress == null || interactionStateRef.current.isDisabled) {
      return;
    }

    longPressTimeoutRef.current = setTimeout(() => {
      longPressTimeoutRef.current = null;
      if (!isPressedRef.current || interactionStateRef.current.isDisabled) {
        return;
      }

      longPressTriggeredRef.current = true;
      const originEvent = pressOriginEventRef.current;
      if (originEvent != null) {
        onLongPress(originEvent);
      }
    }, InteractionConstants.LONG_PRESS_TIMEOUT);
  }, [clearLongPressTimeout, interactionStateRef, isPressedRef, onLongPress]);

  useEffect(() => clearLongPressTimeout, [clearLongPressTimeout]);

  const releasePressed = useCallback(() => {
    clearLongPressTimeout();
    if (!isPressedRef.current) {
      return;
    }

    isPressedRef.current = false;
    internalSetPressed(false);
  }, [clearLongPressTimeout, internalSetPressed, isPressedRef]);

  useEffect(() => {
    if (!isPressable) {
      return;
    }

    const key = registerPressReleaseCallbacks(
      releasePressed,
      (event: globalThis.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          if (activeKeyboardPressKeyRef.current === event.key) {
            activeKeyboardPressKeyRef.current = null;
          }
          releasePressed();
        }
      },
    );

    return () => {
      unregisterPressReleaseCallbacks(key);
    };
  }, [isPressable, releasePressed]);

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      onFocusProp?.(event);
      if (event.defaultPrevented) {
        return;
      }
      if (!isFocusable) {
        return;
      }
      if (
        event.target instanceof Node &&
        !event.currentTarget.contains(event.target)
      ) {
        return;
      }

      const owner = getFocusOwner(event.currentTarget);
      if (owner != null) {
        claimFocusedInteractable(owner);
      }
      setFocusedFromCoordinator(true, true);
    },
    [isFocusable, onFocusProp, setFocusedFromCoordinator]
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      onBlurProp?.(event);
      if (event.defaultPrevented) {
        return;
      }
      if (!isFocusable) {
        return;
      }
      if (
        event.target instanceof Node &&
        !event.currentTarget.contains(event.target)
      ) {
        return;
      }

      if (
        shouldRetainFocusedInteractableOnBlur(
          event.currentTarget,
          event.relatedTarget,
        )
      ) {
        return;
      }

      activeKeyboardPressKeyRef.current = null;
      releasePressed();
      rememberBlurredInteractableElement(event.currentTarget);
      releaseFocusedInteractable(event.currentTarget);
      setFocusedFromCoordinator(false, false);

      if (elementFromFocusTarget(event.relatedTarget) == null) {
        dispatchPartialFocusHandoff(event.currentTarget, 'reset', null, true);
      }
    },
    [isFocusable, onBlurProp, releasePressed, setFocusedFromCoordinator]
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      onMouseDownProp?.(event);
      if (event.defaultPrevented) {
        return;
      }
      if (isFocusable && document.activeElement !== event.currentTarget) {
        event.currentTarget.focus();
      }
      if (!isPressable) {
        return;
      }
      pressOriginEventRef.current = event;
      isPressedRef.current = true;
      internalSetPressed(true);
      startLongPressTimeout();
    },
    [
      internalSetPressed,
      isFocusable,
      isPressable,
      isPressedRef,
      onMouseDownProp,
      startLongPressTimeout,
    ]
  );

  const handleMouseUp = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      onMouseUpProp?.(event);
      if (event.defaultPrevented) {
        return;
      }
      if (!isPressable) {
        return;
      }
      releasePressed();
    },
    [isPressable, onMouseUpProp, releasePressed]
  );

  const handleMouseLeave = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      onMouseLeaveProp?.(event);
      if (event.defaultPrevented) {
        return;
      }
      if (!isPressable) {
        return;
      }
      releasePressed();
    },
    [isPressable, onMouseLeaveProp, releasePressed]
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!isClickable) {
        if (event.currentTarget instanceof HTMLAnchorElement) {
          event.preventDefault();
        }
        return;
      }
      if (longPressTriggeredRef.current) {
        longPressTriggeredRef.current = false;
        event.preventDefault();
        releasePressed();
        return;
      }
      const currentState = interactionStateRef.current;
      if (currentState.isDisabled) {
        event.preventDefault();
        showDisabledClickTooltip();
      } else {
        // Programmatic / accessibility activation arrives as a click with no
        // preceding pointer press (event.detail === 0). Emit a brief press pulse
        // so it still shows press feedback: internalSetPressed(true) then
        // internalSetPressed(false). internalSetPressed owns the
        // lifecycle-managed QUICK_PRESS_RELEASE_DELAY timer, so the pulse is
        // auto-cancelled on unmount and superseded by a later press. isPressedRef
        // stays false — this is a visual-only pulse.
        if (
          !dispatchingKeyboardClickRef.current &&
          isPressable &&
          event.detail === 0 &&
          !isPressedRef.current
        ) {
          internalSetPressed(true);
          internalSetPressed(false);
        }
        if (!dispatchingKeyboardClickRef.current) {
          onActivate?.(event);
        }
        onClick?.(event);
      }
      releasePressed();
    },
    [
      isClickable,
      isPressable,
      isPressedRef,
      internalSetPressed,
      interactionStateRef,
      onActivate,
      onClick,
      releasePressed,
      showDisabledClickTooltip,
    ]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      onKeyDownProp?.(event);

      if (event.defaultPrevented) {
        return;
      }

      const direction = directionForArrowKey(event.key);
      if (
        direction != null &&
        isFocusable &&
        document.activeElement === event.currentTarget
      ) {
        currentDirectionalKeyDownRef.current = event.key;
      }

      if (!isPressable) {
        return;
      }

      const currentState = interactionStateRef.current;
      if (currentState.isDisabled) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
        }
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activeKeyboardPressKeyRef.current = event.key;
        if (!isPressedRef.current) {
          pressOriginEventRef.current = event;
          isPressedRef.current = true;
          internalSetPressed(true);
          startLongPressTimeout();
        }
      }
    },
    [
      currentDirectionalKeyDownRef,
      internalSetPressed,
      interactionStateRef,
      isFocusable,
      isPressable,
      isPressedRef,
      onKeyDownProp,
      startLongPressTimeout,
    ]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      onKeyUpProp?.(event);

      if (event.defaultPrevented) {
        if (currentDirectionalKeyDownRef.current === event.key) {
          currentDirectionalKeyDownRef.current = null;
        }
        return;
      }

      const direction = directionForArrowKey(event.key);
      if (
        direction != null &&
        isFocusable &&
        currentDirectionalKeyDownRef.current === event.key &&
        document.activeElement === event.currentTarget
      ) {
        currentDirectionalKeyDownRef.current = null;
        onInvalidFocusDirection?.(direction);
      }

      if (!isPressable && !isClickable) {
        return;
      }
      const currentState = interactionStateRef.current;
      if (currentState.isDisabled) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          showDisabledClickTooltip();
        }
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const wasKeyboardPressed = activeKeyboardPressKeyRef.current === event.key;
        activeKeyboardPressKeyRef.current = null;
        const wasPressed = isPressedRef.current;
        if (wasPressed) {
          releasePressed();
        }
        if (longPressTriggeredRef.current) {
          longPressTriggeredRef.current = false;
          return;
        }
        if (isClickable && (wasPressed || wasKeyboardPressed)) {
          const target = event.currentTarget;
          onActivate?.(event);
          dispatchingKeyboardClickRef.current = true;
          try {
            target.click();
          } finally {
            dispatchingKeyboardClickRef.current = false;
          }
        }
      }
    },
    [
      currentDirectionalKeyDownRef,
      interactionStateRef,
      isClickable,
      isFocusable,
      isPressable,
      isPressedRef,
      onActivate,
      onInvalidFocusDirection,
      onKeyUpProp,
      releasePressed,
      showDisabledClickTooltip,
    ]
  );

  return {
    releasePressed,
    handleFocus,
    handleBlur,
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave,
    handleClick,
    handleKeyDown,
    handleKeyUp,
  };
}
