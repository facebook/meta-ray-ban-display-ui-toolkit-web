/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  CanvasLayerDrawParams,
  ContainerMaterial,
  DrawCanvasFn,
  createLayer,
  createContainerMaterialWithOwnedLayers,
} from './ContainerMaterial';
import type { DefaultContainerMaterialFactory } from './DefaultContainerMaterial.types';
import { VisualState } from '../base/Interactions';
import { Utility } from '../colors/Colors';
import { LinearGradientContainerMaterialLayer } from './layers';

export type DefaultMaterialFactory = DefaultContainerMaterialFactory;

const PANEL_SCRIM_BLACKOUT_HEIGHT = 64;

export function createPanelContainerMaterial(
  createDefaultMaterial: DefaultContainerMaterialFactory,
): ContainerMaterial {
  const baseMaterial = createDefaultMaterial();

  const allLayers = [
    ...baseMaterial.getBackgroundLayers(),
    ...baseMaterial.getForegroundLayers(),
  ];
  // The panel dims every base layer by a per-state group-opacity multiplier.
  // Each typed base layer is kept intact and composited at that multiplier — a
  // composition wrapper, so it stays a functional layer over the base layer's
  // own draw.
  const wrappedLayers = allLayers.map((layer) => {
    const onStateChanged = layer.onStateChanged?.bind(layer);
    const isVisibleForState = layer.isVisibleForState?.bind(layer);
    const wrappedLayer = createLayer(layer.id, layer.placement, undefined, {
      sortOrder: layer.sortOrder,
      animatesContinuously: layer.animatesContinuously,
      blendMode: layer.blendMode,
      clipsToShape: layer.clipsToShape,
      onStateChanged,
      supportsDiscretePartialFocus: layer.supportsDiscretePartialFocus,
      drawCanvas: wrapDrawCanvasWithPanelAlpha(layer.drawCanvas),
    });
    if (isVisibleForState != null) {
      wrappedLayer.isVisibleForState = isVisibleForState;
    }
    return wrappedLayer;
  });

  // The scrim is a black bottom fade (transparent at the top, fully opaque from
  // PANEL_SCRIM_BLACKOUT_HEIGHT px above the bottom) drawn over its own
  // rectangular geometry rather than the rounded container shape.
  const panelScrimLayer = new LinearGradientContainerMaterialLayer({
    id: 'panel-scrim',
    sortOrder: 350,
    fillRect: true,
    points: (_width, height) => ({ x0: 0, y0: 0, x1: 0, y1: height }),
    stops: (params) => {
      const scrimEndFraction =
        params.height > 0
          ? Math.max(0, (params.height - PANEL_SCRIM_BLACKOUT_HEIGHT) / params.height)
          : 0;
      return [
        { offset: 0, color: Utility.transparent },
        { offset: scrimEndFraction, color: Utility.occlude },
      ];
    },
  });

  return createContainerMaterialWithOwnedLayers({
    layers: [...wrappedLayers, panelScrimLayer],
  });
}

function panelAlphaMultiplier(state: VisualState): number {
  switch (state) {
    case VisualState.NONE:
    case VisualState.DEFAULT:
      return 0.5;
    case VisualState.FOCUSED:
      return 0.75;
    case VisualState.PRESSED:
      return 0.9;
    default:
      return 0.5;
  }
}

/**
 * Wrap a base layer's drawCanvas so its paint is dimmed by the panel's per-state
 * alpha multiplier. The multiplier scales each layer's own alpha while the layer
 * still paints onto the shared container canvas. That is the key: a blend-mode
 * layer (inner-shadow `screen`,
 * noise/glow-stroke `overlay`) must composite against the layers drawn beneath
 * it, NOT against an isolated empty buffer.
 *
 * The base primitives set `globalAlpha` to an absolute value (after `save()`),
 * so we intercept those assignments via a proxy and fold in the multiplier. The
 * layer's `globalCompositeOperation` passes through unchanged, so the blend acts
 * on the real backdrop. The multiplier interpolates via lerpState across a state
 * change.
 */
function wrapDrawCanvasWithPanelAlpha(
  baseDrawCanvas: DrawCanvasFn | undefined,
): DrawCanvasFn {
  return (ctx: CanvasRenderingContext2D, p: CanvasLayerDrawParams): void => {
    if (baseDrawCanvas == null) {
      return;
    }
    const multiplier = p.lerpState(panelAlphaMultiplier);
    if (multiplier <= 0) {
      return;
    }
    if (multiplier >= 1) {
      baseDrawCanvas(ctx, p);
      return;
    }

    // Read/write directly on the target rather than via Reflect with the proxy
    // as receiver: native CanvasRenderingContext2D accessors (globalAlpha,
    // fillStyle, canvas, …) require the real context as `this`, so a proxy
    // receiver throws "Illegal invocation". Methods are bound to the real ctx.
    const scaledCtx = new Proxy(ctx, {
      get(target, prop) {
        const value = (target as unknown as Record<PropertyKey, unknown>)[prop];
        return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
      },
      set(target, prop, value) {
        const writable = target as unknown as Record<PropertyKey, unknown>;
        if (prop === 'globalAlpha' && typeof value === 'number') {
          writable[prop] = value * multiplier;
        } else {
          writable[prop] = value;
        }
        return true;
      },
    });
    baseDrawCanvas(scaledCtx as CanvasRenderingContext2D, p);
  };
}
