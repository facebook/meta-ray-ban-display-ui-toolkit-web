/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as PublicApi from '@wearables-ui-toolkit/mrbd';
import {
  AnimationDurations,
  RoundedRectangleShapeProvider,
  FloatingPortalRootProvider,
  Interpolators,
  SpringConfigs,
  TailShapeProvider,
  TextAppearance,
  createTransition,
  generateSmoothRoundedRectPath,
  getCachedSmoothRoundedRectPath,
  clearPathCache,
  useFloatingPortalRoot,
  type ShapePathParams,
  type ShapeProvider,
  type ShapeTailDirection,
  type StrokePathParams,
} from '@wearables-ui-toolkit/mrbd';

function PortalProbe() {
  const root = useFloatingPortalRoot();
  return <div data-testid="portal-root">{root?.dataset.testid ?? 'body'}</div>;
}

describe('public UI Toolkit for Meta Ray-Ban Display API exports', () => {
  it('exports smooth-corner path helpers from the package entrypoint', () => {
    clearPathCache();

    const path = generateSmoothRoundedRectPath({
      width: 120,
      height: 80,
      cornerRadius: 24,
      smoothing: 0.75,
    });

    expect(path).toMatch(/^M /);
    expect(path).toContain('C');
    expect(
      getCachedSmoothRoundedRectPath({
        width: 120,
        height: 80,
        cornerRadius: 24,
        smoothing: 0.75,
      }),
    ).toBe(path);
  });

  it('exports animation constants and transition helpers', () => {
    expect(AnimationDurations.CONTAINER_STATE_CHANGE).toBe(300);
    expect(Interpolators.CONTAINER_SCALE).toBe(
      'cubic-bezier(0.68, 0, 0.29, 1)',
    );
    expect(SpringConfigs.PROGRESS_VALUE).toEqual({
      stiffness: 150,
      damping: 18,
      mass: 1,
    });
    expect(createTransition('opacity', 250, Interpolators.TEXT_OPACITY, 50)).toBe(
      'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1) 50ms',
    );
  });

  it('exports material shape providers and their geometry contracts', () => {
    const fillParams: ShapePathParams = {
      width: 120,
      height: 80,
    };
    const provider: ShapeProvider = new RoundedRectangleShapeProvider();

    expect(provider.getShapePath(fillParams)).toMatch(/^M /);

    const direction: ShapeTailDirection = 'left';
    const strokeParams: StrokePathParams = {
      ...fillParams,
      strokeWidth: 2,
    };
    expect(new TailShapeProvider(direction).getStrokePath(strokeParams)).toMatch(
      /^M /,
    );
  });

  it('does not export raw palettes or a universal color-token object', () => {
    for (const unsupportedExport of [
      'Blue',
      'ColorToken',
      'Cyan',
      'Gray',
      'Green',
      'MaterialColors',
      'Orange',
      'Overlay',
      'Purple',
      'Red',
      'Slate',
      'Teal',
      'Utility',
    ]) {
      expect(PublicApi).not.toHaveProperty(unsupportedExport);
    }
  });

  it('exports text appearance class names for all text styles', () => {
    expect(TextAppearance).toEqual({
      NUMERAL1: 'uit-text-numeral1',
      NUMERAL2: 'uit-text-numeral2',
      DISPLAY1: 'uit-text-display1',
      HEADING1: 'uit-text-heading1',
      HEADING2: 'uit-text-heading2',
      BODY1: 'uit-text-body1',
      BODY1_EMPHASIZED: 'uit-text-body1-emphasized',
      BODY2: 'uit-text-body2',
      BODY2_EMPHASIZED: 'uit-text-body2-emphasized',
      LABEL: 'uit-text-label',
      LABEL_EMPHASIZED: 'uit-text-label-emphasized',
      META1: 'uit-text-meta1',
      META1_EMPHASIZED: 'uit-text-meta1-emphasized',
      META2: 'uit-text-meta2',
      META2_EMPHASIZED: 'uit-text-meta2-emphasized',
      META3: 'uit-text-meta3',
    });
  });

  it('resolves floating portal roots from scoped providers or document body', () => {
    const portalRoot = document.createElement('div');
    portalRoot.dataset.testid = 'scoped-root';

    const { rerender } = render(
      <FloatingPortalRootProvider root={portalRoot}>
        <PortalProbe />
      </FloatingPortalRootProvider>,
    );

    expect(screen.getByTestId('portal-root')).toHaveTextContent('scoped-root');

    rerender(<PortalProbe />);

    expect(screen.getByTestId('portal-root')).toHaveTextContent('body');
  });
});
