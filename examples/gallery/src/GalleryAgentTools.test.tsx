/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { act, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  executeWebMcpTestTool,
  installWebMcpTestHost,
} from '../../shared/webmcpTestHost';
import { GalleryApp } from './App';

afterEach(() => {
  window.location.hash = '';
  delete (document as Document & { modelContext?: unknown }).modelContext;
});

describe('GalleryAgentTools', () => {
  it('keeps the gallery usable without WebMCP', () => {
    expect(() => render(<GalleryApp />)).not.toThrow();
  });

  it('opens a known component through the registered tool', async () => {
    const host = installWebMcpTestHost();
    render(<GalleryApp />);

    await waitFor(async () => {
      expect(await host.context.getTools()).toHaveLength(1);
    });
    let result: unknown;
    await act(async () => {
      result = await executeWebMcpTestTool(
        host.context,
        'open_component_demo',
        { component: 'ButtonRail' },
      );
    });

    expect(result).toMatchObject({
      opened: 'ButtonRail',
      route: '/actions/button-rail',
    });
    await waitFor(() => {
      expect(window.location.hash).toBe('#/actions/button-rail');
    });
    const historyLength = window.history.length;
    await act(async () => {
      await executeWebMcpTestTool(
        host.context,
        'open_component_demo',
        { component: 'ButtonRail' },
      );
    });
    expect(window.history.length).toBe(historyLength);
    host.remove();
  });

  it.each([
    ['Chip', '/actions/chip', 'ButtonRail', '/actions/button-rail'],
    ['ButtonRail', '/actions/button-rail', 'Chip', '/actions/chip'],
  ])(
    'lets the in-flight entry (%s) win over a later request',
    async (inFlightEntry, inFlightRoute, laterEntry, laterRoute) => {
      const host = installWebMcpTestHost();
      window.location.hash = '#/';
      render(<GalleryApp />);
      await waitFor(async () => {
        expect(await host.context.getTools()).toHaveLength(1);
      });

      // Start on the entry the *later* request names, which is the case the
      // committed-only guard short-circuited.
      await act(async () => {
        await executeWebMcpTestTool(host.context, 'open_component_demo', {
          component: laterEntry,
        });
      });
      await waitFor(() => {
        expect(window.location.hash).toBe(`#${laterRoute}`);
      });

      let results: unknown[] = [];
      await act(async () => {
        results = await Promise.all([
          executeWebMcpTestTool(host.context, 'open_component_demo', {
            component: inFlightEntry,
          }),
          executeWebMcpTestTool(host.context, 'open_component_demo', {
            component: laterEntry,
          }),
        ]);
      });

      // The in-flight navigation is the one that lands.
      await waitFor(() => {
        expect(window.location.hash).toBe(`#${inFlightRoute}`);
      });
      // Its own caller is told so.
      expect(results[0]).toMatchObject({
        opened: inFlightEntry,
        route: inFlightRoute,
      });
      // The later caller is told what is actually opening, not its own route.
      expect(results[1]).toMatchObject({
        error: 'navigation_in_progress',
        openingRoute: inFlightRoute,
        openingEntry: inFlightEntry,
      });
      expect(results[1]).not.toHaveProperty('opened');
      host.remove();
    },
  );

  it('coalesces concurrent requests for the same destination', async () => {
    const host = installWebMcpTestHost();
    window.location.hash = '#/';
    render(<GalleryApp />);
    await waitFor(async () => {
      expect(await host.context.getTools()).toHaveLength(1);
    });
    const historyLength = window.history.length;

    await act(async () => {
      await Promise.all([
        executeWebMcpTestTool(host.context, 'open_component_demo', {
          component: 'ButtonRail',
        }),
        executeWebMcpTestTool(host.context, 'open_component_demo', {
          component: 'ButtonRail',
        }),
      ]);
    });

    expect(window.location.hash).toBe('#/actions/button-rail');
    expect(window.history.length).toBe(historyLength + 1);
    host.remove();
  });

  it('returns suggestions without navigating for an unknown entry', async () => {
    const host = installWebMcpTestHost();
    window.location.hash = '#/';
    render(<GalleryApp />);

    await waitFor(async () => {
      expect(await host.context.getTools()).toHaveLength(1);
    });
    const result = await executeWebMcpTestTool(
      host.context,
      'open_component_demo',
      { component: 'progress' },
    );

    expect(result).toMatchObject({
      error: 'unknown_component',
      suggestions: ['ProgressIndicator', 'ProgressRing', 'CircularProgressBar'],
    });
    expect(window.location.hash).toBe('#/');
    host.remove();
  });
});
