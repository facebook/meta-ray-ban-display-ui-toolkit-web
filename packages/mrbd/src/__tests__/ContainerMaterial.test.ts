/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ContainerMaterial tests
 */

import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import {
  copyTextInputMaterialForHost,
  setTextInputMaterialLoading,
} from '@wearables-ui-toolkit/foundation/material/TextInputContainerMaterial';
import {
  ContainerMaterial,
  ContainerMaterialLayer,
  CornerRadius,
  LayerPlacement,
  createLayer,
  type MaterialLayer,
} from '@wearables-ui-toolkit/foundation';
import { createContainerMaterialWithOwnedLayers } from '@wearables-ui-toolkit/foundation/material/ContainerMaterial';
import type { CanvasLayerDrawParams } from '@wearables-ui-toolkit/foundation';
import {
  RoundedRectangleShapeProvider,
  getCachedShapePath,
  getCachedStrokePath,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import type { ContainerMaterial as ContainerMaterialType } from '@wearables-ui-toolkit/foundation';
import { BackgroundImageBlurContainerMaterial } from '@wearables-ui-toolkit/foundation/material/BackgroundImageBlurContainerMaterial';
import { createPanelContainerMaterial } from '@wearables-ui-toolkit/foundation/material/PanelContainerMaterial';
import {
  CanvasRecorder,
  drawLayer,
  installOffscreenCanvasStub,
  makeDrawParams,
} from './helpers/canvasRecorder';

let restoreOffscreen: () => void;

beforeAll(() => {
  restoreOffscreen = installOffscreenCanvasStub();
});

afterAll(() => {
  restoreOffscreen();
});

const fakeImage = {
  naturalWidth: 300,
  naturalHeight: 200,
} as unknown as CanvasImageSource;

function layerById(material: ContainerMaterialType, id: string) {
  const layer = [
    ...material.getBackgroundLayers(),
    ...material.getForegroundLayers(),
  ].find(item => item.id === id);
  if (layer == null) {
    throw new Error(`Layer not found: ${id}`);
  }
  return layer;
}

describe('MaterialLibrary factory methods', () => {
  it('default() creates material with background layers', () => {
    const material = MaterialLibrary.default();
    const bgLayers = material.getBackgroundLayers();
    expect(bgLayers.length).toBeGreaterThan(0);
  });

  it('default() creates material with layers that have canvas draw methods', () => {
    const material = MaterialLibrary.default();
    const allLayers = [...material.getBackgroundLayers(), ...material.getForegroundLayers()];
    expect(allLayers.length).toBeGreaterThan(0);
    for (const layer of allLayers) {
      expect(typeof layer.drawCanvas).toBe('function');
      expect(typeof layer.id).toBe('string');
    }
  });

  it('defaultStatic() creates material with idle fill and glow stroke background layers', () => {
    const material = MaterialLibrary.defaultStatic();
    const bgLayers = material.getBackgroundLayers();
    const fgLayers = material.getForegroundLayers();
    expect(bgLayers.map(layer => layer.id)).toEqual(['idle-material', 'glow-stroke']);
    expect(fgLayers.length).toBe(0);
  });

  it('withoutInnerShadow removes the inner-shadow layer while keeping the rest', () => {
    const material = MaterialLibrary.default();
    const layerIds = (m: ContainerMaterialType) =>
      [...m.getBackgroundLayers(), ...m.getForegroundLayers()].map(l => l.id);

    expect(layerIds(material)).toContain('inner-shadow');

    const stripped = material.withoutInnerShadow();
    const strippedIds = layerIds(stripped);
    expect(strippedIds).not.toContain('inner-shadow');
    // Every other layer is preserved; only the inner-shadow layer is dropped.
    expect(strippedIds).toEqual(layerIds(material).filter(id => id !== 'inner-shadow'));
  });

  it('withoutInnerShadow is a no-op for a material with no inner-shadow layer', () => {
    const material = MaterialLibrary.defaultStatic();
    expect(
      [...material.getBackgroundLayers(), ...material.getForegroundLayers()].map(l => l.id),
    ).not.toContain('inner-shadow');
    const stripped = material.withoutInnerShadow();
    expect(stripped.getBackgroundLayers().map(l => l.id)).toEqual(
      material.getBackgroundLayers().map(l => l.id),
    );
  });

  it('gives derived materials independent stateful layer instances', () => {
    type StatefulLayer = MaterialLayer & { stateChanges: number };
    const statefulLayer: StatefulLayer = {
      id: 'stateful',
      placement: LayerPlacement.BACKGROUND,
      sortOrder: 100,
      clipsToShape: true,
      stateChanges: 0,
      clone() {
        return {
          ...this,
          stateChanges: this.stateChanges,
        };
      },
      onStateChanged() {
        this.stateChanges += 1;
      },
    };
    const material = new ContainerMaterial({ layers: [statefulLayer] });
    const derived = material.withInset(4);
    const materialLayer = material.getBackgroundLayers()[0] as StatefulLayer;
    const derivedLayer = derived.getBackgroundLayers()[0] as StatefulLayer;

    expect(derivedLayer).not.toBe(materialLayer);

    const detachMaterial = material.attachToHost({}, () => {});
    const detachDerived = derived.attachToHost({}, () => {});
    try {
      material.setState(VisualState.FOCUSED, false);
      expect(materialLayer.stateChanges).toBe(1);
      expect(derivedLayer.stateChanges).toBe(0);

      derived.setState(VisualState.PRESSED, false);
      expect(materialLayer.stateChanges).toBe(1);
      expect(derivedLayer.stateChanges).toBe(1);
    } finally {
      detachMaterial();
      detachDerived();
    }
  });

  it('isolates mutable plain state in cloned typed layers', () => {
    class MutableLayer extends ContainerMaterialLayer {
      cache = {
        points: [1, 2],
        valuesByState: new Map([[VisualState.DEFAULT, { alpha: 1 }]]),
      };

      constructor() {
        super('mutable', LayerPlacement.BACKGROUND);
      }

      protected paint(
        _ctx: CanvasRenderingContext2D,
        _params: CanvasLayerDrawParams,
        _alpha: number,
      ): void {}
    }

    const material = new ContainerMaterial({ layers: [new MutableLayer()] });
    const derived = material.withInset(4);
    const original = material.getBackgroundLayers()[0] as MutableLayer;
    const cloned = derived.getBackgroundLayers()[0] as MutableLayer;

    expect(cloned.cache).not.toBe(original.cache);
    expect(cloned.cache.points).not.toBe(original.cache.points);
    expect(cloned.cache.valuesByState).not.toBe(original.cache.valuesByState);
    expect(cloned.cache.valuesByState.get(VisualState.DEFAULT)).not.toBe(
      original.cache.valuesByState.get(VisualState.DEFAULT),
    );
  });

  it('does not clone layers freshly allocated by internal factories', () => {
    const layer = createLayer(
      'owned',
      LayerPlacement.BACKGROUND,
      () => ({}),
    );
    const cloneSpy = vi.spyOn(layer, 'clone');

    createContainerMaterialWithOwnedLayers({ layers: [layer] });
    expect(cloneSpy).not.toHaveBeenCalled();

    new ContainerMaterial({ layers: [layer] });
    expect(cloneSpy).toHaveBeenCalledOnce();
  });

  it('panel() creates material', () => {
    const material = MaterialLibrary.panel();
    expect(material).toBeDefined();
    expect(material.getBackgroundLayers().length).toBeGreaterThan(0);
  });

  it('card materials blend foreground strokes with live card content', () => {
    expect(MaterialLibrary.card().foregroundBlendsWithContent()).toBe(true);
    expect(MaterialLibrary.fullScreenCard().foregroundBlendsWithContent()).toBe(true);
  });

  it('textInput animates its focused material while loading', () => {
    const material = MaterialLibrary.textInput();
    const focusedLayer = layerById(material, 'focused-material');

    expect(focusedLayer.animatesContinuously).toBe(true);
    expect(focusedLayer.isVisibleForState?.(VisualState.FOCUSED)).toBe(false);

    setTextInputMaterialLoading(material, true);
    expect(focusedLayer.isVisibleForState?.(VisualState.FOCUSED)).toBe(true);
    expect(focusedLayer.isVisibleForState?.(VisualState.DEFAULT)).toBe(false);

    const initial = drawLayer(focusedLayer, {
      state: VisualState.FOCUSED,
      time: 1000,
    });
    const animated = drawLayer(focusedLayer, {
      state: VisualState.FOCUSED,
      time: 1750,
    });
    expect(animated.gradients[0]?.args).not.toEqual(initial.gradients[0]?.args);
    expect(animated.ofType('fillRect')[0]?.style?.globalAlpha).toBeLessThan(
      initial.ofType('fillRect')[0]?.style?.globalAlpha ?? 0,
    );

    setTextInputMaterialLoading(material, false);
    expect(focusedLayer.isVisibleForState?.(VisualState.FOCUSED)).toBe(false);
  });

  it('reuses the text-input idle shadow bitmap across material frames', () => {
    const material = MaterialLibrary.textInput();
    const idleShadow = layerById(material, 'text-input-idle-shadow');
    const createElement = vi.spyOn(document, 'createElement');
    const params = makeDrawParams({ state: VisualState.DEFAULT });
    const recorder = new CanvasRecorder();

    idleShadow.drawCanvas?.(
      recorder as unknown as CanvasRenderingContext2D,
      params,
    );
    idleShadow.drawCanvas?.(
      recorder as unknown as CanvasRenderingContext2D,
      {
        ...params,
        transition: {
          from: VisualState.DEFAULT,
          to: VisualState.FOCUSED,
          progress: 0.25,
        },
        lerpState: valueForState =>
          valueForState(VisualState.DEFAULT) * 0.75 +
          valueForState(VisualState.FOCUSED) * 0.25,
      },
    );

    expect(
      createElement.mock.calls.filter(([tagName]) => tagName === 'canvas'),
    ).toHaveLength(2);
    createElement.mockRestore();
  });

  it('keeps loading state independent across per-host text-input material copies', () => {
    const original = MaterialLibrary.textInput();
    const firstCopy = copyTextInputMaterialForHost(original);
    const secondCopy = copyTextInputMaterialForHost(original);

    expect(firstCopy).not.toBe(original);
    expect(secondCopy).not.toBe(original);
    expect(secondCopy).not.toBe(firstCopy);

    setTextInputMaterialLoading(firstCopy, true);
    expect(
      layerById(firstCopy, 'focused-material').isVisibleForState?.(VisualState.FOCUSED),
    ).toBe(true);
    expect(
      layerById(secondCopy, 'focused-material').isVisibleForState?.(VisualState.FOCUSED),
    ).toBe(false);
    expect(
      layerById(original, 'focused-material').isVisibleForState?.(VisualState.FOCUSED),
    ).toBe(false);
  });

  it('outboundMessage uses the default message tokens', () => {
    const material = MaterialLibrary.outboundMessage();
    const idle = drawLayer(layerById(material, 'idle-material'), {
      state: VisualState.DEFAULT,
    });
    const focused = drawLayer(layerById(material, 'focused-material'), {
      state: VisualState.FOCUSED,
    });

    expect(idle.ofType('fill')[0]?.style?.fillStyle).toBe('#27344A');
    expect(
      focused.gradients.find(g => g.kind === 'radial')?.stops.map(s => s.color),
    ).toEqual(['#495E84', '#27344A', '#0E1119', '#0E1119']);
  });

  it('themedPrimaryBlue uses the primary theme token mapping', () => {
    const material = MaterialLibrary.themedPrimaryBlue();

    const idleRec = drawLayer(layerById(material, 'idle-material'), {
      state: VisualState.DEFAULT,
    });
    const focusedRec = drawLayer(layerById(material, 'focused-material'), {
      state: VisualState.FOCUSED,
    });

    expect(idleRec.ofType('fill')[0]?.style?.fillStyle).toBe('#2694FE');
    const focusedStops = focusedRec.gradients.find(g => g.kind === 'radial')?.stops.map(s => s.color);
    expect(focusedStops).toEqual(['#2694FE', '#0457CB', '#03278D', '#02165E']);
  });

  it('themedPrimary and themedSecondary expose token materials', () => {
    const primary = MaterialLibrary.themedPrimary();
    const secondary = MaterialLibrary.themedSecondary();

    const primaryIdle = drawLayer(layerById(primary, 'idle-material'), {
      state: VisualState.DEFAULT,
    });
    const primaryFocused = drawLayer(layerById(primary, 'focused-material'), {
      state: VisualState.FOCUSED,
    });
    const secondaryIdle = drawLayer(layerById(secondary, 'idle-material'), {
      state: VisualState.DEFAULT,
    });
    const secondaryFocused = drawLayer(layerById(secondary, 'focused-material'), {
      state: VisualState.FOCUSED,
    });

    expect(primaryIdle.ofType('fill')[0]?.style?.fillStyle).toBe('#30333A');
    expect(primaryFocused.gradients.find(g => g.kind === 'radial')?.stops.map(s => s.color)).toEqual([
      '#8D929D',
      '#474D57',
      '#111113',
      '#111113',
    ]);
    expect(secondaryIdle.ofType('fill')[0]?.style?.fillStyle).toBe('#27282D');
    expect(secondaryFocused.gradients.find(g => g.kind === 'radial')?.stops.map(s => s.color)).toEqual([
      '#585E6A',
      '#30333A',
      '#1E1E21',
      '#111113',
    ]);
  });

  it('positive and negative materials support default and persistent idle states', () => {
    const positiveDefault = MaterialLibrary.positive();
    const positivePersistent = MaterialLibrary.positive(false);
    const negativeDefault = MaterialLibrary.negative();
    const negativePersistent = MaterialLibrary.negative(false);

    const positiveDefaultIdle = drawLayer(layerById(positiveDefault, 'idle-material'), {
      state: VisualState.DEFAULT,
    });
    const positivePersistentIdle = drawLayer(layerById(positivePersistent, 'idle-material'), {
      state: VisualState.DEFAULT,
    });
    const positiveFocused = drawLayer(layerById(positiveDefault, 'focused-material'), {
      state: VisualState.FOCUSED,
    });
    const negativeDefaultIdle = drawLayer(layerById(negativeDefault, 'idle-material'), {
      state: VisualState.DEFAULT,
    });
    const negativePersistentIdle = drawLayer(layerById(negativePersistent, 'idle-material'), {
      state: VisualState.DEFAULT,
    });
    const negativeFocused = drawLayer(layerById(negativeDefault, 'focused-material'), {
      state: VisualState.FOCUSED,
    });

    expect(positiveDefaultIdle.ofType('fill')[0]?.style?.fillStyle).toBe('#27282D');
    expect(positivePersistentIdle.ofType('fill')[0]?.style?.fillStyle).toBe('#26A756');
    expect(positiveFocused.gradients.find(g => g.kind === 'radial')?.stops.map(s => s.color)).toEqual([
      '#26A756',
      '#056C42',
      '#003C29',
      '#002519',
    ]);
    expect(negativeDefaultIdle.ofType('fill')[0]?.style?.fillStyle).toBe('#27282D');
    expect(negativePersistentIdle.ofType('fill')[0]?.style?.fillStyle).toBe('#FF5668');
    expect(negativeFocused.gradients.find(g => g.kind === 'radial')?.stops.map(s => s.color)).toEqual([
      '#FF5668',
      '#BE0424',
      '#6F0007',
      '#460403',
    ]);
  });

  it('system material uses the app material gray tokens', () => {
    const material = MaterialLibrary.system();

    const idleRec = drawLayer(layerById(material, 'idle-material'), {
      state: VisualState.DEFAULT,
    });
    const focusedRec = drawLayer(layerById(material, 'focused-material'), {
      state: VisualState.FOCUSED,
    });

    expect(idleRec.ofType('fill')[0]?.style?.fillStyle).toBe('#27282D');
    expect(focusedRec.gradients.find(g => g.kind === 'radial')?.stops.map(s => s.color)).toEqual([
      '#8D929D',
      '#585E6A',
      '#30333A',
      '#1E1E21',
    ]);
  });

  it('clockPill material has a transparent idle with a focused gradient surface', () => {
    const material = MaterialLibrary.clockPill();
    const backgroundLayers = material.getBackgroundLayers();

    expect(backgroundLayers.map(layer => layer.id)).toEqual([
      'idle-material',
      'focused-material',
      'pressed-material',
      'glow-stroke',
    ]);
    expect(material.getForegroundLayers()).toEqual([]);

    // Idle draws nothing (transparent); the focused layer carries the surface.
    const idleRec = drawLayer(layerById(material, 'idle-material'), {
      state: VisualState.DEFAULT,
      width: 200,
      height: 64,
    });
    const focusedDefaultRec = drawLayer(layerById(material, 'focused-material'), {
      state: VisualState.DEFAULT,
      width: 200,
      height: 64,
    });
    const focusedRec = drawLayer(layerById(material, 'focused-material'), {
      state: VisualState.FOCUSED,
      width: 200,
      height: 64,
    });
    const defaultGlowRec = drawLayer(layerById(material, 'glow-stroke'), {
      state: VisualState.DEFAULT,
      width: 200,
      height: 64,
    });
    const focusedGlowRec = drawLayer(layerById(material, 'glow-stroke'), {
      state: VisualState.FOCUSED,
      width: 200,
      height: 64,
    });

    expect(idleRec.has('fill', 'fillRect', 'drawImage')).toBe(false);
    expect(focusedDefaultRec.has('fill', 'drawImage')).toBe(false);
    const focusedGradient = focusedRec.gradients.find(g => g.kind === 'linear');
    expect(focusedGradient?.stops.map(s => s.color)).toEqual([
      'rgba(39, 40, 45, 0.82)',
      'rgba(39, 40, 45, 0.33)',
    ]);
    expect(defaultGlowRec.has('drawImage')).toBe(false);
    expect(focusedGlowRec.ofType('drawImage').length).toBeGreaterThan(0);
  });

  it('reducedOpacityStatic material keeps the 0x4D surface fill without focused fill', () => {
    const material = MaterialLibrary.reducedOpacityStatic();
    const backgroundLayers = material.getBackgroundLayers();

    expect(backgroundLayers.map(layer => layer.id)).toEqual([
      'idle-material',
      'pressed-material',
      'glow-stroke',
    ]);
    expect(backgroundLayers.map(layer => layer.id)).not.toContain('focused-material');
    expect(backgroundLayers.map(layer => layer.id)).not.toContain('inner-shadow');

    const idleRec = drawLayer(layerById(material, 'idle-material'), {
      state: VisualState.DEFAULT,
      width: 160,
      height: 96,
    });
    const noneRec = drawLayer(layerById(material, 'idle-material'), {
      state: VisualState.NONE,
      width: 160,
      height: 96,
    });

    // Surface fill at 0x4D alpha (= 0.30196...).
    expect(idleRec.ofType('fill')[0]?.style?.fillStyle).toBe(
      'rgba(39, 40, 45, 0.30196078431372547)',
    );
    expect(noneRec.has('fill')).toBe(false);
  });

  it('statusIndicatorPanel material renders the 12px bottom fade scrim', () => {
    const material = MaterialLibrary.statusIndicatorPanel();
    const backgroundLayers = material.getBackgroundLayers();

    expect(backgroundLayers.map(layer => layer.id)).toEqual([
      'idle-material',
      'inner-shadow',
      'pressed-material',
      'glow-stroke',
    ]);

    const idleRec = drawLayer(layerById(material, 'idle-material'), {
      state: VisualState.DEFAULT,
      width: 240,
      height: 120,
    });
    const innerShadowRec = drawLayer(layerById(material, 'inner-shadow'), {
      state: VisualState.FOCUSED,
      width: 240,
      height: 120,
    });

    const idleGradient = idleRec.gradients.find(g => g.kind === 'linear');
    // Top-to-bottom surface fade: solid surface to transparent surface.
    expect(idleGradient?.stops.map(s => s.color)).toEqual([
      '#27282D',
      'rgba(39, 40, 45, 0)',
    ]);
    expect(innerShadowRec.ofType('drawImage').length).toBeGreaterThan(0);
  });

  it('message materials draw the themed inner glow in screen blend when FOCUSED', () => {
    const material = MaterialLibrary.inboundMessage();
    const focusedRec = drawLayer(layerById(material, 'inner-shadow'), {
      state: VisualState.FOCUSED,
    });
    const defaultRec = drawLayer(layerById(material, 'inner-shadow'), {
      state: VisualState.DEFAULT,
    });

    const composite = focusedRec.ofType('drawImage');
    expect(composite.length).toBeGreaterThan(0);
    expect(composite.some(op => op.style?.globalCompositeOperation === 'screen')).toBe(true);
    expect(defaultRec.has('drawImage', 'fill')).toBe(false);
  });

  it('default noise material fills an overlay pattern only when FOCUSED and loaded', () => {
    const material = MaterialLibrary.default();
    const focusedRec = drawLayer(layerById(material, 'noise-material'), {
      state: VisualState.FOCUSED,
      noise: { naturalWidth: 50, naturalHeight: 50 } as unknown as CanvasImageSource,
    });
    const defaultRec = drawLayer(layerById(material, 'noise-material'), {
      state: VisualState.DEFAULT,
      noise: { naturalWidth: 50, naturalHeight: 50 } as unknown as CanvasImageSource,
    });

    expect(focusedRec.patterns).toHaveLength(1);
    expect(focusedRec.ofType('fill')[0]?.style?.globalCompositeOperation).toBe('overlay');
    expect(defaultRec.has('fill', 'createPattern')).toBe(false);
  });

  it('backgroundImageBlur creates image material layers', () => {
    const material = MaterialLibrary.backgroundImageBlur('/assets/photo.jpg');

    expect(material.supportsDiscretePartialFocus).toBe(false);
    expect(material.foregroundBlendsWithContent()).toBe(true);
    expect(material.getBackgroundLayers().map(layer => layer.id)).toEqual([
      'image-content',
      'fill-overlay',
    ]);
    expect(material.getForegroundLayers().map(layer => layer.id)).toEqual([
      'interaction-press',
      'glow-stroke',
    ]);

    const getImage = vi.fn(() => fakeImage);
    const imageRec = drawLayer(layerById(material, 'image-content'), {
      state: VisualState.FOCUSED,
      getImage,
    });
    const fillRec = drawLayer(layerById(material, 'fill-overlay'), {
      state: VisualState.DEFAULT,
    });
    const pressRec = drawLayer(layerById(material, 'interaction-press'), {
      state: VisualState.PRESSED,
    });
    const defaultGlowRec = drawLayer(layerById(material, 'glow-stroke'), {
      state: VisualState.DEFAULT,
    });

    // Blurred image is drawn, clipped to the shape.
    expect(getImage).toHaveBeenCalledWith('/assets/photo.jpg');
    expect(imageRec.has('clip')).toBe(true);
    expect(imageRec.ofType('drawImage').length).toBeGreaterThan(0);
    // Dark 50% fill overlay.
    expect(fillRec.ofType('fill')[0]?.style?.fillStyle).toBe('rgba(0, 0, 0, 0.50)');
    // Pressed interaction overlay.
    expect(pressRec.ofType('fill')[0]?.style?.fillStyle).toBe('rgba(255, 255, 255, 0.251)');
    // Glow stroke composites (overlay) in DEFAULT (visible at rest for image blur).
    expect(defaultGlowRec.ofType('drawImage').length).toBeGreaterThan(0);
  });

  it('backgroundImageBlur setImage updates mutable image source and preserves subclass on copy', () => {
    const material = MaterialLibrary.backgroundImageBlur() as BackgroundImageBlurContainerMaterial;
    const listener = vi.fn();
    material.onMaterialChangeListener = listener;

    material.setImage('/assets/updated.jpg');

    expect(listener).toHaveBeenCalledWith(material);
    expect(material.getImage()).toBe('/assets/updated.jpg');

    const copied = material.withInset(4);
    expect(copied).toBeInstanceOf(BackgroundImageBlurContainerMaterial);
    expect((copied as BackgroundImageBlurContainerMaterial).getImage()).toBe('/assets/updated.jpg');
  });
});

describe('ContainerMaterial state management', () => {
  it('setState updates visual state without error', () => {
    const material = MaterialLibrary.default();
    expect(() => material.setState(VisualState.DEFAULT, false)).not.toThrow();
    expect(() => material.setState(VisualState.FOCUSED, true)).not.toThrow();
    expect(() => material.setState(VisualState.PRESSED, true)).not.toThrow();
    expect(() => material.setState(VisualState.NONE, false)).not.toThrow();
  });

  it('layers draw without error for each visual state', () => {
    const material = MaterialLibrary.default();
    const bgLayers = material.getBackgroundLayers();

    for (const state of [VisualState.NONE, VisualState.DEFAULT, VisualState.FOCUSED, VisualState.PRESSED]) {
      material.setState(state, false);
      for (const layer of bgLayers) {
        expect(() => drawLayer(layer, { state, width: 100, height: 100 })).not.toThrow();
      }
    }
  });
});

describe('ContainerMaterial ownership', () => {
  it('rejects simultaneous hosts and allows attachment after detach', () => {
    const material = MaterialLibrary.default();
    const firstHost = {};
    const secondHost = {};
    const detach = material.attachToHost(firstHost, () => {});

    expect(() => material.attachToHost(secondHost, () => {})).toThrow(
      /more than one container/,
    );

    detach();
    expect(() => material.attachToHost(secondHost, () => {})).not.toThrow();
  });
});

describe('ContainerMaterial custom layers and shapes', () => {
  it('keeps render-only layers out of the canvas path', () => {
    const layer = createLayer(
      'css-layer',
      LayerPlacement.BACKGROUND,
      () => ({ backgroundColor: 'rgb(1, 2, 3)' }),
    );

    expect(layer.render?.(VisualState.DEFAULT, false)).toEqual({
      backgroundColor: 'rgb(1, 2, 3)',
    });
    expect(layer.drawCanvas).toBeUndefined();
  });

  it('caches provider fill and stroke paths by geometry', () => {
    const provider = new RoundedRectangleShapeProvider(CornerRadius.SMALL);
    const fillSpy = vi.spyOn(provider, 'getShapePath');
    const strokeSpy = vi.spyOn(provider, 'getStrokePath');
    const shape = {
      width: 120,
      height: 48,
    };

    expect(getCachedShapePath(provider, shape)).toBe(
      getCachedShapePath(provider, shape),
    );
    expect(getCachedStrokePath(provider, { ...shape, strokeWidth: 2 })).toBe(
      getCachedStrokePath(provider, { ...shape, strokeWidth: 2 }),
    );
    expect(fillSpy).toHaveBeenCalledTimes(1);
    expect(strokeSpy).toHaveBeenCalledTimes(1);
  });
});

describe('CornerRadius values match the dimension constants', () => {
  it('XXSMALL = 8px (corner radius xxsmall)', () => {
    expect(CornerRadius.XXSMALL).toBe(8);
  });

  it('XSMALL = 16px (corner radius xsmall)', () => {
    expect(CornerRadius.XSMALL).toBe(16);
  });

  it('SMALL = 24px (corner radius small)', () => {
    expect(CornerRadius.SMALL).toBe(24);
  });

  it('MEDIUM = 32px (corner radius medium)', () => {
    expect(CornerRadius.MEDIUM).toBe(32);
  });

  it('LARGE = 48px (corner radius large)', () => {
    expect(CornerRadius.LARGE).toBe(48);
  });

  it('XLARGE = 56px (corner radius xlarge)', () => {
    expect(CornerRadius.XLARGE).toBe(56);
  });
});

// ============================================================================
// ContainerMaterial Visibility Tests
// ============================================================================

describe('ContainerMaterial hidden property', () => {
  it('defaults to not hidden (isHidden = false)', () => {
    const material = MaterialLibrary.default();
    expect(material.isHidden()).toBe(false);
  });

  it('hidden=true sets isHidden to true', () => {
    const material = new ContainerMaterial({
      layers: [],
      hidden: true,
    });
    expect(material.isHidden()).toBe(true);
  });

  it('hidden=false keeps isHidden false', () => {
    const material = new ContainerMaterial({
      layers: [],
      hidden: false,
    });
    expect(material.isHidden()).toBe(false);
  });
});

// ============================================================================
// ContainerMaterial state transitions
// ============================================================================

describe('ContainerMaterial setState returns correctly for each visual state', () => {
  it('DEFAULT state is returned correctly', () => {
    const material = MaterialLibrary.default();
    material.setState(VisualState.DEFAULT, false);
    expect(material.getCurrentState()).toBe(VisualState.DEFAULT);
  });

  it('FOCUSED state is returned correctly', () => {
    const material = MaterialLibrary.default();
    material.setState(VisualState.FOCUSED, true);
    expect(material.getCurrentState()).toBe(VisualState.FOCUSED);
  });

  it('PRESSED state is returned correctly', () => {
    const material = MaterialLibrary.default();
    material.setState(VisualState.PRESSED, true);
    expect(material.getCurrentState()).toBe(VisualState.PRESSED);
  });

  it('NONE state is returned correctly', () => {
    const material = MaterialLibrary.default();
    material.setState(VisualState.NONE, false);
    expect(material.getCurrentState()).toBe(VisualState.NONE);
  });
});

describe('ContainerMaterial setState transitions through all visual states', () => {
  it('transitions DEFAULT -> FOCUSED -> PRESSED -> NONE -> DEFAULT', () => {
    const material = MaterialLibrary.default();

    material.setState(VisualState.DEFAULT, false);
    expect(material.getCurrentState()).toBe(VisualState.DEFAULT);

    material.setState(VisualState.FOCUSED, true);
    expect(material.getCurrentState()).toBe(VisualState.FOCUSED);

    material.setState(VisualState.PRESSED, true);
    expect(material.getCurrentState()).toBe(VisualState.PRESSED);

    material.setState(VisualState.NONE, false);
    expect(material.getCurrentState()).toBe(VisualState.NONE);

    material.setState(VisualState.DEFAULT, false);
    expect(material.getCurrentState()).toBe(VisualState.DEFAULT);
  });

  it('same state transitions are idempotent', () => {
    const material = MaterialLibrary.default();
    material.setState(VisualState.FOCUSED, true);
    material.setState(VisualState.FOCUSED, true);
    expect(material.getCurrentState()).toBe(VisualState.FOCUSED);
  });
});

describe('ContainerMaterial multiple state transitions', () => {
  it('rapid state transitions maintain consistency', () => {
    const material = MaterialLibrary.default();
    const states = [
      VisualState.DEFAULT,
      VisualState.FOCUSED,
      VisualState.PRESSED,
      VisualState.NONE,
    ];

    for (let i = 0; i < 20; i++) {
      const state = states[i % states.length];
      material.setState(state, i % 2 === 0);
      expect(material.getCurrentState()).toBe(state);
    }
  });

  it('alternating FOCUSED and PRESSED works correctly', () => {
    const material = MaterialLibrary.default();
    for (let i = 0; i < 10; i++) {
      const state = i % 2 === 0 ? VisualState.FOCUSED : VisualState.PRESSED;
      material.setState(state, true);
      expect(material.getCurrentState()).toBe(state);
    }
  });
});

// ============================================================================
// ContainerMaterial alpha property
// ============================================================================

describe('ContainerMaterial alpha', () => {
  it('defaults to 1.0', () => {
    const material = MaterialLibrary.default();
    expect(material.getAlpha()).toBe(1.0);
    expect(material.getAlphaForState(VisualState.DEFAULT)).toBe(1.0);
  });

  it('custom alpha is returned correctly', () => {
    const material = new ContainerMaterial({
      layers: [],
      alpha: 0.5,
    });
    expect(material.getAlpha()).toBe(0.5);
  });

  it('clamps post-composition state alpha', () => {
    const material = new ContainerMaterial({
      layers: [],
      alphaForState: (state) => state === VisualState.FOCUSED ? 2 : -1,
    });

    expect(material.getAlphaForState(VisualState.FOCUSED)).toBe(1);
    expect(material.getAlphaForState(VisualState.DEFAULT)).toBe(0);
  });

  it('preserves state alpha when deriving an independent material', () => {
    const material = new ContainerMaterial({
      layers: [],
      alphaForState: (state) => state === VisualState.FOCUSED ? 0.6 : 1,
    });
    const derived = material.withInset(4);

    expect(derived.getAlphaForState(VisualState.DEFAULT)).toBe(1);
    expect(derived.getAlphaForState(VisualState.FOCUSED)).toBe(0.6);
  });
});

// ============================================================================
// MaterialLibrary card material with tail shapes
// (MaterialLibrary.card() does not take a direction param, so we test the card
//  material properties instead)
// ============================================================================

describe('MaterialLibrary card material properties', () => {
  it('card material has background layers', () => {
    const material = MaterialLibrary.card();
    expect(material.getBackgroundLayers().length).toBeGreaterThan(0);
  });

  it('card material layers render for all states', () => {
    const material = MaterialLibrary.card();
    const allLayers = [
      ...material.getBackgroundLayers(),
      ...material.getForegroundLayers(),
    ];

    for (const state of [VisualState.NONE, VisualState.DEFAULT, VisualState.FOCUSED, VisualState.PRESSED]) {
      material.setState(state, false);
      for (const layer of allLayers) {
        const rec = drawLayer(layer, { state, width: 200, height: 300 });
        expect(rec.calls).toBeDefined();
      }
    }
  });
});

// ============================================================================
// Layer onStateChanged callbacks
// ============================================================================

describe('ContainerMaterial layer onStateChanged callbacks', () => {
  it('layer onStateChanged is called when state changes', () => {
    const onStateChangedFn = vi.fn();
    const material = new ContainerMaterial({
      layers: [
        createLayer(
          'test-layer',
          LayerPlacement.BACKGROUND,
          () => ({}),
          { sortOrder: 100, onStateChanged: onStateChangedFn },
        ),
      ],
    });

    material.setState(VisualState.FOCUSED, true);
    expect(onStateChangedFn).toHaveBeenCalledWith(VisualState.DEFAULT, VisualState.FOCUSED);
  });

  it('layer onStateChanged is not called when state is the same', () => {
    const onStateChangedFn = vi.fn();
    const material = new ContainerMaterial({
      layers: [
        createLayer(
          'test-layer',
          LayerPlacement.BACKGROUND,
          () => ({}),
          { sortOrder: 100, onStateChanged: onStateChangedFn },
        ),
      ],
    });

    material.setState(VisualState.DEFAULT, false); // same as initial
    expect(onStateChangedFn).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Panel material properties
// ============================================================================

describe('MaterialLibrary panel material', () => {
  it('preserves wrapped layer rendering metadata', () => {
    const baseLayers = new Map(
      MaterialLibrary.default().getBackgroundLayers().map(layer => [layer.id, layer]),
    );
    const panelLayers = MaterialLibrary.panel().getBackgroundLayers();

    for (const layer of panelLayers.filter(layer => layer.id !== 'panel-scrim')) {
      const baseLayer = baseLayers.get(layer.id);
      expect(baseLayer).toBeDefined();
      expect(layer.animatesContinuously).toBe(baseLayer?.animatesContinuously);
      expect(layer.blendMode).toBe(baseLayer?.blendMode);
      expect(layer.clipsToShape).toBe(baseLayer?.clipsToShape);
      expect(layer.supportsDiscretePartialFocus).toBe(
        baseLayer?.supportsDiscretePartialFocus,
      );
    }
  });

  it('captures wrapped layer callbacks and visibility predicates', () => {
    const stateChangedReceivers: MaterialLayer[] = [];
    const visibilityReceivers: MaterialLayer[] = [];
    const originalStateChanged = vi.fn(function (this: MaterialLayer) {
      stateChangedReceivers.push(this);
    });
    const replacementStateChanged = vi.fn();
    const originalVisibility = vi.fn(function (this: MaterialLayer) {
      visibilityReceivers.push(this);
      return false;
    });
    const replacementVisibility = vi.fn(() => true);
    const baseLayer = createLayer(
      'stateful-panel-layer',
      LayerPlacement.BACKGROUND,
      undefined,
      { onStateChanged: originalStateChanged },
    );
    baseLayer.isVisibleForState = originalVisibility;
    const panel = createPanelContainerMaterial(() =>
      createContainerMaterialWithOwnedLayers({ layers: [baseLayer] })
    );
    const wrappedLayer = layerById(panel, 'stateful-panel-layer');

    baseLayer.onStateChanged = replacementStateChanged;
    baseLayer.isVisibleForState = replacementVisibility;
    panel.setState(VisualState.FOCUSED, false);

    expect(originalStateChanged).toHaveBeenCalledWith(
      VisualState.DEFAULT,
      VisualState.FOCUSED,
    );
    expect(stateChangedReceivers).toEqual([baseLayer]);
    expect(replacementStateChanged).not.toHaveBeenCalled();
    expect(wrappedLayer.isVisibleForState?.(VisualState.FOCUSED)).toBe(false);
    expect(originalVisibility).toHaveBeenCalledWith(VisualState.FOCUSED);
    expect(visibilityReceivers).toEqual([baseLayer]);
    expect(replacementVisibility).not.toHaveBeenCalled();
  });

  it('panel material applies the per-state alpha multiplier to wrapped layers', () => {
    const material = MaterialLibrary.panel();
    // The panel scales each base layer's own alpha by the DEFAULT multiplier
    // (0.5) on the shared canvas. The idle fill is opaque (1) -> 0.5.
    const rec = drawLayer(layerById(material, 'idle-material'), {
      state: VisualState.DEFAULT,
      width: 100,
      height: 100,
    });
    const fills = rec.ofType('fill');
    expect(fills.length).toBeGreaterThan(0);
    expect(fills[fills.length - 1].style?.globalAlpha).toBeCloseTo(0.5, 4);
  });

  it('panel material dims canvas glow layers via the per-state alpha multiplier', () => {
    const material = MaterialLibrary.panel();
    const glowStroke = layerById(material, 'glow-stroke');

    // The glow stroke composites at its own DEFAULT alpha (153/255) scaled by the
    // panel multiplier (0.5), and keeps its overlay blend against the backdrop.
    const rec = drawLayer(glowStroke, {
      state: VisualState.DEFAULT,
      width: 100,
      height: 100,
    });
    const composite = rec.ofType('drawImage');
    expect(composite.length).toBeGreaterThan(0);
    expect(composite[composite.length - 1].style?.globalCompositeOperation).toBe('overlay');
    expect(composite[composite.length - 1].style?.globalAlpha).toBeCloseTo((153 / 255) * 0.5, 4);
  });

  it('panel material has panel-scrim layer', () => {
    const material = MaterialLibrary.panel();
    const bgLayers = material.getBackgroundLayers();
    const scrimLayer = bgLayers.find(l => l.id === 'panel-scrim');
    expect(scrimLayer).toBeDefined();
  });

  it('panel scrim layer renders a linear-gradient rectangle', () => {
    const material = MaterialLibrary.panel();
    const scrimLayer = layerById(material, 'panel-scrim');
    for (const state of [VisualState.DEFAULT, VisualState.FOCUSED, VisualState.PRESSED]) {
      const rec = drawLayer(scrimLayer, { state, width: 200, height: 120 });
      expect(rec.gradients.some(g => g.kind === 'linear')).toBe(true);
      expect(rec.has('fillRect')).toBe(true);
      expect(rec.has('clip')).toBe(false);
      expect(rec.ofType('fillRect')[0]?.style?.globalAlpha).toBe(1);
    }
  });

  it('panel scrim canvas stays full opacity as an additional panel layer', () => {
    const material = MaterialLibrary.panel();
    const scrimLayer = layerById(material, 'panel-scrim');

    for (const state of [
      VisualState.DEFAULT,
      VisualState.FOCUSED,
      VisualState.PRESSED,
    ]) {
      const rec = drawLayer(scrimLayer, { state, width: 100, height: 100 });
      // The scrim fills its own rectangle at full alpha regardless of state.
      expect(rec.ofType('fillRect')[0]?.style?.globalAlpha).toBe(1);
    }
  });
});

// ============================================================================
// DefaultStatic material
// ============================================================================

describe('MaterialLibrary defaultStatic', () => {
  it('defaultStatic without drop shadow has idle fill and glow stroke background layers', () => {
    const material = MaterialLibrary.defaultStatic();
    expect(material.getBackgroundLayers().map(layer => layer.id)).toEqual([
      'idle-material',
      'glow-stroke',
    ]);
    expect(material.getForegroundLayers().length).toBe(0);
  });

  it('defaultStatic with drop shadow has drop shadow, idle fill, and glow stroke layers', () => {
    const material = MaterialLibrary.defaultStatic({ withDropShadow: true });
    expect(material.getBackgroundLayers().map(layer => layer.id)).toEqual([
      'drop-shadow',
      'idle-material',
      'glow-stroke',
    ]);
  });

  it('defaultStatic drop shadow layer renders an outer shadow', () => {
    const material = MaterialLibrary.defaultStatic({ withDropShadow: true });
    const bgLayers = material.getBackgroundLayers();
    const shadowLayer = bgLayers.find(l => l.id === 'drop-shadow');
    expect(shadowLayer).toBeDefined();
    const rec = drawLayer(shadowLayer!, { state: VisualState.DEFAULT });
    const fills = rec.ofType('fill');
    expect(fills.length).toBeGreaterThan(0);
    expect(fills[0].style?.shadowBlur).toBe(16);
    expect(String(fills[0].style?.shadowColor)).toContain('rgba(0, 0, 0,');
  });
});

// ============================================================================
// ActionHint material
// ============================================================================

describe('MaterialLibrary actionHint material', () => {
  it('actionHint material has 2 layers', () => {
    const material = MaterialLibrary.actionHint();
    const totalLayers = material.getBackgroundLayers().length + material.getForegroundLayers().length;
    expect(totalLayers).toBe(2);
  });

});

// ============================================================================
// Flat and notificationCenterItem aliases
// ============================================================================

describe('MaterialLibrary aliases', () => {
  it('flat material is equivalent to default (no drop shadow)', () => {
    const flat = MaterialLibrary.flat();
    const def = MaterialLibrary.default();
    expect(flat.getBackgroundLayers().length).toBe(def.getBackgroundLayers().length);
  });

  it('notificationCenterItem material includes drop shadow', () => {
    const material = MaterialLibrary.notificationCenterItem();
    const bgLayers = material.getBackgroundLayers();
    const shadowLayer = bgLayers.find(l => l.id === 'drop-shadow');
    expect(shadowLayer).toBeDefined();
  });

  it('defaultWithDropShadow material includes drop shadow', () => {
    const material = MaterialLibrary.defaultWithDropShadow();
    const bgLayers = material.getBackgroundLayers();
    const shadowLayer = bgLayers.find(l => l.id === 'drop-shadow');
    expect(shadowLayer).toBeDefined();
  });
});
