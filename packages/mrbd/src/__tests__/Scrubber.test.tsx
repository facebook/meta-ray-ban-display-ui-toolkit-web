/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../mrbd/app/App';
import {
  Scrubber,
  ScrubberTimestampPosition,
} from '../mrbd/ui/Scrubber';
import {
  formatScrubberTime,
  getScrubberPointerValue,
} from '../mrbd/ui/private/ScrubberLayout';

describe('Scrubber', () => {
  it('renders a clamped slider value and duration-aware accessible text', () => {
    render(<Scrubber value={125} durationSeconds={3661} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '100');
    expect(slider).toHaveAttribute('aria-valuetext', '1:01:01 of 1:01:01');
    expect(slider).toHaveTextContent('1:01:01');
    expect(slider.style.getPropertyValue('--uit-scrubber-offset')).toBe('100cqw');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('removes a disabled scrubber from sequential focus navigation', () => {
    const { container } = render(
      <App>
        <Scrubber value={25} disabled showTooltip />
      </App>,
    );

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-disabled', 'true');
    expect(slider).toHaveAttribute('tabindex', '-1');
    fireEvent.focus(slider);
    expect(slider).toHaveAttribute('data-focused', 'false');
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
    expect(container.querySelector('[class*="scrim"]')).toHaveAttribute(
      'data-active',
      'false',
    );
  });

  it('omits timestamps for a zero duration and formats percentage tooltip text', () => {
    const { container } = render(
      <App>
        <Scrubber
          value={42}
          showTooltip
          timestampPosition={ScrubberTimestampPosition.TOP}
        />
      </App>,
    );

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '42%');
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
    fireEvent.focus(screen.getByRole('slider'));
    expect(container.querySelector('[role="tooltip"]')).toHaveTextContent('42%');
    expect(container.querySelector('[class*="timestamps"]')).toBeNull();
  });

  it('emits continuous and committed callbacks for each changed keyboard step', () => {
    const onValueChange = vi.fn();
    const onValueChanged = vi.fn();
    render(
      <Scrubber
        value={50}
        onValueChange={onValueChange}
        onValueChanged={onValueChanged}
      />,
    );
    const slider = screen.getByRole('slider');

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyDown(slider, { key: 'ArrowRight', shiftKey: true });
    expect(onValueChange).toHaveBeenNthCalledWith(1, 51);
    expect(onValueChange).toHaveBeenNthCalledWith(2, 56);
    expect(onValueChanged).toHaveBeenNthCalledWith(1, 51);
    expect(onValueChanged).toHaveBeenNthCalledWith(2, 56);

    fireEvent.keyUp(slider, { key: 'ArrowRight' });
    expect(onValueChanged).toHaveBeenCalledTimes(2);
  });

  it('moves to the range boundaries with Home and End', () => {
    const onValueChange = vi.fn();
    const onValueChanged = vi.fn();
    render(
      <Scrubber
        value={50}
        onValueChange={onValueChange}
        onValueChanged={onValueChanged}
      />,
    );
    const slider = screen.getByRole('slider');

    fireEvent.keyDown(slider, { key: 'Home' });
    fireEvent.keyDown(slider, { key: 'End' });

    expect(onValueChange).toHaveBeenNthCalledWith(1, 0);
    expect(onValueChange).toHaveBeenNthCalledWith(2, 100);
    expect(onValueChanged).toHaveBeenNthCalledWith(1, 0);
    expect(onValueChanged).toHaveBeenNthCalledWith(2, 100);
  });

  it('consumes a boundary key without emitting a redundant value', () => {
    const onValueChange = vi.fn();
    const onValueChanged = vi.fn();
    render(
      <Scrubber
        value={100}
        onValueChange={onValueChange}
        onValueChanged={onValueChanged}
      />,
    );

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowRight',
    });
    screen.getByRole('slider').dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onValueChanged).not.toHaveBeenCalled();
  });

  it('reverses horizontal keyboard direction in RTL and leaves vertical keys alone', () => {
    const onValueChange = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <Scrubber
        dir="rtl"
        value={50}
        onValueChange={onValueChange}
        onKeyDown={onKeyDown}
      />,
    );
    const slider = screen.getByRole('slider');

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyDown(slider, { key: 'ArrowDown' });

    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith(49);
    expect(onKeyDown).toHaveBeenCalledTimes(2);
  });

  it('tracks a captured pointer continuously and commits its last value once', () => {
    const onValueChange = vi.fn();
    const onValueChanged = vi.fn();

    function ControlledScrubber() {
      const [value, setValue] = useState(0);
      return (
        <Scrubber
          value={value}
          onValueChange={(nextValue) => {
            onValueChange(nextValue);
            setValue(nextValue);
          }}
          onValueChanged={onValueChanged}
        />
      );
    }

    const { container } = render(<ControlledScrubber />);
    const slider = screen.getByRole('slider') as HTMLDivElement;
    const track = container.querySelector('[class*="trackArea"]') as HTMLDivElement;
    track.getBoundingClientRect = vi.fn(() => ({
      left: 10,
      right: 210,
      top: 0,
      bottom: 12,
      width: 200,
      height: 12,
      x: 10,
      y: 0,
      toJSON: () => ({}),
    }));
    slider.setPointerCapture = vi.fn();
    slider.hasPointerCapture = vi.fn(() => true);
    slider.releasePointerCapture = vi.fn();

    fireEvent.pointerDown(slider, { pointerId: 7, button: 0, clientX: 60 });
    fireEvent.pointerMove(slider, { pointerId: 7, clientX: 160 });
    expect(onValueChange).toHaveBeenNthCalledWith(1, 25);
    expect(onValueChange).toHaveBeenNthCalledWith(2, 75);
    expect(onValueChanged).not.toHaveBeenCalled();

    fireEvent.pointerUp(slider, { pointerId: 7, clientX: 160 });
    fireEvent.lostPointerCapture(slider, { pointerId: 7 });
    expect(onValueChanged).toHaveBeenCalledOnce();
    expect(onValueChanged).toHaveBeenCalledWith(75);
    expect(slider.releasePointerCapture).toHaveBeenCalledWith(7);
  });

  it('commits the pointer value while a controlled prop update is delayed', () => {
    const onValueChange = vi.fn();
    const onValueChanged = vi.fn();
    const { container } = render(
      <Scrubber
        value={0}
        onValueChange={onValueChange}
        onValueChanged={onValueChanged}
      />,
    );
    const slider = screen.getByRole('slider') as HTMLDivElement;
    const track = container.querySelector('[class*="trackArea"]') as HTMLDivElement;
    track.getBoundingClientRect = () => ({
      left: 0,
      right: 100,
      top: 0,
      bottom: 12,
      width: 100,
      height: 12,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    slider.setPointerCapture = vi.fn();
    slider.hasPointerCapture = vi.fn(() => true);
    slider.releasePointerCapture = vi.fn();

    fireEvent.pointerDown(slider, { pointerId: 8, button: 0, clientX: 25 });
    fireEvent.pointerMove(slider, { pointerId: 8, clientX: 75 });
    fireEvent.pointerUp(slider, { pointerId: 8, clientX: 75 });

    expect(onValueChange).toHaveBeenLastCalledWith(75);
    expect(onValueChanged).toHaveBeenCalledOnce();
    expect(onValueChanged).toHaveBeenCalledWith(75);
  });

  it('reveals its optional tooltip and scrim while focused', () => {
    const { container, rerender } = render(
      <App>
        <Scrubber value={50} durationSeconds={120} showTooltip />
      </App>,
    );
    const slider = screen.getByRole('slider');

    fireEvent.focus(slider);
    expect(container.querySelector('[role="tooltip"]')).toHaveTextContent('01:00');
    expect(container.querySelector('[class*="scrim"]')).toHaveAttribute(
      'data-active',
      'true',
    );

    rerender(
      <App>
        <Scrubber
          value={50}
          durationSeconds={120}
          showTooltip
          hideScrim
        />
      </App>,
    );
    expect(container.querySelector('[class*="scrim"]')).toBeNull();
  });
});

describe('Scrubber helpers', () => {
  it('formats media timestamps', () => {
    expect(formatScrubberTime(65)).toBe('01:05');
    expect(formatScrubberTime(3661)).toBe('1:01:01');
  });

  it('converts pointer positions to LTR and RTL values', () => {
    expect(getScrubberPointerValue({
      clientX: 60,
      trackLeft: 10,
      trackWidth: 200,
      rtl: false,
    })).toBe(25);
    expect(getScrubberPointerValue({
      clientX: 60,
      trackLeft: 10,
      trackWidth: 200,
      rtl: true,
    })).toBe(75);
  });
});
