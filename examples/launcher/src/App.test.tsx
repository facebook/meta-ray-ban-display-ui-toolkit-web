/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LauncherExampleApp } from './App';

const VISIBLE_RECT: DOMRect = {
  bottom: 100,
  height: 100,
  left: 0,
  right: 100,
  top: 0,
  width: 100,
  x: 0,
  y: 0,
  toJSON: () => {},
};

describe('LauncherExampleApp Back history', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(VISIBLE_RECT);
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    delete (HTMLElement.prototype as HTMLElement & { scrollTo?: unknown })
      .scrollTo;
    vi.restoreAllMocks();
  });

  it('uses launcher history to return from every secondary panel', async () => {
    const initialHistoryLength = window.history.length;
    render(<LauncherExampleApp />);
    const pager = screen.getByLabelText('System launcher pages');

    fireEvent.keyDown(pager, { key: 'ArrowLeft' });

    await waitFor(() => {
      expect(pager).toHaveAttribute('data-current-page', '0');
    });
    await act(() => new Promise(resolve => setTimeout(resolve, 0)));

    expect(window.location.hash).toBe('#uit-launcher-page=quickSettings');
    expect(window.history.length).toBe(initialHistoryLength + 1);
    expect(window.history.state).not.toHaveProperty('__uitTransientBackEntry');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(window.location.hash).toBe('');
      expect(pager).toHaveAttribute('data-current-page', '1');
    });

    fireEvent.keyDown(pager, { key: 'ArrowRight' });
    await waitFor(() => {
      expect(pager).toHaveAttribute('data-current-page', '2');
    });
    await act(() => new Promise(resolve => setTimeout(resolve, 0)));

    expect(window.location.hash).toBe('#uit-launcher-page=allApps');
    expect(window.history.length).toBe(initialHistoryLength + 1);
    expect(window.history.state).not.toHaveProperty('__uitTransientBackEntry');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(window.location.hash).toBe('');
      expect(pager).toHaveAttribute('data-current-page', '1');
    });

    const homePager = screen.getByLabelText('Launcher home and widget panels');
    fireEvent.keyDown(homePager, { key: 'ArrowUp' });
    await waitFor(() => {
      expect(homePager).toHaveAttribute('data-current-page', '0');
    });
    await act(() => new Promise(resolve => setTimeout(resolve, 0)));

    expect(window.location.hash).toBe('#uit-launcher-page=upperPanel');
    expect(window.history.length).toBe(initialHistoryLength + 1);
    expect(window.history.state).not.toHaveProperty('__uitTransientBackEntry');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(window.location.hash).toBe('');
      expect(homePager).toHaveAttribute('data-current-page', '1');
    });
  });

  it('routes transient-mode Escape through shared history handling', async () => {
    render(<LauncherExampleApp />);
    const pager = screen.getByLabelText('System launcher pages');

    fireEvent.keyDown(pager, { key: 'ArrowLeft' });
    await waitFor(() => {
      expect(window.location.hash).toBe('#uit-launcher-page=quickSettings');
    });

    const volume = screen.getByRole('slider', { name: 'Volume' });
    fireEvent.click(volume);
    expect(window.location.hash).toBe(
      '#uit-launcher-mode=quickSettingsSlider',
    );

    fireEvent.keyDown(volume, { key: 'Escape' });
    fireEvent.keyDown(volume, { key: 'Escape', repeat: true });
    await waitFor(() => {
      expect(window.location.hash).toBe('#uit-launcher-page=quickSettings');
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(window.location.hash).toBe('');
    });

    fireEvent.keyDown(pager, { key: 'ArrowRight' });
    await waitFor(() => {
      expect(window.location.hash).toBe('#uit-launcher-page=allApps');
    });

    const managePins = screen.getByRole('button', { name: 'Manage pins' });
    fireEvent.click(managePins);
    expect(window.location.hash).toBe('#uit-launcher-mode=appPinning');

    const done = screen.getByRole('button', { name: 'Done' });
    fireEvent.keyDown(done, { key: 'Escape' });
    fireEvent.keyDown(done, { key: 'Escape', repeat: true });
    await waitFor(() => {
      expect(window.location.hash).toBe('#uit-launcher-page=allApps');
    });
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
  });
});
