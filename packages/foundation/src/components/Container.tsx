/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Container component
 * Extends InteractableBase with material rendering
 */

import {
  forwardRef,
  memo,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useId,
  useReducer,
  useRef,
  type CSSProperties,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from 'react';
import {
  InteractableBase,
  PartialFocusSupportedAxis,
  type InvalidFocusDirection,
} from '../base/InteractableBase';
import type { InteractableBaseImplementationProps } from '../base/InteractableBase.types';
import {
  State,
  VisualState,
  visualStateForInteractionState,
  InteractionState,
} from '../base/Interactions';
import {
  getContentScaleForState,
  type Platform,
} from '../base/Platform';
import { usePlatform } from '../app/PlatformContext';
import { MaterialLibrary } from '../material/MaterialLibrary';
import {
  getCachedShapePath,
} from '../material/ShapeProvider';
import { useComposedRef } from '../utils/useComposedRef';
import { useMeasuredElementDimensions } from '../utils/useMeasuredElementDimensions';
import styles from './Container.module.css';
import {
  AnimationDurations,
  Interpolators,
  getContainerSpringForStateChange,
  getEasedProgressForStateChange,
  getSpringEasing,
} from '../motion/Animations';
import { FastScrollTracker } from '../base/InteractableFastScrollTracker';
import {
  startSynchronizedTransition,
  type SynchronizedTransitionHandle,
  type SynchronizedTransitionParticipant,
} from '../motion/SynchronizedTransition';
import { usePrefersReducedMotion } from '../motion/usePrefersReducedMotion';
import type { ContainerMaterialTransition } from './ContainerMaterialLayers.types';
import { ContainerFrame } from './private/ContainerFrame';
import { getContainerShapeMetrics } from './private/ContainerShape';
import { useContainerPartialFocusFeedback } from './private/useContainerPartialFocusFeedback';
import type {
  ContainerComponent,
  ContainerImplementationProps,
  ContainerProps,
} from './Container.types';

export type { ContainerMaterialTransition } from './ContainerMaterialLayers.types';
export { PartialFocusSupportedAxis } from '../base/InteractableBase';
export type {
  ContainerProps,
  ContainerStateChangeAnimation,
  ContainerStateChangeAnimationContext,
} from './Container.types';

const EMPTY_CONTAINER_STYLE: CSSProperties = {};
const EMPTY_MATERIAL_LAYERS: never[] = [];
const InteractableBaseInternal = InteractableBase as unknown as
  ForwardRefExoticComponent<
    InteractableBaseImplementationProps & RefAttributes<HTMLElement>
  >;

const NO_ROOT_TRANSITION = 'none';

// Numeric values matching the --uit-disabled-opacity / --uit-enabled-opacity theme
// tokens (theme.css). The container animates alpha numerically (the root opacity
// is interpolated in the state-change spring/tween), so a CSS var cannot be used
// here.
const CONTAINER_DISABLED_OPACITY = 0.5;
const CONTAINER_ENABLED_OPACITY = 1;

/** Interaction state managed by useReducer (Task 3: consolidated state) */
interface InteractionReducerState {
  visualState: VisualState;
  interactionTransition: { duration: number; interpolator: string };
  interactionScale: number;
  interactionAlpha: number;
  animated: boolean;
}

type InteractionAction =
  | {
      type: 'SET_INTERACTION_STATE';
      visualState: VisualState;
      transition: { duration: number; interpolator: string };
      scale: number;
      animated: boolean;
      alphaChange?: { isDisabled: boolean };
    }
  | { type: 'SET_SCALE'; scale: number; animated?: boolean }
  | { type: 'SET_ALPHA'; alpha: number }
  | { type: 'SET_ANIMATED'; animated: boolean };

function interactionReducer(
  state: InteractionReducerState,
  action: InteractionAction,
): InteractionReducerState {
  switch (action.type) {
    case 'SET_INTERACTION_STATE': {
      const newAlpha =
        action.alphaChange != null
          ? (action.alphaChange.isDisabled
              ? CONTAINER_DISABLED_OPACITY
              : CONTAINER_ENABLED_OPACITY)
          : state.interactionAlpha;
      return {
        visualState: action.visualState,
        interactionTransition: action.transition,
        interactionScale: action.scale,
        interactionAlpha: newAlpha,
        animated: action.animated,
      };
    }
    case 'SET_SCALE': {
      const animated = action.animated ?? state.animated;
      if (
        action.scale === state.interactionScale &&
        animated === state.animated
      ) {
        return state;
      }
      return {
        ...state,
        interactionScale: action.scale,
        animated,
      };
    }
    case 'SET_ALPHA':
      if (action.alpha === state.interactionAlpha) return state;
      return { ...state, interactionAlpha: action.alpha };
    case 'SET_ANIMATED':
      if (action.animated === state.animated) return state;
      return { ...state, animated: action.animated };
    default:
      return state;
  }
}

const INITIAL_INTERACTION_STATE: InteractionReducerState = {
  visualState: VisualState.DEFAULT,
  interactionTransition: {
    duration: AnimationDurations.CONTAINER_STATE_CHANGE,
    interpolator: Interpolators.CONTAINER_SCALE,
  },
  interactionScale: 1,
  interactionAlpha: 1,
  animated: true,
};

function getInteractionScale(
  width: ContainerProps['width'],
  height: ContainerProps['height'],
  state: State,
  platform: Platform,
  contentScaleForStateFn: ContainerProps['contentScaleForStateFn'] | undefined,
): number {
  if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
    return 1;
  }

  return contentScaleForStateFn
    ? contentScaleForStateFn(state, { width, height })
    : getContentScaleForState(state, platform, { width, height });
}

function formatScaleTransform(scale: number, customScaleX: number, customScaleY: number): string {
  return `scale(${scale * customScaleX}, ${scale * customScaleY})`;
}

function normalizeRenderedScale(
  renderedScaleX: number,
  renderedScaleY: number,
  customScaleX: number,
  customScaleY: number,
  fallbackScale: number,
): number {
  const normalizedScaleX = customScaleX !== 0 ? renderedScaleX / customScaleX : fallbackScale;
  const normalizedScaleY = customScaleY !== 0 ? renderedScaleY / customScaleY : fallbackScale;
  const scaleSamples = [normalizedScaleX, normalizedScaleY].filter(Number.isFinite);

  if (scaleSamples.length === 0) {
    return fallbackScale;
  }

  return scaleSamples.reduce((sum, sample) => sum + sample, 0) / scaleSamples.length;
}

function readInteractionScaleFromTransform(
  transform: string,
  customScaleX: number,
  customScaleY: number,
  fallbackScale: number,
): number {
  if (transform === '' || transform === 'none') {
    return fallbackScale;
  }

  const scaleMatch = transform.match(/^scale\(([^,\s)]+)(?:,\s*([^)]+))?\)$/);
  if (scaleMatch != null) {
    const renderedScaleX = Number(scaleMatch[1]);
    const renderedScaleY = Number(scaleMatch[2] ?? scaleMatch[1]);
    return normalizeRenderedScale(
      renderedScaleX,
      renderedScaleY,
      customScaleX,
      customScaleY,
      fallbackScale,
    );
  }

  const matrixMatch = transform.match(/^matrix\(([^)]+)\)$/);
  if (matrixMatch != null) {
    const [a, b, c, d] = matrixMatch[1].split(',').map((value) => Number(value.trim()));
    if ([a, b, c, d].every(Number.isFinite)) {
      return normalizeRenderedScale(
        Math.hypot(a, b),
        Math.hypot(c, d),
        customScaleX,
        customScaleY,
        fallbackScale,
      );
    }
  }

  return fallbackScale;
}

function readRenderedInteractionValues(
  el: HTMLElement,
  fallbackScale: number,
  fallbackAlpha: number,
  customScaleX: number,
  customScaleY: number,
  customAlpha: number,
): { scale: number; alpha: number } {
  const computedStyle = window.getComputedStyle(el);
  const renderedScale = readInteractionScaleFromTransform(
    computedStyle.transform || el.style.transform,
    customScaleX,
    customScaleY,
    fallbackScale,
  );
  const renderedOpacity = Number(computedStyle.opacity || el.style.opacity);
  const renderedAlpha = Number.isFinite(renderedOpacity) && customAlpha !== 0
    ? renderedOpacity / customAlpha
    : fallbackAlpha;

  return {
    scale: renderedScale,
    alpha: renderedAlpha,
  };
}

function interactionValuesEqual(
  first: number,
  second: number,
): boolean {
  return Math.abs(first - second) < 0.0001;
}

function interpolateNumber(
  from: number,
  to: number,
  progress: number,
): number {
  return from + (to - from) * progress;
}

interface RootInteractionAnimationTarget {
  scale: number;
  alpha: number;
}

interface PendingSynchronizedTransition {
  participants: SynchronizedTransitionParticipant[];
  target: RootInteractionAnimationTarget;
}

/**
 * Container component
 * Provides material-based styling with smooth corners
 */
const ContainerImpl = forwardRef<HTMLElement, ContainerImplementationProps>(
  function Container(
    {
      children,
      material: materialProp,
      width = 'auto',
      height = 'auto',
      clipContent = true,
      interactionStateOverride,
      visualStateOverride,
      materialTransition,
      visualStateForInteractionStateFn,
      contentScaleForStateFn,
      onScaleChange,
      customScaleX = 1,
      customScaleY = 1,
      customAlpha = 1,
      partialFocusSupportedAxis = PartialFocusSupportedAxis.XY,
      isRubberbandTranslationEnabled = true,
      shapeProvider,
      stateChangeAnimations,
      style = EMPTY_CONTAINER_STYLE,
      className = '',
      disabled = false,
      onPartialFocusHandoff,
      onInvalidFocusDirection,
      onStateChange,
      ...interactableProps
    },
    ref
  ) {
    const platform = usePlatform();
    const prefersReducedMotion = usePrefersReducedMotion();
    const initialRenderedInteractionStateRef = useRef<InteractionState>(
      interactionStateOverride ?? {
        state: State.DEFAULT,
        isDisabled: disabled,
      },
    );
    const initialRenderedInteractionState = initialRenderedInteractionStateRef.current;
    const domInteractionStateRef = useRef<InteractionState>({
      state: State.DEFAULT,
      isDisabled: interactionStateOverride?.isDisabled ?? disabled,
    });
    const initialInteractionState = useMemo<InteractionReducerState>(
      () => ({
        ...INITIAL_INTERACTION_STATE,
        visualState: visualStateForInteractionStateFn
          ? visualStateForInteractionStateFn(initialRenderedInteractionState)
          : visualStateForInteractionState(initialRenderedInteractionState),
        interactionScale: getInteractionScale(
          width,
          height,
          initialRenderedInteractionState.state,
          platform,
          contentScaleForStateFn,
        ),
        interactionAlpha: initialRenderedInteractionState.isDisabled
          ? CONTAINER_DISABLED_OPACITY
          : CONTAINER_ENABLED_OPACITY,
      }),
      [
        contentScaleForStateFn,
        height,
        initialRenderedInteractionState,
        platform,
        visualStateForInteractionStateFn,
        width,
      ],
    );

    // Task 3: Consolidated interaction state via useReducer
    const [interactionState, dispatchInteraction] = useReducer(
      interactionReducer,
      initialInteractionState,
    );
    const {
      visualState,
      interactionTransition,
      interactionScale,
      interactionAlpha,
      animated,
    } = interactionState;

    const [internalMaterialTransition, setInternalMaterialTransition] =
      useState<ContainerMaterialTransition | null>(null);
    const material = useMemo(
      () => materialProp ?? MaterialLibrary.default(),
      [materialProp],
    );
    const internalMaterialTransitionRef = useRef<ContainerMaterialTransition | null>(null);
    // Task 1: Layer revision only triggers layer-dependent memos
    const [layerRevision, setLayerRevision] = useState(0);
    const materialHostRef = useRef<object>({});
    const stateTransitionRef = useRef<SynchronizedTransitionHandle | null>(null);
    const stateTransitionTargetRef =
      useRef<RootInteractionAnimationTarget | null>(null);
    const pendingStateTransitionRef =
      useRef<PendingSynchronizedTransition | null>(null);
    const renderedInteractionStateRef = useRef<InteractionState>(
      initialRenderedInteractionState,
    );
    const wasInteractionStateControlledRef = useRef(
      interactionStateOverride != null,
    );
    const containerRef = useRef<HTMLElement>(null);
    const setContainerRef = useComposedRef(ref, containerRef);
    const measuredDims = useMeasuredElementDimensions(containerRef);
    const {
      partialFocusPosition,
      partialFocusTranslationX,
      partialFocusTranslationY,
      handlePartialFocusHandoff,
      startRubberbandAnimation,
    } = useContainerPartialFocusFeedback({
      containerRef,
      onPartialFocusHandoff,
      partialFocusSupportedAxis,
      isRubberbandTranslationEnabled,
    });
    const handleInvalidFocusDirection = useCallback(
      (direction: InvalidFocusDirection) => {
        startRubberbandAnimation(direction);
        onInvalidFocusDirection?.(direction);
      },
      [onInvalidFocusDirection, startRubberbandAnimation],
    );
    useEffect(() => {
      material.setPartialFocusPosition(
        partialFocusPosition.x,
        partialFocusPosition.y,
      );
    }, [material, partialFocusPosition.x, partialFocusPosition.y]);

    const visualStateRef = useRef(visualState);
    const interactionScaleRef = useRef(interactionScale);
    const interactionAlphaRef = useRef(interactionAlpha);

    useLayoutEffect(() => {
      visualStateRef.current = visualState;
    }, [visualState]);

    useLayoutEffect(() => {
      interactionScaleRef.current = interactionScale;
    }, [interactionScale]);

    useLayoutEffect(() => {
      interactionAlphaRef.current = interactionAlpha;
    }, [interactionAlpha]);

    // Recompute the active interaction scale when the rendered size changes.
    // The shared material measurement hook handles initial layout, font
    // settling, and responsive layout changes so material paths and content
    // scale always use the same rendered border box.
    const lastScaleSizeRef = useRef<{ w: number; h: number } | null>(null);
    useLayoutEffect(() => {
      const size = measuredDims ?? (
        typeof width === 'number' && typeof height === 'number'
          ? { w: width, h: height }
          : null
      );
      if (size == null) return;

      const w = size.w;
      const h = size.h;
      if (w <= 0 || h <= 0) return;

      const previousSize = lastScaleSizeRef.current;
      if (previousSize?.w === w && previousSize.h === h) return;

      lastScaleSizeRef.current = { w, h };
      const renderedInteraction = renderedInteractionStateRef.current;
      const renderedVisualState = visualStateForInteractionStateFn
        ? visualStateForInteractionStateFn(renderedInteraction)
        : visualStateForInteractionState(renderedInteraction);
      if (visualStateRef.current !== renderedVisualState) return;

      const nextScale = contentScaleForStateFn
        ? contentScaleForStateFn(renderedInteraction.state, { width: w, height: h })
        : getContentScaleForState(renderedInteraction.state, platform, {
            width: w,
            height: h,
          });
      if (nextScale !== interactionScaleRef.current) {
        dispatchInteraction({
          type: 'SET_SCALE',
          scale: nextScale,
          animated: false,
        });
      }
    }, [
      contentScaleForStateFn,
      height,
      measuredDims,
      platform,
      visualStateForInteractionStateFn,
      width,
    ]);

    useEffect(() => {
      if (animated) return;

      const frameId = window.requestAnimationFrame(() => {
        dispatchInteraction({ type: 'SET_ANIMATED', animated: true });
      });
      return () => window.cancelAnimationFrame(frameId);
    }, [animated]);

    const clipId = useId();
    const insetClipId = useId();
    const clipPathId = `clip-${clipId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const insetClipPathId =
      `clip-inset-${insetClipId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    const updateInternalMaterialTransition = useCallback((
      transition: ContainerMaterialTransition | null
    ) => {
      internalMaterialTransitionRef.current = transition;
      setInternalMaterialTransition(transition);
    }, []);

    const cancelSynchronizedStateTransition = useCallback((complete: boolean) => {
      const activeTransition = stateTransitionRef.current;
      stateTransitionRef.current = null;
      stateTransitionTargetRef.current = null;
      activeTransition?.cancel(complete);
    }, []);

    const createRootInteractionParticipant = useCallback(({
      fromScale,
      toScale,
      fromAlpha,
      toAlpha,
      transitionDuration,
      prevInteraction,
      newInteraction,
    }: {
      fromScale: number;
      toScale: number;
      fromAlpha: number;
      toAlpha: number;
      transitionDuration: number;
      prevInteraction: InteractionState;
      newInteraction: InteractionState;
    }): SynchronizedTransitionParticipant | null => {
      const el = containerRef.current;
      if (el == null || transitionDuration <= 0) {
        return null;
      }

      const styleOwnsTransform = style.transform != null;
      const renderedValues = readRenderedInteractionValues(
        el,
        fromScale,
        fromAlpha,
        customScaleX,
        customScaleY,
        customAlpha,
      );
      const shouldAnimateTransform =
        !styleOwnsTransform &&
        !interactionValuesEqual(renderedValues.scale, toScale);
      const shouldAnimateAlpha =
        !interactionValuesEqual(renderedValues.alpha, toAlpha);

      if (!shouldAnimateTransform && !shouldAnimateAlpha) {
        return null;
      }

      const initialWillChange = el.style.willChange;
      const fromRenderedScale = renderedValues.scale;
      const fromRenderedAlpha = renderedValues.alpha;
      const updateRootFrame = (progress: number) => {
        if (shouldAnimateTransform) {
          const scale = interpolateNumber(fromRenderedScale, toScale, progress);
          el.style.transform = formatScaleTransform(
            scale,
            customScaleX,
            customScaleY,
          );
        }
        if (shouldAnimateAlpha) {
          const alpha = interpolateNumber(fromRenderedAlpha, toAlpha, progress);
          el.style.opacity = `${alpha * customAlpha}`;
        }
      };

      // A press state change animates the content scale with a spring via
      // getContainerSpringForStateChange, run to the spring's natural
      // settle time so the scale overshoots the target and springs back. Gated
      // on a pure scale animation: press transitions do not
      // change the disabled alpha, so the spring drives only the scale; every
      // other transition (and any alpha change) keeps the cubic-bezier path.
      const springConfig =
        shouldAnimateTransform && !shouldAnimateAlpha
          ? getContainerSpringForStateChange(
              prevInteraction.state,
              newInteraction.state,
            )
          : null;
      const springTiming = springConfig != null ? getSpringEasing(springConfig) : null;

      return {
        durationMs: springTiming?.durationMs ?? transitionDuration,
        easing: springTiming
          ? springTiming.easing
          : (linearProgress) => getEasedProgressForStateChange(
              prevInteraction.state,
              newInteraction.state,
              linearProgress,
            ),
        onCancel: () => {
          el.style.willChange = initialWillChange;
        },
        onComplete: () => {
          updateRootFrame(1);
          el.style.willChange = initialWillChange;
        },
        onFrame: ({ easedProgress }) => {
          updateRootFrame(easedProgress);
        },
        onStart: () => {
          el.style.willChange = [
            shouldAnimateTransform ? 'transform' : '',
            shouldAnimateAlpha ? 'opacity' : '',
          ].filter(Boolean).join(', ');
        },
      };
    }, [customAlpha, customScaleX, customScaleY, style.transform]);

    useEffect(() => {
      return () => {
        cancelSynchronizedStateTransition(false);
        pendingStateTransitionRef.current = null;
        internalMaterialTransitionRef.current = null;
        setInternalMaterialTransition(null);
      };
    }, [cancelSynchronizedStateTransition]);

    useLayoutEffect(() => {
      const pendingTransition = pendingStateTransitionRef.current;
      if (pendingTransition == null) {
        return;
      }

      pendingStateTransitionRef.current = null;
      stateTransitionTargetRef.current = pendingTransition.target;
      stateTransitionRef.current = startSynchronizedTransition({
        applyInitialFrame: true,
        completionPaddingMs: 150,
        participants: pendingTransition.participants,
      });
    });

    const handleMaterialChange = useCallback(() => {
      setLayerRevision((revision) => revision + 1);
    }, []);

    useLayoutEffect(
      () => material.attachToHost(materialHostRef.current, handleMaterialChange),
      [handleMaterialChange, material],
    );

    useLayoutEffect(() => {
      const effectiveState = visualStateOverride ?? visualState;
      if (material.getCurrentState() !== effectiveState) {
        material.setState(effectiveState, false);
      }
    }, [material, visualState, visualStateOverride]);

    /**
     * Handle state changes from InteractableBase:
     * - Calculates content scale and applies as interactionScale
     * - Updates material state with both prev and new visual states
     * - Handles disabled alpha transitions
     */
    const handleStateChange = useCallback((
      prevInteraction: InteractionState,
      newInteraction: InteractionState
    ): void => {
      // Calculate visual state using override function or default.
      // Note: ContainerMaterial.setState() only accepts the new state.
      const newVisualState = visualStateForInteractionStateFn
        ? visualStateForInteractionStateFn(newInteraction)
        : visualStateForInteractionState(newInteraction);
      const prevVisualState = visualStateForInteractionStateFn
        ? visualStateForInteractionStateFn(prevInteraction)
        : visualStateForInteractionState(prevInteraction);
      const transitionDuration = newInteraction.state === State.PRESSED
        ? AnimationDurations.CONTAINER_PRESS_IN
        : prevInteraction.state === State.PRESSED
          ? AnimationDurations.CONTAINER_PRESS_OUT
          : AnimationDurations.CONTAINER_STATE_CHANGE;
      const transitionInterpolator = newInteraction.state === State.PRESSED
        ? Interpolators.CONTAINER_PRESS_IN
        : prevInteraction.state === State.PRESSED
          ? Interpolators.CONTAINER_PRESS_OUT
          : Interpolators.CONTAINER_SCALE;

      // FastScrollTracker is a module singleton, so the current interaction can
      // read the same fast-scroll state that InteractableBase just recorded.
      const isPressTransition =
        newInteraction.state === State.PRESSED ||
        prevInteraction.state === State.PRESSED;
      const isFastScrolling =
        interactionStateOverride == null && FastScrollTracker.isCurrentlyFastScrolling;
      const isFastFocus = isFastScrolling && !isPressTransition;
      const isFastDefaultToFocused =
        isFastFocus &&
        prevInteraction.state === State.DEFAULT &&
        newInteraction.state === State.FOCUSED;
      const scaleStartDelayMs =
        isFastScrolling && newInteraction.state === State.FOCUSED
          ? AnimationDurations.CONTAINER_FAST_MOVEMENT_EXPANSION_HESITATION_DELAY
          : 0;
      const materialTransitionDuration = isFastScrolling
        ? AnimationDurations.CONTAINER_STATE_CHANGE_FAST_FOCUS
        : transitionDuration;

      visualStateRef.current = newVisualState;

      const materialPrevVisualState = material.getCurrentState();
      const transitionFromVisualState =
        materialPrevVisualState !== newVisualState
          ? materialPrevVisualState
          : prevVisualState;
      const el = containerRef.current;
      const shouldSnapPageEntryTransition =
        el?.closest('[data-page-transition-phase="entering"]') != null;
      // Page entry and fast scrolling snap every state-change participant.
      const shouldAnimateStateChange =
        !prefersReducedMotion &&
        !shouldSnapPageEntryTransition &&
        !isFastScrolling;

      // Calculate content scale using ACTUAL rendered size (not prop).
      // Use the measured width/height for the scale calculation. Fall back to
      // the prop value, then to a large default (not 88 — that's Button-specific
      // and would make all components scale like collapsed buttons).
      const rect = el?.getBoundingClientRect();
      const actualWidth = rect?.width ?? (typeof width === 'number' ? width : 600);
      const actualHeight = rect?.height ?? (typeof height === 'number' ? height : 120);
      const containerSize = { width: actualWidth, height: actualHeight };

      const newScale = contentScaleForStateFn
        ? contentScaleForStateFn(newInteraction.state, containerSize)
        : getContentScaleForState(newInteraction.state, platform, containerSize);
      const newAlpha =
        prevInteraction.isDisabled !== newInteraction.isDisabled
          ? (newInteraction.isDisabled
              ? CONTAINER_DISABLED_OPACITY
              : CONTAINER_ENABLED_OPACITY)
          : interactionAlphaRef.current;
      const transition = {
        duration: transitionDuration,
        interpolator: transitionInterpolator,
      };
      const customStateChangeAnimations =
        stateChangeAnimations?.({
          prevInteraction,
          newInteraction,
          animated: shouldAnimateStateChange,
          transition,
          containerSize,
        }) ?? [];
      const currentTransitionTarget = stateTransitionTargetRef.current;
      const currentMaterialTransition = internalMaterialTransitionRef.current;
      const isDuplicateMaterialTransition =
        transitionFromVisualState === newVisualState ||
        (
          currentMaterialTransition != null &&
          currentMaterialTransition.from === transitionFromVisualState &&
          currentMaterialTransition.to === newVisualState &&
          currentMaterialTransition.progress < 1
        );
      const isDuplicateStateTransition =
        stateTransitionRef.current?.isActive() === true &&
        currentTransitionTarget != null &&
        (style.transform != null ||
          interactionValuesEqual(currentTransitionTarget.scale, newScale)) &&
        interactionValuesEqual(currentTransitionTarget.alpha, newAlpha) &&
        isDuplicateMaterialTransition;

      if (isDuplicateStateTransition) {
        return;
      }

      cancelSynchronizedStateTransition(false);
      pendingStateTransitionRef.current = null;
      const synchronizedParticipants: SynchronizedTransitionParticipant[] = [];

      if (shouldAnimateStateChange) {
        const rootParticipant = createRootInteractionParticipant({
          fromAlpha: interactionAlphaRef.current,
          fromScale: interactionScaleRef.current,
          newInteraction,
          prevInteraction,
          toAlpha: newAlpha,
          toScale: newScale,
          transitionDuration,
        });
        if (rootParticipant != null) {
          if (scaleStartDelayMs > 0) {
            rootParticipant.startDelayMs = scaleStartDelayMs;
          }
          synchronizedParticipants.push(rootParticipant);
        }

        customStateChangeAnimations.forEach((animation) => {
          synchronizedParticipants.push({
            durationMs: animation.duration,
            onCancel: animation.onCancel,
            onComplete: animation.onComplete,
            onFrame: ({ elapsedMs, linearProgress }) => {
              animation.onFrame(elapsedMs, linearProgress);
            },
            onStart: animation.onStart,
            startDelayMs: animation.startDelay,
          });
        });
      }

      material.setState(
        materialPrevVisualState,
        newVisualState,
        shouldAnimateStateChange && !isFastDefaultToFocused,
      );
      setLayerRevision((revision) => revision + 1);

      if (materialTransition == null) {
        if (!shouldAnimateStateChange || isFastDefaultToFocused) {
          updateInternalMaterialTransition(null);
        } else if (transitionFromVisualState !== newVisualState) {
          updateInternalMaterialTransition({
            from: transitionFromVisualState,
            progress: 0,
            to: newVisualState,
          });
          synchronizedParticipants.push({
            durationMs: materialTransitionDuration,
            easing: (linearProgress) => getEasedProgressForStateChange(
              prevInteraction.state,
              newInteraction.state,
              linearProgress,
            ),
            onCancel: () => {
              updateInternalMaterialTransition(null);
            },
            onComplete: () => {
              updateInternalMaterialTransition(null);
            },
            onFrame: ({ easedProgress }) => {
              updateInternalMaterialTransition({
                from: transitionFromVisualState,
                progress: easedProgress,
                to: newVisualState,
              });
            },
          });
        } else if (internalMaterialTransitionRef.current != null) {
          updateInternalMaterialTransition(null);
        }
      }

      // Task 3: Single dispatch replaces 5 individual setState calls
      dispatchInteraction({
        type: 'SET_INTERACTION_STATE',
        visualState: newVisualState,
        transition: {
          duration: transitionDuration,
          interpolator: transitionInterpolator,
        },
        scale: newScale,
        animated: shouldAnimateStateChange,
        alphaChange: prevInteraction.isDisabled !== newInteraction.isDisabled
          ? { isDisabled: newInteraction.isDisabled }
          : undefined,
      });

      if (synchronizedParticipants.length > 0) {
        pendingStateTransitionRef.current = {
          participants: synchronizedParticipants,
          target: {
            alpha: newAlpha,
            scale: newScale,
          },
        };
      }

      onStateChange?.(prevInteraction, newInteraction);
    }, [
      cancelSynchronizedStateTransition,
      contentScaleForStateFn,
      createRootInteractionParticipant,
      height,
      interactionStateOverride,
      material,
      materialTransition,
      onStateChange,
      platform,
      prefersReducedMotion,
      style.transform,
      stateChangeAnimations,
      updateInternalMaterialTransition,
      visualStateForInteractionStateFn,
      width,
    ]);

    const handleDomInteractionStateChange = useCallback((
      prevInteraction: InteractionState,
      newInteraction: InteractionState,
    ): void => {
      domInteractionStateRef.current = newInteraction;
      if (interactionStateOverride != null) {
        return;
      }

      renderedInteractionStateRef.current = newInteraction;
      handleStateChange(prevInteraction, newInteraction);
    }, [handleStateChange, interactionStateOverride]);

    useLayoutEffect(() => {
      const wasControlled = wasInteractionStateControlledRef.current;
      const isControlled = interactionStateOverride != null;
      let nextState = interactionStateOverride ?? domInteractionStateRef.current;
      if (wasControlled && !isControlled) {
        const hasFocusWithin =
          containerRef.current?.contains(document.activeElement) === true;
        nextState = {
          state: domInteractionStateRef.current.state === State.PRESSED && hasFocusWithin
            ? State.PRESSED
            : hasFocusWithin
              ? State.FOCUSED
              : State.DEFAULT,
          isDisabled: disabled,
        };
        domInteractionStateRef.current = nextState;
      }
      wasInteractionStateControlledRef.current = isControlled;

      const previousState = renderedInteractionStateRef.current;
      if (
        previousState.state === nextState.state &&
        previousState.isDisabled === nextState.isDisabled
      ) {
        return;
      }

      renderedInteractionStateRef.current = nextState;
      handleStateChange(previousState, nextState);
    }, [disabled, handleStateChange, interactionStateOverride]);

    /**
     * Notify scale changes.
     */
    useEffect(() => {
      onScaleChange?.(interactionScale);
    }, [interactionScale, onScaleChange]);

    /**
     * Combined scale: interactionScale * customScale, applied per axis.
     */
    const combinedScaleX = interactionScale * customScaleX;
    const combinedScaleY = interactionScale * customScaleY;
    /**
     * Combined alpha: interactionAlpha * customAlpha.
     *
     * Applied as the root element's CSS opacity, which fades the whole subtree
     * (material canvas included). Canvas materials intentionally render
     * independent of element alpha; the root CSS opacity covers the
     * disabled/visibility fade, so no separate material alpha hook is needed.
     */
    const combinedAlpha = interactionAlpha * customAlpha;

    /**
     * Get background layers for rendering
     */
    const backgroundLayers = useMemo(
      () => material.getBackgroundLayers(),
      // State changes also need to refresh material snapshots even if focus
      // lands before the material listener has attached during route restore.
      [material, layerRevision, visualState, visualStateOverride],
    );

    /**
     * Get foreground layers for rendering
     */
    const foregroundLayers = useMemo(
      () => material.getForegroundLayers(),
      // State changes also need to refresh material snapshots even if focus
      // lands before the material listener has attached during route restore.
      [material, layerRevision, visualState, visualStateOverride],
    );

    /**
     * Effective visual state for rendering
     * Use override if provided, otherwise use internal state
     */
    const effectiveVisualState = visualStateOverride ?? visualState;

    const activeMaterialTransition = useMemo(
      () => materialTransition != null && materialTransition.from !== materialTransition.to
        ? {
            from: materialTransition.from,
            to: materialTransition.to,
            progress: Math.max(0, Math.min(1, materialTransition.progress)),
          }
        : internalMaterialTransition,
      [internalMaterialTransition, materialTransition],
    );
    /**
     * Calculate smooth corner path if enabled.
     *
     * Smooth corners are used whenever dimensions are available — either fixed
     * (number props) or measured via ResizeObserver.
     *
     * This allows responsive components (ListItem, ControlTile,
     * IsolatedControl) to use smooth corners by measuring their
     * actual rendered size, rather than requiring explicit pixel
     * dimensions as props.
     *
     * Dynamic components such as Button use measured dimensions so their
     * material layers continue to follow the same path during width changes.
     */
    const {
      effectiveUseSmoothCorners,
      containerW,
      containerH,
      shapeContext,
      smoothCornerPath,
      cssSmoothCornerClipPath,
    } = useMemo(
      () => getContainerShapeMetrics({
        width,
        height,
        measuredDims,
        shapeProvider,
      }),
      [height, measuredDims, shapeProvider, width],
    );

    /**
     * Container styles
     *
     * Children are stacked on top of each other without centering. Material
     * overflow remains visible; ContainerFrame clips only the content subtree.
     * The scale transform applies scaleX/scaleY.
     */
    const containerStyle: CSSProperties = useMemo(
      () => ({
        position: 'relative',
        width,
        height,
        borderRadius: effectiveUseSmoothCorners
          ? undefined
          : shapeContext.shapeProvider.getCssBorderRadius?.() ?? '0px',
        overflow: 'visible',
        translate: material.backgroundBlendsWithBackdrop() &&
          partialFocusTranslationX === 0 &&
          partialFocusTranslationY === 0
          ? undefined
          : `${partialFocusTranslationX}px ${partialFocusTranslationY}px`,
        transform: material.backgroundBlendsWithBackdrop() &&
          combinedScaleX === 1 &&
          combinedScaleY === 1
          ? undefined
          : `scale(${combinedScaleX}, ${combinedScaleY})`,
        transition: NO_ROOT_TRANSITION,
        opacity: combinedAlpha,
        isolation: material.backgroundBlendsWithBackdrop() ? 'auto' : undefined,
        ...style,
      }),
      // Task 1: no materialRevision — only reads corner radius, not layers
      [
        clipContent,
        combinedAlpha,
        combinedScaleX,
        combinedScaleY,
        effectiveUseSmoothCorners,
        height,
        material,
        partialFocusTranslationX,
        partialFocusTranslationY,
        style,
        width,
      ],
    );

    /**
     * Resolve material inset to individual values (left, top, right, bottom).
     */
    const resolvedInset = useMemo(
      () => material.getInset(),
      [material],
    );

    const hasInset = resolvedInset != null;

    /**
     * When material-owned insets are set, generate a separate smooth corner
     * clip path for the inset dimensions. The background/foreground layers are
     * positioned via CSS inset and clipped with this smaller path.
     */
    const insetSmoothCornerPath = useMemo(
      () => (effectiveUseSmoothCorners && hasInset && containerW > 0 && containerH > 0)
        ? getCachedShapePath(
          shapeContext.shapeProvider,
          {
            width: containerW - resolvedInset!.left - resolvedInset!.right,
            height: containerH - resolvedInset!.top - resolvedInset!.bottom,
          },
        )
        : null,
      // Task 1: no materialRevision — only reads corner radius, not layers
      [
        containerH,
        containerW,
        effectiveUseSmoothCorners,
        hasInset,
        resolvedInset,
        shapeContext,
      ],
    );

    const baseMaterialAlpha = material.getAlpha();
    const stateMaterialAlpha = useMemo(() => {
      const transition = activeMaterialTransition;
      if (
        transition != null &&
        transition.from !== transition.to &&
        transition.progress >= 0 &&
        transition.progress < 1
      ) {
        const fromAlpha = material.getAlphaForState(transition.from);
        const toAlpha = material.getAlphaForState(transition.to);
        return fromAlpha + (toAlpha - fromAlpha) * transition.progress;
      }
      return material.getAlphaForState(effectiveVisualState);
    }, [activeMaterialTransition, effectiveVisualState, material]);
    const materialAlpha = baseMaterialAlpha * stateMaterialAlpha;
    const transitionHasVisibleEndpoint = activeMaterialTransition != null &&
      activeMaterialTransition.from !== activeMaterialTransition.to &&
      activeMaterialTransition.progress >= 0 &&
      activeMaterialTransition.progress < 1 &&
      (
        material.getAlphaForState(activeMaterialTransition.from) > 0 ||
        material.getAlphaForState(activeMaterialTransition.to) > 0
      );
    const isMaterialVisible = !material.isHidden() &&
      baseMaterialAlpha > 0 &&
      (stateMaterialAlpha > 0 || transitionHasVisibleEndpoint);

    const materialLayerPositionStyle: CSSProperties = useMemo(
      () => ({
        borderRadius: (effectiveUseSmoothCorners && !hasInset)
          ? undefined
          : shapeContext.shapeProvider.getCssBorderRadius?.() ?? '0px',
        display: isMaterialVisible ? undefined : 'none',
        opacity: materialAlpha,
        ...(hasInset ? {
          top: resolvedInset!.top,
          left: resolvedInset!.left,
          right: resolvedInset!.right,
          bottom: resolvedInset!.bottom,
        } : {}),
      }),
      // Task 1: no materialRevision — only reads corner radius, not layers
      [
        effectiveUseSmoothCorners,
        hasInset,
        isMaterialVisible,
        material,
        materialAlpha,
        resolvedInset,
        shapeContext,
      ],
    );

    const layerShapeContext = useMemo(
      () => ({
        ...shapeContext,
        materialInset: resolvedInset ?? undefined,
      }),
      [resolvedInset, shapeContext],
    );

    const layerPathD = hasInset ? insetSmoothCornerPath : smoothCornerPath;
    const layerW = hasInset && resolvedInset
      ? containerW - resolvedInset.left - resolvedInset.right
      : containerW;
    const layerH = hasInset && resolvedInset
      ? containerH - resolvedInset.top - resolvedInset.bottom
      : containerH;
    const idPrefix = clipPathId;

    const containerClassName = useMemo(
      () => `${styles.container} ${className}`,
      [className],
    );

    return (
      <InteractableBaseInternal
        ref={setContainerRef}
        className={containerClassName}
        style={containerStyle}
        disabled={interactionStateOverride?.isDisabled ?? disabled}
        onStateChange={handleDomInteractionStateChange}
        partialFocusSupportedAxis={partialFocusSupportedAxis}
        isRubberbandTranslationEnabled={isRubberbandTranslationEnabled}
        onInvalidFocusDirection={handleInvalidFocusDirection}
        onPartialFocusHandoff={handlePartialFocusHandoff}
        {...interactableProps}
        data-uit-background-blends-with-backdrop={
          material.backgroundBlendsWithBackdrop() ? 'true' : undefined
        }
      >
        <ContainerFrame
          backgroundLayers={isMaterialVisible ? backgroundLayers : EMPTY_MATERIAL_LAYERS}
          foregroundLayers={isMaterialVisible ? foregroundLayers : EMPTY_MATERIAL_LAYERS}
          effectiveVisualState={effectiveVisualState}
          activeMaterialTransition={activeMaterialTransition}
          isMaterialTransitionControlled={materialTransition != null}
          animated={animated}
          effectiveUseSmoothCorners={effectiveUseSmoothCorners}
          smoothCornerPath={smoothCornerPath}
          cssSmoothCornerClipPath={cssSmoothCornerClipPath}
          clipPathId={clipPathId}
          insetClipPathId={insetClipPathId}
          insetSmoothCornerPath={insetSmoothCornerPath}
          materialLayerPositionStyle={materialLayerPositionStyle}
          hasInset={hasInset}
          clipContent={clipContent}
          layerPathD={layerPathD}
          layerW={layerW}
          layerH={layerH}
          idPrefix={idPrefix}
          shapeContext={layerShapeContext}
          partialFocusPosition={partialFocusPosition}
          interactionTransition={interactionTransition}
          foregroundBlendsWithContent={material.foregroundBlendsWithContent()}
          backgroundBlendsWithBackdrop={material.backgroundBlendsWithBackdrop()}
        >
          {children}
        </ContainerFrame>
      </InteractableBaseInternal>
    );
  }
);

export const Container = memo(ContainerImpl) as ContainerComponent;
