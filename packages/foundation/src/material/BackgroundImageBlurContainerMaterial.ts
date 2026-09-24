/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { VisualState } from '../base/Interactions';
import {
  Overlay,
} from '../colors/Colors';
import {
  ContainerMaterial,
  LayerPlacement,
  type ContainerMaterialConfig,
  type MaterialLayer,
} from './ContainerMaterial';
import {
  ImageContentContainerMaterialLayer,
  RadialGradientGlowStrokeContainerMaterialLayer,
  SolidColorContainerMaterialLayer,
} from './layers';

const BLUR_RADIUS = 28;
const DEFAULT_STROKE_WIDTH = 1;
const FOCUSED_STROKE_WIDTH = 2;
const PRESS_OVERLAY = 'rgba(255, 255, 255, 0.251)';

const isVisible = (state: VisualState): boolean => state !== VisualState.NONE;

/**
 * Container material that renders a blurred background image.
 *
 * The image is set as a URL through setImage(url) and rendered through the
 * material layer stack: blurred image, dark fill overlay, pressed interaction
 * overlay, and glow stroke.
 */
export class BackgroundImageBlurContainerMaterial extends ContainerMaterial {
  private imageSrc: string | null;

  constructor(imageSrc: string | null = null) {
    const imageSource = { current: imageSrc };
    super({
      layers: createBackgroundImageBlurContainerMaterialLayers(() => imageSource.current),
      supportsDiscretePartialFocus: false,
      foregroundBlendsWithContent: true,
    });

    this.imageSrc = imageSrc;
  }

  setImage(imageSrc: string | null): void {
    if (this.imageSrc === imageSrc) {
      return;
    }

    this.imageSrc = imageSrc;
    this.config = {
      ...this.config,
      layers: createBackgroundImageBlurContainerMaterialLayers(() => this.imageSrc),
    };
    this.notifyMaterialChange();
  }

  getImage(): string | null {
    return this.imageSrc;
  }

  protected createWithConfig(config: ContainerMaterialConfig): ContainerMaterial {
    const material = new BackgroundImageBlurContainerMaterial(this.imageSrc);
    material.config = {
      ...config,
      layers: createBackgroundImageBlurContainerMaterialLayers(() => material.imageSrc),
    };
    return material;
  }
}

export function createBackgroundImageBlurContainerMaterial(
  imageSrc: string | null = null,
): BackgroundImageBlurContainerMaterial {
  return new BackgroundImageBlurContainerMaterial(imageSrc);
}

function createBackgroundImageBlurContainerMaterialLayers(
  getImageSrc: () => string | null,
): MaterialLayer[] {
  return [
    createImageContentLayer(getImageSrc),
    createFillOverlayLayer(),
    createInteractionPressLayer(),
    createBlurGlowStrokeLayer(),
  ];
}

function createImageContentLayer(getImageSrc: () => string | null): MaterialLayer {
  return new ImageContentContainerMaterialLayer({
    id: 'image-content',
    placement: LayerPlacement.BACKGROUND,
    sortOrder: 25,
    imageUrl: () => getImageSrc() ?? '',
    fit: 'cover',
    blurPx: BLUR_RADIUS,
    alphaForState: (state) => (isVisible(state) ? 1 : 0),
  });
}

function createFillOverlayLayer(): MaterialLayer {
  return new SolidColorContainerMaterialLayer({
    id: 'fill-overlay',
    placement: LayerPlacement.BACKGROUND,
    sortOrder: 50,
    color: Overlay.dark[50],
    alphaForState: (state) => (isVisible(state) ? 1 : 0),
  });
}

function createInteractionPressLayer(): MaterialLayer {
  return new SolidColorContainerMaterialLayer({
    id: 'interaction-press',
    placement: LayerPlacement.FOREGROUND,
    sortOrder: 250,
    color: PRESS_OVERLAY,
    alphaForState: (state) => (state === VisualState.PRESSED ? 1 : 0),
  });
}

function createBlurGlowStrokeLayer(): MaterialLayer {
  return new RadialGradientGlowStrokeContainerMaterialLayer({
    id: 'glow-stroke',
    placement: LayerPlacement.FOREGROUND,
    sortOrder: 300,
    supportsDiscretePartialFocus: false,
    blendMode: 'overlay',
    sizeMultiplier: { x: 0.625, y: 0.905 },
    placementMultiplier: { x: 0.2604, y: -0.091 },
    useInsetAdjustedHeight: true,
    stops: [
      { offset: 0, color: 'rgba(255, 255, 255, 1)' },
      { offset: 0.72, color: 'rgba(255, 255, 255, 0)' },
    ],
    alphaForState: (state) => (isVisible(state) ? 1 : 0),
    strokeWidthForState: backgroundBlurGlowStrokeWidth,
  });
}

function backgroundBlurGlowStrokeWidth(state: VisualState): number {
  return state === VisualState.FOCUSED || state === VisualState.PRESSED
    ? FOCUSED_STROKE_WIDTH
    : DEFAULT_STROKE_WIDTH;
}
