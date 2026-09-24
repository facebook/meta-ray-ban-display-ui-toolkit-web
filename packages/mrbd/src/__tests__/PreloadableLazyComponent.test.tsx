/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  Suspense,
} from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createPreloadableLazyComponent } from '@wearables-ui-toolkit/foundation/navigation/PreloadableLazyComponent';

describe('createPreloadableLazyComponent', () => {
  it('shares concurrent preload work', async () => {
    const loadModule = vi.fn(async () => ({
      Demo: () => <span>Demo</span>,
    }));
    const route = createPreloadableLazyComponent(loadModule, module => module.Demo);

    await Promise.all([route.preload(), route.preload()]);

    expect(loadModule).toHaveBeenCalledTimes(1);
  });

  it('retries after a rejected module load', async () => {
    let attempt = 0;
    const route = createPreloadableLazyComponent(
      async () => {
        attempt += 1;
        if (attempt === 1) {
          throw new Error('temporary failure');
        }
        return { Demo: () => <span>Demo</span> };
      },
      module => module.Demo,
    );

    await expect(route.preload()).rejects.toThrow('temporary failure');
    await expect(route.preload()).resolves.toBeUndefined();
    expect(attempt).toBe(2);
  });

  it('returns a rejected promise and retries after a synchronous loader throw', async () => {
    let attempt = 0;
    const loadModule = vi.fn(() => {
      attempt += 1;
      if (attempt === 1) {
        throw new Error('synchronous failure');
      }
      return Promise.resolve({ Demo: () => <span>Demo</span> });
    });
    const route = createPreloadableLazyComponent(
      loadModule,
      module => module.Demo,
    );

    const firstPreload = route.preload();
    expect(firstPreload).toBeInstanceOf(Promise);
    await expect(firstPreload).rejects.toThrow('synchronous failure');
    await expect(route.preload()).resolves.toBeUndefined();
    expect(loadModule).toHaveBeenCalledTimes(2);
  });

  it('replaces a rejected lazy instance before React retries rendering', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      let attempt = 0;
      const route = createPreloadableLazyComponent(
        async () => {
          attempt += 1;
          if (attempt === 1) {
            throw new Error('temporary render failure');
          }
          return { Demo: () => <span>Demo</span> };
        },
        module => module.Demo,
      );
      const LazyDemo = route.Component;
      render(
        <Suspense fallback={<span>Loading</span>}>
          <LazyDemo />
        </Suspense>,
      );

      expect(await screen.findByText('Demo')).toBeInTheDocument();
      expect(attempt).toBe(2);
    } finally {
      consoleError.mockRestore();
    }
  });
});
