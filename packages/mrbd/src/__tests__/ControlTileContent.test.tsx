/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  act,
  render,
  screen,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import { ControlTileContent } from '../mrbd/ui/private/ControlTileContent';
import {
  CONTROL_TILE_DEFAULT_TITLE_MAX_LINES,
  CONTROL_TILE_ICON_SIZE_LARGE,
  CONTROL_TILE_ICON_SIZE_MEDIUM,
} from '../mrbd/ui/private/ControlTileMetrics';
import { SliderBarState } from '../mrbd/ui/SliderBar';

const TEST_ICON_SRC = '/icons/test-icon.svg';
const FIRST_ICON_SRC = '/icons/first-icon.svg';
const SECOND_ICON_SRC = '/icons/second-icon.svg';
const TEST_ICON: IconSource = { uri: TEST_ICON_SRC };
const FIRST_ICON: IconSource = { uri: FIRST_ICON_SRC };
const SECOND_ICON: IconSource = { uri: SECOND_ICON_SRC };

function getIconMaskSpan(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>(
    '[class*="iconImageView"] [style*="mask-image"]',
  );
}

function createContent(overrides = {}) {
  return (
    <ControlTileContent
      title="Brightness"
      titleMaxLines={CONTROL_TILE_DEFAULT_TITLE_MAX_LINES}
      icon={TEST_ICON}
      progress={0.5}
      showCircularProgress={false}
      showHorizontalProgress={false}
      iconBackgroundStyle={{ opacity: 1 }}
      iconSize={CONTROL_TILE_ICON_SIZE_LARGE}
      iconScale={1}
      sliderBarState={SliderBarState.IDLE}
      {...overrides}
    />
  );
}

function renderContent(overrides = {}) {
  return render(createContent(overrides));
}

describe('ControlTileContent', () => {
  it('renders the title and large icon in the default tile body', () => {
    const { container } = renderContent();

    expect(screen.getByText('Brightness')).toBeInTheDocument();
    const iconMask = getIconMaskSpan(container);
    expect(iconMask).toBeTruthy();
    expect(iconMask?.getAttribute('style')).toContain(
      `mask-image: url("${TEST_ICON_SRC}")`,
    );
    const iconView = container.querySelector('[class*="iconImageView"]');
    expect(iconView?.getAttribute('style')).toContain(
      `width: ${CONTROL_TILE_ICON_SIZE_LARGE}px`,
    );
  });

  it('replaces the title with the horizontal slider when horizontal progress is shown', () => {
    const { container } = renderContent({
      showHorizontalProgress: true,
      iconSize: CONTROL_TILE_ICON_SIZE_MEDIUM,
      iconScale: 1.099,
      sliderBarState: SliderBarState.FOCUSED,
    });

    expect(screen.getByText('Brightness')).toHaveStyle({
      opacity: '0',
      pointerEvents: 'none',
    });
    expect(container.querySelector('[class*="sliderBarContainer"]')).not.toBeNull();
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '0.5');
  });

  it('keeps horizontal progress accessible when title is omitted', () => {
    renderContent({
      title: undefined,
      showHorizontalProgress: true,
      iconSize: CONTROL_TILE_ICON_SIZE_MEDIUM,
    });

    expect(screen.getByRole('slider', { name: 'Progress' })).toHaveAttribute(
      'aria-valuenow',
      '0.5',
    );
  });

  it('hides the inactive circular progressbar from assistive tech in horizontal mode', () => {
    renderContent({
      showHorizontalProgress: true,
      iconSize: CONTROL_TILE_ICON_SIZE_MEDIUM,
      iconScale: 1.099,
      sliderBarState: SliderBarState.FOCUSED,
    });

    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('hides the inactive horizontal slider from assistive tech in circular mode', () => {
    renderContent({
      showCircularProgress: true,
      iconSize: CONTROL_TILE_ICON_SIZE_MEDIUM,
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('slider')).toBeNull();
  });

  it('snaps progress visibility changes when animation is disabled', () => {
    const requestFrameSpy = vi.spyOn(window, 'requestAnimationFrame');
    const { rerender } = renderContent();

    requestFrameSpy.mockClear();
    rerender(createContent({
      showHorizontalProgress: true,
      iconSize: CONTROL_TILE_ICON_SIZE_MEDIUM,
      iconScale: 1.099,
    }));

    expect(requestFrameSpy).not.toHaveBeenCalled();
    expect(screen.getByText('Brightness')).toHaveStyle({
      opacity: '0',
      pointerEvents: 'none',
    });
    requestFrameSpy.mockRestore();
  });

  it('keeps the title visible while circular progress wraps the icon', () => {
    const { container } = renderContent({
      showCircularProgress: true,
      iconSize: CONTROL_TILE_ICON_SIZE_MEDIUM,
    });

    expect(screen.getByText('Brightness')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    expect(container.querySelector('[class*="circularProgressWrapper"]')).not.toBeNull();
  });

  it('sizes the rendered icon to fill the icon slot', () => {
    const { container } = renderContent({
      iconSize: CONTROL_TILE_ICON_SIZE_MEDIUM,
    });

    const iconMask = getIconMaskSpan(container);
    expect(iconMask).toBeTruthy();
    // The icon fills its slot via the IconImage `fill` class (so component CSS can
    // size the slot); sizing is no longer an overriding inline style.
    expect(iconMask?.className).toContain('fill');
  });

  it('uses the documented icon swap fade and scale when the icon key changes', () => {
    vi.useFakeTimers();
    try {
      const { container, rerender } = renderContent({
        animateIconChanges: true,
        icon: FIRST_ICON,
        iconAnimationKey: 'first',
      });
      const iconView = container.querySelector('[class*="iconImageView"]');

      rerender(createContent({
        animateIconChanges: true,
        icon: SECOND_ICON,
        iconAnimationKey: 'second',
      }));

      expect(getIconMaskSpan(container)?.getAttribute('style')).toContain(
        `mask-image: url("${FIRST_ICON_SRC}")`,
      );

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(getIconMaskSpan(container)?.getAttribute('style')).toContain(
        `mask-image: url("${FIRST_ICON_SRC}")`,
      );
      expect(Number((iconView as HTMLElement).style.opacity)).toBeLessThan(1);
      expect((iconView as HTMLElement).style.transform).not.toBe('scale(1)');

      act(() => {
        vi.advanceTimersByTime(120);
      });

      expect(getIconMaskSpan(container)?.getAttribute('style')).toContain(
        `mask-image: url("${SECOND_ICON_SRC}")`,
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(iconView?.getAttribute('style')).toContain('opacity: 1');
      expect(iconView?.getAttribute('style')).toContain('scale(1)');
    } finally {
      vi.useRealTimers();
    }
  });
});
