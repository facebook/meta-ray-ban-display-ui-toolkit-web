/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';
import {
  App,
  PageTransition,
  PagerPage,
  useSpringAnimation,
  type PageTransitionInitialFocus,
} from '@wearables-ui-toolkit/mrbd';
import { AllAppsPage } from './AllAppsPage';
import { AppGridStylePage } from './AppGridStylePage';
import {
  APP_GRID_STYLE_LABELS,
  useAppGridStyle,
  type AppGridStyle,
} from './appGridStyle';
import { HomePage } from './HomePage';
import { LauncherAgentTools } from './LauncherAgentTools';
import { LauncherChrome } from './LauncherChrome';
import { LauncherPager } from './LauncherPager';
import {
  ALL_APPS_PAGE_INDEX,
  HOME_PAGE_INDEX,
  HOME_PANEL_PAGE_INDEX,
} from './launcherPages';
import { QuickSettingsPage } from './QuickSettingsPage';
import { SettingsPage } from './SettingsPage';
import { useLauncherState } from './launcherState';
import {
  applyQuickSettingsOverlayProgress,
  QUICK_SETTINGS_OVERLAY_SPRING,
} from './quickSettingsOverlay';
import { useLauncherNavigation } from './useLauncherNavigation';

export function LauncherExampleApp() {
  const launcher = useLauncherState();
  const [appGridStyle, setAppGridStyle] = useAppGridStyle();
  const viewportRef = useRef<HTMLElement>(null);
  const hasShownPreviousGridHintRef = useRef(false);
  const navigation = useLauncherNavigation({
    isPinningApps: launcher.isPinningApps,
    setAppPinningMode: launcher.setAppPinningMode,
  });
  const handleOverlayProgressChange = useCallback((value: number) => {
    if (viewportRef.current != null) {
      applyQuickSettingsOverlayProgress(viewportRef.current, value);
    }
  }, []);
  const handleOverlaySpringRest = useCallback((value: number) => {
    const viewport = viewportRef.current;
    if (viewport != null && value <= 0.01) {
      delete viewport.dataset.quickSettingsOverlayAnimating;
      delete viewport.dataset.quickSettingsVisualSlider;
      navigation.releaseSliderFocusLock();
    }
  }, [navigation.releaseSliderFocusLock]);
  const overlaySpring = useSpringAnimation({
    config: QUICK_SETTINGS_OVERLAY_SPRING,
    initialValue: 0,
    onChange: handleOverlayProgressChange,
    onRest: handleOverlaySpringRest,
  });
  const handleAppGridStyleChange = useCallback((style: AppGridStyle) => {
    setAppGridStyle(style);
    launcher.triggerAction(`App grid style: ${APP_GRID_STYLE_LABELS[style]}`);
  }, [launcher.triggerAction, setAppGridStyle]);
  const consumePreviousGridHint = useCallback(() => {
    if (hasShownPreviousGridHintRef.current) {
      return false;
    }
    hasShownPreviousGridHintRef.current = true;
    return true;
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (viewport != null && navigation.activeSliderId != null) {
      viewport.dataset.quickSettingsOverlayAnimating = 'true';
      viewport.dataset.quickSettingsVisualSlider = navigation.activeSliderId;
    }
    if (viewport != null) {
      applyQuickSettingsOverlayProgress(viewport, overlaySpring.getValue());
    }
    overlaySpring.setTarget(navigation.isSliderOverlayActive ? 1 : 0);
  }, [
    navigation.activeSliderId,
    navigation.isSliderOverlayActive,
    overlaySpring,
  ]);

  let initialFocus: PageTransitionInitialFocus = 'none';
  let transitionContent = (
    <main ref={viewportRef} className="launcherViewport">
      <LauncherPager
        ariaLabel="System launcher pages"
        className="launcherHorizontalPager"
        currentPageIndex={navigation.horizontalPageIndex}
        homeIndex={HOME_PAGE_INDEX}
        navigationLocked={
          (navigation.horizontalPageIndex === HOME_PAGE_INDEX &&
            navigation.verticalPageIndex !== HOME_PANEL_PAGE_INDEX) ||
          (navigation.horizontalPageIndex === ALL_APPS_PAGE_INDEX &&
            launcher.isPinningApps)
        }
        onPageChange={navigation.handleHorizontalPageChange}
        requestInitialFocusOnMount
      >
        <PagerPage>
          <QuickSettingsPage
            activeSliderId={navigation.activeSliderId}
            focusLockedSliderId={navigation.focusLockedSliderId}
            quickSettings={launcher.quickSettings}
            onAction={launcher.triggerAction}
            onActiveSliderChange={navigation.handleActiveSliderChange}
            onLaunchApp={launcher.launchApp}
            onOpenSettings={navigation.openSettings}
            onSetBrightness={launcher.setBrightness}
            onSetVolume={launcher.setVolume}
            onToggleAudioOnly={launcher.toggleAudioOnly}
            onToggleDoNotDisturb={launcher.toggleDoNotDisturb}
          />
        </PagerPage>
        <PagerPage>
          <HomePage
            cards={launcher.homeCards}
            currentPageIndex={navigation.verticalPageIndex}
            onPageChange={navigation.handleVerticalPageChange}
            onSelectCard={launcher.performHomeCardAction}
          />
        </PagerPage>
        <PagerPage>
          <AllAppsPage
            appGridStyle={appGridStyle}
            apps={launcher.apps}
            consumePreviousGridHint={consumePreviousGridHint}
            isActive={
              navigation.horizontalPageIndex === ALL_APPS_PAGE_INDEX
            }
            isPinningApps={launcher.isPinningApps}
            pinnedAppIds={launcher.pinnedAppIds}
            recentlyPinnedAppId={launcher.recentlyPinnedAppId}
            onLaunchApp={launcher.launchApp}
            onSetPinningMode={navigation.handlePinningModeChange}
            onTogglePinned={launcher.toggleAppPinned}
          />
        </PagerPage>
      </LauncherPager>
      <LauncherChrome
        allAppsStatusText={launcher.isPinningApps ? 'Manage pins' : undefined}
        horizontalPageIndex={navigation.horizontalPageIndex}
        isQuickSettingsSliderOverlayActive={navigation.isSliderOverlayActive}
        verticalPageIndex={navigation.verticalPageIndex}
      />
    </main>
  );

  if (navigation.activeDetailPage === 'settings') {
    initialFocus = {
      selector: '[data-uit-capture-id="launcher-app-grid-style-setting"]',
    };
    transitionContent = (
      <SettingsPage
        appGridStyle={appGridStyle}
        onOpenAppGridStyle={navigation.openAppGridStyle}
      />
    );
  } else if (navigation.activeDetailPage === 'appGridStyle') {
    initialFocus = { selector: '[data-uit-selected="true"]' };
    transitionContent = (
      <AppGridStylePage
        appGridStyle={appGridStyle}
        onChange={handleAppGridStyleChange}
      />
    );
  }

  return (
    <App className="launcherAppRoot">
      <LauncherAgentTools
        onAppGridStyleChange={handleAppGridStyleChange}
        onSetAppPinned={launcher.setAppPinned}
      />
      <PageTransition
        className="launcherPageTransition"
        direction={navigation.detailTransitionDirection}
        initialFocus={initialFocus}
        preservePageState
        transitionKey={navigation.activeDetailPage ?? 'launcher'}
      >
        {transitionContent}
      </PageTransition>
      <span className="srOnly" aria-live="polite">
        {launcher.lastAction}
      </span>
    </App>
  );
}
