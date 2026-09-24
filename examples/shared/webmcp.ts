/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useLayoutEffect, useRef } from 'react';

export type WebMcpToolInput = Record<string, unknown>;

export interface WebMcpToolExecutionOptions {
  signal: AbortSignal;
}

export interface WebMcpInputProperty {
  type: 'boolean' | 'integer' | 'number' | 'string';
  description?: string;
}

export interface WebMcpInputSchema {
  type: 'object';
  properties?: Record<string, WebMcpInputProperty>;
  required?: readonly string[];
}

export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema?: WebMcpInputSchema;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (
    input: WebMcpToolInput,
    options: WebMcpToolExecutionOptions,
  ) => unknown | Promise<unknown>;
}

export interface WebMcpRegisteredTool {
  name: string;
  description: string;
  inputSchema?: WebMcpInputSchema;
}

export interface WebMcpModelContext {
  registerTool(
    tool: WebMcpTool,
    options?: { signal?: AbortSignal },
  ): Promise<undefined>;
  getTools(): Promise<readonly WebMcpRegisteredTool[]>;
  executeTool(
    tool: WebMcpRegisteredTool,
    input?: string,
  ): Promise<string>;
}

type DocumentWithModelContext = Document & {
  modelContext?: unknown;
};

function isModelContext(value: unknown): value is WebMcpModelContext {
  if (value == null || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.registerTool === 'function' &&
    typeof candidate.getTools === 'function' &&
    typeof candidate.executeTool === 'function';
}

export function getWebMcpModelContext(): WebMcpModelContext | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const candidate = (document as DocumentWithModelContext).modelContext;
  return isModelContext(candidate) ? candidate : null;
}

function registrationKey(tools: readonly WebMcpTool[]): string {
  return JSON.stringify(tools.map(tool => ({
    annotations: tool.annotations,
    description: tool.description,
    inputSchema: tool.inputSchema,
    name: tool.name,
  })));
}

export function useWebMcpTools(tools: readonly WebMcpTool[]): void {
  const currentToolsRef = useRef(new Map<string, WebMcpTool>());
  const key = registrationKey(tools);

  // Registered tools dispatch through this map, so it is only ever written for
  // a render React committed. A discarded render must not change what an
  // already-registered tool calls.
  useLayoutEffect(() => {
    currentToolsRef.current = new Map(tools.map(tool => [tool.name, tool]));
  }, [tools]);

  useEffect(() => {
    const modelContext = getWebMcpModelContext();
    if (modelContext == null) {
      return;
    }

    const controller = new AbortController();
    const registeredTools = tools.map(tool => ({
      ...tool,
      execute: (
        input: WebMcpToolInput,
        options: WebMcpToolExecutionOptions,
      ) => {
        const currentTool = currentToolsRef.current.get(tool.name);
        if (currentTool == null) {
          throw new Error(`WebMCP tool is no longer available: ${tool.name}`);
        }
        return currentTool.execute(input, options);
      },
    }));

    const register = async () => {
      for (const tool of registeredTools) {
        if (controller.signal.aborted) {
          return;
        }
        try {
          await modelContext.registerTool(tool, {
            signal: controller.signal,
          });
        } catch (error) {
          if (!controller.signal.aborted) {
            console.warn(`Could not register WebMCP tool ${tool.name}.`, error);
          }
        }
      }
    };

    void register();
    return () => controller.abort();
  }, [key]);
}
