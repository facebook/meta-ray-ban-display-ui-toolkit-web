/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';

export type QuickSettingsSliderId = 'volume' | 'brightness';

export type QuickSettingsOverlayStyle = CSSProperties & {
  '--quick-overlay-scrim-height'?: string;
  '--quick-overlay-scrim-left'?: string;
  '--quick-overlay-scrim-top'?: string;
  '--quick-overlay-scrim-width'?: string;
  '--quick-settings-scroll-origin-x'?: string;
  '--quick-settings-scroll-origin-y'?: string;
  '--quick-slider-brightness-origin-x'?: string;
  '--quick-slider-brightness-origin-y'?: string;
  '--quick-slider-volume-origin-x'?: string;
  '--quick-slider-volume-origin-y'?: string;
};

export const QUICK_SETTINGS_OVERLAY_SCALE = 0.91;
export const QUICK_SETTINGS_OVERLAY_SPRING = {
  stiffness: 150,
  damping: 16,
  mass: 1,
};
export const DEFAULT_QUICK_SETTINGS_OVERLAY_STYLE: QuickSettingsOverlayStyle = {
  '--quick-overlay-scrim-height': '100dvh',
  '--quick-overlay-scrim-left': '0px',
  '--quick-overlay-scrim-top': '-12dvh',
  '--quick-overlay-scrim-width': '100cqw',
  '--quick-settings-scroll-origin-x': '50%',
  '--quick-settings-scroll-origin-y': '50%',
  '--quick-slider-brightness-origin-x': '50%',
  '--quick-slider-brightness-origin-y': '50%',
  '--quick-slider-volume-origin-x': '50%',
  '--quick-slider-volume-origin-y': '50%',
};

interface OverlayElements {
  activeSliderId: QuickSettingsSliderId | null;
  scrollLayer: HTMLElement;
  sliderTiles: Record<QuickSettingsSliderId, HTMLElement>;
  statusBar: HTMLElement;
}

const elementCache = new WeakMap<HTMLElement, OverlayElements>();

function getElements(viewport: HTMLElement): OverlayElements | null {
  const cached = elementCache.get(viewport);
  if (
    cached != null &&
    cached.scrollLayer.isConnected &&
    cached.sliderTiles.volume.isConnected &&
    cached.sliderTiles.brightness.isConnected &&
    cached.statusBar.isConnected
  ) {
    return cached;
  }
  const scrollLayer = viewport.querySelector<HTMLElement>(
    '.quickSettingsScrollContainer',
  );
  const statusBar = viewport.querySelector<HTMLElement>('.launcherStatusBar');
  const volume = viewport.querySelector<HTMLElement>(
    ".quickSettingsSliderTile[data-slider-id='volume']",
  );
  const brightness = viewport.querySelector<HTMLElement>(
    ".quickSettingsSliderTile[data-slider-id='brightness']",
  );
  if (scrollLayer == null || statusBar == null || volume == null || brightness == null) {
    return null;
  }
  const elements: OverlayElements = {
    activeSliderId: null,
    scrollLayer,
    sliderTiles: { volume, brightness },
    statusBar,
  };
  elementCache.set(viewport, elements);
  return elements;
}

export function applyQuickSettingsOverlayProgress(
  viewport: HTMLElement,
  progress: number,
): void {
  const elements = getElements(viewport);
  if (elements == null) {
    return;
  }
  const activeSliderId =
    viewport.dataset.quickSettingsVisualSlider === 'volume' ||
      viewport.dataset.quickSettingsVisualSlider === 'brightness'
      ? viewport.dataset.quickSettingsVisualSlider
      : null;
  if (elements.activeSliderId !== activeSliderId) {
    if (elements.activeSliderId != null) {
      elements.sliderTiles[elements.activeSliderId].style.transform = 'scale(1)';
    }
    elements.activeSliderId = activeSliderId;
  }
  elements.statusBar.style.opacity = `${progress <= 0.5
    ? 1
    : Math.max(0.25, 0.25 + (1 - progress) * 1.5)}`;
  elements.scrollLayer.style.transform =
    `scale(${1 + (QUICK_SETTINGS_OVERLAY_SCALE - 1) * progress})`;
  if (activeSliderId != null) {
    elements.sliderTiles[activeSliderId].style.transform =
      `scale(${1 + (1 / QUICK_SETTINGS_OVERLAY_SCALE - 1) * progress})`;
  }
}
