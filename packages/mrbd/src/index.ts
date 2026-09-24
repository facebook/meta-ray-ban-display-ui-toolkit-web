/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Public API exports for UI Toolkit for Meta Ray-Ban Display.
 *
 * Generated from scripts/public-api-manifest.mjs.
 */

// Foundation - Base
export {
  InteractableBase,
  TooltipMode,
  PartialFocusSupportedAxis,
} from '@wearables-ui-toolkit/foundation';
export type {
  InteractableActivationEvent,
  InteractableBaseProps,
  InvalidFocusDirection,
  InvalidFocusDirectionDetail,
} from '@wearables-ui-toolkit/foundation';
export {
  State,
  VisualState,
} from '@wearables-ui-toolkit/foundation';
export type { InteractionState } from '@wearables-ui-toolkit/foundation';
export {
  ContentScaleInsets,
  getContentScaleForState,
} from './mrbd/foundation/Interactions';
export type { Platform } from './mrbd/foundation/Interactions';
export type { UITCommonProps } from '@wearables-ui-toolkit/foundation';

// Foundation - App
export { App } from './mrbd/app/App';
export type { AppProps } from './mrbd/app/App';

// Foundation - Motion
export {
  AnimationDurations,
  Interpolators,
  SpringConfigs,
  createTransition,
  reducedMotionDuration,
} from '@wearables-ui-toolkit/foundation';
export type { SpringConfig } from '@wearables-ui-toolkit/foundation';
export { usePrefersReducedMotion } from '@wearables-ui-toolkit/foundation';
export { useSpringAnimation } from '@wearables-ui-toolkit/foundation';
export type {
  SpringAnimationController,
  UseSpringAnimationOptions,
} from '@wearables-ui-toolkit/foundation';

// Foundation - Navigation
export { useBackNavigation } from '@wearables-ui-toolkit/foundation';
export type { BackNavigationHandler } from '@wearables-ui-toolkit/foundation';
export {
  FocusNavigationProvider,
  useFocusNavigation,
} from '@wearables-ui-toolkit/foundation';
export type { FocusNavigationProviderProps } from '@wearables-ui-toolkit/foundation';
export { preserveFocusedInteractableDuringNavigation } from '@wearables-ui-toolkit/foundation';
export {
  AppSwitchPageTransitionConfig,
  DefaultPageTransitionConfig,
  InAppPageTransitionConfig,
  PageTransition,
} from '@wearables-ui-toolkit/foundation';
export {
  RoutePreloadProvider,
  RoutePreloadTarget,
  useRoutePreloadTarget,
  useRoutePreloader,
} from '@wearables-ui-toolkit/foundation';
export type {
  RoutePreloadHandler,
  RoutePreloadRequest,
  RoutePreloadProviderProps,
  RoutePreloadTargetBindings,
  RoutePreloadTargetProps,
  UseRoutePreloadTargetOptions,
} from '@wearables-ui-toolkit/foundation';
export { createPreloadableLazyComponent } from '@wearables-ui-toolkit/foundation';
export type { PreloadableLazyComponent } from '@wearables-ui-toolkit/foundation';
export type {
  PageTransitionConfig,
  PageTransitionDirection,
  PageTransitionInitialFocus,
  PageTransitionMotionConfig,
  PageTransitionProps,
  PageTransitionSegmentConfig,
  PageTransitionStateConfig,
  PageTransitionValueSegmentConfig,
} from '@wearables-ui-toolkit/foundation';

// Foundation - Material
export {
  ContainerMaterial,
  ContainerMaterialLayer,
  DEFAULT_SORT_ORDER,
  LayerPlacement,
  MAX_SORT_ORDER,
  MIN_SORT_ORDER,
  createLayer,
} from '@wearables-ui-toolkit/foundation';
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
} from '@wearables-ui-toolkit/foundation';
export {
  CornerRadius,
  TailShapeProvider,
  RoundedRectangleShapeProvider,
  getShapeProviderId,
} from '@wearables-ui-toolkit/foundation';
export * from '@wearables-ui-toolkit/foundation';
export { createDefaultContainerMaterial } from '@wearables-ui-toolkit/foundation';
export type { DefaultContainerMaterialOptions } from '@wearables-ui-toolkit/foundation';
export { MaterialLibrary } from './mrbd/foundation/MaterialLibrary';
export { createContentFocusContainerMaterial } from './mrbd/foundation/ContentFocusContainerMaterial';
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
} from '@wearables-ui-toolkit/foundation';
export {
  defaultGlowStrokeAlpha,
  defaultGlowStrokeWidth,
  drawDefaultGlowStrokeCanvas,
  renderDefaultGlowStrokeStyles,
} from '@wearables-ui-toolkit/foundation';
export {
  getInsetAdjustedShaderHeight,
  interpolate,
  shiftedX,
  shiftedY,
} from '@wearables-ui-toolkit/foundation';
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
} from '@wearables-ui-toolkit/foundation';
export type {
  BlendMode,
  GradientStop,
} from '@wearables-ui-toolkit/foundation';
export {
  getInsetStrokePath2D,
  getPath2DForPathD,
} from '@wearables-ui-toolkit/foundation';
export {
  BackgroundImageBlurContainerMaterial,
  createBackgroundImageBlurContainerMaterial,
} from '@wearables-ui-toolkit/foundation';
export {
  createClockPillContainerMaterial,
  createReducedOpacityStaticContainerMaterial,
  createStatusIndicatorPanelContainerMaterial,
} from '@wearables-ui-toolkit/foundation';

// Foundation - Components
export { Container } from '@wearables-ui-toolkit/foundation';
export type { ContainerProps } from '@wearables-ui-toolkit/foundation';
export { IconImage } from '@wearables-ui-toolkit/foundation';
export type {
  IconSource,
  IconVectorSource,
  IconUriSource,
  IconVectorPath,
  IconImageProps,
} from '@wearables-ui-toolkit/foundation';
export { IconWithContainerMaterial } from '@wearables-ui-toolkit/foundation';
export type { IconWithContainerMaterialProps } from '@wearables-ui-toolkit/foundation';
export { StaticContainer } from '@wearables-ui-toolkit/foundation';
export type { StaticContainerProps } from '@wearables-ui-toolkit/foundation';
export { BackgroundStyle } from '@wearables-ui-toolkit/foundation';
export { Panel } from '@wearables-ui-toolkit/foundation';
export type { PanelProps } from '@wearables-ui-toolkit/foundation';
export {
  Card,
  CardAboveScrim,
  CardBelowScrim,
  ScrimType,
} from '@wearables-ui-toolkit/foundation';
export type {
  CardProps,
  CardScrimLayerProps,
} from '@wearables-ui-toolkit/foundation';
export {
  CardStack,
  StackType,
  AspectRatio,
} from '@wearables-ui-toolkit/foundation';
export type {
  CardStackProps,
  BackgroundCardConfig,
} from '@wearables-ui-toolkit/foundation';
export { TextSwitcher } from '@wearables-ui-toolkit/foundation';
export type { TextSwitcherProps } from '@wearables-ui-toolkit/foundation';
export {
  Shimmer,
  ShimmerItem,
  ShimmerItemCornerRadius,
  ShimmerRepeatMode,
} from '@wearables-ui-toolkit/foundation';
export type {
  ShimmerProps,
  ShimmerItemProps,
} from '@wearables-ui-toolkit/foundation';
export {
  MediaWrapper,
  MediaWrapperPosition,
  MediaWrapperSize,
} from '@wearables-ui-toolkit/foundation';
export type { MediaWrapperProps } from '@wearables-ui-toolkit/foundation';
export {
  Vignette,
  VignetteEdge,
} from '@wearables-ui-toolkit/foundation';
export type {
  VignetteEdgeVisibility,
  VignetteProps,
} from '@wearables-ui-toolkit/foundation';
export {
  Surface,
  SurfaceCornerRadius,
} from '@wearables-ui-toolkit/foundation';
export type { SurfaceProps } from '@wearables-ui-toolkit/foundation';
export {
  TextView,
  TextStyle,
  TextColor,
} from '@wearables-ui-toolkit/foundation';
export type { TextViewProps } from '@wearables-ui-toolkit/foundation';
export {
  ScrollView,
  ScrollViewOrientation,
} from '@wearables-ui-toolkit/foundation';
export type { ScrollViewProps } from '@wearables-ui-toolkit/foundation';
export { VerticalList } from '@wearables-ui-toolkit/foundation';
export type { VerticalListProps } from '@wearables-ui-toolkit/foundation';
export {
  Pager,
  PagerPage,
  PagerOrientation,
  NavigationDirection,
  usePagerPageLifecycle,
} from '@wearables-ui-toolkit/foundation';
export type {
  PagerAnimationCompletedRequest,
  PagerHandle,
  PagerInitialFocusRequest,
  PagerPageLifecycle,
  PagerPageProps,
  PagerProps,
} from '@wearables-ui-toolkit/foundation';
export {
  Carousel,
  CarouselVerticalAlignment,
  CarouselIndicatorPlacement,
} from './mrbd/ui/Carousel';
export type {
  CarouselHandle,
  CarouselProps,
  ProgressIndicatorCustomization,
} from './mrbd/ui/Carousel';

// Foundation - Utils
export {
  generateSmoothRoundedRectPath,
  getCachedSmoothRoundedRectPath,
  clearPathCache,
} from '@wearables-ui-toolkit/foundation';
export type { SmoothRoundedRectParams } from '@wearables-ui-toolkit/foundation';
export {
  FloatingPortalRootProvider,
  useFloatingPortalRoot,
} from '@wearables-ui-toolkit/foundation';
export type { FloatingPortalRootProviderProps } from '@wearables-ui-toolkit/foundation';

// Meta Ray-Ban Display - UI
export { Button } from './mrbd/ui/Button';
export type {
  ButtonProps,
  ButtonHandle,
  ButtonActionTransitionOptions,
} from './mrbd/ui/Button';
export {
  IconTintColor,
  getIconTintCSSVariable,
  getIconTintBlendMode,
} from './mrbd/ui/IconTintColor';
export { ButtonItemIconSize } from './mrbd/ui/ButtonItemIconSize';
export { TrailingTag } from './mrbd/ui/TrailingTag';
export {
  TimestampTextColor,
  getTimestampTextCSSVariable,
  getTimestampTextBlendMode,
} from './mrbd/ui/TimestampTextColor';
export {
  Avatar,
  AvatarSize,
  AvatarShape,
  AvatarStyle,
  PlaceholderStyle,
  StatusIndicatorType,
} from './mrbd/ui/Avatar';
export type { AvatarProps } from './mrbd/ui/Avatar';
export { AppBadge } from './mrbd/ui/AppBadge';
export type { AppBadgeProps } from './mrbd/ui/AppBadge';
export { NotificationBadge } from './mrbd/ui/NotificationBadge';
export type { NotificationBadgeProps } from './mrbd/ui/NotificationBadge';
export {
  SliderBar,
  SliderBarOrientation,
  SliderBarState,
  SliderBarSize,
} from './mrbd/ui/SliderBar';
export type { SliderBarProps } from './mrbd/ui/SliderBar';
export {
  Scrubber,
  ScrubberTimestampPosition,
} from './mrbd/ui/Scrubber';
export type { ScrubberProps } from './mrbd/ui/Scrubber';
export {
  IndeterminateLoader,
  IndeterminateLoaderSize,
} from './mrbd/ui/IndeterminateLoader';
export type { IndeterminateLoaderProps } from './mrbd/ui/IndeterminateLoader';
export {
  ProgressRing,
  ProgressRingSize,
} from './mrbd/ui/ProgressRing';
export type { ProgressRingProps } from './mrbd/ui/ProgressRing';
export {
  ReadMoreTextView,
  DEFAULT_READ_MORE_TEXT_VIEW_MAX_LINES,
} from './mrbd/ui/ReadMoreTextView';
export type {
  ReadMoreTextViewHandle,
  ReadMoreTextViewProps,
} from './mrbd/ui/ReadMoreTextView';
export {
  InputTextView,
  InputTextViewSize,
} from './mrbd/ui/InputTextView';
export type {
  InputTextViewInputProps,
  InputTextViewProps,
} from './mrbd/ui/InputTextView';
export {
  Divider,
  DividerOrientation,
} from './mrbd/ui/Divider';
export type { DividerProps } from './mrbd/ui/Divider';
export { Switch } from './mrbd/ui/Switch';
export type { SwitchProps } from './mrbd/ui/Switch';
export { RadioButton } from './mrbd/ui/RadioButton';
export type { RadioButtonProps } from './mrbd/ui/RadioButton';
export {
  Toast,
  ToastStyle,
  ToastContainer,
  useToast,
} from './mrbd/ui/Toast';
export type {
  ToastIdentifier,
  ToastContainerProps,
} from './mrbd/ui/Toast';
export {
  Scrim,
  ScrimPosition,
} from './mrbd/ui/Scrim';
export type { ScrimProps } from './mrbd/ui/Scrim';
export {
  ButtonGroup,
  ButtonGroupAlignment,
} from './mrbd/ui/ButtonGroup';
export type { ButtonGroupProps } from './mrbd/ui/ButtonGroup';
export { ActionHint } from './mrbd/ui/ActionHint';
export type { ActionHintProps } from './mrbd/ui/ActionHint';
export { CircularProgressBar } from './mrbd/ui/CircularProgressBar';
export type { CircularProgressBarProps } from './mrbd/ui/CircularProgressBar';
export { PaginationIndicator } from './mrbd/ui/PaginationIndicator';
export type { PaginationIndicatorProps } from './mrbd/ui/PaginationIndicator';
export { PaginationMode } from '@wearables-ui-toolkit/foundation';
export {
  SwipeIndicator,
  SwipeDirection,
} from './mrbd/ui/SwipeIndicator';
export type {
  SwipeIndicatorProps,
  SwipeIndicatorHandle,
} from './mrbd/ui/SwipeIndicator';
export { SwipeToReveal } from './mrbd/ui/SwipeToReveal';
export type {
  SwipeToRevealAction,
  SwipeToRevealProps,
} from './mrbd/ui/SwipeToReveal';
export { TooltipContainer } from './mrbd/ui/TooltipContainer';
export type { TooltipContainerProps } from './mrbd/ui/TooltipContainer';
export {
  ContextMenu,
  DismissReason,
} from './mrbd/ui/ContextMenu';
export type {
  ContextMenuHandle,
  ContextMenuProps,
} from './mrbd/ui/ContextMenu';
export {
  ContextMenuItemView,
  ButtonContextMenuItemView,
  EmojiContextMenuItemView,
} from './mrbd/ui/ContextMenuItemView';
export type {
  ContextMenuItemViewProps,
  ButtonContextMenuItemViewProps,
  EmojiContextMenuItemViewProps,
} from './mrbd/ui/ContextMenuItemView';
export {
  VerticalMenu,
  VerticalMenuCorner,
  VerticalMenuDismissReason,
  getVerticalMenuAnchorProps,
} from './mrbd/ui/VerticalMenu';
export type {
  VerticalMenuAnchorProps,
  VerticalMenuProps,
} from './mrbd/ui/VerticalMenu';
export { VerticalMenuButton } from './mrbd/ui/VerticalMenuButton';
export type { VerticalMenuButtonProps } from './mrbd/ui/VerticalMenuButton';
export { SubNavigation } from './mrbd/ui/SubNavigation';
export type {
  SubNavigationProps,
  SubNavigationItem,
  SubNavigationHandle,
} from './mrbd/ui/SubNavigation';
export { ControlTile } from './mrbd/ui/ControlTile';
export type { ControlTileProps } from './mrbd/ui/ControlTile';
export { QuickReplyButton } from './mrbd/ui/QuickReplyButton';
export type { QuickReplyButtonProps } from './mrbd/ui/QuickReplyButton';
export { ContainerHeader } from './mrbd/ui/ContainerHeader';
export type { ContainerHeaderProps } from './mrbd/ui/ContainerHeader';
export { IsolatedControl } from './mrbd/ui/IsolatedControl';
export type {
  IsolatedControlHandle,
  IsolatedControlProps,
} from './mrbd/ui/IsolatedControl';
export { AppControlTile } from './mrbd/ui/AppControlTile';
export type { AppControlTileProps } from './mrbd/ui/AppControlTile';
export {
  WebAppIcon,
  createWebAppIconMaterial,
} from './mrbd/ui/WebAppIcon';
export type {
  WebAppIconMaterialOptions,
  WebAppIconMaterialRendering,
  WebAppIconProps,
} from './mrbd/ui/WebAppIcon';
export { VolumeIndicator } from './mrbd/ui/VolumeIndicator';
export type { VolumeIndicatorProps } from './mrbd/ui/VolumeIndicator';
export { ZoomIndicator } from './mrbd/ui/ZoomIndicator';
export type { ZoomIndicatorProps } from './mrbd/ui/ZoomIndicator';
export {
  ProgressIndicator,
  ProgressIndicatorSize,
} from './mrbd/ui/ProgressIndicator';
export type { ProgressIndicatorProps } from './mrbd/ui/ProgressIndicator';
export { ButtonDivider } from './mrbd/ui/ButtonDivider';
export type { ButtonDividerProps } from './mrbd/ui/ButtonDivider';
export { Tag } from './mrbd/ui/Tag';
export type { TagProps } from './mrbd/ui/Tag';
export {
  Chip,
  ChipStyle,
  ChipAvatarSize,
} from './mrbd/ui/Chip';
export type { ChipProps } from './mrbd/ui/Chip';
export {
  Header,
  HeaderAvatarSize,
} from './mrbd/ui/Header';
export type {
  HeaderHandle,
  HeaderProps,
} from './mrbd/ui/Header';
export {
  Tooltip,
  useTooltip,
  TooltipPosition,
} from './mrbd/ui/Tooltip';
export type {
  TooltipAnchorPoint,
  TooltipAnchorRect,
  TooltipCenterPositionProvider,
  TooltipProps,
  TooltipShowOptions,
  TooltipState,
  TooltipTargetRectProvider,
} from './mrbd/ui/Tooltip';
export {
  ListItem,
  SubtitleTextColor,
  TimestampPosition,
} from './mrbd/ui/ListItem';
export type {
  ListItemProps,
  StatusIndicator,
  StatusIcon,
} from './mrbd/ui/ListItem';
export { ButtonRail } from './mrbd/ui/ButtonRail';
export type {
  ButtonRailHandle,
  ButtonRailProps,
} from './mrbd/ui/ButtonRail';
export { Page } from './mrbd/ui/Page';
export type {
  PageHandle,
  PageProps,
} from './mrbd/ui/Page';
export {
  Modal,
  ModalContentMode,
  ModalBannerSize,
  ModalBannerTag,
} from './mrbd/ui/Modal';
export type {
  ModalProps,
  ModalListItem,
} from './mrbd/ui/Modal';
export { SubNavigationPager } from './mrbd/ui/SubNavigationPager';
export type { SubNavigationPagerProps } from './mrbd/ui/SubNavigationPager';

// Foundation - Text Appearance
export { TextAppearance } from '@wearables-ui-toolkit/foundation';
export type {
  TextAppearanceKey,
  TextAppearanceValue,
} from '@wearables-ui-toolkit/foundation';
