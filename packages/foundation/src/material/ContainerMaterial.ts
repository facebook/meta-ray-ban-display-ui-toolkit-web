/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ContainerMaterial system
 * Provides layered rendering with state-driven animations
 *
 * - Each layer = one visual effect (fill, gradient, shadow, stroke)
 * - Layers compose via z-ordering (sortOrder) and alpha blending
 * - render() returns ONLY CSS properties, never components
 */

import { VisualState } from '../base/Interactions';
import type {
  CanvasLayerDrawParams,
  ContainerMaterialConfig,
  ContainerMaterialInset,
  ContainerMaterialLayerOptions,
  DrawCanvasFn,
  LayerStyles,
  MaterialLayer,
  PartialFocusPosition,
} from './ContainerMaterial.types';

export type {
  CanvasLayerDrawParams,
  CanvasMaterialAssets,
  ContainerMaterialConfig,
  ContainerMaterialInset,
  ContainerMaterialLayerOptions,
  DrawCanvasFn,
  LayerStyles,
  MaterialLayer,
  MaterialShapeContext,
  MaterialStateTransition,
  PartialFocusPosition,
} from './ContainerMaterial.types';
export type {
  ShapePathParams,
  ShapeProvider,
  ShapeTailDirection,
  StrokePathParams,
} from './ShapeProvider';
export {
  CornerRadius,
  getCornerRadiusValue,
  getShapeProviderId,
  RoundedRectangleShapeProvider,
  TailShapeProvider,
} from './ShapeProvider';

/**
 * Layer placement (rendering order)
 */
export const LayerPlacement = {
  BACKGROUND: 'background', // Renders behind content
  FOREGROUND: 'foreground', // Renders in front of content
} as const;
export type LayerPlacement = (typeof LayerPlacement)[keyof typeof LayerPlacement];

/** Sort-order bounds for layer z-ordering. */
export const MIN_SORT_ORDER = 0;
export const DEFAULT_SORT_ORDER = 500;
export const MAX_SORT_ORDER = 1000;

function cloneLayerOwnedValue<T>(value: T, seen: WeakMap<object, object>): T {
  if (value == null || typeof value !== 'object') {
    return value;
  }
  const existing = seen.get(value);
  if (existing != null) {
    return existing as T;
  }
  if (Array.isArray(value)) {
    const cloned: unknown[] = [];
    seen.set(value, cloned);
    value.forEach(item => cloned.push(cloneLayerOwnedValue(item, seen)));
    return cloned as T;
  }
  if (value instanceof Map) {
    const cloned = new Map();
    seen.set(value, cloned);
    value.forEach((entryValue, entryKey) => {
      cloned.set(entryKey, cloneLayerOwnedValue(entryValue, seen));
    });
    return cloned as T;
  }
  if (value instanceof Set) {
    const cloned = new Set();
    seen.set(value, cloned);
    value.forEach(entry => cloned.add(cloneLayerOwnedValue(entry, seen)));
    return cloned as T;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return value;
  }

  const cloned = Object.create(prototype) as Record<PropertyKey, unknown>;
  seen.set(value, cloned);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor == null) {
      continue;
    }
    if ('value' in descriptor) {
      descriptor.value = cloneLayerOwnedValue(descriptor.value, seen);
    }
    Object.defineProperty(cloned, key, descriptor);
  }
  return cloned as T;
}

/**
 * Abstract base layer. Each concrete subclass renders exactly one visual effect
 * (solid fill, radial gradient, drop shadow, glow stroke, …), owns its own typed
 * config + blend mode + per-layer caches, and implements {@link paint}.
 *
 * `draw()` is the template method: it resolves the layer's animated alpha across
 * the active state transition (the per-state policy lives in
 * {@link alphaForState}) and then paints the single effect at that alpha. The
 * host invokes layers through `drawCanvas`, which the base binds to `draw` so
 * every typed layer plugs into the canvas host with no per-layer wiring.
 */
export abstract class ContainerMaterialLayer implements MaterialLayer {
  readonly id: string;
  readonly placement: LayerPlacement;
  readonly sortOrder: number;
  supportsDiscretePartialFocus: boolean;
  onStateChanged?: (oldState: VisualState, newState: VisualState) => void;
  drawCanvas?: DrawCanvasFn;
  animatesContinuously?: boolean;
  blendMode?: GlobalCompositeOperation;
  clipsToShape: boolean;
  private readonly alphaFn?: (state: VisualState) => number;

  protected constructor(
    id: string,
    placement: LayerPlacement,
    options: ContainerMaterialLayerOptions = {},
  ) {
    this.id = id;
    this.placement = placement;
    this.sortOrder = options.sortOrder ?? DEFAULT_SORT_ORDER;
    this.onStateChanged = options.onStateChanged;
    this.animatesContinuously = options.animatesContinuously;
    this.blendMode = options.blendMode;
    this.supportsDiscretePartialFocus = options.supportsDiscretePartialFocus ?? true;
    this.clipsToShape = options.clipsToShape ?? true;
    this.alphaFn = options.alphaForState;
    this.drawCanvas = (ctx, params) => this.draw(ctx, params);
  }

  /**
   * Per-state target alpha (0..1) for this layer. Resolves the `alphaForState`
   * policy supplied at construction, defaulting to fully opaque. Subclasses may
   * override for intrinsic visibility rules.
   */
  protected alphaForState(state: VisualState): number {
    return this.alphaFn != null ? this.alphaFn(state) : 1;
  }

  /**
   * Template method: resolve the animated alpha across any active transition,
   * then paint the single effect. Skips painting when the resolved alpha is
   * zero.
   */
  draw(ctx: CanvasRenderingContext2D, params: CanvasLayerDrawParams): void {
    const alpha = params.lerpState((state) => this.alphaForState(state));
    if (alpha <= 0) {
      return;
    }
    this.paint(ctx, params, alpha);
  }

  /**
   * Whether this layer resolves to a visible alpha in the given state. The canvas
   * host gates its requestAnimationFrame loop on this so a continuously-animating
   * layer that is invisible in the current state does not keep the loop running.
   */
  isVisibleForState(state: VisualState): boolean {
    return this.alphaForState(state) > 0;
  }

  /** Paint this layer's single visual effect at the resolved alpha. */
  protected abstract paint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void;

  /**
   * Drop cached path-derived data when the shape path is regenerated. No-op by
   * default; layers that cache path-derived bitmaps/shaders/strokes override it.
   */
  invalidatePathCaches(): void {}

  /** Create an independent copy for a derived material instance. */
  clone(): this {
    const cloned = Object.create(Object.getPrototypeOf(this)) as this;
    const descriptors = Object.getOwnPropertyDescriptors(this);
    const seen = new WeakMap<object, object>();
    for (const descriptor of Object.values(descriptors)) {
      if ('value' in descriptor) {
        descriptor.value = cloneLayerOwnedValue(descriptor.value, seen);
      }
    }
    Object.defineProperties(cloned, descriptors);
    if (this.drawCanvas != null) {
      cloned.drawCanvas = (ctx, params) => cloned.draw(ctx, params);
    }
    return cloned;
  }
}

/**
 * Adapter for closure-based layer definitions created via {@link createLayer}.
 *
 * Bridges legacy materials that have not yet been migrated to typed layer
 * subclasses: it stores the supplied `drawCanvas` closure directly (bypassing
 * the {@link ContainerMaterialLayer.paint} template) and keeps the optional CSS
 * `render` closure for tests that still inspect it.
 */
export class FunctionalContainerMaterialLayer extends ContainerMaterialLayer {
  private readonly renderFn?: (state: VisualState, animated: boolean) => LayerStyles;

  constructor(
    id: string,
    placement: LayerPlacement,
    render: ((state: VisualState, animated: boolean) => LayerStyles) | undefined,
    options: ContainerMaterialLayerOptions = {},
  ) {
    super(id, placement, options);
    this.renderFn = render;
    if (options.drawCanvas != null) {
      this.drawCanvas = options.drawCanvas;
    } else {
      this.drawCanvas = undefined;
    }
  }

  protected paint(): void {
    // Unused: a functional layer renders through its supplied drawCanvas closure.
  }

  render(state: VisualState, animated: boolean): LayerStyles {
    return this.renderFn?.(state, animated) ?? {};
  }

  clone(): this {
    const cloned = super.clone();
    cloned.drawCanvas = this.drawCanvas;
    return cloned;
  }
}

function cloneMaterialLayer(layer: MaterialLayer): MaterialLayer {
  if (typeof layer.clone !== 'function') {
    throw new Error(
      `MaterialLayer "${layer.id}" must implement clone() so each ContainerMaterial owns independent layer state.`,
    );
  }
  return layer.clone();
}

const OWNED_LAYERS = Symbol('ContainerMaterial.ownedLayers');

/**
 * Container material class
 * Manages layers and state transitions
 */
export class ContainerMaterial {
  protected config: ContainerMaterialConfig;
  private currentState: VisualState = VisualState.DEFAULT;
  private partialFocusPosition: PartialFocusPosition = { x: 0, y: 0 };
  private attachedHost: object | null = null;
  private attachedHostChangeListener: (() => void) | null = null;

  /**
   * Used by stateful materials whose properties can mutate after the
   * component has mounted (for example, animated materials whose content
   * state changes).
   */
  onMaterialChangeListener?: (material: ContainerMaterial) => void;

  constructor(config: ContainerMaterialConfig);
  constructor(
    config: ContainerMaterialConfig,
    layerOwnership?: typeof OWNED_LAYERS,
  ) {
    this.config = {
      hidden: false,
      alpha: 1.0,
      ...config,
      layers: layerOwnership === OWNED_LAYERS
        ? config.layers
        : config.layers.map(cloneMaterialLayer),
    };
  }

  /**
   * Update visual state
   * Triggers onStateChanged callbacks on layers
   *
   * Accepts either setState(prevState, state, animated) or the shorthand
   * setState(state, animated).
   */
  setState(
    prevStateOrNewState: VisualState,
    stateOrAnimated: VisualState | boolean = true,
    _animated: boolean = true,
  ): void {
    const oldState =
      typeof stateOrAnimated === 'boolean'
        ? this.currentState
        : prevStateOrNewState;
    const newState =
      typeof stateOrAnimated === 'boolean'
        ? prevStateOrNewState
        : stateOrAnimated;

    if (oldState !== newState) {
      this.currentState = newState;

      // Notify layers of state change
      this.config.layers.forEach(layer => {
        layer.onStateChanged?.(oldState, newState);
      });
    }
  }

  /**
   * Notify the attached Container that material-owned properties changed.
   */
  protected notifyMaterialChange(): void {
    this.attachedHostChangeListener?.();
    this.onMaterialChangeListener?.(this);
  }

  /**
   * Attach this stateful material instance to its rendering host. A material can
   * have only one host at a time because its visual state and mutable layer data
   * are shared by reference. Create a separate material instance for each
   * simultaneously mounted container.
   */
  attachToHost(host: object, onChange: () => void): () => void {
    if (this.attachedHost != null && this.attachedHost !== host) {
      throw new Error(
        'A ContainerMaterial instance cannot be mounted by more than one container at a time. Create a separate material instance for each container.',
      );
    }

    this.attachedHost = host;
    this.attachedHostChangeListener = onChange;
    return () => this.detachFromHost(host);
  }

  private detachFromHost(host: object): void {
    if (this.attachedHost !== host) {
      return;
    }
    this.attachedHost = null;
    this.attachedHostChangeListener = null;
  }

  /**
   * Get current visual state
   */
  getCurrentState(): VisualState {
    return this.currentState;
  }

  /**
   * Container owns the InteractableBase callback and forwards the normalized
   * render offset into the material before layers draw.
   */
  setPartialFocusPosition(x: number, y: number): void {
    this.partialFocusPosition = { x, y };
  }

  getPartialFocusPosition(): PartialFocusPosition {
    return this.partialFocusPosition;
  }

  /**
   * Get background layers sorted by sortOrder
   */
  getBackgroundLayers(): MaterialLayer[] {
    return this.config.layers
      .filter(layer => layer.placement === LayerPlacement.BACKGROUND)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get foreground layers sorted by sortOrder
   */
  getForegroundLayers(): MaterialLayer[] {
    return this.config.layers
      .filter(layer => layer.placement === LayerPlacement.FOREGROUND)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Whether this material supports discrete partial-focus handoff.
   */
  get supportsDiscretePartialFocus(): boolean {
    return this.config.supportsDiscretePartialFocus ?? true;
  }

  /**
   * Factory hook so subclasses keep their runtime type when common material
   * properties are copied.
   */
  protected createWithConfig(config: ContainerMaterialConfig): ContainerMaterial {
    return new ContainerMaterial(config);
  }

  /**
   * Get material alpha
   */
  getAlpha(): number {
    return Math.max(0, Math.min(1, this.config.alpha ?? 1.0));
  }

  /** Get post-composition material alpha for a visual state. */
  getAlphaForState(state: VisualState): number {
    return Math.max(0, Math.min(1, this.config.alphaForState?.(state) ?? 1.0));
  }

  /**
   * Get material-owned insets for layer rendering.
   */
  getInset(): ContainerMaterialInset | null {
    const inset = this.config.inset;
    if (inset == null) {
      return null;
    }

    return typeof inset === 'number'
      ? { left: inset, top: inset, right: inset, bottom: inset }
      : inset;
  }

  /**
   * Return a material with the same layers/configuration but material-owned insets.
   */
  withInset(inset: number | ContainerMaterialInset): ContainerMaterial {
    return this.createWithConfig({
      ...this.config,
      inset,
    });
  }

  /**
   * Return a material with the inner-shadow layer removed, e.g. for an
   * always-focused icon-container material whose backdrop should draw no inner
   * shadow. A no-op for materials that have no inner-shadow layer.
   */
  withoutInnerShadow(): ContainerMaterial {
    return this.createWithConfig({
      ...this.config,
      layers: this.config.layers.filter((layer) => layer.id !== 'inner-shadow'),
    });
  }

  /**
   * Check if material is hidden
   */
  isHidden(): boolean {
    return this.config.hidden ?? false;
  }

  /**
   * Whether the foreground layers should blend with the live DOM content behind
   * them.
   */
  foregroundBlendsWithContent(): boolean {
    return this.config.foregroundBlendsWithContent ?? false;
  }

  /** Whether background layers blend with the live backdrop. */
  backgroundBlendsWithBackdrop(): boolean {
    return this.config.backgroundBlendsWithBackdrop ?? false;
  }
}

/** @internal Constructs a material from layers freshly allocated by a factory. */
export function createContainerMaterialWithOwnedLayers(
  config: ContainerMaterialConfig,
): ContainerMaterial {
  const OwnedContainerMaterial = ContainerMaterial as unknown as new (
    ownedConfig: ContainerMaterialConfig,
    layerOwnership: typeof OWNED_LAYERS,
  ) => ContainerMaterial;
  return new OwnedContainerMaterial(config, OWNED_LAYERS);
}

/**
 * Create a material layer
 * Helper function for cleaner layer creation
 *
 * @param id - Unique layer identifier
 * @param placement - Where to render (background/foreground)
 * @param render - Render function that returns CSS properties
 * @param metadata - Optional metadata (sortOrder, onStateChanged)
 * @returns MaterialLayer instance
 */
export function createLayer(
  id: string,
  placement: LayerPlacement,
  render: ((state: VisualState, animated: boolean) => LayerStyles) | undefined,
  metadata: ContainerMaterialLayerOptions = {},
): MaterialLayer {
  return new FunctionalContainerMaterialLayer(id, placement, render, {
    sortOrder: metadata.sortOrder,
    onStateChanged: metadata.onStateChanged,
    drawCanvas: metadata.drawCanvas,
    animatesContinuously: metadata.animatesContinuously,
    blendMode: metadata.blendMode,
    supportsDiscretePartialFocus: metadata.supportsDiscretePartialFocus ?? false,
    clipsToShape: metadata.clipsToShape,
    alphaForState: metadata.alphaForState,
  });
}
