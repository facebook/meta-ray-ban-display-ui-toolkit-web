/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import type { VisualState } from '../base/Interactions';
import type { LayerPlacement } from './ContainerMaterial';
import type { ShapeProvider } from './ShapeProvider';

/**
 * Layer styles that can be returned from render()
 * Represents CSS properties applied to a single layer div.
 */
export type LayerStyles = CSSProperties;

/**
 * Shape metadata passed to material layers.
 * Lets stroke layers draw an inset stroke path rather than stroking the outer
 * fill path.
 */
export interface MaterialShapeContext {
  materialInset?: ContainerMaterialInset;
  shapeProvider: ShapeProvider;
}

export interface ContainerMaterialInset {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Normalized partial-focus offset. Rubber-band feedback moves this in
 * [-0.5, 0.5] and material layers may shift their focus-aware gradients by
 * x * width / y * height.
 */
export interface PartialFocusPosition {
  x: number;
  y: number;
}

/**
 * An in-flight material state transition.
 *
 * A single 0..1 tween drives every layer, which interpolates its own animated
 * properties (alpha, stroke width, gradient scale) between the from-state and
 * to-state values.
 */
export interface MaterialStateTransition {
  from: VisualState;
  to: VisualState;
  progress: number;
}

/** Loaded image assets available to canvas layers (e.g. the noise texture). */
export interface CanvasMaterialAssets {
  noise: CanvasImageSource | null;
  /**
   * Lazily load and cache an image by URL. Returns null until the image has
   * decoded; loading triggers a redraw so the layer paints once the bitmap is
   * ready. Used by materials with dynamic image content (e.g. blurred
   * backgrounds, media tiles).
   */
  getImage(url: string): CanvasImageSource | null;
}

/**
 * Parameters passed to a layer's canvas draw call.
 *
 * The context transform is already scaled to the device pixel ratio, with the
 * layer origin at (0, 0) in logical (CSS) pixels. Each layer draws its single
 * visual effect against the shared shape path. Parameters are valid only for
 * the duration of the draw call and must not be retained.
 */
export interface CanvasLayerDrawParams {
  /** Resolved current visual state (the target of any active transition). */
  state: VisualState;
  /** When set, the layer interpolates its animated props from->to by progress. */
  transition?: MaterialStateTransition;
  /** Shared outer shape path in logical px, origin (0, 0). */
  path: Path2D;
  /** Layer area in logical px. */
  width: number;
  height: number;
  shapeContext: MaterialShapeContext;
  partialFocusPosition: PartialFocusPosition;
  /** Device pixel ratio the context is scaled to (for offscreen passes). */
  dpr: number;
  /**
   * Monotonic timestamp (ms) for continuously-animating layers. Only meaningful
   * for layers that set animatesContinuously; otherwise the host redraws solely
   * on input changes and this reflects the most recent draw time.
   */
  time: number;
  /** Loaded image assets, or null entries until they finish loading. */
  assets: CanvasMaterialAssets;
  /**
   * Interpolate a per-state numeric property across the active transition.
   * Returns valueForState(state) when no transition is active, otherwise the
   * eased blend between the from-state and to-state values.
   */
  lerpState(valueForState: (state: VisualState) => number): number;
  /**
   * Resolve the inset stroke path for the given stroke width. The returned path
   * is already inset and translated into place (stroke it directly).
   */
  getInsetStrokePath(strokeWidth: number): Path2D;
}

/** A layer's canvas draw function. */
export type DrawCanvasFn = (
  ctx: CanvasRenderingContext2D,
  params: CanvasLayerDrawParams,
) => void;

/**
 * Material layer interface
 *
 * Key principle: Each layer is ONE visual effect
 * - Solid fill? One layer
 * - Radial gradient? One layer
 * - Drop shadow? One layer
 * - Stroke? One layer
 */
export interface MaterialLayer {
  /** Unique layer identifier */
  readonly id: string;

  /** Where this layer renders (background/foreground) */
  readonly placement: LayerPlacement;

  /** Z-order within placement group (0-1000, lower = behind, higher = front) */
  readonly sortOrder: number;

  /**
   * Return an independent layer for a new material instance. Implementations
   * must copy private mutable state and caches; sharing those objects violates
   * ContainerMaterial's single-owner contract.
   */
  clone(): MaterialLayer;

  /**
   * CSS render path. Returns CSS properties for a layer element. A layer may use
   * this instead of `drawCanvas` when the effect is naturally represented by CSS.
   */
  render?(state: VisualState, animated: boolean): LayerStyles;

  /**
   * Draw this layer onto a 2D canvas using the container's shape path.
   *
   * Canvas layers in the same placement normally share one canvas.
   */
  drawCanvas?: DrawCanvasFn;

  /**
   * Whether this layer animates continuously (independent of state changes).
   * When any layer in a placement sets this, the canvas host runs a
   * requestAnimationFrame loop and supplies an advancing time to drawCanvas.
   */
  animatesContinuously?: boolean;

  /**
   * Whether this layer would paint anything in the given visual state (resolved
   * alpha > 0). The canvas host uses this to PAUSE its requestAnimationFrame loop
   * when every continuously-animating layer is invisible in the current state,
   * saving battery and CPU. Defaults to visible (true) when a layer does not
   * implement it.
   */
  isVisibleForState?(state: VisualState): boolean;

  /**
   * This layer's blend mode against its backdrop. The layer's drawCanvas applies
   * it via globalCompositeOperation, compositing against the surface's own
   * accumulated pixels.
   *
   * It is ALSO declared here so the host can reproduce the blend at the ELEMENT
   * level for a foreground layer that opts into blending with live DOM content
   * (ContainerMaterialConfig.foregroundBlendsWithContent): a canvas cannot
   * composite against the DOM content behind it, so for that case the host
   * renders the layer's group on its own canvas with this as the CSS
   * mix-blend-mode (drawing onto a transparent group canvas makes the in-canvas
   * blend a no-op, and the element performs the real blend against the content).
   */
  blendMode?: GlobalCompositeOperation;

  /**
   * Optional: Called when state changes (before render)
   * Use for complex state transitions or caching
   */
  onStateChanged?(oldState: VisualState, newState: VisualState): void;

  /**
   * Whether this layer responds to discrete partial-focus offsets.
   * Container translation always rubber-bands, but only layers that opt in
   * should move their focus-aware gradient origins.
   */
  supportsDiscretePartialFocus?: boolean;

  /**
   * Whether this layer should be clipped to the container shape.
   *
   * Layers normally draw through the container shape path, but some layers
   * intentionally supply their own rectangular metrics path. Panel scrim is the
   * canonical case: it blacks out the bottom of the panel without inheriting the
   * rounded container path.
   */
  clipsToShape?: boolean;
}

export interface ContainerMaterialLayerOptions {
  sortOrder?: number;
  onStateChanged?: (oldState: VisualState, newState: VisualState) => void;
  drawCanvas?: DrawCanvasFn;
  animatesContinuously?: boolean;
  blendMode?: GlobalCompositeOperation;
  supportsDiscretePartialFocus?: boolean;
  clipsToShape?: boolean;
  /**
   * Per-state target alpha (0..1): the base layer resolves this across the
   * active transition before painting. Defaults to fully opaque when omitted.
   */
  alphaForState?: (state: VisualState) => number;
}

/**
 * Container material configuration
 */
export interface ContainerMaterialConfig {
  /** Material layers (each layer = one visual effect) */
  layers: MaterialLayer[];

  /**
   * Whether this material supports discrete partial-focus handoff. Rubber-band
   * render offsets are still forwarded to layers, and each layer decides
   * independently whether its focus-aware origin responds.
   */
  supportsDiscretePartialFocus?: boolean;

  /** Whether material is hidden */
  hidden?: boolean;

  /** Material opacity override (0-1) */
  alpha?: number;

  /**
   * Post-composition material opacity for each visual state. This multiplies
   * `alpha` and fades the background and foreground material surfaces without
   * affecting container content.
   */
  alphaForState?: (state: VisualState) => number;

  /** Insets applied to this material's rendered layers. */
  inset?: number | ContainerMaterialInset;

  /**
   * Opt the foreground layers into blending with the live DOM content behind
   * them (default false). Normally each surface is a single canvas whose layers
   * blend among themselves. A canvas cannot composite against the DOM content
   * behind it, so a material whose foreground overlay must blend
   * with arbitrary content sets this: the host then renders the foreground layers
   * grouped by blend mode onto element-blended canvases (CSS mix-blend-mode), at
   * the cost of a few extra surfaces.
   */
  foregroundBlendsWithContent?: boolean;

  /**
   * Opt background layers into blending with the backdrop behind the container.
   * Use this only for materials whose layer blend modes require live backdrop
   * pixels; it may split the background into multiple compositing surfaces.
   * A caller-supplied transform, filter, clip, or partial opacity on the host
   * creates a CSS compositing group and limits blending to that group.
   */
  backgroundBlendsWithBackdrop?: boolean;
}
