/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const publicApiSections = [
  {
    title: 'Foundation - Base',
    exports: [
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'InteractableBase',
          'TooltipMode',
          'PartialFocusSupportedAxis',
        ],
        types: [
          'InteractableActivationEvent',
          'InteractableBaseProps',
          'InvalidFocusDirection',
          'InvalidFocusDirectionDetail',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'State',
          'VisualState',
        ],
        types: ['InteractionState'],
      },
      {
        source: 'mrbd/foundation/Interactions',
        values: [
          'ContentScaleInsets',
          'getContentScaleForState',
        ],
        types: ['Platform'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        types: ['UITCommonProps'],
      },
    ],
  },
  {
    title: 'Foundation - App',
    exports: [
      {
        source: 'mrbd/app/App',
        values: ['App'],
        types: ['AppProps'],
      },
    ],
  },
  {
    title: 'Foundation - Motion',
    exports: [
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'AnimationDurations',
          'Interpolators',
          'SpringConfigs',
          'createTransition',
          'reducedMotionDuration',
        ],
        types: ['SpringConfig'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['usePrefersReducedMotion'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['useSpringAnimation'],
        types: [
          'SpringAnimationController',
          'UseSpringAnimationOptions',
        ],
      },
    ],
  },
  {
    title: 'Foundation - Navigation',
    exports: [
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['useBackNavigation'],
        types: ['BackNavigationHandler'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'FocusNavigationProvider',
          'useFocusNavigation',
        ],
        types: ['FocusNavigationProviderProps'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['preserveFocusedInteractableDuringNavigation'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'AppSwitchPageTransitionConfig',
          'DefaultPageTransitionConfig',
          'InAppPageTransitionConfig',
          'PageTransition',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'RoutePreloadProvider',
          'RoutePreloadTarget',
          'useRoutePreloadTarget',
          'useRoutePreloader',
        ],
        types: [
          'RoutePreloadHandler',
          'RoutePreloadRequest',
          'RoutePreloadProviderProps',
          'RoutePreloadTargetBindings',
          'RoutePreloadTargetProps',
          'UseRoutePreloadTargetOptions',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['createPreloadableLazyComponent'],
        types: ['PreloadableLazyComponent'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        types: [
          'PageTransitionConfig',
          'PageTransitionDirection',
          'PageTransitionInitialFocus',
          'PageTransitionMotionConfig',
          'PageTransitionProps',
          'PageTransitionSegmentConfig',
          'PageTransitionStateConfig',
          'PageTransitionValueSegmentConfig',
        ],
      },
    ],
  },
  {
    title: 'Foundation - Material',
    exports: [
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'ContainerMaterial',
          'ContainerMaterialLayer',
          'DEFAULT_SORT_ORDER',
          'LayerPlacement',
          'MAX_SORT_ORDER',
          'MIN_SORT_ORDER',
          'createLayer',
        ],
        types: [
          'CanvasLayerDrawParams',
          'CanvasMaterialAssets',
          'ContainerMaterialConfig',
          'ContainerMaterialLayerOptions',
          'DrawCanvasFn',
          'MaterialLayer',
          'MaterialShapeContext',
          'MaterialStateTransition',
          'LayerStyles',
          'PartialFocusPosition',
          'ShapePathParams',
          'ShapeProvider',
          'ShapeTailDirection',
          'StrokePathParams',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'CornerRadius',
          'TailShapeProvider',
          'RoundedRectangleShapeProvider',
          'getShapeProviderId',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        exportAll: true,
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['createDefaultContainerMaterial'],
        types: ['DefaultContainerMaterialOptions'],
      },
      {
        source: 'mrbd/foundation/MaterialLibrary',
        values: ['MaterialLibrary'],
      },
      {
        source: 'mrbd/foundation/ContentFocusContainerMaterial',
        values: ['createContentFocusContainerMaterial'],
      },
      {
        comments: [
          'Advanced material-composition primitives: the supported surface for building',
          'custom ContainerMaterials (layer factories + glow/inner-shadow renderers +',
          'shape geometry). Low-level math helpers are not exported.',
        ],
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'createFocusedMaterialLayer',
          'createGlowStrokeLayer',
          'createIdleMaterialLayer',
          'createInnerShadowLayer',
          'createNoiseMaterialLayer',
          'createPressedMaterialLayer',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'defaultGlowStrokeAlpha',
          'defaultGlowStrokeWidth',
          'drawDefaultGlowStrokeCanvas',
          'renderDefaultGlowStrokeStyles',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'getInsetAdjustedShaderHeight',
          'interpolate',
          'shiftedX',
          'shiftedY',
        ],
      },
      {
        comments: ['Canvas material drawing primitives for downstream material extensions.'],
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'drawDropShadow',
          'drawImageClipped',
          'drawInnerGlow',
          'fillEllipticalRadialGradient',
          'fillLinearGradient',
          'fillLinearGradientRect',
          'fillNoise',
          'fillSolid',
          'strokeEllipticalRadialGradient',
          'strokeLinearGradient',
          'strokeSolid',
        ],
        types: [
          'BlendMode',
          'GradientStop',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'getInsetStrokePath2D',
          'getPath2DForPathD',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'BackgroundImageBlurContainerMaterial',
          'createBackgroundImageBlurContainerMaterial',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'createClockPillContainerMaterial',
          'createReducedOpacityStaticContainerMaterial',
          'createStatusIndicatorPanelContainerMaterial',
        ],
      },
    ],
  },
  {
    title: 'Foundation - Components',
    exports: [
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['Container'],
        types: ['ContainerProps'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['IconImage'],
        types: [
          'IconSource',
          'IconVectorSource',
          'IconUriSource',
          'IconVectorPath',
          'IconImageProps',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['IconWithContainerMaterial'],
        types: ['IconWithContainerMaterialProps'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['StaticContainer'],
        types: ['StaticContainerProps'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['BackgroundStyle'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['Panel'],
        types: ['PanelProps'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'Card',
          'CardAboveScrim',
          'CardBelowScrim',
          'ScrimType',
        ],
        types: [
          'CardProps',
          'CardScrimLayerProps',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'CardStack',
          'StackType',
          'AspectRatio',
        ],
        types: [
          'CardStackProps',
          'BackgroundCardConfig',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['TextSwitcher'],
        types: ['TextSwitcherProps'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'Shimmer',
          'ShimmerItem',
          'ShimmerItemCornerRadius',
          'ShimmerRepeatMode',
        ],
        types: [
          'ShimmerProps',
          'ShimmerItemProps',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'MediaWrapper',
          'MediaWrapperPosition',
          'MediaWrapperSize',
        ],
        types: ['MediaWrapperProps'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'Vignette',
          'VignetteEdge',
        ],
        types: [
          'VignetteEdgeVisibility',
          'VignetteProps',
        ],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'Surface',
          'SurfaceCornerRadius',
        ],
        types: ['SurfaceProps'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'TextView',
          'TextStyle',
          'TextColor',
        ],
        types: ['TextViewProps'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'ScrollView',
          'ScrollViewOrientation',
        ],
        types: ['ScrollViewProps'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['VerticalList'],
        types: ['VerticalListProps'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'Pager',
          'PagerPage',
          'PagerOrientation',
          'NavigationDirection',
          'usePagerPageLifecycle',
        ],
        types: [
          'PagerAnimationCompletedRequest',
          'PagerHandle',
          'PagerInitialFocusRequest',
          'PagerPageLifecycle',
          'PagerPageProps',
          'PagerProps',
        ],
      },
      {
        source: 'mrbd/ui/Carousel',
        values: [
          'Carousel',
          'CarouselVerticalAlignment',
          'CarouselIndicatorPlacement',
        ],
        types: [
          'CarouselHandle',
          'CarouselProps',
          'ProgressIndicatorCustomization',
        ],
      },
    ],
  },
  {
    title: 'Foundation - Utils',
    exports: [
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'generateSmoothRoundedRectPath',
          'getCachedSmoothRoundedRectPath',
          'clearPathCache',
        ],
        types: ['SmoothRoundedRectParams'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: [
          'FloatingPortalRootProvider',
          'useFloatingPortalRoot',
        ],
        types: ['FloatingPortalRootProviderProps'],
      },
    ],
  },
  {
    title: 'Meta Ray-Ban Display - UI',
    exports: [
      {
        source: 'mrbd/ui/Button',
        values: ['Button'],
        types: [
          'ButtonProps',
          'ButtonHandle',
          'ButtonActionTransitionOptions',
        ],
      },
      {
        source: 'mrbd/ui/IconTintColor',
        values: [
          'IconTintColor',
          'getIconTintCSSVariable',
          'getIconTintBlendMode',
        ],
      },
      {
        source: 'mrbd/ui/ButtonItemIconSize',
        values: ['ButtonItemIconSize'],
      },
      {
        source: 'mrbd/ui/TrailingTag',
        values: ['TrailingTag'],
      },
      {
        source: 'mrbd/ui/TimestampTextColor',
        values: [
          'TimestampTextColor',
          'getTimestampTextCSSVariable',
          'getTimestampTextBlendMode',
        ],
      },
      {
        source: 'mrbd/ui/Avatar',
        values: [
          'Avatar',
          'AvatarSize',
          'AvatarShape',
          'AvatarStyle',
          'PlaceholderStyle',
          'StatusIndicatorType',
        ],
        types: ['AvatarProps'],
      },
      {
        source: 'mrbd/ui/AppBadge',
        values: ['AppBadge'],
        types: ['AppBadgeProps'],
      },
      {
        source: 'mrbd/ui/NotificationBadge',
        values: ['NotificationBadge'],
        types: ['NotificationBadgeProps'],
      },
      {
        source: 'mrbd/ui/SliderBar',
        values: [
          'SliderBar',
          'SliderBarOrientation',
          'SliderBarState',
          'SliderBarSize',
        ],
        types: ['SliderBarProps'],
      },
      {
        source: 'mrbd/ui/Scrubber',
        values: [
          'Scrubber',
          'ScrubberTimestampPosition',
        ],
        types: ['ScrubberProps'],
      },
      {
        source: 'mrbd/ui/IndeterminateLoader',
        values: [
          'IndeterminateLoader',
          'IndeterminateLoaderSize',
        ],
        types: ['IndeterminateLoaderProps'],
      },
      {
        source: 'mrbd/ui/ProgressRing',
        values: [
          'ProgressRing',
          'ProgressRingSize',
        ],
        types: ['ProgressRingProps'],
      },
      {
        source: 'mrbd/ui/ReadMoreTextView',
        values: [
          'ReadMoreTextView',
          'DEFAULT_READ_MORE_TEXT_VIEW_MAX_LINES',
        ],
        types: [
          'ReadMoreTextViewHandle',
          'ReadMoreTextViewProps',
        ],
      },
      {
        source: 'mrbd/ui/InputTextView',
        values: [
          'InputTextView',
          'InputTextViewSize',
        ],
        types: [
          'InputTextViewInputProps',
          'InputTextViewProps',
        ],
      },
      {
        source: 'mrbd/ui/Divider',
        values: [
          'Divider',
          'DividerOrientation',
        ],
        types: ['DividerProps'],
      },
      {
        source: 'mrbd/ui/Switch',
        values: ['Switch'],
        types: ['SwitchProps'],
      },
      {
        source: 'mrbd/ui/RadioButton',
        values: ['RadioButton'],
        types: ['RadioButtonProps'],
      },
      {
        source: 'mrbd/ui/Toast',
        values: [
          'Toast',
          'ToastStyle',
          'ToastContainer',
          'useToast',
        ],
        types: [
          'ToastIdentifier',
          'ToastContainerProps',
        ],
      },
      {
        source: 'mrbd/ui/Scrim',
        values: [
          'Scrim',
          'ScrimPosition',
        ],
        types: ['ScrimProps'],
      },
      {
        source: 'mrbd/ui/ButtonGroup',
        values: [
          'ButtonGroup',
          'ButtonGroupAlignment',
        ],
        types: ['ButtonGroupProps'],
      },
      {
        source: 'mrbd/ui/ActionHint',
        values: ['ActionHint'],
        types: ['ActionHintProps'],
      },
      {
        source: 'mrbd/ui/CircularProgressBar',
        values: ['CircularProgressBar'],
        types: ['CircularProgressBarProps'],
      },
      {
        source: 'mrbd/ui/PaginationIndicator',
        values: ['PaginationIndicator'],
        types: ['PaginationIndicatorProps'],
      },
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['PaginationMode'],
      },
      {
        source: 'mrbd/ui/SwipeIndicator',
        values: [
          'SwipeIndicator',
          'SwipeDirection',
        ],
        types: [
          'SwipeIndicatorProps',
          'SwipeIndicatorHandle',
        ],
      },
      {
        source: 'mrbd/ui/SwipeToReveal',
        values: ['SwipeToReveal'],
        types: [
          'SwipeToRevealAction',
          'SwipeToRevealProps',
        ],
      },
      {
        source: 'mrbd/ui/TooltipContainer',
        values: ['TooltipContainer'],
        types: ['TooltipContainerProps'],
      },
      {
        source: 'mrbd/ui/ContextMenu',
        values: [
          'ContextMenu',
          'DismissReason',
        ],
        types: [
          'ContextMenuHandle',
          'ContextMenuProps',
        ],
      },
      {
        source: 'mrbd/ui/ContextMenuItemView',
        values: [
          'ContextMenuItemView',
          'ButtonContextMenuItemView',
          'EmojiContextMenuItemView',
        ],
        types: [
          'ContextMenuItemViewProps',
          'ButtonContextMenuItemViewProps',
          'EmojiContextMenuItemViewProps',
        ],
      },
      {
        source: 'mrbd/ui/VerticalMenu',
        values: [
          'VerticalMenu',
          'VerticalMenuCorner',
          'VerticalMenuDismissReason',
          'getVerticalMenuAnchorProps',
        ],
        types: [
          'VerticalMenuAnchorProps',
          'VerticalMenuProps',
        ],
      },
      {
        source: 'mrbd/ui/VerticalMenuButton',
        values: ['VerticalMenuButton'],
        types: ['VerticalMenuButtonProps'],
      },
      {
        source: 'mrbd/ui/SubNavigation',
        values: ['SubNavigation'],
        types: [
          'SubNavigationProps',
          'SubNavigationItem',
          'SubNavigationHandle',
        ],
      },
      {
        source: 'mrbd/ui/ControlTile',
        values: ['ControlTile'],
        types: ['ControlTileProps'],
      },
      {
        source: 'mrbd/ui/QuickReplyButton',
        values: ['QuickReplyButton'],
        types: ['QuickReplyButtonProps'],
      },
      {
        source: 'mrbd/ui/ContainerHeader',
        values: ['ContainerHeader'],
        types: ['ContainerHeaderProps'],
      },
      {
        source: 'mrbd/ui/IsolatedControl',
        values: ['IsolatedControl'],
        types: [
          'IsolatedControlHandle',
          'IsolatedControlProps',
        ],
      },
      {
        source: 'mrbd/ui/AppControlTile',
        values: ['AppControlTile'],
        types: ['AppControlTileProps'],
      },
      {
        source: 'mrbd/ui/WebAppIcon',
        values: ['WebAppIcon', 'createWebAppIconMaterial'],
        types: [
          'WebAppIconMaterialOptions',
          'WebAppIconMaterialRendering',
          'WebAppIconProps',
        ],
      },
      {
        source: 'mrbd/ui/VolumeIndicator',
        values: ['VolumeIndicator'],
        types: ['VolumeIndicatorProps'],
      },
      {
        source: 'mrbd/ui/ZoomIndicator',
        values: ['ZoomIndicator'],
        types: ['ZoomIndicatorProps'],
      },
      {
        source: 'mrbd/ui/ProgressIndicator',
        values: [
          'ProgressIndicator',
          'ProgressIndicatorSize',
        ],
        types: ['ProgressIndicatorProps'],
      },
      {
        source: 'mrbd/ui/ButtonDivider',
        values: ['ButtonDivider'],
        types: ['ButtonDividerProps'],
      },
      {
        source: 'mrbd/ui/Tag',
        values: ['Tag'],
        types: ['TagProps'],
      },
      {
        source: 'mrbd/ui/Chip',
        values: [
          'Chip',
          'ChipStyle',
          'ChipAvatarSize',
        ],
        types: ['ChipProps'],
      },
      {
        source: 'mrbd/ui/Header',
        values: [
          'Header',
          'HeaderAvatarSize',
        ],
        types: [
          'HeaderHandle',
          'HeaderProps',
        ],
      },
      {
        source: 'mrbd/ui/Tooltip',
        values: [
          'Tooltip',
          'useTooltip',
          'TooltipPosition',
        ],
        types: [
          'TooltipAnchorPoint',
          'TooltipAnchorRect',
          'TooltipCenterPositionProvider',
          'TooltipProps',
          'TooltipShowOptions',
          'TooltipState',
          'TooltipTargetRectProvider',
        ],
      },
      {
        source: 'mrbd/ui/ListItem',
        values: [
          'ListItem',
          'SubtitleTextColor',
          'TimestampPosition',
        ],
        types: [
          'ListItemProps',
          'StatusIndicator',
          'StatusIcon',
        ],
      },
      {
        source: 'mrbd/ui/ButtonRail',
        values: ['ButtonRail'],
        types: [
          'ButtonRailHandle',
          'ButtonRailProps',
        ],
      },
      {
        source: 'mrbd/ui/Page',
        values: ['Page'],
        types: [
          'PageHandle',
          'PageProps',
        ],
      },
      {
        source: 'mrbd/ui/Modal',
        values: [
          'Modal',
          'ModalContentMode',
          'ModalBannerSize',
          'ModalBannerTag',
        ],
        types: [
          'ModalProps',
          'ModalListItem',
        ],
      },
      {
        source: 'mrbd/ui/SubNavigationPager',
        values: ['SubNavigationPager'],
        types: ['SubNavigationPagerProps'],
      },
    ],
  },
  {
    title: 'Foundation - Text Appearance',
    exports: [
      {
        source: '@wearables-ui-toolkit/foundation',
        values: ['TextAppearance'],
        types: [
          'TextAppearanceKey',
          'TextAppearanceValue',
        ],
      },
    ],
  },
];

export const packageSubpathExports = [
  { subpath: 'ActionHint', source: 'mrbd/ui/ActionHint' },
  { subpath: 'App', source: 'mrbd/app/App' },
  { subpath: 'AppBadge', source: 'mrbd/ui/AppBadge' },
  { subpath: 'AppControlTile', source: 'mrbd/ui/AppControlTile' },
  { subpath: 'WebAppIcon', source: 'mrbd/ui/WebAppIcon' },
  { subpath: 'Avatar', source: 'mrbd/ui/Avatar' },
  { subpath: 'Button', source: 'mrbd/ui/Button' },
  { subpath: 'ButtonDivider', source: 'mrbd/ui/ButtonDivider' },
  { subpath: 'ButtonGroup', source: 'mrbd/ui/ButtonGroup' },
  { subpath: 'ButtonRail', source: 'mrbd/ui/ButtonRail' },
  { subpath: 'Card', source: '@wearables-ui-toolkit/foundation' },
  { subpath: 'CardStack', source: '@wearables-ui-toolkit/foundation' },
  { subpath: 'Carousel', source: 'mrbd/ui/Carousel' },
  { subpath: 'Chip', source: 'mrbd/ui/Chip' },
  { subpath: 'CircularProgressBar', source: 'mrbd/ui/CircularProgressBar' },
  { subpath: 'Container', source: '@wearables-ui-toolkit/foundation' },
  { subpath: 'ContainerHeader', source: 'mrbd/ui/ContainerHeader' },
  { subpath: 'ContextMenu', source: 'mrbd/ui/ContextMenu' },
  { subpath: 'ContextMenuItemView', source: 'mrbd/ui/ContextMenuItemView' },
  { subpath: 'ControlTile', source: 'mrbd/ui/ControlTile' },
  { subpath: 'Divider', source: 'mrbd/ui/Divider' },
  { subpath: 'Header', source: 'mrbd/ui/Header' },
  { subpath: 'IconImage', source: '@wearables-ui-toolkit/foundation' },
  {
    subpath: 'IconWithContainerMaterial',
    source: '@wearables-ui-toolkit/foundation',
  },
  { subpath: 'IndeterminateLoader', source: 'mrbd/ui/IndeterminateLoader' },
  { subpath: 'IsolatedControl', source: 'mrbd/ui/IsolatedControl' },
  { subpath: 'ListItem', source: 'mrbd/ui/ListItem' },
  { subpath: 'MediaWrapper', source: '@wearables-ui-toolkit/foundation' },
  { subpath: 'Modal', source: 'mrbd/ui/Modal' },
  { subpath: 'NotificationBadge', source: 'mrbd/ui/NotificationBadge' },
  { subpath: 'Page', source: 'mrbd/ui/Page' },
  { subpath: 'Pager', source: '@wearables-ui-toolkit/foundation' },
  { subpath: 'PaginationIndicator', source: 'mrbd/ui/PaginationIndicator' },
  { subpath: 'Panel', source: '@wearables-ui-toolkit/foundation' },
  { subpath: 'ProgressIndicator', source: 'mrbd/ui/ProgressIndicator' },
  { subpath: 'ProgressRing', source: 'mrbd/ui/ProgressRing' },
  { subpath: 'QuickReplyButton', source: 'mrbd/ui/QuickReplyButton' },
  { subpath: 'RadioButton', source: 'mrbd/ui/RadioButton' },
  { subpath: 'ReadMoreTextView', source: 'mrbd/ui/ReadMoreTextView' },
  { subpath: 'InputTextView', source: 'mrbd/ui/InputTextView' },
  { subpath: 'react-router', source: 'react-router/index' },
  { subpath: 'Scrubber', source: 'mrbd/ui/Scrubber' },
  { subpath: 'Scrim', source: 'mrbd/ui/Scrim' },
  { subpath: 'ScrollView', source: '@wearables-ui-toolkit/foundation' },
  { subpath: 'VerticalList', source: '@wearables-ui-toolkit/foundation' },
  { subpath: 'Shimmer', source: '@wearables-ui-toolkit/foundation' },
  { subpath: 'SliderBar', source: 'mrbd/ui/SliderBar' },
  { subpath: 'StaticContainer', source: '@wearables-ui-toolkit/foundation' },
  { subpath: 'SubNavigation', source: 'mrbd/ui/SubNavigation' },
  { subpath: 'SubNavigationPager', source: 'mrbd/ui/SubNavigationPager' },
  { subpath: 'Surface', source: '@wearables-ui-toolkit/foundation' },
  { subpath: 'SwipeIndicator', source: 'mrbd/ui/SwipeIndicator' },
  { subpath: 'SwipeToReveal', source: 'mrbd/ui/SwipeToReveal' },
  { subpath: 'Switch', source: 'mrbd/ui/Switch' },
  { subpath: 'Tag', source: 'mrbd/ui/Tag' },
  { subpath: 'TextSwitcher', source: '@wearables-ui-toolkit/foundation' },
  { subpath: 'TextView', source: '@wearables-ui-toolkit/foundation' },
  { subpath: 'Toast', source: 'mrbd/ui/Toast' },
  { subpath: 'Tooltip', source: 'mrbd/ui/Tooltip' },
  { subpath: 'TooltipContainer', source: 'mrbd/ui/TooltipContainer' },
  { subpath: 'VerticalMenu', source: 'mrbd/ui/VerticalMenu' },
  { subpath: 'VerticalMenuButton', source: 'mrbd/ui/VerticalMenuButton' },
  { subpath: 'Vignette', source: '@wearables-ui-toolkit/foundation' },
  { subpath: 'VolumeIndicator', source: 'mrbd/ui/VolumeIndicator' },
  { subpath: 'ZoomIndicator', source: 'mrbd/ui/ZoomIndicator' },
];
