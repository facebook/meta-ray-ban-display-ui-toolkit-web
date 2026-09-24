/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ForwardedRef, RefObject } from 'react';
import { useEffect, useLayoutEffect } from 'react';
import {
  claimFocusedInteractable,
  FORCE_FOCUS_SYNC_EVENT,
  FOCUS_NAVIGATION_HANDLED_EVENT,
  INVALID_FOCUS_DIRECTION_EVENT,
  PARTIAL_FOCUS_HANDOFF_EVENT,
  PartialFocusSupportedAxis,
  registerFocusOwner,
  releaseFocusedInteractable,
  shouldRetainFocusedInteractableOnBlur,
  unregisterFocusOwner,
} from './FocusCoordinator';
import type {
  FocusOwner,
  InvalidFocusDirectionDetail,
  PartialFocusHandoffDetail,
} from './FocusCoordinator';
import type { UseInteractableFocusOwnerParams } from './useInteractableFocusOwner.types';

export type { UseInteractableFocusOwnerParams } from './useInteractableFocusOwner.types';

function resolvedElement(
  forwardedRef: ForwardedRef<HTMLElement>,
  internalRef: RefObject<HTMLElement | null>,
): HTMLElement | null {
  return internalRef.current ?? (
    typeof forwardedRef === 'function'
      ? null
      : forwardedRef?.current ?? null
  );
}

export function useInteractableFocusOwner({
  forwardedRef,
  internalRef,
  isFocusable,
  initialFocusEligible,
  currentDirectionalKeyDownRef,
  applyFocusedFromCoordinator,
  clearFocusedOwner,
  partialFocusSupportedAxis,
  isRubberbandTranslationEnabled,
  onInvalidFocusDirection,
  onPartialFocusHandoff,
}: UseInteractableFocusOwnerParams): void {
  useLayoutEffect(() => {
    const el = resolvedElement(forwardedRef, internalRef);
    if (el == null || !isFocusable) {
      return;
    }

    const focusOwner: FocusOwner = {
      element: el,
      initialFocusEligible,
      partialFocusSupportedAxis,
      isRubberbandTranslationEnabled,
      applyFocus: (forceNotify = false) =>
        applyFocusedFromCoordinator(true, false, forceNotify),
      clearFocus: clearFocusedOwner,
    };

    const syncFocus = () => {
      claimFocusedInteractable(focusOwner);
      applyFocusedFromCoordinator(true, true);
    };

    const forceSyncFocusIfActive = () => {
      if (document.activeElement === el) {
        claimFocusedInteractable(focusOwner);
        applyFocusedFromCoordinator(true, false, true);
      }
    };

    const syncBlur = (event: globalThis.FocusEvent) => {
      if (shouldRetainFocusedInteractableOnBlur(el, event.relatedTarget)) {
        return;
      }

      releaseFocusedInteractable(el);
      applyFocusedFromCoordinator(false, false);
    };
    const forceSyncFocus = (event: Event) => {
      if (document.activeElement !== el) {
        return;
      }

      claimFocusedInteractable(focusOwner);
      applyFocusedFromCoordinator(true, false, true);
      event.preventDefault();
    };

    registerFocusOwner(focusOwner);
    el.addEventListener('focus', syncFocus);
    el.addEventListener('blur', syncBlur);
    el.addEventListener(FORCE_FOCUS_SYNC_EVENT, forceSyncFocus);
    forceSyncFocusIfActive();
    const animationFrame = window.requestAnimationFrame(forceSyncFocusIfActive);
    const delayedSync = window.setTimeout(forceSyncFocusIfActive, 100);

    return () => {
      el.removeEventListener('focus', syncFocus);
      el.removeEventListener('blur', syncBlur);
      el.removeEventListener(FORCE_FOCUS_SYNC_EVENT, forceSyncFocus);
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(delayedSync);
      unregisterFocusOwner(el);
    };
  }, [
    applyFocusedFromCoordinator,
    clearFocusedOwner,
    forwardedRef,
    internalRef,
    initialFocusEligible,
    isRubberbandTranslationEnabled,
    isFocusable,
    partialFocusSupportedAxis,
  ]);

  useEffect(() => {
    const el = resolvedElement(forwardedRef, internalRef);
    if (el == null || !isFocusable) {
      return;
    }

    const handleInvalidFocusDirection = (event: Event) => {
      const customEvent = event as CustomEvent<InvalidFocusDirectionDetail>;
      const direction = customEvent.detail?.direction;
      if (direction == null) {
        return;
      }

      currentDirectionalKeyDownRef.current = null;
      onInvalidFocusDirection?.(direction);
    };

    const handleFocusNavigationHandled = () => {
      currentDirectionalKeyDownRef.current = null;
    };

    const handlePartialFocusHandoff = (event: Event) => {
      if (partialFocusSupportedAxis === PartialFocusSupportedAxis.None) {
        return;
      }

      const customEvent = event as CustomEvent<PartialFocusHandoffDetail>;
      onPartialFocusHandoff?.(customEvent.detail);
    };

    el.addEventListener(INVALID_FOCUS_DIRECTION_EVENT, handleInvalidFocusDirection);
    el.addEventListener(FOCUS_NAVIGATION_HANDLED_EVENT, handleFocusNavigationHandled);
    el.addEventListener(PARTIAL_FOCUS_HANDOFF_EVENT, handlePartialFocusHandoff);
    return () => {
      el.removeEventListener(INVALID_FOCUS_DIRECTION_EVENT, handleInvalidFocusDirection);
      el.removeEventListener(FOCUS_NAVIGATION_HANDLED_EVENT, handleFocusNavigationHandled);
      el.removeEventListener(PARTIAL_FOCUS_HANDOFF_EVENT, handlePartialFocusHandoff);
    };
  }, [
    currentDirectionalKeyDownRef,
    forwardedRef,
    internalRef,
    isFocusable,
    onInvalidFocusDirection,
    onPartialFocusHandoff,
    partialFocusSupportedAxis,
  ]);
}
