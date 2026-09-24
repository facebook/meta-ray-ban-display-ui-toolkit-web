/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Container,
  CornerRadius,
  RoundedRectangleShapeProvider,
  State,
  TextStyle,
  TextView,
  type ContainerProps,
} from '@wearables-ui-toolkit/mrbd';
import type { AppId, LauncherApp } from './launcherCatalog';
import { PinGlyph } from './ControlGlyph';
import {
  LauncherIconMaterial,
} from './LauncherIcon';
import {
  getLauncherAppTileAnimationValues,
  getLauncherAppTileInteractionProgress,
  getLauncherAppTilePinProgress,
  interpolateLauncherAppTileAnimationValues,
  launcherAppTileAnimationValuesEqual,
  type LauncherAppTileAnimationValues,
} from './launcherAppTileAnimation';
import { createLauncherTileMaterial } from './appTileMaterials';
import { usePrefersReducedMotion } from './launcherUtils';

const PIN_TOGGLE_DURATION_MS = 200;
const LAUNCHER_APP_TILE_SHAPE_PROVIDER = new RoundedRectangleShapeProvider(
  CornerRadius.MEDIUM,
);

export const LauncherAppTile = memo(function LauncherAppTile({
  app,
  isPinned,
  isPinningMode,
  onLaunch,
  onTogglePinned,
}: {
  app: LauncherApp;
  isPinned: boolean;
  isPinningMode: boolean;
  onLaunch: (id: AppId) => void;
  onTogglePinned: (id: AppId) => void;
}) {
  const material = useMemo(
    () => createLauncherTileMaterial(app.materialTheme),
    [app.materialTheme],
  );
  const prefersReducedMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const interactionStateRef = useRef<State>(State.DEFAULT);
  const animatedValuesRef = useRef(
    getLauncherAppTileAnimationValues(State.DEFAULT, isPinningMode, isPinned),
  );

  const applyValues = useCallback((values: LauncherAppTileAnimationValues) => {
    animatedValuesRef.current = values;
    const root = ref.current;
    if (root == null) {
      return;
    }
    root.style.setProperty('--launcher-app-icon-material-opacity', `${values.iconMaterialOpacity}`);
    root.style.setProperty('--launcher-app-icon-scale', `${values.iconScale}`);
    root.style.setProperty('--launcher-app-pin-background-progress', `${values.pinBackgroundProgress}`);
    root.style.setProperty('--launcher-app-pin-container-opacity', `${values.pinContainerOpacity}`);
    root.style.setProperty('--launcher-app-pin-icon-opacity', `${values.pinIconOpacity}`);
    root.style.setProperty('--launcher-app-pin-icon-scale', `${values.pinIconScale}`);
    root.style.setProperty('--launcher-app-title-translation-x', `${values.titleTranslationX}px`);
  }, []);

  // Share Container's interaction timeline so the icon, title, and material
  // remain synchronized with the toolkit focus and press transitions.
  const stateChangeAnimations = useMemo<
    NonNullable<ContainerProps['stateChangeAnimations']>
  >(() => ({ prevInteraction, newInteraction, animated, transition }) => {
    const start = animatedValuesRef.current;
    interactionStateRef.current = newInteraction.state;
    const target = getLauncherAppTileAnimationValues(
      newInteraction.state,
      isPinningMode,
      isPinned,
    );
    if (
      prefersReducedMotion ||
      !animated ||
      launcherAppTileAnimationValuesEqual(start, target)
    ) {
      applyValues(target);
      return [];
    }
    return [{
      duration: transition.duration,
      onFrame: (_elapsedMs, progress) => applyValues(
        interpolateLauncherAppTileAnimationValues(
        start,
        target,
        getLauncherAppTileInteractionProgress(
          prevInteraction.state,
          newInteraction.state,
          progress,
        ),
      )),
      onComplete: () => applyValues(target),
    }];
  }, [applyValues, isPinned, isPinningMode, prefersReducedMotion]);

  useEffect(() => () => {
    if (animationFrameRef.current != null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  useEffect(() => {
    // Pinning is app state rather than Container interaction state, so it uses
    // a short independent transition between the same animation values.
    const start = animatedValuesRef.current;
    const target = getLauncherAppTileAnimationValues(
      interactionStateRef.current,
      isPinningMode,
      isPinned,
    );
    if (animationFrameRef.current != null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (
      prefersReducedMotion ||
      launcherAppTileAnimationValuesEqual(start, target)
    ) {
      applyValues(target);
      return;
    }
    const startTime = window.performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / PIN_TOGGLE_DURATION_MS, 1);
      const eased = getLauncherAppTilePinProgress(progress);
      applyValues(interpolateLauncherAppTileAnimationValues(
        start,
        target,
        eased,
      ));
      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
        applyValues(target);
      }
    };
    animationFrameRef.current = window.requestAnimationFrame(animate);
  }, [applyValues, isPinned, isPinningMode, prefersReducedMotion]);

  return (
    <Container
      ref={ref}
      className="launcherAppTile"
      height="var(--launcher-tile-height)"
      material={material}
      shapeProvider={LAUNCHER_APP_TILE_SHAPE_PROVIDER}
      stateChangeAnimations={stateChangeAnimations}
      onClick={() => isPinningMode
        ? onTogglePinned(app.id)
        : onLaunch(app.id)}
      role="button"
      width="100%"
      aria-label={app.title}
      aria-pressed={isPinningMode ? isPinned : undefined}
      data-uit-capture-id={`launcher-app-${app.id}`}
    >
      <div className="launcherAppTileContent">
        <LauncherIconMaterial
          className="launcherAppTileIconMaterial"
          icon={app.icon}
          iconClassName="launcherAppTileIcon"
          materialTheme={app.materialTheme}
        />
        <TextView
          as="span"
          className="launcherAppTileTitle"
          textStyle={TextStyle.LABEL_EMPHASIZED}
        >
          {app.title}
        </TextView>
      </div>
      <div className="launcherAppPinBadge" aria-hidden="true">
        <div className="launcherAppPinBadgeBase" />
        <div className="launcherAppPinBadgeSelected" />
        <PinGlyph className="launcherAppPinIcon" />
      </div>
    </Container>
  );
});
