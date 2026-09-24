/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ContainerMaterial,
  LayerPlacement,
  LayerStyles,
  createLayer,
} from './ContainerMaterial';
import type {
  CanvasLayerDrawParams,
  ContainerMaterialConfig,
} from './ContainerMaterial.types';
import type { DefaultContainerMaterialFactory } from './DefaultContainerMaterial.types';
import { VisualState } from '../base/Interactions';
import { MaterialColors, Gray } from '../colors/Colors';
import { AnimationDurations, createTransition } from '../motion/Animations';
import { strokeSolid } from './canvas/CanvasDrawUtils';
import {
  AnimatableRadialGradientContainerMaterialLayer,
  SolidColorContainerMaterialLayer,
} from './layers';

const INPUT_FIELD_COLOR = Gray['1050'];
const IDLE_BORDER_COLOR = Gray['850'];

const isIdleVisible = (state: VisualState): boolean =>
  state === VisualState.DEFAULT || state === VisualState.NONE;
const isFocusedVisible = (state: VisualState): boolean =>
  state === VisualState.FOCUSED || state === VisualState.PRESSED;

const LOADING_POSITION_DURATION_MS = 1500;
const LOADING_SCALE_DURATION_MS = 1500;
const LOADING_OPACITY_DURATION_MS = 2000;

class LoadingTextInputFocusedLayer extends AnimatableRadialGradientContainerMaterialLayer {
  private isLoading = false;
  private loadingAnimationActive = false;
  private loadingStartedAt = 0;

  constructor() {
    super({
      id: 'focused-material',
      sortOrder: 100,
      supportsDiscretePartialFocus: true,
      sizeMultiplier: { x: 216 / 88 / 2, y: 264 / 88 / 2 },
      placementMultiplier: { x: 0.2256, y: 0.1333 },
      useInsetAdjustedHeight: true,
      stops: [
        { offset: 0, color: MaterialColors.gradientStep1 },
        { offset: 0.33, color: MaterialColors.gradientStep2 },
        { offset: 0.66, color: MaterialColors.gradientStep3 },
        { offset: 1, color: MaterialColors.gradientStep4 },
      ],
      alphaForState: (state) => isFocusedVisible(state) ? 1 : 0,
    });
    this.animatesContinuously = true;
  }

  setLoading(isLoading: boolean): boolean {
    if (this.isLoading === isLoading) {
      return false;
    }
    this.isLoading = isLoading;
    this.loadingAnimationActive = false;
    this.resetAnimationProperties();
    return true;
  }

  override isVisibleForState(state: VisualState): boolean {
    return this.isLoading && super.isVisibleForState(state);
  }

  protected override paint(
    ctx: CanvasRenderingContext2D,
    params: CanvasLayerDrawParams,
    alpha: number,
  ): void {
    if (!this.isLoading || !isFocusedVisible(params.state)) {
      this.loadingAnimationActive = false;
      this.resetAnimationProperties();
      super.paint(ctx, params, alpha);
      return;
    }
    if (!this.loadingAnimationActive) {
      this.loadingAnimationActive = true;
      this.loadingStartedAt = params.time;
    }

    const elapsed = Math.max(0, params.time - this.loadingStartedAt);
    const positionPhase = elapsed * Math.PI * 2 / LOADING_POSITION_DURATION_MS;
    const scalePhase = elapsed * Math.PI * 2 / LOADING_SCALE_DURATION_MS - Math.PI / 2;
    const opacityPhase = elapsed * Math.PI * 2 / LOADING_OPACITY_DURATION_MS;
    const positionEnvelope = Math.min(1, elapsed / LOADING_POSITION_DURATION_MS);
    const loadingOpacity = 0.875 + 0.125 * Math.cos(opacityPhase);
    this.animatedPositionX = positionEnvelope * (0.5 + 0.4 * Math.sin(positionPhase));
    this.animatedPositionY = positionEnvelope * (0.5 + 0.3 * Math.cos(positionPhase * 0.83));
    this.animationScale = 1.25 + 0.25 * Math.sin(scalePhase);
    super.paint(ctx, params, alpha * loadingOpacity);
  }
}

class TextInputContainerMaterial extends ContainerMaterial {
  copyForHost(): TextInputContainerMaterial {
    const copy = new TextInputContainerMaterial({ ...this.config });
    copy.setLoading(false);
    return copy;
  }

  setLoading(isLoading: boolean): void {
    const loadingLayer = this.config.layers.find(
      (layer): layer is LoadingTextInputFocusedLayer =>
        layer instanceof LoadingTextInputFocusedLayer,
    );
    if (loadingLayer == null) {
      return;
    }
    if (!loadingLayer.setLoading(isLoading)) {
      return;
    }
    this.notifyMaterialChange();
  }

  protected override createWithConfig(config: ContainerMaterialConfig): ContainerMaterial {
    return new TextInputContainerMaterial(config);
  }
}

export function copyTextInputMaterialForHost(material: ContainerMaterial): ContainerMaterial {
  return material instanceof TextInputContainerMaterial
    ? material.copyForHost()
    : material;
}

export function setTextInputMaterialLoading(
  material: ContainerMaterial,
  isLoading: boolean,
): void {
  if (material instanceof TextInputContainerMaterial) {
    material.setLoading(isLoading);
  }
}

export function createTextInputContainerMaterial(
  createDefaultMaterial: DefaultContainerMaterialFactory,
): ContainerMaterial {
  const base = createDefaultMaterial();
  const allLayers = [...base.getBackgroundLayers(), ...base.getForegroundLayers()];

  const modifiedLayers = allLayers.map((layer) => {
    if (layer.id === 'idle-material') {
      return new SolidColorContainerMaterialLayer({
        id: layer.id,
        placement: layer.placement,
        sortOrder: layer.sortOrder,
        color: INPUT_FIELD_COLOR,
        alphaForState: (state) => (state === VisualState.NONE ? 0 : 1),
      });
    }
    if (layer.id === 'focused-material') {
      return new LoadingTextInputFocusedLayer();
    }
    return layer;
  });

  const idleShadowCache = new WeakMap<Path2D, {
    canvas: HTMLCanvasElement;
    dpr: number;
    height: number;
    width: number;
  }>();
  const idleInnerShadow = createLayer(
    'text-input-idle-shadow',
    LayerPlacement.BACKGROUND,
    (state: VisualState, animated: boolean): LayerStyles => {
      const visible = isIdleVisible(state);
      return {
        boxShadow: 'inset -4px -4px 8px rgba(0, 0, 0, 1)',
        opacity: visible ? 1 : 0,
        transition: animated ? createTransition('opacity', AnimationDurations.CONTAINER_STATE_CHANGE) : 'none',
        borderRadius: 'inherit',
      };
    },
    {
      sortOrder: 55,
      drawCanvas: (ctx, p) => {
        const opacity = p.lerpState((state) => (isIdleVisible(state) ? 1 : 0));
        if (opacity <= 0 || p.width <= 0 || p.height <= 0) {
          return;
        }
        // Directional inset shadow: a black stroke of the shape edge, blurred and
        // offset toward the top-left, clipped to the shape interior. The drop-in
        // inner-glow primitive is symmetric, so this directional (blur + offset)
        // variant is rendered inline here.
        const sigma = 4;
        const offsetX = -4;
        const offsetY = -4;
        const strokeWidth = 16;
        const dpr = p.dpr;
        const pad = Math.ceil(sigma * 3 + Math.max(strokeWidth, Math.abs(offsetX), Math.abs(offsetY)));
        const paddedW = p.width + pad * 2;
        const paddedH = p.height + pad * 2;

        const cachedShadow = idleShadowCache.get(p.path);
        let blurred = cachedShadow?.canvas ?? null;
        if (
          cachedShadow == null ||
          cachedShadow.width !== p.width ||
          cachedShadow.height !== p.height ||
          cachedShadow.dpr !== dpr
        ) {
          const off = document.createElement('canvas');
          off.width = Math.ceil(paddedW * dpr);
          off.height = Math.ceil(paddedH * dpr);
          const octx = off.getContext('2d');
          if (octx == null) {
            return;
          }
          octx.scale(dpr, dpr);
          octx.translate(pad, pad);
          octx.lineWidth = strokeWidth;
          octx.lineCap = 'round';
          octx.lineJoin = 'round';
          octx.strokeStyle = 'black';
          octx.stroke(p.path);

          blurred = document.createElement('canvas');
          blurred.width = off.width;
          blurred.height = off.height;
          const bctx = blurred.getContext('2d');
          if (bctx == null) {
            return;
          }
          bctx.scale(dpr, dpr);
          bctx.filter = `blur(${sigma}px)`;
          bctx.drawImage(off, 0, 0, paddedW, paddedH);
          bctx.filter = 'none';
          idleShadowCache.set(p.path, {
            canvas: blurred,
            dpr,
            height: p.height,
            width: p.width,
          });
        }

        if (blurred == null) {
          return;
        }
        ctx.save();
        ctx.clip(p.path);
        ctx.globalAlpha = opacity;
        ctx.drawImage(blurred, -pad + offsetX, -pad + offsetY, paddedW, paddedH);
        ctx.restore();
      },
    },
  );

  const idleBorderStroke = createLayer(
    'text-input-idle-border',
    LayerPlacement.FOREGROUND,
    (state: VisualState, animated: boolean): LayerStyles => {
      const visible = isIdleVisible(state);
      return {
        border: `2px solid ${IDLE_BORDER_COLOR}`,
        borderRadius: 'inherit',
        boxSizing: 'border-box',
        opacity: visible ? 1 : 0,
        transition: animated ? createTransition('opacity', AnimationDurations.CONTAINER_STATE_CHANGE) : 'none',
      };
    },
    {
      sortOrder: 50,
      drawCanvas: (ctx, p) => {
        const opacity = p.lerpState((state) => (isIdleVisible(state) ? 1 : 0));
        if (opacity <= 0) {
          return;
        }
        strokeSolid(ctx, {
          strokePath: p.getInsetStrokePath(2),
          strokeWidth: 2,
          color: IDLE_BORDER_COLOR,
          alpha: opacity,
        });
      },
    },
  );

  return new TextInputContainerMaterial({
    layers: [...modifiedLayers, idleInnerShadow, idleBorderStroke],
  });
}
