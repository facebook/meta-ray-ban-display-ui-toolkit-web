/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { cleanup, render, screen } from '@testing-library/react';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { App } from './App';
import { usePlatform } from './PlatformContext';

const NOTO_SANS_LOCAL_STYLE_ID = 'uit-noto-sans-local-faces';
const NOTO_SANS_LINK_ID = 'uit-noto-sans-font';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, '');
  document.getElementById(NOTO_SANS_LOCAL_STYLE_ID)?.remove();
  document.getElementById(NOTO_SANS_LINK_ID)?.remove();
});

describe('App', () => {
  it('provides the Meta Ray-Ban Display platform to app content', () => {
    function PlatformValue() {
      return <span>{usePlatform()}</span>;
    }

    render(
      <App>
        <PlatformValue />
      </App>,
    );

    expect(screen.getByText('mrbd')).toBeInTheDocument();
  });

  it('leaves back navigation to the host router', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    window.history.replaceState({ idx: 1 }, '');

    render(
      <App>
        <span>content</span>
      </App>,
    );

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(back).not.toHaveBeenCalled();
  });
});
