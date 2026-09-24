/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * InteractableBase component
 * Provides focus/press state management and gesture handling
 */

import {
  forwardRef,
  memo,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  type CSSProperties,
} from 'react';
import { State, InteractionState, InteractionConstants } from './Interactions';
import { FastScrollTracker } from './InteractableFastScrollTracker';
import type {
  InteractableBaseComponent,
  InteractableBaseImplementationProps,
} from './InteractableBase.types';
import { TooltipPosition } from './TooltipPopup';
import { TooltipMode } from './TooltipMode';
import { useInteractableFocusOwner } from './useInteractableFocusOwner';
import { useInteractableTooltip } from './useInteractableTooltip';
import { useInteractableEventHandlers } from './useInteractableEventHandlers';
import {
  getInteractableBaseSemantics,
  getInteractableBaseStyle,
} from './InteractableBaseLayout';
import {
  INITIAL_FOCUS_EXCLUDED_ATTRIBUTE,
  PartialFocusSupportedAxis,
} from './FocusCoordinator';
import { useComposedRef } from '../utils/useComposedRef';
import { InteractableTooltipPortal } from './InteractableTooltipPortal';
import './InteractableBase.css';

export {
  FOCUS_NAVIGATION_HANDLED_EVENT,
  INVALID_FOCUS_DIRECTION_EVENT,
  PARTIAL_FOCUS_HANDOFF_EVENT,
  PartialFocusSupportedAxis,
} from './FocusCoordinator';
export type {
  InvalidFocusDirection,
  InvalidFocusDirectionDetail,
  PartialFocusHandoffDetail,
  PartialFocusHandoffPhase,
  PartialFocusHandoffRect,
} from './FocusCoordinator';
export { TooltipPosition } from './TooltipPopup';
export { TooltipMode } from './TooltipMode';
export { FastScrollTracker } from './InteractableFastScrollTracker';
export type {
  InteractableActivationEvent,
  InteractableBaseProps,
} from './InteractableBase.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * InteractableBase component
 * Base interactive component with state management.
 *
 * Behavior:
 * - State is tracked as { state, isDisabled }
 * - Disabled changes trigger state transitions (not blocked)
 * - Press release delay uses FULL delay duration (not remainder)
 * - Focus changes always compute new state (no guard on current state)
 * - Entering PRESSED invalidates fast scroll decay
 */
const InteractableBaseImpl = forwardRef<
  HTMLElement,
  InteractableBaseImplementationProps
>(
  function InteractableBase(
    {
      as: RootComponent = 'div',
      children,
      className = '',
      style = DEFAULT_STYLE,
      disabled = false,
      interactive = true,
      focusable,
      initialFocusEligible = true,
      pressable,
      clickable,
      onClick,
      onActivate,
      onLongPress,
      onStateChange,
      tabIndex = 0,
      role,
      ariaLabel,
      tooltipText,
      tooltipMetadata,
      tooltipContent,
      tooltipContentDescription,
      tooltipFocusable = false,
      tooltipMode = TooltipMode.NONE,
      tooltipPosition = TooltipPosition.ANCHORED,
      tooltipShowTail = true,
      tooltipCenterPositionProvider,
      tooltipTargetRectProvider,
      tooltipHidesFocusState = false,
      onFocus: onFocusProp,
      onBlur: onBlurProp,
      onMouseDown: onMouseDownProp,
      onMouseUp: onMouseUpProp,
      onMouseLeave: onMouseLeaveProp,
      onKeyDown: onKeyDownProp,
      onKeyUp: onKeyUpProp,
      partialFocusSupportedAxis = PartialFocusSupportedAxis.XY,
      isRubberbandTranslationEnabled = true,
      onInvalidFocusDirection,
      onPartialFocusHandoff,
      'aria-label': ariaLabelHtml,
      'aria-disabled': ariaDisabledAttr,
      'aria-valuenow': ariaValueNow,
      'aria-valuemin': ariaValueMin,
      'aria-valuemax': ariaValueMax,
      'aria-checked': ariaChecked,
      ...rest
    },
    ref
  ) {
    // aria-disabled inherits React's Booleanish type from HTMLAttributes;
    // normalize to a boolean for the internal semantics contract.
    const ariaDisabledHtml =
      ariaDisabledAttr == null ? undefined : ariaDisabledAttr !== 'false' && ariaDisabledAttr !== false;

    // State tracked as (state, isDisabled)
    const [interactionState, setInteractionState] = useState<InteractionState>({
      state: State.DEFAULT,
      isDisabled: disabled,
    });
    const internalRef = useRef<HTMLElement>(null);
    const setRootRef = useComposedRef(ref, internalRef);

    // Track pressed and focused state independently
    const isPressedRef = useRef(false);
    const isFocusedRef = useRef(false);
    const currentDirectionalKeyDownRef = useRef<string | null>(null);

    // Press release delay tracking
    const lastPressTimestampRef = useRef<number>(0);
    const pressReleaseDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Ref to always access latest interactionState in callbacks without stale closures
    const interactionStateRef = useRef(interactionState);
    useLayoutEffect(() => {
      interactionStateRef.current = interactionState;
    }, [interactionState]);

    // Ref to always access latest onStateChange
    const onStateChangeRef = useRef(onStateChange);
    useLayoutEffect(() => {
      onStateChangeRef.current = onStateChange;
    }, [onStateChange]);
    const isFocusable = focusable ?? interactive;
    const isPressable = pressable ?? interactive;
    const isClickable = clickable ?? interactive;
    const hasInteractionState = useMemo(
      () => isFocusable || isPressable || isClickable,
      [isClickable, isFocusable, isPressable],
    );
    const {
      showTooltip,
      isTooltipMounted,
      showTooltipRef,
      tooltipHidesFocusStateRef,
      setTooltipHasFocus,
      showDisabledClickTooltip,
      dismissTooltip,
      handleTooltipExited,
    } = useInteractableTooltip({
      interactionState,
      interactionStateRef,
      onStateChangeRef,
      tooltipMode,
      tooltipText,
      tooltipContent,
      tooltipFocusable,
      tooltipHidesFocusState,
    });

    /**
     * Cleanup press release delay timeout on unmount
     */
    useEffect(() => {
      return () => {
        if (pressReleaseDelayTimeoutRef.current) {
          clearTimeout(pressReleaseDelayTimeoutRef.current);
        }
      };
    }, []);

    /**
     * Compute state from current inputs.
     */
    const computeState = useCallback(
      (overrides?: {
        pressed?: boolean;
        focused?: boolean;
        isDisabled?: boolean;
      }): InteractionState => {
        const pressed = overrides?.pressed ?? isPressedRef.current;
        const focused = overrides?.focused ?? isFocusedRef.current;
        const isDisabled = overrides?.isDisabled ?? interactionStateRef.current.isDisabled;

        const state = pressed
          ? State.PRESSED
          : focused
            ? State.FOCUSED
            : State.DEFAULT;

        return { state, isDisabled };
      },
      []
    );

    /**
     * Internal state update.
     * Handles fast scroll decay invalidation on PRESSED.
     */
    const internalUpdateForStateChange = useCallback(
      (prevState: InteractionState, newState: InteractionState) => {
        // Invalidate fast scroll decay when entering PRESSED
        if (newState.state === State.PRESSED) {
          FastScrollTracker.invalidateFastScrollDecay();
        }

        interactionStateRef.current = newState;
        setInteractionState(newState);
        const notifiedState =
          tooltipHidesFocusStateRef.current && showTooltipRef.current
            ? { ...newState, state: State.DEFAULT }
            : newState;
        onStateChangeRef.current?.(prevState, notifiedState);
      },
      [showTooltipRef, tooltipHidesFocusStateRef]
    );

    const setFocusedFromCoordinator = useCallback(
      (focused: boolean, recordFocusChange: boolean, forceNotify: boolean = false) => {
        const wasFocused = isFocusedRef.current;
        if (!focused) {
          isPressedRef.current = false;
          if (pressReleaseDelayTimeoutRef.current != null) {
            clearTimeout(pressReleaseDelayTimeoutRef.current);
            pressReleaseDelayTimeoutRef.current = null;
          }
        }

        if (wasFocused !== focused) {
          isFocusedRef.current = focused;

          if (focused && recordFocusChange) {
            FastScrollTracker.recordFocusChange();
          }
        }

        const currentState = interactionStateRef.current;
        const newState = computeState({ focused });

        if (
          !forceNotify &&
          newState.state === currentState.state &&
          newState.isDisabled === currentState.isDisabled
        ) {
          return;
        }

        internalUpdateForStateChange(currentState, newState);
      },
      [computeState, internalUpdateForStateChange]
    );

    const clearFocusedOwner = useCallback(() => {
      setFocusedFromCoordinator(false, false);
    }, [setFocusedFromCoordinator]);

    useInteractableFocusOwner({
      forwardedRef: ref,
      internalRef,
      isFocusable,
      initialFocusEligible,
      currentDirectionalKeyDownRef,
      applyFocusedFromCoordinator: setFocusedFromCoordinator,
      clearFocusedOwner,
      partialFocusSupportedAxis,
      isRubberbandTranslationEnabled,
      onInvalidFocusDirection,
      onPartialFocusHandoff,
    });

    /**
     * Internal set pressed.
     *
     * Key behaviors:
     * - Clears any pending press release delay callback
     * - Records timestamp when entering PRESSED
     * - If releasing press too quickly, delays by FULL QUICK_PRESS_RELEASE_DELAY
     *   (not the remainder)
     * - Recalculates state in the delayed callback (events may have come in)
     * - Requires lastPressTimestamp > 0 for delay check
     */
    const internalSetPressed = useCallback(
      (pressed: boolean) => {
        if (pressed && pressReleaseDelayTimeoutRef.current != null) {
          clearTimeout(pressReleaseDelayTimeoutRef.current);
          pressReleaseDelayTimeoutRef.current = null;
        }

        const currentState = interactionStateRef.current;
        const newState = computeState({ pressed });

        if (
          newState.state === currentState.state &&
          newState.isDisabled === currentState.isDisabled
        ) {
          return;
        }

        // Clear any pending press release delay
        if (pressReleaseDelayTimeoutRef.current != null) {
          clearTimeout(pressReleaseDelayTimeoutRef.current);
          pressReleaseDelayTimeoutRef.current = null;
        }

        // Record press timestamp when entering pressed state
        if (newState.state === State.PRESSED) {
          lastPressTimestampRef.current = Date.now();
        }

        const doUpdate = () => {
          // Recalculate state in the delayed callback since other events
          // may have come in
          const recalculatedNewState = computeState({ pressed });
          const oldState = interactionStateRef.current;
          internalUpdateForStateChange(oldState, recalculatedNewState);
        };

        // Check if we need to delay the release (QUICK_PRESS_RELEASE_DELAY)
        // Condition: newState is DEFAULT or FOCUSED, lastPressTimestamp > 0,
        // and time since press < QUICK_PRESS_RELEASE_DELAY
        if (
          (newState.state === State.DEFAULT || newState.state === State.FOCUSED) &&
          lastPressTimestampRef.current > 0 &&
          Date.now() - lastPressTimestampRef.current <
            InteractionConstants.QUICK_PRESS_RELEASE_DELAY
        ) {
          // Delay by the FULL delay amount, not the remainder
          pressReleaseDelayTimeoutRef.current = setTimeout(() => {
            pressReleaseDelayTimeoutRef.current = null;
            doUpdate();
          }, InteractionConstants.QUICK_PRESS_RELEASE_DELAY);
        } else {
          doUpdate();
        }
      },
      [computeState, internalUpdateForStateChange]
    );

    const {
      handleFocus,
      handleBlur,
      handleMouseDown,
      handleMouseUp,
      handleMouseLeave,
      handleClick,
      handleKeyDown,
      handleKeyUp,
    } = useInteractableEventHandlers({
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
    });

    /**
     * Handle disabled prop changes.
     * The element stays focusable when disabled; this just tracks the
     * disabled state and triggers a non-animated state transition.
     */
    useEffect(() => {
      const currentState = interactionStateRef.current;
      const newIsDisabled = disabled;
      // The disabled transition is suppressed for non-interactive instances
      // (`interactive=false`, e.g. Panel/Surface), since a non-interactive
      // element has no interaction state to transition.
      if (!hasInteractionState) {
        return;
      }
      if (newIsDisabled === currentState.isDisabled) {
        return;
      }
      const prevState = currentState;
      const newState = computeState({ isDisabled: newIsDisabled });
      internalUpdateForStateChange(prevState, newState);
    }, [disabled, computeState, hasInteractionState, internalUpdateForStateChange]);

    const isDisabled = interactionState.isDisabled;
    const combinedStyle = useMemo(
      () => getInteractableBaseStyle({
        style,
        isClickable,
        isDisabled,
        hasTooltip: Boolean(tooltipText || tooltipContent),
      }),
      [
        isClickable,
        isDisabled,
        style,
        tooltipContent,
        tooltipText,
      ],
    );
    const semantics = useMemo(
      () => getInteractableBaseSemantics({
        isFocusable,
        isClickable,
        isDisabled,
        hasInteractionState,
        tabIndex,
        role,
        ariaDisabled: ariaDisabledHtml,
        inferButtonRole: RootComponent === 'div',
        forceNonFocusableTabIndex: RootComponent !== 'div',
      }),
      [
        ariaDisabledHtml,
        hasInteractionState,
        isClickable,
        isDisabled,
        isFocusable,
        role,
        RootComponent,
        tabIndex,
      ],
    );

    return (
      <RootComponent
        {...rest}
        ref={setRootRef}
        className={className}
        style={combinedStyle}
        data-uit-interactable=""
        {...{ [INITIAL_FOCUS_EXCLUDED_ATTRIBUTE]: initialFocusEligible ? undefined : 'true' }}
        tabIndex={semantics.tabIndex}
        role={semantics.role}
        aria-label={ariaLabelHtml ?? ariaLabel}
        aria-disabled={semantics.ariaDisabled}
        aria-valuenow={ariaValueNow}
        aria-valuemin={ariaValueMin}
        aria-valuemax={ariaValueMax}
        aria-checked={ariaChecked}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
      >
        {children}
        <InteractableTooltipPortal
          isMounted={isTooltipMounted}
          isVisible={showTooltip}
          text={tooltipText}
          metadata={tooltipMetadata}
          content={tooltipContent}
          contentDescription={tooltipContentDescription}
          focusable={tooltipFocusable}
          showTail={tooltipShowTail}
          position={tooltipPosition}
          centerPositionProvider={tooltipCenterPositionProvider}
          targetRectProvider={tooltipTargetRectProvider}
          anchorRef={internalRef}
          onFocusWithinChange={setTooltipHasFocus}
          onBackRequest={dismissTooltip}
          onExited={handleTooltipExited}
        />
      </RootComponent>
    );
  }
);

export const InteractableBase = memo(
  InteractableBaseImpl,
) as InteractableBaseComponent;

/**
 * Hook to get current interaction state.
 */
export function useInteractionState(
  disabled: boolean = false
): [InteractionState, (newState: InteractionState) => void] {
  const [interactionState, setInteractionState] = useState<InteractionState>({
    state: State.DEFAULT,
    isDisabled: disabled,
  });

  const updateState = useCallback(
    (newState: InteractionState) => {
      setInteractionState(newState);
    },
    []
  );

  // Sync disabled prop changes
  useEffect(() => {
    setInteractionState((prev) => {
      if (prev.isDisabled === disabled) return prev;
      return { ...prev, isDisabled: disabled };
    });
  }, [disabled]);

  return [interactionState, updateState];
}
