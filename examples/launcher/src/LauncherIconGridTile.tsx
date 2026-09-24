/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo, useCallback, useMemo, useRef } from 'react';
import {
  Container,
  State,
  TextStyle,
  TextView,
  type ContainerProps,
} from '@wearables-ui-toolkit/mrbd';
import {
  createLauncherWebAppIconMaterial,
} from './appTileMaterials';
import { createLauncherArtworkSource } from './appIcons';
import type { AppId, LauncherApp } from './launcherCatalog';
import { PinGlyph } from './ControlGlyph';
import { getLauncherAppTileInteractionProgress } from './launcherAppTileAnimation';

const ICON_SURFACE_SIZE = 112;
const ICON_SURFACE_REST_SCALE = 88 / ICON_SURFACE_SIZE;
const iconGridScaleForState = (state: typeof State[keyof typeof State]) =>
  state === State.FOCUSED ? 1 : ICON_SURFACE_REST_SCALE;

export const LauncherIconGridTile = memo(function LauncherIconGridTile({
  app,
  isPinned,
  isPinningMode,
  itemCount,
  itemPosition,
  onLaunch,
  onTogglePinned,
}: {
  app: LauncherApp;
  isPinned: boolean;
  isPinningMode: boolean;
  itemCount: number;
  itemPosition: number;
  onLaunch: (id: AppId) => void;
  onTogglePinned: (id: AppId) => void;
}) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const labelOffsetRef = useRef(0);
  const rendering = useMemo(
    () => createLauncherWebAppIconMaterial(
      app.materialTheme,
      createLauncherArtworkSource(app.icon),
    ),
    [app.icon, app.materialTheme],
  );
  const applyLabelOffset = useCallback((offset: number) => {
    labelOffsetRef.current = offset;
    if (labelRef.current != null) {
      labelRef.current.style.transform = `translateY(${offset}px)`;
    }
  }, []);
  const stateChangeAnimations = useMemo<
    NonNullable<ContainerProps['stateChangeAnimations']>
  >(() => ({ prevInteraction, newInteraction, animated, transition }) => {
    const start = labelOffsetRef.current;
    const target = newInteraction.state === State.FOCUSED ? 4 : 0;
    if (!animated || Math.abs(start - target) < 0.001) {
      applyLabelOffset(target);
      return [];
    }
    return [{
      duration: transition.duration,
      onFrame: (_elapsedMs, progress) => {
        const easedProgress = getLauncherAppTileInteractionProgress(
          prevInteraction.state,
          newInteraction.state,
          progress,
        );
        applyLabelOffset(start + (target - start) * easedProgress);
      },
      onComplete: () => applyLabelOffset(target),
    }];
  }, [applyLabelOffset]);

  return (
    <div className="launcherIconGridTile">
      <div className="launcherIconGridSurface">
        <Container
          aria-label={`${app.title}, ${itemPosition} of ${itemCount}`}
          aria-pressed={isPinningMode ? isPinned : undefined}
          className="launcherIconGridMaterialSurface"
          clipContent={false}
          contentScaleForStateFn={iconGridScaleForState}
          data-uit-capture-id={`launcher-app-${app.id}`}
          height={ICON_SURFACE_SIZE}
          material={rendering.material}
          onClick={() => isPinningMode
            ? onTogglePinned(app.id)
            : onLaunch(app.id)}
          role="button"
          shapeProvider={rendering.shapeProvider}
          stateChangeAnimations={stateChangeAnimations}
          width={ICON_SURFACE_SIZE}
        >
          {isPinningMode && isPinned && (
            <span
              aria-hidden="true"
              className="launcherIconGridPinBadge"
            >
              <PinGlyph className="launcherIconGridPinGlyph" />
            </span>
          )}
        </Container>
      </div>
      <TextView
        ref={labelRef}
        as="span"
        className="launcherIconGridTitle"
        textStyle={TextStyle.META3}
      >
        {app.title}
      </TextView>
    </div>
  );
});
