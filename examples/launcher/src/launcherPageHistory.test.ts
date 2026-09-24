/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getLauncherHistoryPage,
  getLauncherDetailPageDepth,
  popLauncherPageHistory,
  pushLauncherPageHistory,
  replaceLauncherPageHistory,
  resetLauncherPageHistoryForTesting,
} from './launcherPageHistory';

describe('launcher page history', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    resetLauncherPageHistoryForTesting();
  });

  afterEach(() => {
    // This file spies on `window.history.back`/`replaceState` in several
    // tests. Without a restore the spy — and its call count — leaks into the
    // next test, which makes a `toHaveBeenCalledOnce` assertion read the
    // previous test's traversals and fail for the wrong reason.
    vi.restoreAllMocks();
  });

  it.each([
    ['quickSettings', '#uit-launcher-page=quickSettings'],
    ['allApps', '#uit-launcher-page=allApps'],
    ['upperPanel', '#uit-launcher-page=upperPanel'],
    ['settings', '#uit-launcher-page=settings'],
    ['appGridStyle', '#uit-launcher-page=appGridStyle'],
  ] as const)('marks the %s page as a same-document entry', (page, hash) => {
    pushLauncherPageHistory(page);

    expect(window.location.hash).toBe(hash);
    expect(getLauncherHistoryPage()).toBe(page);
  });

  it('uses browser back only for the matching active page', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    pushLauncherPageHistory('allApps');

    expect(popLauncherPageHistory('quickSettings')).toBe(false);
    expect(back).not.toHaveBeenCalled();

    expect(popLauncherPageHistory('allApps')).toBe(true);
    expect(back).toHaveBeenCalledOnce();
    back.mockRestore();
  });

  it('mints a Home entry when a deep link is replaced sideways before popping', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const pushState = vi.spyOn(window.history, 'pushState');
    // Reviewer sequence: the document loads deep-linked at quickSettings (no
    // launcher state, nothing pushed), then a horizontal page change calls
    // replaceLauncherPageHistory('allApps'), stamping the state key onto the
    // document's first entry. The key alone would say "we pushed this" and
    // suppress the mint — the pushed-entry count is what still demands it.
    window.history.replaceState(null, '', '#uit-launcher-page=quickSettings');
    replaceLauncherPageHistory('allApps');
    expect(window.history.state?.uitLauncherPage).toBe('allApps');
    pushState.mockClear();

    expect(popLauncherPageHistory('allApps')).toBe(true);

    expect(pushState).toHaveBeenCalledOnce();
    expect(back).toHaveBeenCalledOnce();

    // The mint is itself a push: a second pop must not mint again, or every
    // Back leaks one entry. (back() is mocked, so the hash is still active —
    // the count, not navigation, is what suppresses the re-mint.)
    pushState.mockClear();
    expect(popLauncherPageHistory('allApps')).toBe(true);
    expect(pushState).not.toHaveBeenCalled();

    pushState.mockRestore();
    back.mockRestore();
  });

  it('mints a Home entry before popping a deep-linked page', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const pushState = vi.spyOn(window.history, 'pushState');
    // A deep link arrives with the page hash already set and no launcher state,
    // so nothing was ever pushed to return to.
    window.history.replaceState(null, '', '#uit-launcher-page=quickSettings');
    pushState.mockClear();

    expect(popLauncherPageHistory('quickSettings')).toBe(true);

    // The Home entry the page would have been opened from is minted first, so
    // the pop stays inside the launcher document instead of leaving it.
    expect(pushState).toHaveBeenCalledOnce();
    expect(back).toHaveBeenCalledOnce();
    expect(window.location.hash).toBe('#uit-launcher-page=quickSettings');
    expect(window.history.state?.uitLauncherPage).toBe('quickSettings');

    pushState.mockRestore();
    back.mockRestore();
  });

  it('pops a pushed page without minting another entry', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    pushLauncherPageHistory('allApps');
    const pushState = vi.spyOn(window.history, 'pushState');

    expect(popLauncherPageHistory('allApps')).toBe(true);

    expect(pushState).not.toHaveBeenCalled();
    expect(back).toHaveBeenCalledOnce();

    pushState.mockRestore();
    back.mockRestore();
  });

  it('keeps detail-page depth mapping in one place', () => {
    expect(getLauncherDetailPageDepth(null)).toBe(0);
    expect(getLauncherDetailPageDepth('settings')).toBe(1);
    expect(getLauncherDetailPageDepth('appGridStyle')).toBe(2);
  });

  it('replaces one tracked page with another without adding history', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    pushLauncherPageHistory('quickSettings');

    replaceLauncherPageHistory('allApps');

    expect(window.location.hash).toBe('#uit-launcher-page=allApps');
    expect(replaceState).toHaveBeenCalledOnce();
  });

  it('traverses once when two Back presses arrive before popstate', () => {
    // `pop` calls `history.back()` and returns immediately; the hash only
    // changes when the asynchronous `popstate` is delivered. Two presses that
    // land inside that gap both see the unchanged hash, so both used to
    // traverse — consuming two entries and potentially leaving the document.
    //
    // Same async-traversal class as the controlled-Pager Back fix: the state
    // that says "already handled" is not observable yet at the second call, so
    // it has to be tracked explicitly rather than inferred from the URL.
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    pushLauncherPageHistory('quickSettings');

    expect(popLauncherPageHistory('quickSettings')).toBe(true);
    // Second press, before any popstate: the hash still reads quickSettings.
    expect(window.location.hash).toBe('#uit-launcher-page=quickSettings');
    popLauncherPageHistory('quickSettings');

    expect(back).toHaveBeenCalledOnce();
  });

  it('accepts the next pop once popstate has been delivered', () => {
    // The in-flight marker must clear, or the launcher becomes un-poppable
    // after its first Back. This is the other direction of the guard above.
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    pushLauncherPageHistory('quickSettings');

    popLauncherPageHistory('quickSettings');
    expect(back).toHaveBeenCalledOnce();

    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));

    pushLauncherPageHistory('allApps');
    popLauncherPageHistory('allApps');
    expect(back).toHaveBeenCalledTimes(2);
  });

  it('does not swallow a different page\'s pop while one is in flight', () => {
    // The guard is scoped to the value being popped, not to the marker as a
    // whole: suppressing a repeat of the SAME Back is correct, but a pop of a
    // different page is a distinct intent and must still traverse. A boolean
    // flag would swallow it.
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    pushLauncherPageHistory('quickSettings');
    popLauncherPageHistory('quickSettings');
    expect(back).toHaveBeenCalledOnce();

    // Still in flight — no popstate yet — but a different page's hash is now
    // active, so this is a separate request rather than a double press.
    window.history.replaceState(null, '', '#uit-launcher-page=allApps');
    popLauncherPageHistory('allApps');

    expect(back).toHaveBeenCalledTimes(2);
  });
});
