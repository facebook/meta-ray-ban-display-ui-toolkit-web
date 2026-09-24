/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react';
import type { VisualState } from '../../base/Interactions';
import type {
  CanvasLayerDrawParams,
  MaterialLayer,
} from '../../material/ContainerMaterial';
import { getPath2DForPathD, getInsetStrokePath2D } from '../../material/canvas/Path2DCache';
import { useCanvasMaterialAssets } from '../../material/canvas/useCanvasMaterialAssets';
import { usePrefersReducedMotion } from '../../motion/usePrefersReducedMotion';
import { ZERO_PARTIAL_FOCUS_POSITION } from './useContainerPartialFocusFeedback';
import type { ContainerMaterialLayersProps } from '../ContainerMaterialLayers.types';
import styles from '../Container.module.css';

export type {
  ContainerMaterialLayersProps,
  ContainerMaterialTransition,
} from '../ContainerMaterialLayers.types';

/**
 * Padding (logical px) around the layer area so effects that bleed outside the
 * shape — drop-shadow halos, round stroke caps — are not clipped by the canvas
 * bitmap. These effects draw with overflow visible; the padded canvas plus the
 * container's own overflow rule reproduce the same clipping behavior.
 */
export const MATERIAL_CANVAS_PADDING = 32;
export const MATERIAL_CANVAS_LAYOUT_GEOMETRY_EVENT =
  'uit-material-canvas-layout-geometry';

export interface MaterialCanvasLayoutGeometryEventDetail {
  height: number;
  pathD: string;
  width: number;
}

interface CanvasLayerGroup {
  kind: 'canvas';
  key: string;
  canvasIndex: number;
  blendMode?: GlobalCompositeOperation;
  layers: MaterialLayer[];
}

interface CssLayerItem {
  kind: 'css';
  key: string;
  layer: MaterialLayer;
}

type LayerRenderItem = CanvasLayerGroup | CssLayerItem;

const CSS_BACKDROP_BLEND_MODES = new Set<GlobalCompositeOperation>([
  'color',
  'color-burn',
  'color-dodge',
  'darken',
  'difference',
  'exclusion',
  'hard-light',
  'hue',
  'lighten',
  'luminosity',
  'multiply',
  'overlay',
  'saturation',
  'screen',
  'soft-light',
]);

type VisibilityListener = (isVisible: boolean) => void;

const visibilityListeners = new WeakMap<Element, VisibilityListener>();
let sharedVisibilityObserver: IntersectionObserver | null = null;

function observeVisibility(
  element: Element,
  listener: VisibilityListener,
): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    return () => {};
  }

  if (sharedVisibilityObserver == null) {
    sharedVisibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        visibilityListeners.get(entry.target)?.(entry.isIntersecting);
      });
    });
  }

  visibilityListeners.set(element, listener);
  sharedVisibilityObserver.observe(element);
  return () => {
    visibilityListeners.delete(element);
    sharedVisibilityObserver?.unobserve(element);
  };
}

function createLayerRenderItems(
  layers: MaterialLayer[],
  blendWithContent: boolean,
): LayerRenderItem[] {
  const items: LayerRenderItem[] = [];
  let canvasIndex = 0;

  for (const layer of layers) {
    if (layer.drawCanvas != null) {
      const blend = blendWithContent &&
        layer.blendMode != null &&
        CSS_BACKDROP_BLEND_MODES.has(layer.blendMode)
        ? layer.blendMode
        : undefined;
      const last = items[items.length - 1];
      if (
        last?.kind === 'canvas' &&
        last.blendMode === blend &&
        blend == null
      ) {
        last.layers.push(layer);
      } else {
        items.push({
          kind: 'canvas',
          key: `canvas-${layer.id}`,
          canvasIndex,
          blendMode: blend,
          layers: [layer],
        });
        canvasIndex += 1;
      }
    } else if (layer.render != null) {
      items.push({
        kind: 'css',
        key: `css-${layer.id}`,
        layer,
      });
    }
  }

  return items;
}

/**
 * Renders a material surface (background or foreground), batching consecutive
 * canvas layers while preserving sort order across canvas and CSS layers.
 *
 * When `blendWithContent` is set (foreground layers that opt in via
 * ContainerMaterialConfig.foregroundBlendsWithContent), the layers are instead
 * grouped by blend mode onto element-blended canvases so the overlay can blend
 * with the live DOM content behind it — the one case a single canvas can't do.
 */
export const ContainerMaterialCanvas = memo(function ContainerMaterialCanvas({
  layers,
  effectiveVisualState,
  activeMaterialTransition,
  animated,
  materialClipPath,
  layerPathD,
  layerW,
  layerH,
  shapeContext,
  partialFocusPosition,
  blendWithContent = false,
}: ContainerMaterialLayersProps): ReactElement {
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const [isInViewport, setIsInViewport] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  const canDraw = layerPathD != null && layerW > 0 && layerH > 0;
  const renderItems = useMemo(
    () => createLayerRenderItems(layers, blendWithContent),
    [blendWithContent, layers],
  );
  const groups = useMemo(
    () => renderItems.filter(
      (item): item is CanvasLayerGroup => item.kind === 'canvas',
    ),
    [renderItems],
  );
  const canvasLayers = useMemo(
    () => groups.flatMap((group) => group.layers),
    [groups],
  );
  const assets = useCanvasMaterialAssets(groups.length > 0);

  const resolvedState = useMemo<VisualState>(() => {
    const transition = activeMaterialTransition;
    return transition != null &&
      transition.from !== transition.to &&
      transition.progress >= 0 &&
      transition.progress < 1
      ? transition.to
      : effectiveVisualState;
  }, [activeMaterialTransition, effectiveVisualState]);

  const baseCanvasStyle = useMemo<CSSProperties>(
    () => ({
      position: 'absolute',
      top: -MATERIAL_CANVAS_PADDING,
      left: -MATERIAL_CANVAS_PADDING,
      width: layerW + MATERIAL_CANVAS_PADDING * 2,
      height: layerH + MATERIAL_CANVAS_PADDING * 2,
      pointerEvents: 'none',
    }),
    [layerH, layerW],
  );

  const drawGroup = useCallback(
    (
      canvas: HTMLCanvasElement,
      groupLayers: MaterialLayer[],
      time: number,
      geometry?: MaterialCanvasLayoutGeometryEventDetail,
    ) => {
      const effectiveLayerPathD = geometry?.pathD ?? layerPathD;
      const effectiveLayerW = geometry?.width ?? layerW;
      const effectiveLayerH = geometry?.height ?? layerH;
      if (effectiveLayerPathD == null) {
        return;
      }
      const ctx = canvas.getContext('2d');
      if (ctx == null) {
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const cssW = effectiveLayerW + MATERIAL_CANVAS_PADDING * 2;
      const cssH = effectiveLayerH + MATERIAL_CANVAS_PADDING * 2;
      const pixelW = Math.max(1, Math.round(cssW * dpr));
      const pixelH = Math.max(1, Math.round(cssH * dpr));
      if (canvas.width !== pixelW) {
        canvas.width = pixelW;
      }
      if (canvas.height !== pixelH) {
        canvas.height = pixelH;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, pixelW, pixelH);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(MATERIAL_CANVAS_PADDING, MATERIAL_CANVAS_PADDING);

      const path = getPath2DForPathD(effectiveLayerPathD);
      const transition =
        activeMaterialTransition != null &&
        activeMaterialTransition.from !== activeMaterialTransition.to &&
        activeMaterialTransition.progress >= 0 &&
        activeMaterialTransition.progress < 1
          ? activeMaterialTransition
          : undefined;
      const resolvedState: VisualState =
        transition != null ? transition.to : effectiveVisualState;

      // lerpState and getInsetStrokePath close over loop-invariant values only,
      // and every shared param field is identical across the layers in a group,
      // so build them once per draw instead of reallocating per layer per frame
      // (the rAF loop re-enters this ~60×/sec for continuously-animated groups).
      const lerpState: CanvasLayerDrawParams['lerpState'] = (valueForState) => {
        if (transition == null) {
          return valueForState(resolvedState);
        }
        const fromValue = valueForState(transition.from);
        const toValue = valueForState(transition.to);
        return fromValue + (toValue - fromValue) * transition.progress;
      };
      const getInsetStrokePath: CanvasLayerDrawParams['getInsetStrokePath'] = (
        strokeWidth,
      ) => getInsetStrokePath2D(
        effectiveLayerW,
        effectiveLayerH,
        strokeWidth,
        shapeContext,
        dpr,
      );

      const params: CanvasLayerDrawParams = {
        state: resolvedState,
        transition,
        path,
        width: effectiveLayerW,
        height: effectiveLayerH,
        shapeContext,
        dpr,
        time,
        assets,
        lerpState,
        getInsetStrokePath,
        partialFocusPosition: ZERO_PARTIAL_FOCUS_POSITION,
      };

      for (const layer of groupLayers) {
        if (layer.drawCanvas == null) {
          continue;
        }
        params.partialFocusPosition = layer.supportsDiscretePartialFocus
          ? partialFocusPosition
          : ZERO_PARTIAL_FOCUS_POSITION;
        ctx.save();
        try {
          if (layer.clipsToShape) {
            ctx.clip(path);
          }
          layer.drawCanvas(ctx, params);
        } finally {
          ctx.restore();
        }
      }
    },
    [
      activeMaterialTransition,
      assets,
      effectiveVisualState,
      layerPathD,
      layerH,
      layerW,
      partialFocusPosition,
      shapeContext,
    ],
  );
  const drawGroupRef = useRef(drawGroup);
  const groupsRef = useRef(groups);
  const geometryListenerKey = groups.map(group => group.key).join('\u0000');

  useLayoutEffect(() => {
    drawGroupRef.current = drawGroup;
    groupsRef.current = groups;
  }, [drawGroup, groups]);

  const drawAll = useCallback(
    (time: number) => {
      groups.forEach((group, index) => {
        const canvas = canvasRefs.current[index];
        if (canvas != null) {
          drawGroup(canvas, group.layers, time);
        }
      });
    },
    [drawGroup, groups],
  );

  // Run the rAF loop only while a continuously-animating layer is actually VISIBLE
  // in the current state (or could be mid-transition). When every animated layer
  // resolves to alpha 0, pause the loop to save CPU/battery. The one-shot draw
  // below still paints the frame, and this effect re-arms when the state or
  // transition changes (deps), so entering an animated state restarts it.
  const shouldAnimate = useMemo(() => {
    const continuouslyAnimated = canvasLayers.filter(
      (layer) => layer.animatesContinuously === true,
    );
    if (continuouslyAnimated.length === 0) {
      return false;
    }
    const transition = activeMaterialTransition;
    const inTransition =
      transition != null &&
      transition.from !== transition.to &&
      transition.progress >= 0 &&
      transition.progress < 1;
    if (inTransition) {
      // Alpha may be ramping in or out; keep animating while either endpoint is visible.
      return continuouslyAnimated.some(
        (layer) =>
          (layer.isVisibleForState?.(transition.from) ?? true) ||
          (layer.isVisibleForState?.(transition.to) ?? true),
      );
    }
    return continuouslyAnimated.some(
      (layer) => layer.isVisibleForState?.(effectiveVisualState) ?? true,
    );
  }, [canvasLayers, effectiveVisualState, activeMaterialTransition]);

  useLayoutEffect(() => {
    if (!shouldAnimate || prefersReducedMotion || !canDraw) {
      return;
    }
    const canvas = canvasRefs.current[0];
    if (canvas == null) {
      return;
    }
    setIsInViewport(true);
    return observeVisibility(canvas, setIsInViewport);
  }, [canDraw, groups, prefersReducedMotion, shouldAnimate]);

  useLayoutEffect(() => {
    if (!canDraw) {
      return;
    }
    drawAll(performance.now());
    if (!shouldAnimate || prefersReducedMotion || !isInViewport) {
      return;
    }
    let rafId = 0;
    const loop = (time: number) => {
      drawAll(time);
      rafId = window.requestAnimationFrame(loop);
    };
    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [canDraw, drawAll, isInViewport, prefersReducedMotion, shouldAnimate]);

  useLayoutEffect(() => {
    if (!canDraw) {
      return;
    }

    const cleanups = groupsRef.current.map((group, index) => {
      const canvas = canvasRefs.current[index];
      if (canvas == null) {
        return null;
      }
      const groupKey = group.key;

      const handleLayoutGeometry = (event: Event) => {
        const detail =
          (event as CustomEvent<MaterialCanvasLayoutGeometryEventDetail>).detail;
        if (
          detail == null ||
          detail.pathD === '' ||
          detail.width <= 0 ||
          detail.height <= 0
        ) {
          return;
        }

        const currentGroup = groupsRef.current.find(
          candidate => candidate.key === groupKey,
        );
        if (currentGroup != null) {
          drawGroupRef.current(
            canvas,
            currentGroup.layers,
            performance.now(),
            detail,
          );
        }
      };

      canvas.addEventListener(
        MATERIAL_CANVAS_LAYOUT_GEOMETRY_EVENT,
        handleLayoutGeometry,
      );

      return () => {
        canvas.removeEventListener(
          MATERIAL_CANVAS_LAYOUT_GEOMETRY_EVENT,
          handleLayoutGeometry,
        );
      };
    });

    return () => {
      cleanups.forEach(cleanup => cleanup?.());
    };
  }, [canDraw, geometryListenerKey]);

  return (
    <>
      {renderItems.map((item) => item.kind === 'canvas'
        ? canDraw && (
          <canvas
            key={item.key}
            ref={(el) => {
              canvasRefs.current[item.canvasIndex] = el;
            }}
            style={
              item.blendMode != null
                ? {
                    ...baseCanvasStyle,
                    mixBlendMode: item.blendMode as CSSProperties['mixBlendMode'],
                  }
                : baseCanvasStyle
            }
            aria-hidden="true"
          />
        )
        : (
        <div
          key={item.key}
          className={styles.materialLayer}
          data-uit-material-layer={item.layer.id}
          data-uit-material-clips-to-shape={
            item.layer.clipsToShape ? 'true' : undefined
          }
          aria-hidden="true"
          style={{
            ...item.layer.render?.(resolvedState, animated),
            clipPath: item.layer.clipsToShape === false
              ? undefined
              : materialClipPath,
            ...(item.layer.blendMode != null &&
              item.layer.blendMode !== 'source-over'
              ? {
                  mixBlendMode: item.layer
                    .blendMode as CSSProperties['mixBlendMode'],
                }
              : {}),
            pointerEvents: 'none',
          }}
        />
        ))}
    </>
  );
});
