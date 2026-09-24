/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { InteractionConstants, State } from './Interactions';
import { TooltipMode } from './TooltipMode';
import type {
  InteractableTooltipState,
  UseInteractableTooltipParams,
} from './useInteractableTooltip.types';

export type {
  InteractableTooltipState,
  UseInteractableTooltipParams,
} from './useInteractableTooltip.types';

const INTERACTABLE_TOOLTIP_SHOW_EVENT = '__uit_interactable_tooltip_show__';

export function useInteractableTooltip({
  interactionState,
  interactionStateRef,
  onStateChangeRef,
  tooltipMode,
  tooltipText,
  tooltipContent,
  tooltipFocusable,
  tooltipHidesFocusState,
}: UseInteractableTooltipParams): InteractableTooltipState {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTooltipMounted, setIsTooltipMounted] = useState(false);
  const [tooltipHasFocus, setTooltipHasFocus] = useState(false);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disabledTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTooltipRef = useRef(false);
  const isTooltipMountedRef = useRef(false);
  const tooltipHidesFocusStateRef = useRef(tooltipHidesFocusState);
  const tooltipFocusOverrideActiveRef = useRef(false);
  const tooltipOwnerId = useId();
  showTooltipRef.current = showTooltip;

  useLayoutEffect(() => {
    tooltipHidesFocusStateRef.current = tooltipHidesFocusState;
  }, [tooltipHidesFocusState]);

  const clearTimers = useCallback(() => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    if (disabledTooltipTimerRef.current) {
      clearTimeout(disabledTooltipTimerRef.current);
      disabledTooltipTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const shouldOverride = tooltipHidesFocusState && showTooltip;
    if (tooltipFocusOverrideActiveRef.current === shouldOverride) {
      return;
    }
    tooltipFocusOverrideActiveRef.current = shouldOverride;
    const currentState = interactionStateRef.current;
    onStateChangeRef.current?.(
      currentState,
      shouldOverride ? { ...currentState, state: State.DEFAULT } : currentState,
    );
  }, [interactionStateRef, onStateChangeRef, showTooltip, tooltipHidesFocusState]);

  useEffect(() => {
    isTooltipMountedRef.current = isTooltipMounted;
  }, [isTooltipMounted]);

  const requestShowTooltip = useCallback(() => {
    if (!showTooltipRef.current) {
      window.dispatchEvent(
        new CustomEvent(INTERACTABLE_TOOLTIP_SHOW_EVENT, {
          detail: { ownerId: tooltipOwnerId },
        }),
      );
    }
    setShowTooltip(true);
  }, [tooltipOwnerId]);

  const showDisabledClickTooltip = useCallback(() => {
    if (
      tooltipMode !== TooltipMode.DISABLED_CLICK ||
      (!tooltipText && !tooltipContent)
    ) {
      return;
    }

    requestShowTooltip();
    if (disabledTooltipTimerRef.current) {
      clearTimeout(disabledTooltipTimerRef.current);
    }
    disabledTooltipTimerRef.current = setTimeout(() => {
      disabledTooltipTimerRef.current = null;
      setShowTooltip(false);
    }, InteractionConstants.DISABLED_CLICK_TOOLTIP_DISMISS_DELAY);
  }, [requestShowTooltip, tooltipContent, tooltipMode, tooltipText]);

  const dismissTooltip = useCallback(() => {
    clearTimers();
    showTooltipRef.current = false;
    setShowTooltip(false);
    setTooltipHasFocus(false);
  }, [clearTimers]);

  useEffect(() => {
    const hideImmediately = () => {
      clearTimers();
      showTooltipRef.current = false;
      isTooltipMountedRef.current = false;
      setShowTooltip(false);
      setIsTooltipMounted(false);
      setTooltipHasFocus(false);
    };
    const handleTooltipShow = (event: Event) => {
      const ownerId = (event as CustomEvent<{ ownerId?: string }>).detail?.ownerId;
      if (ownerId === tooltipOwnerId) {
        return;
      }
      if (!showTooltipRef.current && !isTooltipMountedRef.current) {
        return;
      }
      hideImmediately();
    };

    window.addEventListener(INTERACTABLE_TOOLTIP_SHOW_EVENT, handleTooltipShow);
    return () => {
      window.removeEventListener(INTERACTABLE_TOOLTIP_SHOW_EVENT, handleTooltipShow);
    };
  }, [clearTimers, tooltipOwnerId]);

  useEffect(() => {
    if (tooltipMode === TooltipMode.NONE || (!tooltipText && !tooltipContent)) {
      if (disabledTooltipTimerRef.current) {
        clearTimeout(disabledTooltipTimerRef.current);
        disabledTooltipTimerRef.current = null;
      }
      setShowTooltip(false);
      return;
    }
    if (tooltipMode !== TooltipMode.DISABLED_CLICK && disabledTooltipTimerRef.current) {
      clearTimeout(disabledTooltipTimerRef.current);
      disabledTooltipTimerRef.current = null;
    }
    if (tooltipMode === TooltipMode.ALWAYS) {
      requestShowTooltip();
      return;
    }

    const currentState = interactionState.state;
    const isFocusedOrPressed = currentState === State.FOCUSED || currentState === State.PRESSED;
    const shouldRetainFocusableContentTooltip =
      tooltipFocusable &&
      tooltipContent != null &&
      (tooltipHasFocus || (showTooltip && isTooltipMounted));

    if (tooltipMode === TooltipMode.FOCUSED) {
      if (isFocusedOrPressed || shouldRetainFocusableContentTooltip) {
        requestShowTooltip();
      } else {
        setShowTooltip(false);
      }
    } else if (tooltipMode === TooltipMode.DWELL) {
      if (isFocusedOrPressed) {
        tooltipTimerRef.current = setTimeout(() => {
          requestShowTooltip();
        }, InteractionConstants.TOOLTIP_DWELL_DELAY);
      } else {
        if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
        setShowTooltip(false);
      }
    }

    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, [
    interactionState.state,
    interactionState.isDisabled,
    tooltipMode,
    tooltipText,
    tooltipContent,
    tooltipFocusable,
    tooltipHasFocus,
    requestShowTooltip,
  ]);

  useEffect(() => {
    return () => {
      if (disabledTooltipTimerRef.current) {
        clearTimeout(disabledTooltipTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (showTooltip && (tooltipText || tooltipContent)) {
      setIsTooltipMounted(true);
    }
  }, [showTooltip, tooltipText, tooltipContent]);

  return {
    showTooltip,
    isTooltipMounted,
    tooltipHasFocus,
    showTooltipRef,
    tooltipHidesFocusStateRef,
    setTooltipHasFocus,
    showDisabledClickTooltip,
    dismissTooltip,
    handleTooltipExited: () => setIsTooltipMounted(false),
  };
}
