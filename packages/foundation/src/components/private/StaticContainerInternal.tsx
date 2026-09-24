/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * StaticContainer component
 *
 * Non-interactive container with material support (background/foreground layers).
 * Unlike Container, this does NOT extend InteractableBase — no focus/press state management.
 * Visual state is caller-selected and does not respond to interaction.
 *
 * Used as base for: Chip, Tag, TooltipContainer, ContextMenu
 */

import {
  forwardRef,
  memo,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { MaterialLibrary } from '../../material/MaterialLibrary';
import type { ContainerMaterialInset } from '../../material/ContainerMaterial';
import { VisualState } from '../../base/Interactions';
import {
  defaultShapeProvider,
  getCachedShapePath,
} from '../../material/ShapeProvider';
import { useComposedRef } from '../../utils/useComposedRef';
import { useMeasuredElementDimensions } from '../../utils/useMeasuredElementDimensions';
import {
  getStaticContainerVisualState,
  resolveStaticContainerDimensions,
} from './StaticContainerLayout';
import {
  BackgroundStyle,
  type StaticContainerProps,
} from '../StaticContainer.types';
import {
  PrivateBackgroundStyle,
  type ResolvedBackgroundStyle,
} from './StaticContainerBackgroundStyle';
import { StaticContainerFrame } from './StaticContainerFrame';
import {
  useStaticContainerLayoutTransition,
  type StaticContainerSmoothShapeSnapshot,
} from './StaticContainerLayoutTransition';

export { BackgroundStyle } from '../StaticContainer.types';
export type { StaticContainerProps } from '../StaticContainer.types';

const EMPTY_STATIC_CONTAINER_STYLE: CSSProperties = {};
const EMPTY_MATERIAL_LAYERS: never[] = [];
const ZERO_MATERIAL_INSET: ContainerMaterialInset = {
  bottom: 0,
  left: 0,
  right: 0,
  top: 0,
};

/**
 * StaticContainer props augmented with a private background-style override.
 * Public callers only see {@link StaticContainerProps}.
 * {@link TextSwitcher} passes `_privateBackgroundStyle` to keep its material
 * always visible without adding an always-visible option to the public union.
 *
 * @internal
 */
export type StaticContainerInternalProps = StaticContainerProps & {
  /** @internal Overrides `backgroundStyle` for visual-state/material resolution. */
  _privateBackgroundStyle?: PrivateBackgroundStyle;
};

/**
 * StaticContainer component
 * Provides material-based styling with smooth corners, without interactivity.
 *
 * Key differences from Container:
 * - No InteractableBase wrapper (no tabIndex, focus/blur/press handlers)
 * - No interaction-driven state transitions
 * - No content scale animation
 * - Still has material layers (background + foreground)
 * - Still has smooth corners support
 * - Still clips content to border radius
 */
const StaticContainerComponent = memo(forwardRef<HTMLDivElement, StaticContainerInternalProps>(
  function StaticContainer(
    {
      children,
      material: materialProp,
      shapeProvider = defaultShapeProvider,
      visualState: visualStateProp = VisualState.DEFAULT,
      width = 'auto',
      height = 'auto',
      backgroundStyle = BackgroundStyle.PRIMARY,
      _privateBackgroundStyle,
      clipContent = true,
      useSmoothCorners = true,
      layoutTransitionToken = 0,
      layoutTransitionSignature,
      layoutTransitionAnchor = 'start',
      onLayoutTransitionComplete,
      className = '',
      contentClassName = '',
      style = EMPTY_STATIC_CONTAINER_STYLE,
      ...rest
    },
    ref
  ) {
    /**
     * The private style, when provided, wins over the public `backgroundStyle`.
     * `TextSwitcher` uses `ALWAYS_VISIBLE` to pin the material to its DEFAULT
     * visual state (what the removed public `IDLE` case did) without exposing a
     * fourth case on the public union.
     */
    const resolvedBackgroundStyle: ResolvedBackgroundStyle =
      _privateBackgroundStyle ?? backgroundStyle;
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const backgroundLayerRef = useRef<HTMLDivElement>(null);
    const foregroundLayerRef = useRef<HTMLDivElement>(null);
    const materialHostRef = useRef<object>({});
    const [materialRevision, setMaterialRevision] = useState(0);
    const reactClipPathId = useId();
    const clipPathId =
      `clip-${reactClipPathId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const measuredDims = useMeasuredElementDimensions(containerRef);
    const setContainerRef = useComposedRef(ref, containerRef);
    /**
     * Resolve the material from the background style:
     * - SECONDARY -> the derived secondary static material, which takes
     *   precedence over any passed `material`.
     * - PRIMARY (the default) -> a passed `material` is kept (defaulting to the
     *   primary static material when none is passed).
     * - NONE -> the existing/passed material is kept and its visibility is driven
     *   through the resolved visual state below.
     * - ALWAYS_VISIBLE -> keep the passed material, pinned visible.
     *
     */
    const material = useMemo(
      () => resolvedBackgroundStyle === BackgroundStyle.SECONDARY
        ? MaterialLibrary.defaultStatic({ secondary: true })
        : materialProp ?? MaterialLibrary.defaultStatic({ secondary: false }),
      [resolvedBackgroundStyle, materialProp],
    );

    /**
     * Determine the visual state from the resolved background style.
     * PRIMARY/SECONDARY/ALWAYS_VISIBLE -> the caller-selected visual state
     * NONE -> NONE visual state (material is hidden)
     *
     * The visual state is passed directly to the material layers without
     * attaching interaction behavior.
     */
    const visualState = useMemo(
      () => getStaticContainerVisualState(
        resolvedBackgroundStyle,
        visualStateProp,
      ),
      [resolvedBackgroundStyle, visualStateProp],
    );

    const handleMaterialChange = useCallback(() => {
      setMaterialRevision((revision) => revision + 1);
    }, []);

    useLayoutEffect(
      () => material.attachToHost(materialHostRef.current, handleMaterialChange),
      [handleMaterialChange, material],
    );

    useLayoutEffect(() => {
      material.setState(visualState, false);
    }, [material, visualState]);

    /**
     * Get background layers for rendering
     */
    const backgroundLayers = useMemo(
      () => material.getBackgroundLayers(),
      [material, materialRevision],
    );

    /**
     * Get foreground layers for rendering
     */
    const foregroundLayers = useMemo(
      () => material.getForegroundLayers(),
      [material, materialRevision],
    );

    /**
     * Calculate smooth corner path if enabled.
     *
     * The clip path is recreated from measured width/height whenever the size
     * changes (via ResizeObserver), so auto-sized components such as Tag can use
     * the same material path as their content clip instead of relying on the
     * approximate CSS border-radius fallback.
     */
    const resolvedDimensions = useMemo(
      () => resolveStaticContainerDimensions(
        width,
        height,
        measuredDims,
      ),
      [height, measuredDims, width],
    );
    const effectiveUseSmoothCorners =
      useSmoothCorners && resolvedDimensions != null;
    const containerW = resolvedDimensions?.width ?? 0;
    const containerH = resolvedDimensions?.height ?? 0;
    const resolvedInset = material.getInset();
    const materialInset = resolvedInset ?? ZERO_MATERIAL_INSET;
    const hasInset = resolvedInset != null;
    const layerW = hasInset
      ? Math.max(0, containerW - resolvedInset!.left - resolvedInset!.right)
      : containerW;
    const layerH = hasInset
      ? Math.max(0, containerH - resolvedInset!.top - resolvedInset!.bottom)
      : containerH;

    const smoothCornerPath = useMemo(
      () => effectiveUseSmoothCorners
        ? getCachedShapePath(shapeProvider, {
            width: containerW,
            height: containerH,
          })
        : null,
      [
        containerH,
        containerW,
        effectiveUseSmoothCorners,
        shapeProvider,
      ],
    );
    const materialShapePath = useMemo(
      () => resolvedDimensions != null && layerW > 0 && layerH > 0
        ? getCachedShapePath(shapeProvider, {
            width: layerW,
            height: layerH,
          })
        : null,
      [
        layerH,
        layerW,
        resolvedDimensions,
        shapeProvider,
      ],
    );
    const smoothShapeSnapshot = useMemo<StaticContainerSmoothShapeSnapshot | null>(
      () => effectiveUseSmoothCorners
        ? {
            width: containerW,
            height: containerH,
            materialInset,
            shapeProvider,
          }
        : null,
      [
        containerH,
        containerW,
        effectiveUseSmoothCorners,
        materialInset,
        shapeProvider,
      ],
    );
    useStaticContainerLayoutTransition({
      anchor: layoutTransitionAnchor,
      backgroundLayerRef,
      containerRef,
      contentRef,
      foregroundLayerRef,
      onComplete: onLayoutTransitionComplete,
      shapeSnapshot: smoothShapeSnapshot,
      transitionSignature: layoutTransitionSignature,
      transitionToken: layoutTransitionToken,
    });
    /**
     * Container styles
     *
     * Material overflow remains visible; StaticContainerFrame clips only the
     * content subtree when clipContent is enabled.
     */
    const containerStyle: CSSProperties = useMemo(
      () => ({
        ...style,
        position: 'relative',
        width,
        height,
        borderRadius: effectiveUseSmoothCorners
          ? undefined
          : shapeProvider.getCssBorderRadius?.() ?? '0px',
        isolation: material.backgroundBlendsWithBackdrop() ? 'auto' : undefined,
        overflow: 'visible',
      }),
      [effectiveUseSmoothCorners, height, material, shapeProvider, style, width],
    );

    const materialAlpha = material.getAlpha() * material.getAlphaForState(visualState);
    const isMaterialVisible =
      visualState !== VisualState.NONE && !material.isHidden() && materialAlpha > 0;

    /**
     * Background layer element styles
     */
    const backgroundLayerStyle: CSSProperties = useMemo(
      () => ({
        borderRadius: effectiveUseSmoothCorners
          ? undefined
          : shapeProvider.getCssBorderRadius?.() ?? '0px',
        display: isMaterialVisible ? undefined : 'none',
        opacity: materialAlpha,
        ...(hasInset ? {
          '--uit-material-inset-top': `${resolvedInset!.top}px`,
          '--uit-material-inset-right': `${resolvedInset!.right}px`,
          '--uit-material-inset-bottom': `${resolvedInset!.bottom}px`,
          '--uit-material-inset-left': `${resolvedInset!.left}px`,
        } : {}),
      }) as CSSProperties,
      [
        effectiveUseSmoothCorners,
        hasInset,
        isMaterialVisible,
        material,
        materialAlpha,
        resolvedInset,
        shapeProvider,
      ],
    );

    /**
     * Foreground layer element styles
     */
    const foregroundLayerStyle: CSSProperties = useMemo(
      () => ({
        borderRadius: effectiveUseSmoothCorners
          ? undefined
          : shapeProvider.getCssBorderRadius?.() ?? '0px',
        display: isMaterialVisible ? undefined : 'none',
        opacity: materialAlpha,
        ...(hasInset ? {
          '--uit-material-inset-top': `${resolvedInset!.top}px`,
          '--uit-material-inset-right': `${resolvedInset!.right}px`,
          '--uit-material-inset-bottom': `${resolvedInset!.bottom}px`,
          '--uit-material-inset-left': `${resolvedInset!.left}px`,
        } : {}),
      }) as CSSProperties,
      [
        effectiveUseSmoothCorners,
        hasInset,
        isMaterialVisible,
        material,
        materialAlpha,
        resolvedInset,
        shapeProvider,
      ],
    );

    /**
     * Content wrapper styles
     *
     * Children stack without centering.
     * z-index 1: between background (0) and foreground (3).
     */
    const contentWrapperStyle: CSSProperties = useMemo(
      () => ({
        width: width === 'auto' ? undefined : '100%',
        height: height === 'auto' ? undefined : '100%',
      }),
      [height, width],
    );

    const shapeContext = useMemo(
      () => ({
        materialInset: resolvedInset ?? undefined,
        shapeProvider,
      }),
      [resolvedInset, shapeProvider],
    );
    const idPrefix = clipPathId;

    return (
      <StaticContainerFrame
        rootProps={rest}
        containerRef={setContainerRef}
        contentRef={contentRef}
        backgroundLayerRef={backgroundLayerRef}
        foregroundLayerRef={foregroundLayerRef}
        className={className}
        contentClassName={contentClassName}
        containerStyle={containerStyle}
        effectiveUseSmoothCorners={effectiveUseSmoothCorners}
        smoothCornerPath={smoothCornerPath}
        materialShapePath={materialShapePath}
        clipContent={clipContent}
        backgroundLayers={isMaterialVisible ? backgroundLayers : EMPTY_MATERIAL_LAYERS}
        foregroundLayers={isMaterialVisible ? foregroundLayers : EMPTY_MATERIAL_LAYERS}
        visualState={visualState}
        containerW={layerW}
        containerH={layerH}
        shapeContext={shapeContext}
        idPrefix={idPrefix}
        backgroundLayerStyle={backgroundLayerStyle}
        foregroundLayerStyle={foregroundLayerStyle}
        contentWrapperStyle={contentWrapperStyle}
        foregroundBlendsWithContent={material.foregroundBlendsWithContent()}
        backgroundBlendsWithBackdrop={material.backgroundBlendsWithBackdrop()}
      >
        {children}
      </StaticContainerFrame>
    );
  }
));

export const StaticContainerInternal = StaticContainerComponent;
