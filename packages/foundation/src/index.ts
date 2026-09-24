/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Public shared foundation exports.
 *
 */

// Foundation - Base
export {
  InteractableBase,
  TooltipMode,
  PartialFocusSupportedAxis,
} from './base/InteractableBase';
export type {
  InteractableActivationEvent,
  InteractableBaseProps,
  InvalidFocusDirection,
  InvalidFocusDirectionDetail,
} from './base/InteractableBase';
export {
  DefaultContentScaleInsets,
  State,
  VisualState,
  getDefaultContentScaleForState,
} from './base/Interactions';
export type {
  ContentScaleForStateFn,
  InteractionState,
} from './base/Interactions';
export type { UITCommonProps } from './base/CommonProps';
export {
  TooltipPresentationProvider,
} from './base/TooltipPresentation';
export type {
  DefaultTooltipPresentation,
  DefaultTooltipPresentationProps,
  TooltipPresentationProviderProps,
} from './base/TooltipPresentation';

// Foundation - App
export { App } from './app/App';
export type { AppProps } from './app/App';

// Foundation - Motion
export {
  AnimationDurations,
  Interpolators,
  SpringConfigs,
  createTransition,
  reducedMotionDuration,
} from './motion/Animations';
export type { SpringConfig } from './motion/Animations';
export { usePrefersReducedMotion } from './motion/usePrefersReducedMotion';
export { useSpringAnimation } from './motion/useSpringAnimation';
export type {
  SpringAnimationController,
  UseSpringAnimationOptions,
} from './motion/useSpringAnimation';

// Foundation - Navigation
export { useBackNavigation } from './navigation/BackNavigation';
export type { BackNavigationHandler } from './navigation/BackNavigation';
export {
  FocusNavigationProvider,
  useFocusNavigation,
} from './navigation/FocusNavigationProvider';
export type { FocusNavigationProviderProps } from './navigation/FocusNavigationProvider';
export { preserveFocusedInteractableDuringNavigation } from './navigation/FocusRetention';
export {
  AppSwitchPageTransitionConfig,
  DefaultPageTransitionConfig,
  InAppPageTransitionConfig,
  PageTransition,
} from './navigation/PageTransition';
export {
  RoutePreloadProvider,
  RoutePreloadTarget,
  useRoutePreloadTarget,
  useRoutePreloader,
} from './navigation/RoutePreloading';
export type {
  RoutePreloadHandler,
  RoutePreloadRequest,
  RoutePreloadProviderProps,
  RoutePreloadTargetBindings,
  RoutePreloadTargetProps,
  UseRoutePreloadTargetOptions,
} from './navigation/RoutePreloading';
export { createPreloadableLazyComponent } from './navigation/PreloadableLazyComponent';
export type { PreloadableLazyComponent } from './navigation/PreloadableLazyComponent';
export type {
  PageTransitionConfig,
  PageTransitionDirection,
  PageTransitionInitialFocus,
  PageTransitionMotionConfig,
  PageTransitionProps,
  PageTransitionSegmentConfig,
  PageTransitionStateConfig,
  PageTransitionValueSegmentConfig,
} from './navigation/PageTransition.types';

// Foundation - Material
export {
  ContainerMaterial,
  ContainerMaterialLayer,
  CornerRadius,
  DEFAULT_SORT_ORDER,
  LayerPlacement,
  MAX_SORT_ORDER,
  MIN_SORT_ORDER,
  TailShapeProvider,
  RoundedRectangleShapeProvider,
  getShapeProviderId,
  createLayer,
} from './material/ContainerMaterial';
export type {
  CanvasLayerDrawParams,
  CanvasMaterialAssets,
  ContainerMaterialConfig,
  ContainerMaterialLayerOptions,
  DrawCanvasFn,
  MaterialLayer,
  MaterialShapeContext,
  MaterialStateTransition,
  LayerStyles,
  PartialFocusPosition,
  ShapePathParams,
  ShapeProvider,
  ShapeTailDirection,
  StrokePathParams,
} from './material/ContainerMaterial';
export * from './material/layers';
export { createDefaultContainerMaterial } from './material/DefaultContainerMaterial';
export type { DefaultContainerMaterialOptions } from './material/DefaultContainerMaterial';
export { MaterialLibrary } from './material/MaterialLibrary';
// Advanced material-composition primitives: the supported surface for building
// custom ContainerMaterials (layer factories + glow/inner-shadow renderers +
// shape geometry). Low-level math helpers are not exported.
export {
  createFocusedMaterialLayer,
  createGlowStrokeLayer,
  createIdleMaterialLayer,
  createInnerShadowLayer,
  createNoiseMaterialLayer,
  createPressedMaterialLayer,
} from './material/DefaultContainerMaterialLayerFactories';
export {
  defaultGlowStrokeAlpha,
  defaultGlowStrokeWidth,
  drawDefaultGlowStrokeCanvas,
  renderDefaultGlowStrokeStyles,
} from './material/DefaultGlowStrokeLayer';
export {
  getInsetAdjustedShaderHeight,
  interpolate,
  shiftedX,
  shiftedY,
} from './material/MaterialLayerGeometry';
// Canvas material drawing primitives for downstream material extensions.
export {
  drawDropShadow,
  drawImageClipped,
  drawInnerGlow,
  fillEllipticalRadialGradient,
  fillLinearGradient,
  fillLinearGradientRect,
  fillNoise,
  fillSolid,
  strokeEllipticalRadialGradient,
  strokeLinearGradient,
  strokeSolid,
} from './material/canvas/CanvasDrawUtils';
export type {
  BlendMode,
  GradientStop,
} from './material/canvas/CanvasDrawUtils';
export {
  getInsetStrokePath2D,
  getPath2DForPathD,
} from './material/canvas/Path2DCache';
export {
  BackgroundImageBlurContainerMaterial,
  createBackgroundImageBlurContainerMaterial,
} from './material/BackgroundImageBlurContainerMaterial';
export {
  createClockPillContainerMaterial,
  createReducedOpacityStaticContainerMaterial,
  createStatusIndicatorPanelContainerMaterial,
} from './material/SpecializedContainerMaterials';

// Foundation - Components
export { Container } from './components/Container';
export type { ContainerProps } from './components/Container';
export { IconImage } from './components/IconImage';
export type {
  IconSource,
  IconVectorSource,
  IconUriSource,
  IconVectorPath,
  IconImageProps,
} from './components/IconImage';
export { IconWithContainerMaterial } from './components/IconWithContainerMaterial';
export type { IconWithContainerMaterialProps } from './components/IconWithContainerMaterial';
export {
  StaticContainer,
  BackgroundStyle,
} from './components/StaticContainer';
export type { StaticContainerProps } from './components/StaticContainer';
export { Panel } from './components/Panel';
export type { PanelProps } from './components/Panel';
export {
  Card,
  CardAboveScrim,
  CardBelowScrim,
  ScrimType,
} from './components/Card';
export type {
  CardProps,
  CardScrimLayerProps,
} from './components/Card';
export {
  CardStack,
  StackType,
  AspectRatio,
} from './components/CardStack';
export type {
  CardStackProps,
  BackgroundCardConfig,
} from './components/CardStack';
export { TextSwitcher } from './components/TextSwitcher';
export type { TextSwitcherProps } from './components/TextSwitcher';
export {
  Shimmer,
  ShimmerItem,
  ShimmerItemCornerRadius,
  ShimmerRepeatMode,
} from './components/Shimmer';
export type {
  ShimmerProps,
  ShimmerItemProps,
} from './components/Shimmer';
export {
  MediaWrapper,
  MediaWrapperPosition,
  MediaWrapperSize,
} from './components/MediaWrapper';
export type { MediaWrapperProps } from './components/MediaWrapper';
export {
  Vignette,
  VignetteEdge,
} from './components/Vignette';
export type {
  VignetteEdgeVisibility,
  VignetteProps,
} from './components/Vignette';
export {
  Surface,
  SurfaceCornerRadius,
} from './components/Surface';
export type { SurfaceProps } from './components/Surface';
export {
  TextView,
  TextStyle,
  TextColor,
} from './components/TextView';
export type { TextViewProps } from './components/TextView';
export {
  ScrollView,
  ScrollViewOrientation,
} from './components/ScrollView';
export type { ScrollViewProps } from './components/ScrollView';
export { VerticalList } from './components/VerticalList';
export type { VerticalListProps } from './components/VerticalList';
export {
  Pager,
  PagerPage,
  PagerOrientation,
  NavigationDirection,
  usePagerPageLifecycle,
} from './components/Pager';
export type {
  PagerAnimationCompletedRequest,
  PagerHandle,
  PagerInitialFocusRequest,
  PagerPageLifecycle,
  PagerPageProps,
  PagerProps,
} from './components/Pager';
export {
  Carousel,
  CarouselVerticalAlignment,
  CarouselIndicatorPlacement,
  PaginationMode,
} from './components/Carousel';
export type {
  CarouselHandle,
  CarouselProps,
  ProgressIndicatorCustomization,
} from './components/Carousel';
export {
  CarouselPaginationPresentationProvider,
} from './components/CarouselPaginationPresentation';
export type {
  CarouselPaginationPresentation,
  CarouselPaginationPresentationProps,
  CarouselPaginationPresentationProviderProps,
} from './components/CarouselPaginationPresentation';

// Foundation - Utils
export {
  generateSmoothRoundedRectPath,
  getCachedSmoothRoundedRectPath,
  clearPathCache,
} from './utils/SmoothCorners';
export type { SmoothRoundedRectParams } from './utils/SmoothCorners';
export {
  FloatingPortalRootProvider,
  useFloatingPortalRoot,
} from './portal/FloatingPortalRoot';
export type { FloatingPortalRootProviderProps } from './portal/FloatingPortalRoot';

// Foundation - Text Appearance
export { TextAppearance } from './theme/TextAppearance';
export type {
  TextAppearanceKey,
  TextAppearanceValue,
} from './theme/TextAppearance';
