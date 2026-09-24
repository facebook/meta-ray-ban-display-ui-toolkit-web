/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from 'react';
import {
  AnimationDurations,
  cubicBezierY,
} from '../../motion/Animations';
import {
  startSynchronizedTransition,
  type SynchronizedTransitionHandle,
} from '../../motion/SynchronizedTransition';
import { usePrefersReducedMotion } from '../../motion/usePrefersReducedMotion';
import {
  getCachedShapePath,
  type ShapeProvider,
} from '../../material/ShapeProvider';
import type { ContainerMaterialInset } from '../../material/ContainerMaterial';
import {
  MANAGED_LAYOUT_TRANSITION_COMPLETE_EVENT,
} from '../../utils/useMeasuredElementDimensions';
import type {
  StaticContainerLayoutTransitionAnchor,
} from '../StaticContainer.types';
import {
  MATERIAL_CANVAS_PADDING,
  MATERIAL_CANVAS_LAYOUT_GEOMETRY_EVENT,
  type MaterialCanvasLayoutGeometryEventDetail,
} from './ContainerMaterialCanvas';

export interface StaticContainerSmoothShapeSnapshot {
  width: number;
  height: number;
  materialInset: ContainerMaterialInset;
  shapeProvider: ShapeProvider;
}

interface StaticContainerLayoutTransitionOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  backgroundLayerRef: RefObject<HTMLDivElement | null>;
  foregroundLayerRef: RefObject<HTMLDivElement | null>;
  shapeSnapshot: StaticContainerSmoothShapeSnapshot | null;
  transitionToken: number;
  transitionSignature: unknown;
  anchor: StaticContainerLayoutTransitionAnchor;
  onComplete?: () => void;
}

interface ElementSize {
  width: number;
  height: number;
}

interface ElementRect {
  x: number;
  y: number;
}

const ZERO_MATERIAL_INSET: ContainerMaterialInset = {
  bottom: 0,
  left: 0,
  right: 0,
  top: 0,
};

interface ActiveLayoutTransition {
  transition: SynchronizedTransitionHandle | null;
  content: {
    clipPath: string;
    element: HTMLElement;
    webkitClipPath: string;
    willChange: string;
  };
  root: {
    element: HTMLElement;
    height: string;
    width: string;
    willChange: string;
  };
  materialLayers: Array<{
    bottom: string;
    element: HTMLElement;
    height: string;
    left: string;
    right: string;
    top: string;
    transform: string;
    width: string;
    willChange: string;
  }>;
  materialCanvases: Array<{
    element: HTMLCanvasElement;
    height: string;
    width: string;
    willChange: string;
  }>;
  materialShapeElements: Array<{
    clipPath: string;
    element: HTMLElement;
    webkitClipPath: string;
    willChange: string;
  }>;
  materialShapeSvgs: Array<{
    element: SVGSVGElement;
    viewBox: string | null;
    paths: Array<{
      element: SVGPathElement;
      d: string | null;
    }>;
  }>;
  participants: Array<{
    element: HTMLElement;
    startTranslateX: number;
    startTranslateY: number;
    transform: string;
    willChange: string;
  }>;
}

function readLayoutSize(element: HTMLElement): ElementSize {
  return {
    height: element.offsetHeight,
    width: element.offsetWidth,
  };
}

function readRenderedSize(
  element: HTMLElement,
  fallback: ElementSize,
): ElementSize {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return fallback;
  }

  return {
    height: rect.height,
    width: rect.width,
  };
}

function isSameSize(
  first: ElementSize,
  second: ElementSize,
): boolean {
  return (
    Math.abs(first.width - second.width) < 0.5 &&
    Math.abs(first.height - second.height) < 0.5
  );
}

function getShapePath(
  shape: StaticContainerSmoothShapeSnapshot,
  size: ElementSize,
): string {
  return getCachedShapePath(shape.shapeProvider, {
    height: size.height,
    width: size.width,
  });
}

function getMaterialSize(
  shape: StaticContainerSmoothShapeSnapshot,
): ElementSize {
  return {
    height: Math.max(
      0,
      shape.height - shape.materialInset.top - shape.materialInset.bottom,
    ),
    width: Math.max(
      0,
      shape.width - shape.materialInset.left - shape.materialInset.right,
    ),
  };
}

function interpolateInset(
  from: ContainerMaterialInset,
  to: ContainerMaterialInset,
  progress: number,
): ContainerMaterialInset {
  return {
    bottom: interpolate(from.bottom, to.bottom, progress),
    left: interpolate(from.left, to.left, progress),
    right: interpolate(from.right, to.right, progress),
    top: interpolate(from.top, to.top, progress),
  };
}

function interpolate(
  from: number,
  to: number,
  progress: number,
): number {
  return from + (to - from) * progress;
}

function formatPx(value: number): string {
  return `${Number(value.toFixed(3))}px`;
}

function formatTranslate(value: number): string {
  return Math.abs(value) < 0.01 ? '0px' : formatPx(value);
}

function getIconAvatarProgress(linearProgress: number): number {
  return cubicBezierY(0, 0.45, 0.46, 0.94, linearProgress);
}

function readWebkitClipPath(element: HTMLElement): string {
  return element.style.getPropertyValue('-webkit-clip-path');
}

function writeWebkitClipPath(
  element: HTMLElement,
  value: string,
): void {
  if (value === '') {
    element.style.removeProperty('-webkit-clip-path');
  } else {
    element.style.setProperty('-webkit-clip-path', value);
  }
}

function hasClipPath(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized !== '' && normalized !== 'none';
}

function measureLayoutParticipants(
  element: HTMLElement,
): Map<string, ElementRect> {
  const participants = new Map<string, ElementRect>();
  const containerRect = element.getBoundingClientRect();
  element
    .querySelectorAll<HTMLElement>('[data-uit-layout-transition-part]')
    .forEach(participant => {
      const key = participant.dataset.uitLayoutTransitionPart;
      if (key == null || key === '') {
        return;
      }

      const rect = participant.getBoundingClientRect();
      participants.set(key, {
        x: rect.x - containerRect.x,
        y: rect.y - containerRect.y,
      });
    });
  return participants;
}

function collectMaterialShapeSvgs(
  materialLayers: HTMLElement[],
): ActiveLayoutTransition['materialShapeSvgs'] {
  return materialLayers.flatMap(layer =>
    Array.from(layer.querySelectorAll<SVGSVGElement>('svg'))
      .map(svg => {
        const paths = Array.from(
          svg.querySelectorAll<SVGPathElement>(
            'path[data-uit-material-shape-path="true"]',
          ),
        );
        if (paths.length === 0) {
          return null;
        }

        return {
          element: svg,
          paths: paths.map(path => ({
            d: path.getAttribute('d'),
            element: path,
          })),
          viewBox: svg.getAttribute('viewBox'),
        };
      })
      .filter((svg): svg is ActiveLayoutTransition['materialShapeSvgs'][number] => (
        svg != null
      )),
  );
}

function applyMaterialShapePath(
  materialShapeSvgs: ActiveLayoutTransition['materialShapeSvgs'],
  pathD: string,
  size: ElementSize,
): void {
  const viewBox = `0 0 ${size.width} ${size.height}`;
  materialShapeSvgs.forEach(svg => {
    svg.element.setAttribute('viewBox', viewBox);
    svg.paths.forEach(path => {
      path.element.setAttribute('d', pathD);
    });
  });
}

function restoreMaterialShapeSvgs(
  materialShapeSvgs: ActiveLayoutTransition['materialShapeSvgs'],
): void {
  materialShapeSvgs.forEach(svg => {
    if (svg.viewBox == null) {
      svg.element.removeAttribute('viewBox');
    } else {
      svg.element.setAttribute('viewBox', svg.viewBox);
    }

    svg.paths.forEach(path => {
      if (path.d == null) {
        path.element.removeAttribute('d');
      } else {
        path.element.setAttribute('d', path.d);
      }
    });
  });
}

function notifyManagedLayoutTransitionComplete(element: HTMLElement): void {
  element.dispatchEvent(new Event(MANAGED_LAYOUT_TRANSITION_COMPLETE_EVENT));
}

function clearActiveTransitionStyles(
  activeTransition: ActiveLayoutTransition,
): void {
  const { content, root } = activeTransition;
  delete root.element.dataset.uitLayoutTransitionActive;
  root.element.style.width = root.width;
  root.element.style.height = root.height;
  root.element.style.willChange = root.willChange;
  content.element.style.clipPath = content.clipPath;
  content.element.style.willChange = content.willChange;
  writeWebkitClipPath(content.element, content.webkitClipPath);

  activeTransition.materialLayers.forEach(layer => {
    layer.element.style.bottom = layer.bottom;
    layer.element.style.height = layer.height;
    layer.element.style.left = layer.left;
    layer.element.style.right = layer.right;
    layer.element.style.top = layer.top;
    layer.element.style.transform = layer.transform;
    layer.element.style.width = layer.width;
    layer.element.style.willChange = layer.willChange;
  });
  const canvasSnapshots = new Map(
    activeTransition.materialCanvases.map(canvas => [canvas.element, canvas]),
  );
  activeTransition.materialLayers.forEach(layer => {
    layer.element.querySelectorAll<HTMLCanvasElement>('canvas').forEach(canvas => {
      const snapshot = canvasSnapshots.get(canvas);
      if (snapshot == null) {
        return;
      }
      canvas.style.height = snapshot.height;
      canvas.style.width = snapshot.width;
      canvas.style.willChange = snapshot.willChange;
    });
  });
  activeTransition.materialShapeElements.forEach(shape => {
    shape.element.style.clipPath = shape.clipPath;
    shape.element.style.willChange = shape.willChange;
    writeWebkitClipPath(shape.element, shape.webkitClipPath);
  });
  restoreMaterialShapeSvgs(activeTransition.materialShapeSvgs);

  activeTransition.participants.forEach(participant => {
    participant.element.style.transform = participant.transform;
    participant.element.style.willChange = participant.willChange;
  });
  notifyManagedLayoutTransitionComplete(root.element);
}

function clearSettledMaterialLayerGeometry(
  materialLayers: Array<HTMLElement | null>,
): void {
  materialLayers.forEach(layer => {
    if (layer == null) {
      return;
    }

    layer.style.height = '';
    layer.style.bottom = '';
    layer.style.left = '';
    layer.style.right = '';
    layer.style.top = '';
    layer.style.transform = '';
    layer.style.width = '';
    layer.style.willChange = '';
  });
}

function clearSettledMaterialCanvasGeometry(
  materialCanvases: HTMLCanvasElement[],
): void {
  materialCanvases.forEach(canvas => {
    canvas.style.willChange = '';
  });
}

function updateMaterialCanvases(
  materialLayers: HTMLElement[],
  size: ElementSize,
  pathD?: string,
): void {
  const detail: MaterialCanvasLayoutGeometryEventDetail | undefined =
    pathD == null
      ? undefined
      : {
          height: size.height,
          pathD,
          width: size.width,
        };

  materialLayers.forEach(layer => {
    layer.querySelectorAll<HTMLCanvasElement>('canvas').forEach(canvas => {
      canvas.style.width = formatPx(
        size.width + MATERIAL_CANVAS_PADDING * 2,
      );
      canvas.style.height = formatPx(
        size.height + MATERIAL_CANVAS_PADDING * 2,
      );
      if (detail != null) {
        canvas.dispatchEvent(new CustomEvent(
          MATERIAL_CANVAS_LAYOUT_GEOMETRY_EVENT,
          { detail },
        ));
      }
    });
  });
}

function completeActiveTransitionStyles(
  activeTransition: ActiveLayoutTransition,
  finalMaterialSize: ElementSize,
  finalMaterialInset: ContainerMaterialInset,
  anchor: StaticContainerLayoutTransitionAnchor,
  finalContentClipPath?: string,
  finalMaterialClipPath?: string,
  finalMaterialShapePath?: string,
): void {
  const { content, root } = activeTransition;
  delete root.element.dataset.uitLayoutTransitionActive;
  const clipsContent =
    hasClipPath(content.clipPath) || hasClipPath(content.webkitClipPath);

  if (finalMaterialShapePath != null) {
    applyMaterialShapePath(
      activeTransition.materialShapeSvgs,
      finalMaterialShapePath,
      finalMaterialSize,
    );
  }
  if (finalContentClipPath != null && clipsContent) {
    content.element.style.clipPath = finalContentClipPath;
    writeWebkitClipPath(content.element, finalContentClipPath);
  }
  content.element.style.willChange = content.willChange;

  activeTransition.materialLayers.forEach(layer => {
    layer.element.style.bottom = 'auto';
    layer.element.style.left = anchor === 'end'
      ? 'auto'
      : formatPx(finalMaterialInset.left);
    layer.element.style.right = anchor === 'end'
      ? formatPx(finalMaterialInset.right)
      : 'auto';
    layer.element.style.top = formatPx(finalMaterialInset.top);
    layer.element.style.transform = layer.transform;
    layer.element.style.width = formatPx(finalMaterialSize.width);
    layer.element.style.height = formatPx(finalMaterialSize.height);
    layer.element.style.willChange = layer.willChange;
  });
  activeTransition.materialShapeElements.forEach(shape => {
    shape.element.style.willChange = shape.willChange;
    if (finalMaterialClipPath != null) {
      shape.element.style.clipPath = finalMaterialClipPath;
      writeWebkitClipPath(shape.element, finalMaterialClipPath);
    }
  });
  const canvasSnapshots = new Map(
    activeTransition.materialCanvases.map(canvas => [canvas.element, canvas]),
  );
  activeTransition.materialLayers.forEach(layer => {
    layer.element.querySelectorAll<HTMLCanvasElement>('canvas').forEach(canvas => {
      canvas.style.willChange = canvasSnapshots.get(canvas)?.willChange ?? '';
    });
  });
  updateMaterialCanvases(
    activeTransition.materialLayers.map(layer => layer.element),
    finalMaterialSize,
    finalMaterialShapePath,
  );
  root.element.style.width = root.width;
  root.element.style.height = root.height;
  root.element.style.willChange = root.willChange;

  activeTransition.participants.forEach(participant => {
    participant.element.style.transform = participant.transform;
    participant.element.style.willChange = participant.willChange;
  });
  notifyManagedLayoutTransitionComplete(root.element);
}

export function useStaticContainerLayoutTransition({
  containerRef,
  contentRef,
  backgroundLayerRef,
  foregroundLayerRef,
  shapeSnapshot,
  transitionToken,
  transitionSignature,
  anchor,
  onComplete,
}: StaticContainerLayoutTransitionOptions): void {
  const prefersReducedMotion = usePrefersReducedMotion();
  const previousSizeRef = useRef<ElementSize | null>(null);
  const previousShapeRef =
    useRef<StaticContainerSmoothShapeSnapshot | null>(null);
  const previousParticipantRectsRef =
    useRef<Map<string, ElementRect>>(new Map());
  const latestShapeSnapshotRef =
    useRef<StaticContainerSmoothShapeSnapshot | null>(shapeSnapshot);
  const previousTransitionTokenRef = useRef(transitionToken);
  const previousTransitionSignatureRef = useRef(transitionSignature);
  const activeTransitionRef = useRef<ActiveLayoutTransition | null>(null);
  const onCompleteRef = useRef(onComplete);

  useLayoutEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useLayoutEffect(() => {
    latestShapeSnapshotRef.current = shapeSnapshot;
  }, [shapeSnapshot]);

  const cancelActiveTransition = (complete: boolean): void => {
    const activeTransition = activeTransitionRef.current;
    if (activeTransition == null) {
      return;
    }

    activeTransitionRef.current = null;
    activeTransition.transition?.cancel(complete);
    clearActiveTransitionStyles(activeTransition);

    if (complete) {
      onCompleteRef.current?.();
    }
  };

  useLayoutEffect(() => {
    const element = containerRef.current;
    const contentElement = contentRef.current;
    if (element == null || contentElement == null) {
      return;
    }

    previousSizeRef.current = readLayoutSize(element);
    previousShapeRef.current = latestShapeSnapshotRef.current;
    previousParticipantRectsRef.current = measureLayoutParticipants(element);

    if (typeof window.ResizeObserver !== 'function') {
      return;
    }

    const observer = new window.ResizeObserver(() => {
      if (activeTransitionRef.current == null) {
        previousSizeRef.current = readLayoutSize(element);
        previousShapeRef.current = latestShapeSnapshotRef.current;
        previousParticipantRectsRef.current = measureLayoutParticipants(element);
      }
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [containerRef, contentRef]);

  useLayoutEffect(() => {
    const element = containerRef.current;
    const contentElement = contentRef.current;
    if (element == null || contentElement == null) {
      return;
    }

    const didTransitionRequest =
      previousTransitionTokenRef.current !== transitionToken ||
      !Object.is(previousTransitionSignatureRef.current, transitionSignature);
    previousTransitionTokenRef.current = transitionToken;
    previousTransitionSignatureRef.current = transitionSignature;

    const previousSize = previousSizeRef.current;
    const previousParticipantRects = previousParticipantRectsRef.current;
    const activeTransition = activeTransitionRef.current;
    const fromSize = activeTransition != null && previousSize != null
      ? readRenderedSize(element, previousSize)
      : previousSize;
    const previousShape = previousShapeRef.current;
    const currentShapeSnapshot = latestShapeSnapshotRef.current;
    if (activeTransition != null) {
      cancelActiveTransition(false);
    }

    const naturalToSize = readLayoutSize(element);
    previousSizeRef.current = naturalToSize;
    previousShapeRef.current = currentShapeSnapshot;
    previousParticipantRectsRef.current = measureLayoutParticipants(element);

    if (!didTransitionRequest) {
      clearSettledMaterialLayerGeometry([
        backgroundLayerRef.current,
        foregroundLayerRef.current,
      ]);
      return;
    }

    if (prefersReducedMotion) {
      clearSettledMaterialLayerGeometry([
        backgroundLayerRef.current,
        foregroundLayerRef.current,
      ]);
      onCompleteRef.current?.();
      return;
    }

    if (
      fromSize == null ||
      isSameSize(fromSize, naturalToSize)
    ) {
      clearSettledMaterialLayerGeometry([
        backgroundLayerRef.current,
        foregroundLayerRef.current,
      ]);
      if (typeof window.requestAnimationFrame !== 'function') {
        onCompleteRef.current?.();
        return;
      }

      const frame = window.requestAnimationFrame(() => {
        onCompleteRef.current?.();
      });
      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    const materialElements = [
      backgroundLayerRef.current,
      foregroundLayerRef.current,
    ].filter((layer): layer is HTMLDivElement => layer != null);
    const materialLayers = materialElements.map(layer => ({
      bottom: layer.style.bottom,
      element: layer,
      height: layer.style.height,
      left: layer.style.left,
      right: layer.style.right,
      top: layer.style.top,
      transform: layer.style.transform,
      width: layer.style.width,
      willChange: layer.style.willChange,
    }));
    const materialCanvases = materialElements.flatMap(layer =>
      Array.from(layer.querySelectorAll<HTMLCanvasElement>('canvas'))
        .map(canvas => ({
          element: canvas,
          height: canvas.style.height,
          width: canvas.style.width,
          willChange: canvas.style.willChange,
        })),
    );
    const materialShapeElements = materialElements.flatMap(layer =>
      Array.from(layer.querySelectorAll<HTMLElement>(
        '[data-uit-material-clips-to-shape="true"]',
      )).map(element => ({
        clipPath: element.style.clipPath,
        element,
        webkitClipPath: readWebkitClipPath(element),
        willChange: element.style.willChange,
      })),
    );
    const participantElements = Array.from(
      element.querySelectorAll<HTMLElement>('[data-uit-layout-transition-part]'),
    ).filter(participant =>
      participant.dataset.uitLayoutTransitionSkipFlip !== 'true',
    );
    const activeLayoutTransition: ActiveLayoutTransition = {
      content: {
        clipPath: contentElement.style.clipPath,
        element: contentElement,
        webkitClipPath: readWebkitClipPath(contentElement),
        willChange: contentElement.style.willChange,
      },
      materialCanvases,
      materialLayers,
      materialShapeElements,
      materialShapeSvgs: collectMaterialShapeSvgs(materialElements),
      participants: [],
      root: {
        element,
        height: element.style.height,
        width: element.style.width,
        willChange: element.style.willChange,
      },
      transition: null,
    };
    activeTransitionRef.current = activeLayoutTransition;
    element.dataset.uitLayoutTransitionActive = 'true';
    const clipsContent =
      hasClipPath(activeLayoutTransition.content.clipPath) ||
      hasClipPath(activeLayoutTransition.content.webkitClipPath);

    const fromShape = previousShape == null
      ? null
      : {
          height: fromSize.height,
          materialInset: previousShape.materialInset,
          shapeProvider: previousShape.shapeProvider,
          width: fromSize.width,
        };
    const toShape = currentShapeSnapshot == null
      ? null
      : {
          height: naturalToSize.height,
          materialInset: currentShapeSnapshot.materialInset,
          shapeProvider: currentShapeSnapshot.shapeProvider,
          width: naturalToSize.width,
        };
    if (fromShape != null && toShape != null) {
      const fromContentPath = getShapePath(fromShape, fromSize);
      const toContentPath = getShapePath(toShape, naturalToSize);
      const fromMaterialPath = getShapePath(
        fromShape,
        getMaterialSize(fromShape),
      );
      const toMaterialPath = getShapePath(
        toShape,
        getMaterialSize(toShape),
      );

      if (fromMaterialPath !== toMaterialPath) {
        materialLayers.forEach(layer => {
          layer.element.style.willChange = 'width, height, transform';
        });
        materialShapeElements.forEach(shape => {
          shape.element.style.willChange = shape.willChange === ''
            ? 'clip-path'
            : `${shape.willChange}, clip-path`;
        });
      }
      if (clipsContent && fromContentPath !== toContentPath) {
        contentElement.style.willChange = contentElement.style.willChange === ''
          ? 'clip-path'
          : `${contentElement.style.willChange}, clip-path`;
      }
    }

    element.style.willChange = 'width, height';

    const applyParticipantProgress = (easedProgress: number) => {
      activeLayoutTransition.participants.forEach(participant => {
        const translateX = participant.startTranslateX * (1 - easedProgress);
        const translateY = participant.startTranslateY * (1 - easedProgress);
        const transitionTransform =
          `translate(${formatTranslate(translateX)}, ${formatTranslate(translateY)})`;
        participant.element.style.transform = participant.transform === ''
          ? transitionTransform
          : `${transitionTransform} ${participant.transform}`;
      });
    };

    const applyProgress = (easedProgress: number) => {
      const currentWidth = interpolate(
        fromSize.width,
        naturalToSize.width,
        easedProgress,
      );
      const currentHeight = interpolate(
        fromSize.height,
        naturalToSize.height,
        easedProgress,
      );

      if (fromShape != null && toShape != null) {
        const currentShape: StaticContainerSmoothShapeSnapshot = {
          height: currentHeight,
          materialInset: interpolateInset(
            fromShape.materialInset,
            toShape.materialInset,
            easedProgress,
          ),
          shapeProvider: toShape.shapeProvider,
          width: currentWidth,
        };
        const currentRootSize = {
          height: currentHeight,
          width: currentWidth,
        };
        const currentMaterialSize = getMaterialSize(currentShape);
        const currentContentPath = getShapePath(currentShape, currentRootSize);
        const currentMaterialPath = getShapePath(
          currentShape,
          currentMaterialSize,
        );
        const currentContentClipPath = `path('${currentContentPath}')`;
        const currentMaterialClipPath = `path('${currentMaterialPath}')`;

        applyMaterialShapePath(
          activeLayoutTransition.materialShapeSvgs,
          currentMaterialPath,
          currentMaterialSize,
        );
        materialLayers.forEach(layer => {
          layer.element.style.bottom = 'auto';
          if (anchor === 'end') {
            layer.element.style.left = 'auto';
            layer.element.style.right = formatPx(currentShape.materialInset.right);
          } else {
            layer.element.style.left = formatPx(currentShape.materialInset.left);
            layer.element.style.right = 'auto';
          }
          layer.element.style.top = formatPx(currentShape.materialInset.top);
          layer.element.style.width = formatPx(currentMaterialSize.width);
          layer.element.style.height = formatPx(currentMaterialSize.height);
          layer.element.style.transform = layer.transform;
        });
        materialShapeElements.forEach(shape => {
          shape.element.style.clipPath = currentMaterialClipPath;
          writeWebkitClipPath(shape.element, currentMaterialClipPath);
        });
        if (clipsContent) {
          contentElement.style.clipPath = currentContentClipPath;
          writeWebkitClipPath(contentElement, currentContentClipPath);
        }
        updateMaterialCanvases(materialElements, {
          height: currentMaterialSize.height,
          width: currentMaterialSize.width,
        }, currentMaterialPath);
      } else {
        updateMaterialCanvases(materialElements, {
          height: currentHeight,
          width: currentWidth,
        });
      }

      element.style.width = formatPx(currentWidth);
      element.style.height = formatPx(currentHeight);
      applyParticipantProgress(easedProgress);
    };

    applyProgress(0);

    const currentContainerRect = element.getBoundingClientRect();
    activeLayoutTransition.participants = participantElements
      .map(participant => {
        const key = participant.dataset.uitLayoutTransitionPart;
        const fromRect = key == null
          ? undefined
          : previousParticipantRects.get(key);
        if (fromRect == null) {
          return null;
        }

        const currentRect = participant.getBoundingClientRect();
        const currentX = currentRect.x - currentContainerRect.x;
        const currentY = currentRect.y - currentContainerRect.y;
        const startTranslateX = fromRect.x - currentX;
        const startTranslateY = fromRect.y - currentY;
        if (
          Math.abs(startTranslateX) < 0.5 &&
          Math.abs(startTranslateY) < 0.5
        ) {
          return null;
        }

        return {
          element: participant,
          startTranslateX,
          startTranslateY,
          transform: participant.style.transform,
          willChange: participant.style.willChange,
        };
      })
      .filter((participant): participant is ActiveLayoutTransition['participants'][number] => (
        participant != null
      ));
    activeLayoutTransition.participants.forEach(participant => {
      participant.element.style.willChange = participant.willChange === ''
        ? 'transform'
        : `${participant.willChange}, transform`;
    });
    applyParticipantProgress(0);

    const completeTransition = () => {
      if (activeTransitionRef.current !== activeLayoutTransition) {
        return;
      }

      activeTransitionRef.current = null;
      activeLayoutTransition.transition = null;
      const finalMaterialSize = toShape == null
        ? naturalToSize
        : getMaterialSize(toShape);
      const finalContentShapePath = toShape == null
        ? undefined
        : getShapePath(toShape, naturalToSize);
      const finalMaterialShapePath = toShape == null
        ? undefined
        : getShapePath(toShape, finalMaterialSize);
      completeActiveTransitionStyles(
        activeLayoutTransition,
        finalMaterialSize,
        toShape?.materialInset ?? ZERO_MATERIAL_INSET,
        anchor,
        finalContentShapePath == null
          ? undefined
          : `path('${finalContentShapePath}')`,
        finalMaterialShapePath == null
          ? undefined
          : `path('${finalMaterialShapePath}')`,
        finalMaterialShapePath,
      );
      previousSizeRef.current = readLayoutSize(element);
      previousShapeRef.current = currentShapeSnapshot;
      previousParticipantRectsRef.current = measureLayoutParticipants(element);
      if (typeof window.requestAnimationFrame !== 'function') {
        onCompleteRef.current?.();
        return;
      }
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (activeTransitionRef.current == null && element.isConnected) {
            clearSettledMaterialLayerGeometry(
              activeLayoutTransition.materialLayers.map(layer => layer.element),
            );
            clearSettledMaterialCanvasGeometry(
              activeLayoutTransition.materialCanvases.map(canvas => canvas.element),
            );
            onCompleteRef.current?.();
          }
        });
      });
    };

    activeLayoutTransition.transition = startSynchronizedTransition({
      completionPaddingMs: 80,
      participants: [
        {
          durationMs: AnimationDurations.CONTAINER_STATE_CHANGE,
          easing: getIconAvatarProgress,
          onCancel: () => {
            clearActiveTransitionStyles(activeLayoutTransition);
          },
          onComplete: completeTransition,
          onFrame: ({ easedProgress }) => {
            applyProgress(easedProgress);
          },
        },
      ],
    });

    return () => {
      cancelActiveTransition(false);
    };
  }, [
    anchor,
    backgroundLayerRef,
    containerRef,
    contentRef,
    foregroundLayerRef,
    prefersReducedMotion,
    transitionSignature,
    transitionToken,
  ]);

  useEffect(
    () => () => {
      cancelActiveTransition(false);
    },
    [],
  );
}
