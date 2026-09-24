/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AlphaLauncherApp } from './App';

describe('launcher navigation and focus', () => {
  afterEach(() => {
    window.history.replaceState(null, '', window.location.pathname);
    window.sessionStorage.clear();
  });

  it('returns rail focus to Notifications before leaving the app', async () => {
    render(<AlphaLauncherApp />);
    const notifications = screen.getByRole('button', {
      name: 'Notifications',
    });
    await waitFor(() => expect(notifications).toHaveFocus());

    for (const name of ['Settings', 'Games']) {
      screen.getByRole('button', { name }).focus();
      expect(window.history.state?.alphaLauncherRailBackGuard)
        .toEqual(expect.any(String));
      window.history.back();
      await waitFor(() => expect(notifications).toHaveFocus());
    }
  });

  it('fades the screen back in when a same-page popstate restores it', async () => {
    render(<AlphaLauncherApp />);
    const notifications = screen.getByRole('button', {
      name: 'Notifications',
    });
    await waitFor(() => expect(notifications).toHaveFocus());

    const screenElement = screen.getByLabelText('Alpha Launcher');
    await waitFor(() => expect(screenElement).toHaveClass('is-ready'));

    // A history traversal can land on the page that is already active — no
    // `activePage` or `railFocusTarget` change. The restore still clears
    // `isPageReady`, so unless the restore itself re-runs the shared
    // focus/ready effect there is no dependency change left to set it again
    // and the screen stays at zero opacity: the same black screen the
    // cross-document path produced, reached a different way.
    fireEvent(window, new PopStateEvent('popstate', { state: null }));

    await waitFor(() => expect(screenElement).toHaveClass('is-ready'));
    expect(screenElement).not.toHaveClass('is-leaving');
  });

  it('fades the screen back in when a cross-document Back restores it', async () => {
    render(<AlphaLauncherApp />);
    const notifications = screen.getByRole('button', {
      name: 'Notifications',
    });
    await waitFor(() => expect(notifications).toHaveFocus());

    const screenElement = screen.getByLabelText('Alpha Launcher');
    await waitFor(() => expect(screenElement).toHaveClass('is-ready'));

    // Opening a page starts the fade-out and then replaces the document, so the
    // launcher is left in its leaving state. A cross-document Back restores
    // that document from the back/forward cache with the leaving state intact,
    // which renders the whole screen at zero opacity — `popstate` never fires
    // for it, so only `pageshow` can put the screen back.
    screen.getByRole('button', { name: 'Settings' }).click();
    await waitFor(() => expect(screenElement).toHaveClass('is-leaving'));

    fireEvent(
      window,
      Object.assign(new Event('pageshow'), { persisted: true }),
    );

    await waitFor(() => expect(screenElement).not.toHaveClass('is-leaving'));
    await waitFor(() => expect(screenElement).toHaveClass('is-ready'));
  });

  it('returns from a child page to its launching rail button', async () => {
    window.sessionStorage.setItem(
      'alpha-launcher-last-rail-focus',
      'brightness',
    );
    window.history.replaceState(null, '', window.location.pathname);
    window.history.pushState(null, '', '?page=brightness');
    render(<AlphaLauncherApp />);

    const control = screen.getByRole('slider', { name: 'Brightness, 70%' });
    control.focus();
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Brightness' })).toHaveFocus();
    }, { timeout: 1_500 });
  });

  it('restores the current rail button after the host menu resumes', async () => {
    render(<AlphaLauncherApp />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Notifications' })).toHaveFocus();
    });

    const messages = screen.getByRole('button', { name: 'Messages' });
    messages.focus();
    fireEvent.blur(window);
    messages.blur();
    fireEvent.focus(window);

    await waitFor(() => expect(messages).toHaveFocus(), { timeout: 1_000 });

    messages.blur();
    await waitFor(() => expect(messages).toHaveFocus());
    fireEvent.keyDown(messages, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: 'Community' })).toHaveFocus();
  });

  it('does not traverse history when the rail guard entry is not ours', async () => {
    render(<AlphaLauncherApp />);
    const notifications = screen.getByRole('button', {
      name: 'Notifications',
    });
    await waitFor(() => expect(notifications).toHaveFocus());

    // Focusing a non-anchor rail button arms the guard: a same-URL entry this
    // hook owns and may pop when focus returns to the anchor.
    screen.getByRole('button', { name: 'Settings' }).focus();
    expect(window.history.state?.alphaLauncherRailBackGuard).toEqual(
      expect.any(String),
    );

    // Now make the current entry someone else's while the hook still believes
    // it armed a guard. This is what a shared origin produces: the samples are
    // siblings in one history stack, so the entry behind us can belong to a
    // neighbouring app rather than to this launcher. Popping it would navigate
    // out of the launcher entirely.
    window.history.replaceState(
      { someOtherApp: 'sibling-entry' },
      '',
      window.location.href,
    );

    const back = vi.spyOn(window.history, 'back');
    try {
      notifications.focus();
      await waitFor(() => expect(notifications).toHaveFocus());

      // The guard is disarmed locally and focus is restored, but history is
      // left alone: we only traverse entries we can prove are ours.
      expect(back).not.toHaveBeenCalled();
      expect(window.history.state).toEqual({ someOtherApp: 'sibling-entry' });
    } finally {
      back.mockRestore();
    }
  });
});
