/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ReactRouterPageTransition,
} from '@wearables-ui-toolkit/mrbd/react-router';
import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { ActionsPage } from './pages/ActionsPage';
import { ContentPage } from './pages/ContentPage';
import { ControlsPage } from './pages/ControlsPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { HomePage } from './pages/HomePage';
import { ListsPage } from './pages/ListsPage';
import { NavigationPage } from './pages/NavigationPage';
import { StatusPage } from './pages/StatusPage';
import { SurfacesPage } from './pages/SurfacesPage';
import { ActionHintPage } from './pages/components/ActionHintPage';
import { AppBadgePage } from './pages/components/AppBadgePage';
import { AppControlTilePage } from './pages/components/AppControlTilePage';
import { AvatarPage } from './pages/components/AvatarPage';
import { ButtonGroupPage } from './pages/components/ButtonGroupPage';
import { ButtonPage } from './pages/components/ButtonPage';
import { ButtonRailPage } from './pages/components/ButtonRailPage';
import { CardPage } from './pages/components/CardPage';
import { CardStackPage } from './pages/components/CardStackPage';
import { CarouselPage } from './pages/components/CarouselPage';
import { ChipPage } from './pages/components/ChipPage';
import { CircularProgressBarPage } from './pages/components/CircularProgressBarPage';
import { ContainerHeaderPage } from './pages/components/ContainerHeaderPage';
import { ContainerPage } from './pages/components/ContainerPage';
import { ContextMenuPage } from './pages/components/ContextMenuPage';
import { ControlTilePage } from './pages/components/ControlTilePage';
import { HeaderPage } from './pages/components/HeaderPage';
import { IconImagePage } from './pages/components/IconImagePage';
import { IndeterminateLoaderPage } from './pages/components/IndeterminateLoaderPage';
import { InputTextViewPage } from './pages/components/InputTextViewPage';
import { IsolatedControlPage } from './pages/components/IsolatedControlPage';
import { ListItemPage } from './pages/components/ListItemPage';
import { MediaWrapperPage } from './pages/components/MediaWrapperPage';
import { ModalPage } from './pages/components/ModalPage';
import { NotificationBadgePage } from './pages/components/NotificationBadgePage';
import { PagerComponentPage } from './pages/components/PagerComponentPage';
import { PaginationIndicatorPage } from './pages/components/PaginationIndicatorPage';
import { PanelPage } from './pages/components/PanelPage';
import { ProgressIndicatorPage } from './pages/components/ProgressIndicatorPage';
import { ProgressRingPage } from './pages/components/ProgressRingPage';
import { QuickReplyButtonPage } from './pages/components/QuickReplyButtonPage';
import { RadioButtonPage } from './pages/components/RadioButtonPage';
import { ReadMoreTextViewPage } from './pages/components/ReadMoreTextViewPage';
import { ScrimPage } from './pages/components/ScrimPage';
import { ScrubberPage } from './pages/components/ScrubberPage';
import { ShimmerPage } from './pages/components/ShimmerPage';
import { SliderBarPage } from './pages/components/SliderBarPage';
import { StaticContainerPage } from './pages/components/StaticContainerPage';
import { SubNavigationPage } from './pages/components/SubNavigationPage';
import { SubNavigationPagerPage } from './pages/components/SubNavigationPagerPage';
import { SurfacePage } from './pages/components/SurfacePage';
import { SwipeIndicatorPage } from './pages/components/SwipeIndicatorPage';
import { SwipeToRevealPage } from './pages/components/SwipeToRevealPage';
import { SwitchPage } from './pages/components/SwitchPage';
import { TagPage } from './pages/components/TagPage';
import { TextSwitcherPage } from './pages/components/TextSwitcherPage';
import { TextViewPage } from './pages/components/TextViewPage';
import { ToastPage } from './pages/components/ToastPage';
import { TooltipPage } from './pages/components/TooltipPage';
import { VerticalListPage } from './pages/components/VerticalListPage';
import { VerticalMenuPage } from './pages/components/VerticalMenuPage';
import { VignettePage } from './pages/components/VignettePage';
import { WebAppIconPage } from './pages/components/WebAppIconPage';
import { VolumeIndicatorPage } from './pages/components/VolumeIndicatorPage';
import { ZoomIndicatorPage } from './pages/components/ZoomIndicatorPage';

export function GalleryRoutes() {
  return (
    <ReactRouterPageTransition className="gallery-route-viewport">
      {({ location }) => (
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/actions" element={<ActionsPage />} />
          <Route path="/actions/button" element={<ButtonPage />} />
          <Route path="/actions/button-group" element={<ButtonGroupPage />} />
          <Route path="/actions/button-rail" element={<ButtonRailPage />} />
          <Route path="/actions/quick-reply-button" element={<QuickReplyButtonPage />} />
          <Route path="/actions/chip" element={<ChipPage />} />
          <Route path="/actions/action-hint" element={<ActionHintPage />} />
          <Route path="/content" element={<ContentPage />} />
          <Route path="/content/text-view" element={<TextViewPage />} />
          <Route path="/content/avatar" element={<AvatarPage />} />
          <Route path="/content/app-badge" element={<AppBadgePage />} />
          <Route path="/content/notification-badge" element={<NotificationBadgePage />} />
          <Route path="/content/tag" element={<TagPage />} />
          <Route path="/content/container-header" element={<ContainerHeaderPage />} />
          <Route path="/content/read-more-text-view" element={<ReadMoreTextViewPage />} />
          <Route path="/content/text-switcher" element={<TextSwitcherPage />} />
          <Route path="/content/icon-image" element={<IconImagePage />} />
          <Route path="/content/web-app-icon" element={<WebAppIconPage />} />
          <Route path="/controls" element={<ControlsPage />} />
          <Route path="/controls/switch" element={<SwitchPage />} />
          <Route path="/controls/radio-button" element={<RadioButtonPage />} />
          <Route path="/controls/slider-bar" element={<SliderBarPage />} />
          <Route path="/controls/scrubber" element={<ScrubberPage />} />
          <Route path="/controls/input-text-view" element={<InputTextViewPage />} />
          <Route path="/controls/isolated-control" element={<IsolatedControlPage />} />
          <Route path="/controls/control-tile" element={<ControlTilePage />} />
          <Route path="/controls/app-control-tile" element={<AppControlTilePage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/feedback/toast" element={<ToastPage />} />
          <Route path="/feedback/tooltip" element={<TooltipPage />} />
          <Route path="/feedback/modal" element={<ModalPage />} />
          <Route path="/feedback/context-menu" element={<ContextMenuPage />} />
          <Route path="/feedback/scrim" element={<ScrimPage />} />
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/lists/list-item" element={<ListItemPage />} />
          <Route path="/lists/vertical-list" element={<VerticalListPage />} />
          <Route path="/lists/swipe-to-reveal" element={<SwipeToRevealPage />} />
          <Route path="/lists/vertical-menu" element={<VerticalMenuPage />} />
          <Route path="/navigation" element={<NavigationPage />} />
          <Route path="/navigation/header" element={<HeaderPage />} />
          <Route path="/navigation/sub-navigation" element={<SubNavigationPage />} />
          <Route path="/navigation/sub-navigation-pager" element={<SubNavigationPagerPage />} />
          <Route path="/navigation/pager" element={<PagerComponentPage />} />
          <Route path="/navigation/pagination-indicator" element={<PaginationIndicatorPage />} />
          <Route path="/navigation/swipe-indicator" element={<SwipeIndicatorPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/status/progress-indicator" element={<ProgressIndicatorPage />} />
          <Route path="/status/progress-ring" element={<ProgressRingPage />} />
          <Route path="/status/circular-progress-bar" element={<CircularProgressBarPage />} />
          <Route path="/status/indeterminate-loader" element={<IndeterminateLoaderPage />} />
          <Route path="/status/shimmer" element={<ShimmerPage />} />
          <Route path="/status/volume-indicator" element={<VolumeIndicatorPage />} />
          <Route path="/status/zoom-indicator" element={<ZoomIndicatorPage />} />
          <Route path="/surfaces" element={<SurfacesPage />} />
          <Route path="/surfaces/panel" element={<PanelPage />} />
          <Route path="/surfaces/static-container" element={<StaticContainerPage />} />
          <Route path="/surfaces/container" element={<ContainerPage />} />
          <Route path="/surfaces/surface" element={<SurfacePage />} />
          <Route path="/surfaces/card" element={<CardPage />} />
          <Route path="/surfaces/card-stack" element={<CardStackPage />} />
          <Route path="/surfaces/carousel" element={<CarouselPage />} />
          <Route path="/surfaces/media-wrapper" element={<MediaWrapperPage />} />
          <Route path="/surfaces/vignette" element={<VignettePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </ReactRouterPageTransition>
  );
}
