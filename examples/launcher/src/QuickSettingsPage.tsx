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
  type KeyboardEvent,
} from 'react';
import {
  ControlTile,
  IconTintColor,
  MaterialLibrary,
  NavigationDirection,
  Panel,
  ScrollView,
  TextColor,
  TextStyle,
  TextView,
  usePagerPageLifecycle,
  type PagerInitialFocusRequest,
} from '@wearables-ui-toolkit/mrbd';
import type { AppId } from './launcherCatalog';
import { getLauncherApp } from './launcherCatalog';
import type { QuickSettingsState } from './launcherState';
import {
  ControlGlyph,
} from './ControlGlyph';
import {
  getBrightnessIconSource,
  getToggleIconSource,
  getVolumeIconSource,
  settingsIconSource,
} from './controlGlyphSources';
import { focusLauncherElement } from './launcherUtils';
import { QuickSettingsAppTile } from './QuickSettingsAppTile';
import {
  DEFAULT_QUICK_SETTINGS_OVERLAY_STYLE,
  QUICK_SETTINGS_OVERLAY_SCALE,
  type QuickSettingsOverlayStyle,
  type QuickSettingsSliderId,
} from './quickSettingsOverlay';
import './QuickSettingsPage.css';

const UNCHECKED_ICON_TINT = IconTintColor.PRIMARY;
const CHECKED_ICON_TINT = IconTintColor.ON_CHECKED;

export const QuickSettingsPage = memo(function QuickSettingsPage({
  activeSliderId,
  focusLockedSliderId,
  quickSettings,
  onAction,
  onActiveSliderChange,
  onLaunchApp,
  onOpenSettings,
  onSetBrightness,
  onSetVolume,
  onToggleAudioOnly,
  onToggleDoNotDisturb,
}: {
  activeSliderId: QuickSettingsSliderId | null;
  focusLockedSliderId: QuickSettingsSliderId | null;
  quickSettings: QuickSettingsState;
  onAction: (message: string) => void;
  onActiveSliderChange: (sliderId: QuickSettingsSliderId | null) => void;
  onLaunchApp: (id: AppId) => void;
  onOpenSettings: () => void;
  onSetBrightness: (value: number) => void;
  onSetVolume: (value: number) => void;
  onToggleAudioOnly: () => void;
  onToggleDoNotDisturb: () => void;
}) {
  const notesApp = getLauncherApp('notes');
  const cameraApp = getLauncherApp('camera');
  const soundscapeApp = getLauncherApp('soundscape');
  const panelRef = useRef<HTMLDivElement>(null);
  const scaleLayerRef = useRef<HTMLDivElement>(null);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const notesTileRef = useRef<HTMLDivElement>(null);
  const soundscapeTileRef = useRef<HTMLDivElement>(null);
  const volumeTileRef = useRef<HTMLDivElement>(null);
  const brightnessTileRef = useRef<HTMLDivElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const [panelBackgroundSize, setPanelBackgroundSize] = useState({
    height: 1,
    width: 1,
  });
  const [overlayStyle, setOverlayStyle] = useState<QuickSettingsOverlayStyle>(
    DEFAULT_QUICK_SETTINGS_OVERLAY_STYLE,
  );
  const audioOnlyCheckedMaterial = useMemo(
    () => MaterialLibrary.controlTileCheckedIcon(),
    [],
  );
  const doNotDisturbCheckedMaterial = useMemo(
    () => MaterialLibrary.controlTileCheckedIcon(),
    [],
  );
  const isSliderOverlayActive = activeSliderId != null;

  const recordFocusedElement = useCallback((target: EventTarget | null) => {
    if (
      target instanceof HTMLElement &&
      panelRef.current?.contains(target) === true
    ) {
      lastFocusedElementRef.current = target;
    }
  }, []);
  const focusElement = useCallback((element: HTMLElement | null) => {
    return panelRef.current?.contains(element) === true &&
      focusLauncherElement(element);
  }, []);
  const onRequestInitialFocus = useCallback((request: PagerInitialFocusRequest) => {
    if (
      request.direction === NavigationDirection.UP ||
      request.direction === NavigationDirection.DOWN ||
      request.direction === NavigationDirection.BACK
    ) {
      return true;
    }
    if (focusElement(lastFocusedElementRef.current)) {
      return true;
    }
    return focusElement(
      request.direction === NavigationDirection.RIGHT
        ? soundscapeTileRef.current
        : notesTileRef.current,
    );
  }, [focusElement]);
  const onWillHidePage = useCallback(() => {
    recordFocusedElement(document.activeElement);
    onActiveSliderChange(null);
  }, [onActiveSliderChange, recordFocusedElement]);
  usePagerPageLifecycle(useMemo(() => ({
    onRequestInitialFocus,
    onWillHidePage,
  }), [onRequestInitialFocus, onWillHidePage]));

  const updateOverlayLayout = (sliderId: QuickSettingsSliderId) => {
    const panel = panelRef.current;
    const scrollView = scrollViewRef.current;
    const contentLayer = scaleLayerRef.current;
    const viewport = panel?.closest<HTMLElement>('.launcherViewport');
    const firstTile = panel?.querySelector<HTMLElement>(
      '.quickSettingsGridItem:not(.quickSettingsHeaderItem)',
    );
    const lastTile = panel?.querySelector<HTMLElement>('.quickSettingsBottomSpacer');
    const activeTile = sliderId === 'volume'
      ? volumeTileRef.current
      : brightnessTileRef.current;
    if (
      scrollView == null || contentLayer == null || viewport == null ||
      firstTile == null || lastTile == null || activeTile == null
    ) {
      return;
    }
    const viewportRect = viewport.getBoundingClientRect();
    const scrollRect = scrollView.getBoundingClientRect();
    const contentRect = contentLayer.getBoundingClientRect();
    const firstTileRect = firstTile.getBoundingClientRect();
    const lastTileRect = lastTile.getBoundingClientRect();
    const activeTileRect = activeTile.getBoundingClientRect();
    const scrollOriginX = scrollRect.width / 2;
    const scrollOriginY = (
      firstTileRect.top - scrollRect.top +
      lastTileRect.bottom - scrollRect.top
    ) / 2;
    const pageOriginX = scrollRect.left + scrollOriginX;
    const pageOriginY = scrollRect.top + scrollOriginY;
    const scrimLeft = pageOriginX +
      (viewportRect.left - pageOriginX) / QUICK_SETTINGS_OVERLAY_SCALE;
    const scrimTop = pageOriginY +
      (viewportRect.top - pageOriginY) / QUICK_SETTINGS_OVERLAY_SCALE;

    setOverlayStyle(current => ({
      ...current,
      '--quick-overlay-scrim-height':
        `${viewportRect.height / QUICK_SETTINGS_OVERLAY_SCALE}px`,
      '--quick-overlay-scrim-left': `${scrimLeft - contentRect.left}px`,
      '--quick-overlay-scrim-top': `${scrimTop - contentRect.top}px`,
      '--quick-overlay-scrim-width':
        `${viewportRect.width / QUICK_SETTINGS_OVERLAY_SCALE}px`,
      '--quick-settings-scroll-origin-x': `${scrollOriginX}px`,
      '--quick-settings-scroll-origin-y': `${scrollOriginY}px`,
      [`--quick-slider-${sliderId}-origin-x`]:
        `${scrollRect.left - activeTileRect.left + scrollOriginX}px`,
      [`--quick-slider-${sliderId}-origin-y`]:
        `${scrollRect.top - activeTileRect.top + scrollRect.height / 2}px`,
    }));
  };
  const handleSliderClick = (sliderId: QuickSettingsSliderId) => {
    if (activeSliderId !== sliderId) {
      updateOverlayLayout(sliderId);
    }
    onActiveSliderChange(activeSliderId === sliderId ? null : sliderId);
  };
  const handleSliderKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    sliderId: QuickSettingsSliderId,
  ) => {
    if (activeSliderId !== sliderId) {
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  const restoreLockedSliderFocus = (sliderId: QuickSettingsSliderId) => {
    if (focusLockedSliderId !== sliderId) {
      return;
    }
    const tile = sliderId === 'volume'
      ? volumeTileRef.current
      : brightnessTileRef.current;
    if (tile != null && document.activeElement !== tile) {
      tile.focus({ preventScroll: true });
    }
  };
  useLayoutEffect(() => {
    const scaleLayer = scaleLayerRef.current;
    if (scaleLayer == null) {
      return;
    }
    // Panel materials rasterize at explicit dimensions, so keep the background
    // synchronized with this responsive content layer.
    const measure = () => {
      const width = Math.round(scaleLayer.getBoundingClientRect().width);
      const height = Math.ceil(scaleLayer.scrollHeight);
      if (width > 0 && height > 0) {
        setPanelBackgroundSize(current =>
          current.width === width && current.height === height
            ? current
            : { width, height },
        );
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scaleLayer);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="launcherPage quickSettingsPage"
      aria-label="Quick settings"
      onFocusCapture={event => recordFocusedElement(event.target)}
    >
      <div
        ref={panelRef}
        className="quickSettingsPanel"
        data-slider-overlay-active={isSliderOverlayActive ? 'true' : undefined}
        style={overlayStyle}
      >
        <ScrollView
          ref={scrollViewRef}
          ariaLabel="Quick settings"
          bottomFadingEdgeLength={64}
          className="quickSettingsScrollView"
          scrollContainerClassName="quickSettingsScrollContainer"
          height="100%"
          topFadingEdgeLength={64}
          width="100%"
        >
          <div ref={scaleLayerRef} className="quickSettingsScaleLayer">
            <Panel
              className="quickSettingsPanelBackground"
              height={panelBackgroundSize.height}
              width={panelBackgroundSize.width}
            />
            <div className="quickSettingsGrid">
              <div className="quickSettingsHeaderItem">
                <div className="quickSettingsHeader">
                  <ControlGlyph kind="glasses" />
                  <TextView as="span" textColor={TextColor.SECONDARY} textStyle={TextStyle.META2}>
                    100%
                  </TextView>
                  {quickSettings.doNotDisturb && <ControlGlyph kind="dnd-on" />}
                  {quickSettings.audioOnly && <ControlGlyph kind="audio-on" />}
                  <ControlGlyph kind="phone-off" />
                </div>
              </div>
              <div className="quickSettingsGridItem quickSettingsGridItemLeft">
                <div className="quickSettingsShortcutPair">
                  <QuickSettingsAppTile
                    ariaLabel="Notes"
                    className="quickSquareTile"
                    icon={notesApp.icon}
                    iconMaterialTheme={notesApp.materialTheme}
                    initialFocusEligible={false}
                    onClick={() => onAction('Notes')}
                    tileRef={notesTileRef}
                  />
                  <QuickSettingsAppTile
                    ariaLabel="Camera"
                    className="quickSquareTile"
                    icon={cameraApp.icon}
                    iconMaterialTheme={cameraApp.materialTheme}
                    initialFocusEligible={false}
                    onClick={() => onAction('Camera')}
                  />
                </div>
              </div>
              <div className="quickSettingsGridItem quickSettingsGridItemRight">
                <QuickSettingsAppTile
                  className="quickMusicTile"
                  icon={soundscapeApp.icon}
                  iconMaterialTheme={soundscapeApp.materialTheme}
                  onClick={() => onLaunchApp('soundscape')}
                  tileRef={soundscapeTileRef}
                  title="Soundscape"
                />
              </div>
              <div
                className="quickSettingsGridItem quickSettingsGridItemLeft quickSettingsSliderTile"
                data-slider-id="volume"
              >
                <ControlTile
                  animateProgressChanges
                  ref={volumeTileRef}
                  className="quickControlTile"
                  height="var(--launcher-tile-height)"
                  icon={getVolumeIconSource(quickSettings.volume)}
                  lockFocus={focusLockedSliderId === 'volume'}
                  onLockedFocusLost={() => restoreLockedSliderFocus('volume')}
                  onKeyDown={event => handleSliderKeyDown(event, 'volume')}
                  onClick={() => handleSliderClick('volume')}
                  onDecrement={value => onSetVolume(value - 0.1)}
                  onIncrement={value => onSetVolume(value + 0.1)}
                  progress={quickSettings.volume}
                  showCircularProgressBar={activeSliderId !== 'volume'}
                  showHorizontalProgressBar={activeSliderId === 'volume'}
                  title="Volume"
                  width="100%"
                />
              </div>
              <div
                className="quickSettingsGridItem quickSettingsGridItemRight quickSettingsSliderTile"
                data-slider-id="brightness"
              >
                <ControlTile
                  animateProgressChanges
                  ref={brightnessTileRef}
                  className="quickControlTile"
                  height="var(--launcher-tile-height)"
                  icon={getBrightnessIconSource(quickSettings.brightness)}
                  lockFocus={focusLockedSliderId === 'brightness'}
                  onLockedFocusLost={() => restoreLockedSliderFocus('brightness')}
                  onKeyDown={event => handleSliderKeyDown(event, 'brightness')}
                  onClick={() => handleSliderClick('brightness')}
                  onDecrement={value => onSetBrightness(value - 0.1)}
                  onIncrement={value => onSetBrightness(value + 0.1)}
                  progress={quickSettings.brightness}
                  showCircularProgressBar={activeSliderId !== 'brightness'}
                  showHorizontalProgressBar={activeSliderId === 'brightness'}
                  title="Brightness"
                  width="100%"
                />
              </div>
              <div className="quickSettingsGridItem quickSettingsGridItemLeft">
                <ControlTile
                  animateIconChanges
                  checkedIconContainerMaterial={audioOnlyCheckedMaterial}
                  checked={quickSettings.audioOnly}
                  className="quickControlTile"
                  height="var(--launcher-tile-height)"
                  iconAnimationKey={quickSettings.audioOnly ? 'audio-on' : 'audio-off'}
                  icon={getToggleIconSource('audio', quickSettings.audioOnly)}
                  iconTintColor={UNCHECKED_ICON_TINT}
                  checkedIconTintColor={CHECKED_ICON_TINT}
                  onClick={onToggleAudioOnly}
                  title="Audio only"
                  width="100%"
                />
              </div>
              <div className="quickSettingsGridItem quickSettingsGridItemRight">
                <ControlTile
                  animateIconChanges
                  checkedIconContainerMaterial={doNotDisturbCheckedMaterial}
                  checked={quickSettings.doNotDisturb}
                  className="quickControlTile"
                  height="var(--launcher-tile-height)"
                  iconAnimationKey={quickSettings.doNotDisturb ? 'dnd-on' : 'dnd-off'}
                  icon={getToggleIconSource('dnd', quickSettings.doNotDisturb)}
                  iconTintColor={UNCHECKED_ICON_TINT}
                  checkedIconTintColor={CHECKED_ICON_TINT}
                  onClick={onToggleDoNotDisturb}
                  title="Do not disturb"
                  width="100%"
                />
              </div>
              <div className="quickSettingsGridItem quickSettingsGridItemFull">
                <ControlTile
                  className="quickControlTile quickSettingsTile"
                  data-uit-capture-id="launcher-settings"
                  height="var(--launcher-tile-height)"
                  icon={settingsIconSource}
                  onClick={onOpenSettings}
                  title="Settings"
                  width="100%"
                />
              </div>
              <div className="quickSettingsBottomSpacer" aria-hidden="true" />
            </div>
            <div className="quickSettingsSliderOverlayScrim" aria-hidden="true" />
          </div>
        </ScrollView>
      </div>
    </section>
  );
});
