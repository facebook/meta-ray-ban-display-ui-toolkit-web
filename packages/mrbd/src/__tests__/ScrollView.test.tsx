/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ScrollView keyboard regressions.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ScrollView, ScrollViewOrientation } from '@wearables-ui-toolkit/foundation/components/ScrollView';
import { SCROLL_VIEW_NAVIGATION_REQUEST_EVENT } from '@wearables-ui-toolkit/foundation/base/FocusNavigationEvents';

function setScrollMetrics(
  element: Element,
  metrics: {
    clientHeight?: number;
    scrollHeight?: number;
    scrollTop?: number;
    clientWidth?: number;
    scrollWidth?: number;
    scrollLeft?: number;
  },
) {
  for (const [key, value] of Object.entries(metrics)) {
    Object.defineProperty(element, key, {
      configurable: true,
      writable: true,
      value,
    });
  }
}

function rect(top: number, height: number, left = 0, width = 100): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    width,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('ScrollView keyboard handling', () => {
  it('forwards function refs to the scroll viewport', () => {
    const ref = vi.fn();

    render(
      <ScrollView ref={ref} height={100}>
        <button>Child action</button>
      </ScrollView>,
    );

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it('marks clipped focus-boundary alignment as handled', () => {
    render(
      <ScrollView
        height={100}
        ariaLabel="Scrollable area"
        fadingEdgeEnabled={false}
      >
        <div data-uit-focus-boundary-root="true">
          <textarea aria-label="Clipped input" />
          <button type="button">Following action</button>
        </div>
        <div style={{ height: 300 }} />
      </ScrollView>,
    );
    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    const input = screen.getByRole('textbox', { name: 'Clipped input' });
    const followingAction = screen.getByRole('button', { name: 'Following action' });
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 50,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    scrollView.getBoundingClientRect = () => rect(0, 100);
    input.getBoundingClientRect = () => rect(-20, 20);
    followingAction.getBoundingClientRect = () => rect(40, 20);
    scrollView.scrollTo = vi.fn();
    scrollView.scrollBy = vi.fn();
    const detail = {
      consumeBoundaryAlignment: true,
      direction: 'up',
      handled: false,
      origin: input,
    };
    const event = new CustomEvent(SCROLL_VIEW_NAVIGATION_REQUEST_EVENT, {
      cancelable: true,
      detail,
    });

    scrollView.dispatchEvent(event);

    expect(detail.handled).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(scrollView.scrollTo).toHaveBeenCalled();
  });

  it('applies a public class name to the scroll viewport', () => {
    render(
      <ScrollView
        ariaLabel="Scrollable area"
        scrollContainerClassName="custom-scroll-container"
      >
        <button>Child action</button>
      </ScrollView>,
    );

    expect(screen.getByRole('region', { name: 'Scrollable area' }))
      .toHaveClass('custom-scroll-container');
  });

  it('uses the 64px page header inset by default', () => {
    render(
      <ScrollView insetForHeader height={100} ariaLabel="Scrollable area">
        <button>Child action</button>
      </ScrollView>,
    );

    expect(screen.getByRole('region', { name: 'Scrollable area' }).style.paddingTop)
      .toBe('calc(64px + var(--uit-page-content-origin-offset, 0px))');
  });

  it('defaults to a non-tab-focusable full-size viewport', () => {
    const { container } = render(
      <ScrollView ariaLabel="Scrollable area">
        <button>Child action</button>
      </ScrollView>,
    );

    const frame = container.querySelector<HTMLElement>('[class*="scrollViewFrame"]');
    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    expect(frame).toHaveStyle({
      width: '100%',
      height: '100%',
    });
    expect(scrollView).toHaveAttribute('tabindex', '-1');
    expect(scrollView).toHaveAttribute('data-uit-focus-section', 'true');
  });

  it('does not consume arrow keys from focused child controls', () => {
    render(
      <ScrollView height={100}>
        <button>Child action</button>
      </ScrollView>,
    );

    const child = screen.getByText('Child action');
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    });

    child.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('aligns visually leading and trailing children regardless of DOM order', () => {
    let timestamp = 0;
    const frameCallbacks: FrameRequestCallback[] = [];
    const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => timestamp);
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    render(
      <ScrollView
        height={200}
        ariaLabel="Scrollable area"
        fadingEdgeEnabled={false}
      >
        <div>
          <button>Middle row</button>
          <button>Bottom row</button>
          <div inert>
            <button>Inert row</button>
          </div>
          <button>Top row</button>
        </div>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    const middle = screen.getByRole('button', { name: 'Middle row' });
    const bottom = screen.getByRole('button', { name: 'Bottom row' });
    const inert = screen.getByText('Inert row');
    const top = screen.getByRole('button', { name: 'Top row' });
    setScrollMetrics(scrollView, {
      clientHeight: 200,
      scrollHeight: 500,
      scrollTop: 100,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    Object.defineProperty(scrollView, 'scrollTo', {
      configurable: true,
      value: ({ top, left }: ScrollToOptions) => {
        if (top != null) scrollView.scrollTop = top;
        if (left != null) scrollView.scrollLeft = left;
      },
    });
    scrollView.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 200,
      width: 100,
      height: 200,
      toJSON: () => {},
    });
    top.getBoundingClientRect = () => ({
      x: 0,
      y: 20,
      top: 20,
      left: 0,
      right: 100,
      bottom: 50,
      width: 100,
      height: 30,
      toJSON: () => {},
    });
    middle.getBoundingClientRect = () => ({
      x: 0,
      y: 85,
      top: 85,
      left: 0,
      right: 100,
      bottom: 115,
      width: 100,
      height: 30,
      toJSON: () => {},
    });
    bottom.getBoundingClientRect = () => ({
      x: 0,
      y: 350,
      top: 350,
      left: 0,
      right: 100,
      bottom: 380,
      width: 100,
      height: 30,
      toJSON: () => {},
    });
    inert.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 15,
      width: 100,
      height: 15,
      toJSON: () => {},
    });

    frameCallbacks.length = 0;
    fireEvent.focus(middle);
    expect(frameCallbacks).toHaveLength(0);
    expect(scrollView.scrollTop).toBe(100);

    fireEvent.focus(top);
    timestamp = 150;
    while (frameCallbacks.length > 0) {
      frameCallbacks.shift()?.(timestamp);
    }
    expect(scrollView.scrollTop).toBe(0);

    scrollView.scrollTop = 100;
    fireEvent.focus(bottom);
    timestamp = 300;
    while (frameCallbacks.length > 0) {
      frameCallbacks.shift()?.(timestamp);
    }
    expect(scrollView.scrollTop).toBe(300);
    bottom.focus();

    setScrollMetrics(scrollView, {
      scrollHeight: 502,
      scrollTop: 300,
    });
    fireEvent.scroll(scrollView);
    expect(scrollView.scrollTop).toBe(302);

    nowSpy.mockRestore();
    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });

  it('applies a focus boundary only to its nearest ScrollView', () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 1);

    render(
      <ScrollView
        height={200}
        ariaLabel="Outer scroll area"
        fadingEdgeEnabled={false}
      >
        <ScrollView
          height={100}
          ariaLabel="Inner scroll area"
          fadingEdgeEnabled={false}
        >
          <div data-uit-focus-boundary-root="true">
            <button>First inner row</button>
            <button>Last inner row</button>
          </div>
        </ScrollView>
      </ScrollView>,
    );

    const outer = screen.getByRole('region', { name: 'Outer scroll area' });
    const inner = screen.getByRole('region', { name: 'Inner scroll area' });
    const first = screen.getByRole('button', { name: 'First inner row' });
    const last = screen.getByRole('button', { name: 'Last inner row' });
    setScrollMetrics(outer, {
      clientHeight: 200,
      scrollHeight: 400,
      scrollTop: 80,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    setScrollMetrics(inner, {
      clientHeight: 100,
      scrollHeight: 200,
      scrollTop: 0,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    outer.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 200,
      width: 100,
      height: 200,
      toJSON: () => {},
    });
    inner.getBoundingClientRect = () => ({
      x: 0,
      y: 60,
      top: 60,
      left: 0,
      right: 100,
      bottom: 160,
      width: 100,
      height: 100,
      toJSON: () => {},
    });
    first.getBoundingClientRect = () => ({
      x: 0,
      y: 80,
      top: 80,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 20,
      toJSON: () => {},
    });
    last.getBoundingClientRect = () => ({
      x: 0,
      y: 180,
      top: 180,
      left: 0,
      right: 100,
      bottom: 200,
      width: 100,
      height: 20,
      toJSON: () => {},
    });

    requestAnimationFrameSpy.mockClear();
    fireEvent.focus(first);

    expect(outer.scrollTop).toBe(80);
    expect(inner.scrollTop).toBe(0);
    expect(requestAnimationFrameSpy).not.toHaveBeenCalled();

    requestAnimationFrameSpy.mockClear();
    fireEvent.focus(last);

    expect(outer.scrollTop).toBe(80);
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);

    requestAnimationFrameSpy.mockRestore();
  });

  it('realigns a focused boundary after the final focus-expansion layout frame', () => {
    vi.useFakeTimers();
    const frameCallbacks: FrameRequestCallback[] = [];
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      });
    try {
      render(
        <ScrollView
          height={200}
          ariaLabel="Scrollable area"
          fadingEdgeEnabled={false}
        >
          <div data-uit-focus-boundary-root="true">
            <button>Top row</button>
            <button>Bottom row</button>
          </div>
        </ScrollView>,
      );

      const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
      const top = screen.getByRole('button', { name: 'Top row' });
      const bottom = screen.getByRole('button', { name: 'Bottom row' });
      setScrollMetrics(scrollView, {
        clientHeight: 200,
        scrollHeight: 500,
        scrollTop: 100,
        clientWidth: 100,
        scrollWidth: 100,
        scrollLeft: 0,
      });
      Object.defineProperty(scrollView, 'scrollTo', {
        configurable: true,
        value: ({ top, left }: ScrollToOptions) => {
          if (top != null) scrollView.scrollTop = top;
          if (left != null) scrollView.scrollLeft = left;
        },
      });
      top.getBoundingClientRect = () => ({
        x: 0,
        y: 20,
        top: 20,
        left: 0,
        right: 100,
        bottom: 50,
        width: 100,
        height: 30,
        toJSON: () => {},
      });
      bottom.getBoundingClientRect = () => ({
        x: 0,
        y: 350,
        top: 350,
        left: 0,
        right: 100,
        bottom: 380,
        width: 100,
        height: 30,
        toJSON: () => {},
      });

      fireEvent.focus(bottom);
      bottom.focus();
      setScrollMetrics(scrollView, {
        scrollHeight: 500,
        scrollTop: 300,
      });
      frameCallbacks.length = 0;
      vi.runOnlyPendingTimers();

      expect(scrollView.scrollTop).toBe(300);
      expect(frameCallbacks).toHaveLength(1);

      bottom.getBoundingClientRect = () => ({
        x: 0,
        y: 150,
        top: 150,
        left: 0,
        right: 100,
        bottom: 180,
        width: 100,
        height: 30,
        toJSON: () => {},
      });
      setScrollMetrics(scrollView, {scrollHeight: 502});
      frameCallbacks.shift()?.(800);

      expect(scrollView.scrollTop).toBe(302);
    } finally {
      requestAnimationFrameSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('lets an outer ScrollView follow focus inside a non-scrolling nested ScrollView', () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 1);

    render(
      <ScrollView
        height={200}
        ariaLabel="Outer scroll area"
        fadingEdgeEnabled={false}
      >
        <ScrollView
          height={100}
          ariaLabel="Inner scroll area"
          fadingEdgeEnabled={false}
        >
          <div data-uit-focus-boundary-root="true">
            <button>Nested row</button>
          </div>
        </ScrollView>
      </ScrollView>,
    );

    const outer = screen.getByRole('region', { name: 'Outer scroll area' });
    const inner = screen.getByRole('region', { name: 'Inner scroll area' });
    const row = screen.getByRole('button', { name: 'Nested row' });
    setScrollMetrics(outer, {
      clientHeight: 200,
      scrollHeight: 400,
      scrollTop: 0,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    setScrollMetrics(inner, {
      clientHeight: 100,
      scrollHeight: 100,
      scrollTop: 0,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    outer.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 200,
      width: 100,
      height: 200,
      toJSON: () => {},
    });
    row.getBoundingClientRect = () => ({
      x: 0,
      y: 210,
      top: 210,
      left: 0,
      right: 100,
      bottom: 250,
      width: 100,
      height: 40,
      toJSON: () => {},
    });

    requestAnimationFrameSpy.mockClear();
    fireEvent.focus(row);

    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);

    requestAnimationFrameSpy.mockRestore();
  });

  it('does not consume outward arrows from first or last focused children', () => {
    render(
      <ScrollView
        height={100}
        ariaLabel="Scrollable area"
      >
        <div data-uit-focus-boundary-root="true">
          <button>First row</button>
          <button>Last row</button>
        </div>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    const first = screen.getByRole('button', { name: 'First row' });
    const last = screen.getByRole('button', { name: 'Last row' });
    const scrollTo = vi.fn();
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 80,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    Object.defineProperty(scrollView, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });
    first.getBoundingClientRect = () => ({
      x: 0,
      y: -80,
      top: -80,
      left: 0,
      right: 100,
      bottom: -40,
      width: 100,
      height: 40,
      toJSON: () => {},
    });
    last.getBoundingClientRect = () => ({
      x: 0,
      y: 200,
      top: 200,
      left: 0,
      right: 100,
      bottom: 240,
      width: 100,
      height: 40,
      toJSON: () => {},
    });

    expect(fireEvent.keyDown(first, { key: 'ArrowUp' })).toBe(true);
    expect(scrollTo).toHaveBeenLastCalledWith({
      top: 0,
      left: 0,
      behavior: 'auto',
    });

    scrollView.scrollTop = 60;
    expect(fireEvent.keyDown(last, { key: 'ArrowDown' })).toBe(true);
    expect(scrollTo).toHaveBeenLastCalledWith({
      top: 200,
      left: 0,
      behavior: 'auto',
    });
  });

  it('does not snap to a boundary that would hide the focused child', () => {
    render(
      <ScrollView
        height={200}
        ariaLabel="Scrollable area"
        fadingEdgeEnabled={false}
      >
        <div data-uit-focus-boundary-root="true">
          <button>First action</button>
          <button>Last action</button>
          <div>Trailing information</div>
        </div>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    const first = screen.getByRole('button', { name: 'First action' });
    const last = screen.getByRole('button', { name: 'Last action' });
    const scrollTo = vi.fn();
    const scrollBy = vi.fn();
    setScrollMetrics(scrollView, {
      clientHeight: 200,
      scrollHeight: 600,
      scrollTop: 100,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    Object.defineProperty(scrollView, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });
    Object.defineProperty(scrollView, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });
    scrollView.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 200,
      width: 100,
      height: 200,
      toJSON: () => {},
    });
    first.getBoundingClientRect = () => ({
      x: 0,
      y: 20,
      top: 20,
      left: 0,
      right: 100,
      bottom: 60,
      width: 100,
      height: 40,
      toJSON: () => {},
    });
    last.getBoundingClientRect = () => ({
      x: 0,
      y: 150,
      top: 150,
      left: 0,
      right: 100,
      bottom: 180,
      width: 100,
      height: 30,
      toJSON: () => {},
    });

    fireEvent.focus(last);

    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollView.scrollTop).toBe(100);

    expect(fireEvent.keyDown(last, { key: 'ArrowDown' })).toBe(false);
    expect(scrollBy).toHaveBeenCalledWith({
      top: 100,
      behavior: 'smooth',
    });
  });

  it('does not snap a focused child underneath an active fading edge', () => {
    render(
      <ScrollView
        height={100}
        ariaLabel="Scrollable area"
      >
        <div data-uit-focus-boundary-root="true">
          <button>First action</button>
          <button>Last action</button>
        </div>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    const first = screen.getByRole('button', { name: 'First action' });
    const last = screen.getByRole('button', { name: 'Last action' });
    const scrollTo = vi.fn();
    const scrollBy = vi.fn();
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 60,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    Object.defineProperty(scrollView, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });
    Object.defineProperty(scrollView, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });
    scrollView.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON: () => {},
    });
    first.getBoundingClientRect = () => ({
      x: 0,
      y: 20,
      top: 20,
      left: 0,
      right: 100,
      bottom: 60,
      width: 100,
      height: 40,
      toJSON: () => {},
    });
    last.getBoundingClientRect = () => ({
      x: 0,
      y: 190,
      top: 190,
      left: 0,
      right: 100,
      bottom: 230,
      width: 100,
      height: 40,
      toJSON: () => {},
    });

    expect(fireEvent.keyDown(last, { key: 'ArrowDown' })).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollBy).toHaveBeenCalledWith({
      top: 50,
      behavior: 'smooth',
    });
  });

  it('does not snap a focused child underneath the header inset', () => {
    render(
      <ScrollView
        height={200}
        ariaLabel="Scrollable area"
        fadingEdgeEnabled={false}
        insetForHeader
        headerHeight={80}
      >
        <div data-uit-focus-boundary-root="true">
          <button>First action</button>
          <button>Last action</button>
        </div>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    const first = screen.getByRole('button', { name: 'First action' });
    const last = screen.getByRole('button', { name: 'Last action' });
    const scrollTo = vi.fn();
    const scrollBy = vi.fn();
    setScrollMetrics(scrollView, {
      clientHeight: 200,
      scrollHeight: 500,
      scrollTop: 100,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    Object.defineProperty(scrollView, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });
    Object.defineProperty(scrollView, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });
    scrollView.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 200,
      width: 100,
      height: 200,
      toJSON: () => {},
    });
    first.getBoundingClientRect = () => ({
      x: 0,
      y: 20,
      top: 20,
      left: 0,
      right: 100,
      bottom: 60,
      width: 100,
      height: 40,
      toJSON: () => {},
    });
    last.getBoundingClientRect = () => ({
      x: 0,
      y: 250,
      top: 250,
      left: 0,
      right: 100,
      bottom: 290,
      width: 100,
      height: 40,
      toJSON: () => {},
    });

    expect(fireEvent.keyDown(last, { key: 'ArrowDown' })).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollBy).toHaveBeenCalledWith({
      top: 100,
      behavior: 'smooth',
    });
  });

  it('scrolls before navigating when focus is outside the physical viewport', () => {
    render(
      <ScrollView height={200} ariaLabel="Scrollable area">
        <button>Previous action</button>
        <button>Current action</button>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    const previous = screen.getByRole('button', { name: 'Previous action' });
    const current = screen.getByRole('button', { name: 'Current action' });
    const scrollBy = vi.fn();
    setScrollMetrics(scrollView, {
      clientHeight: 200,
      scrollHeight: 600,
      scrollTop: 250,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    Object.defineProperty(scrollView, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });
    scrollView.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 200,
      width: 100,
      height: 200,
      toJSON: () => {},
    });
    previous.getBoundingClientRect = () => ({
      x: 0,
      y: 20,
      top: 20,
      left: 0,
      right: 100,
      bottom: 60,
      width: 100,
      height: 40,
      toJSON: () => {},
    });
    current.getBoundingClientRect = () => ({
      x: 0,
      y: -80,
      top: -80,
      left: 0,
      right: 100,
      bottom: -40,
      width: 100,
      height: 40,
      toJSON: () => {},
    });

    const prevented = !fireEvent.keyDown(current, { key: 'ArrowUp' });

    expect(prevented).toBe(true);
    expect(scrollBy).toHaveBeenCalledWith({
      top: -100,
      behavior: 'smooth',
    });
  });

  it('navigates from a partially visible child instead of page-scrolling', () => {
    render(
      <ScrollView height={100} ariaLabel="Scrollable area">
        <button>Current row</button>
        <button>Next row</button>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    const current = screen.getByRole('button', { name: 'Current row' });
    const next = screen.getByRole('button', { name: 'Next row' });
    const scrollBy = vi.fn();
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 80,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    Object.defineProperty(scrollView, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });
    scrollView.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON: () => {},
    });
    current.getBoundingClientRect = () => ({
      x: 0,
      y: 80,
      top: 80,
      left: 0,
      right: 100,
      bottom: 120,
      width: 100,
      height: 40,
      toJSON: () => {},
    });
    next.getBoundingClientRect = () => ({
      x: 0,
      y: 130,
      top: 130,
      left: 0,
      right: 100,
      bottom: 170,
      width: 100,
      height: 40,
      toJSON: () => {},
    });

    const prevented = !fireEvent.keyDown(current, { key: 'ArrowDown' });

    expect(prevented).toBe(false);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('scrolls a focused child by half a viewport when no target exists above', () => {
    render(
      <ScrollView
        height={100}
        ariaLabel="Scrollable area"
        fadingEdgeEnabled={false}
      >
        <button>Top focusable</button>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    const child = screen.getByRole('button', { name: 'Top focusable' });
    const scrollBy = vi.fn();
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 80,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    Object.defineProperty(scrollView, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });

    const prevented = !fireEvent.keyDown(child, { key: 'ArrowUp' });

    expect(prevented).toBe(true);
    expect(scrollBy).toHaveBeenCalledWith({
      top: -50,
      behavior: 'smooth',
    });
  });

  it('does not edge-scroll when a focusable child exists in the key direction', () => {
    render(
      <ScrollView
        height={100}
        ariaLabel="Scrollable area"
        fadingEdgeEnabled={false}
      >
        <button>Previous row</button>
        <button>Current row</button>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    const previous = screen.getByRole('button', { name: 'Previous row' });
    const current = screen.getByRole('button', { name: 'Current row' });
    const scrollBy = vi.fn();
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 80,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    Object.defineProperty(scrollView, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });
    scrollView.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON: () => {},
    });
    previous.getBoundingClientRect = () => ({
      x: 0,
      y: 10,
      top: 10,
      left: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 30,
      toJSON: () => {},
    });
    current.getBoundingClientRect = () => ({
      x: 0,
      y: 60,
      top: 60,
      left: 0,
      right: 100,
      bottom: 90,
      width: 100,
      height: 30,
      toJSON: () => {},
    });

    const prevented = !fireEvent.keyDown(current, { key: 'ArrowUp' });

    expect(prevented).toBe(false);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('supports horizontal edge scrolling when focus has no target to the left', () => {
    render(
      <ScrollView
        orientation={ScrollViewOrientation.HORIZONTAL}
        width={100}
        ariaLabel="Horizontal area"
      >
        <button>Left focusable</button>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Horizontal area' });
    const child = screen.getByRole('button', { name: 'Left focusable' });
    const scrollBy = vi.fn();
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 100,
      scrollTop: 0,
      clientWidth: 100,
      scrollWidth: 300,
      scrollLeft: 80,
    });
    Object.defineProperty(scrollView, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });

    const prevented = !fireEvent.keyDown(child, { key: 'ArrowLeft' });

    expect(prevented).toBe(true);
    expect(scrollBy).toHaveBeenCalledWith({
      left: -50,
      behavior: 'smooth',
    });
  });

  it('consumes arrow keys while focused content can still scroll', () => {
    render(
      <ScrollView height={100} ariaLabel="Scrollable area">
        <div style={{ height: 300 }}>Content</div>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 0,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    const scrollBy = vi.fn();
    Object.defineProperty(scrollView, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });
    const prevented = !fireEvent.keyDown(scrollView, { key: 'ArrowDown' });

    expect(prevented).toBe(true);
    expect(scrollBy).toHaveBeenCalledWith({
      top: 60,
      behavior: 'smooth',
    });
  });

  it('does not consume an outward arrow when the focused scroll view is at its boundary', () => {
    render(
      <ScrollView height={100} ariaLabel="Scrollable area">
        <div style={{ height: 300 }}>Content</div>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    const scrollBy = vi.fn();
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 200,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    Object.defineProperty(scrollView, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });

    expect(fireEvent.keyDown(scrollView, { key: 'ArrowDown' })).toBe(true);
    expect(scrollBy).not.toHaveBeenCalled();

    scrollView.scrollTop = 0;
    expect(fireEvent.keyDown(scrollView, { key: 'ArrowUp' })).toBe(true);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('hands focus outward when the focused scroll view reaches its boundary', () => {
    render(
      <>
        <ScrollView tabIndex={0} height={100} ariaLabel="Scrollable area">
          <div style={{ height: 300 }}>Content</div>
        </ScrollView>
        <button>Next action</button>
      </>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    const nextAction = screen.getByRole('button', { name: 'Next action' });
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 200,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    const handleFocusSearch = (event: Event) => {
      const customEvent = event as CustomEvent<{ handled: boolean }>;
      customEvent.detail.handled = true;
      nextAction.focus();
      event.preventDefault();
    };
    document.addEventListener('uit-focus-search-from-origin', handleFocusSearch);

    try {
      scrollView.focus();
      expect(fireEvent.keyDown(scrollView, { key: 'ArrowDown' })).toBe(false);
      expect(document.activeElement).toBe(nextAction);
    } finally {
      document.removeEventListener('uit-focus-search-from-origin', handleFocusSearch);
    }
  });

  it('enables medium vertical fading edges by default', async () => {
    render(
      <ScrollView height={100} ariaLabel="Scrollable area">
        <div style={{ height: 300 }}>Content</div>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 0,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    fireEvent.scroll(scrollView);

    await waitFor(() => {
      const topEdge = scrollView.parentElement?.querySelector<HTMLElement>('[data-edge="top"]');
      const bottomEdge = scrollView.parentElement?.querySelector<HTMLElement>('[data-edge="bottom"]');
      expect(topEdge?.style.height).toBe('64px');
      expect(topEdge?.style.opacity).toBe('0');
      expect(bottomEdge?.style.height).toBe('64px');
      expect(bottomEdge?.style.opacity).toBe('1');
    });
  });

  it('does not rely on ambient CSS smooth scrolling', () => {
    render(
      <ScrollView height={100} ariaLabel="Scrollable area">
        <button>Child action</button>
      </ScrollView>,
    );

    expect(screen.getByRole('region', { name: 'Scrollable area' }).style.scrollBehavior)
      .toBe('');
  });

  it('updates vertical fading edges as scroll position changes', async () => {
    render(
      <ScrollView height={100} ariaLabel="Scrollable area">
        <div style={{ height: 300 }}>Content</div>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 48,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    fireEvent.scroll(scrollView);

    await waitFor(() => {
      const topEdge = scrollView.parentElement?.querySelector<HTMLElement>('[data-edge="top"]');
      const bottomEdge = scrollView.parentElement?.querySelector<HTMLElement>('[data-edge="bottom"]');
      expect(topEdge?.style.opacity).toBe('0.75');
      expect(bottomEdge?.style.opacity).toBe('1');
    });

    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 200,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    fireEvent.scroll(scrollView);

    await waitFor(() => {
      const topEdge = scrollView.parentElement?.querySelector<HTMLElement>('[data-edge="top"]');
      const bottomEdge = scrollView.parentElement?.querySelector<HTMLElement>('[data-edge="bottom"]');
      expect(topEdge?.style.opacity).toBe('1');
      expect(bottomEdge?.style.opacity).toBe('0');
    });
  });

  it('supports horizontal fading edges on the shared scroll primitive', async () => {
    render(
      <ScrollView
        orientation={ScrollViewOrientation.HORIZONTAL}
        width={100}
        ariaLabel="Horizontal area"
      >
        <div style={{ width: 300 }}>Content</div>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Horizontal area' });
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 100,
      scrollTop: 0,
      clientWidth: 100,
      scrollWidth: 300,
      scrollLeft: 0,
    });
    fireEvent.scroll(scrollView);

    await waitFor(() => {
      const leftEdge = scrollView.parentElement?.querySelector<HTMLElement>('[data-edge="left"]');
      const rightEdge = scrollView.parentElement?.querySelector<HTMLElement>('[data-edge="right"]');
      expect(leftEdge?.style.opacity).toBe('0');
      expect(rightEdge?.style.width).toBe('64px');
      expect(rightEdge?.style.opacity).toBe('1');
    });
  });

  it('does not add trailing content to make room for the fading edge', async () => {
    render(
      <ScrollView
        orientation={ScrollViewOrientation.HORIZONTAL}
        width={100}
        ariaLabel="Horizontal area"
      >
        <div style={{ width: 300 }}>Content</div>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Horizontal area' });
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 100,
      scrollTop: 0,
      clientWidth: 100,
      scrollWidth: 300,
      scrollLeft: 0,
    });
    fireEvent.scroll(scrollView);

    await waitFor(() => {
      expect(
        scrollView.querySelector('[data-scroll-safe-area="trailing"]'),
      ).toBeNull();
    });
  });

  it('renders the vertical scrollbar as a viewport overlay sibling', async () => {
    const { container } = render(
      <ScrollView height={100} ariaLabel="Scrollable area">
        <div style={{ height: 300 }}>Content</div>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 50,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    fireEvent.scroll(scrollView);

    await waitFor(() => {
      const scrollbar = container.querySelector<HTMLElement>(
        '[data-visible="true"][data-axis="vertical"]',
      );
      expect(scrollbar).not.toBeNull();
      expect(scrollbar?.parentElement).not.toBe(scrollView);
      expect(scrollbar?.querySelector<HTMLElement>('[class*="scrollbarHandle"]')?.style.height)
        .toBe('33.33333333333333px');
    });
  });

  it('renders horizontal scrollbar geometry when horizontal content overflows', async () => {
    const { container } = render(
      <ScrollView
        orientation={ScrollViewOrientation.HORIZONTAL}
        width={100}
        ariaLabel="Horizontal area"
      >
        <div style={{ width: 400 }}>Content</div>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Horizontal area' });
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 100,
      scrollTop: 0,
      clientWidth: 100,
      scrollWidth: 400,
      scrollLeft: 100,
    });
    fireEvent.scroll(scrollView);

    await waitFor(() => {
      const scrollbar = container.querySelector<HTMLElement>(
        '[data-visible="true"][data-axis="horizontal"]',
      );
      const handle = scrollbar?.querySelector<HTMLElement>('[class*="scrollbarHandle"]');
      expect(scrollbar).not.toBeNull();
      expect(handle?.style.width).toBe('25px');
      expect(handle?.style.left).toBe('calc(50% - 25px)');
    });
  });

  it('supports disabling the custom scrollbar', () => {
    const { container } = render(
      <ScrollView height={100} scrollbarEnabled={false} ariaLabel="Scrollable area">
        <div style={{ height: 300 }}>Content</div>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 50,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    fireEvent.scroll(scrollView);

    expect(container.querySelector('[data-visible]')).toBeNull();
  });

  it('scrolls focused children past a visible fading edge', () => {
    let timestamp = 0;
    const frameCallbacks: FrameRequestCallback[] = [];
    const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => timestamp);
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      });
    const cancelAnimationFrameSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    render(
      <ScrollView height={100} ariaLabel="Scrollable area">
        <button>Earlier row</button>
        <button>Focusable row</button>
        <button>Later row</button>
      </ScrollView>,
    );

    const scrollView = screen.getByRole('region', { name: 'Scrollable area' });
    const earlier = screen.getByRole('button', { name: 'Earlier row' });
    const child = screen.getByRole('button', { name: 'Focusable row' });
    const later = screen.getByRole('button', { name: 'Later row' });
    setScrollMetrics(scrollView, {
      clientHeight: 100,
      scrollHeight: 300,
      scrollTop: 0,
      clientWidth: 100,
      scrollWidth: 100,
      scrollLeft: 0,
    });
    scrollView.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON: () => {},
    });
    earlier.getBoundingClientRect = () => ({
      x: 0,
      y: 10,
      top: 10,
      left: 0,
      right: 100,
      bottom: 25,
      width: 100,
      height: 15,
      toJSON: () => {},
    });
    child.getBoundingClientRect = () => ({
      x: 0,
      y: 80,
      top: 80,
      left: 0,
      right: 100,
      bottom: 95,
      width: 100,
      height: 15,
      toJSON: () => {},
    });
    later.getBoundingClientRect = () => ({
      x: 0,
      y: 180,
      top: 180,
      left: 0,
      right: 100,
      bottom: 195,
      width: 100,
      height: 15,
      toJSON: () => {},
    });

    fireEvent.focus(child);

    expect(requestAnimationFrameSpy).toHaveBeenCalled();

    timestamp = 150;
    while (frameCallbacks.length > 0) {
      frameCallbacks.shift()?.(timestamp);
    }

    expect(scrollView.scrollTop).toBe(59);
    expect(scrollView.scrollLeft).toBe(0);

    nowSpy.mockRestore();
    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });
});
