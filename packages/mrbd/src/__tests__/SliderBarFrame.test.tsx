/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SliderBarFrame } from '../mrbd/ui/private/SliderBarFrame';

describe('SliderBarFrame', () => {
  it('renders the slider frame with track and fill', () => {
    const { container } = render(
      <SliderBarFrame
        className="slider"
        style={{ height: 8 }}
        isInteractive
        clampedValue={0.5}
        minimumValue={0}
        maximumValue={1}
        accessibilityLabel="50%"
        accessibilityValueText="50%"
        disabled={false}
        fillStyle={{ width: '50%' }}
        onKeyDown={() => {}}
      />,
    );

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '0.5');
    expect(screen.getByRole('slider')).toHaveAttribute('tabindex', '0');
    expect(container.querySelector('[class*="track"]')).not.toBeNull();
    expect(container.querySelector('[class*="fill"]')).not.toBeNull();
  });

  it('keeps a zero-width fill mounted and stays display-only without interaction', () => {
    const { container } = render(
      <SliderBarFrame
        className="slider"
        style={{}}
        isInteractive={false}
        clampedValue={0}
        minimumValue={0}
        maximumValue={1}
        accessibilityLabel="0%"
        accessibilityValueText="0%"
        disabled={false}
        fillStyle={{ width: '0%' }}
        onKeyDown={() => {}}
      />,
    );

    // Non-interactive exposes a progressbar with no tab stop, not a slider.
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('tabindex');
    expect(container.querySelector('[class*="fill"]')).toHaveStyle({ width: '0%' });
  });

  it('renders role="progressbar" with range info when non-interactive', () => {
    render(
      <SliderBarFrame
        className="slider"
        style={{}}
        isInteractive={false}
        clampedValue={0.5}
        minimumValue={0}
        maximumValue={1}
        accessibilityLabel="50%"
        accessibilityValueText="50%"
        disabled={false}
        fillStyle={{ width: '50%' }}
        onKeyDown={() => {}}
      />,
    );

    expect(screen.queryByRole('slider')).toBeNull();
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0.5');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '1');
    // The percentage is exposed as aria-valuetext so AT announces "50%" on the
    // non-interactive progressbar.
    expect(progressbar).toHaveAttribute('aria-valuetext', '50%');
  });

  it('renders role="slider" with range info when interactive', () => {
    render(
      <SliderBarFrame
        className="slider"
        style={{}}
        isInteractive
        clampedValue={0.5}
        minimumValue={0}
        maximumValue={1}
        accessibilityLabel="50%"
        accessibilityValueText="50%"
        disabled={false}
        fillStyle={{ width: '50%' }}
        onKeyDown={() => {}}
      />,
    );

    expect(screen.queryByRole('progressbar')).toBeNull();
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '0.5');
    expect(slider).toHaveAttribute('tabindex', '0');
  });

  it('forwards keyboard events when interactive', () => {
    const onKeyDown = vi.fn();
    render(
      <SliderBarFrame
        className="slider"
        style={{}}
        isInteractive
        clampedValue={0.5}
        minimumValue={0}
        maximumValue={1}
        accessibilityLabel="50%"
        accessibilityValueText="50%"
        disabled={false}
        fillStyle={{ width: '50%' }}
        onKeyDown={onKeyDown}
      />,
    );

    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });
});
