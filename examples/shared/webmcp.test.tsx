/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, waitFor } from '@testing-library/react';
import { useMemo } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { useWebMcpTools } from './webmcp';
import {
  executeWebMcpTestTool,
  installWebMcpTestHost,
} from './webmcpTestHost';

function TestTools({ value }: { value: string }) {
  const tools = useMemo(() => [{
    name: 'read_value',
    description: 'Returns the current test value.',
    annotations: { readOnlyHint: true },
    execute: () => ({ value }),
  }], [value]);
  useWebMcpTools(tools);
  return null;
}

afterEach(() => {
  delete (document as Document & { modelContext?: unknown }).modelContext;
});

describe('useWebMcpTools', () => {
  it('does nothing when WebMCP is unavailable', () => {
    expect(() => render(<TestTools value="first" />)).not.toThrow();
  });

  it('uses current handlers and unregisters on unmount', async () => {
    const host = installWebMcpTestHost();
    const view = render(<TestTools value="first" />);

    await waitFor(async () => {
      expect(await host.context.getTools()).toHaveLength(1);
    });
    expect(await executeWebMcpTestTool(
      host.context,
      'read_value',
    )).toEqual({ value: 'first' });

    view.rerender(<TestTools value="second" />);
    expect(await executeWebMcpTestTool(
      host.context,
      'read_value',
    )).toEqual({ value: 'second' });

    view.unmount();
    expect(await host.context.getTools()).toHaveLength(0);
    host.remove();
  });
});
