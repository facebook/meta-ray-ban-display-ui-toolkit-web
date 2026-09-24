/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  WebMcpModelContext,
  WebMcpRegisteredTool,
  WebMcpTool,
  WebMcpToolInput,
} from './webmcp';

type DocumentWithModelContext = Document & {
  modelContext?: WebMcpModelContext;
};

export interface WebMcpTestHost {
  context: WebMcpModelContext;
  remove(): void;
}

export function installWebMcpTestHost(): WebMcpTestHost {
  const tools = new Map<string, WebMcpTool>();
  const context: WebMcpModelContext = {
    async registerTool(tool, options) {
      if (tools.has(tool.name)) {
        throw new DOMException(
          `Tool already registered: ${tool.name}`,
          'InvalidStateError',
        );
      }
      if (options?.signal?.aborted === true) {
        throw options.signal.reason;
      }

      tools.set(tool.name, tool);
      options?.signal?.addEventListener('abort', () => {
        if (tools.get(tool.name) === tool) {
          tools.delete(tool.name);
        }
      }, { once: true });
      return undefined;
    },
    async getTools() {
      return Array.from(tools.values(), tool => ({
        description: tool.description,
        inputSchema: tool.inputSchema,
        name: tool.name,
      }));
    },
    async executeTool(registeredTool, input = '{}') {
      const tool = tools.get(registeredTool.name);
      if (tool == null) {
        throw new Error(`Unknown WebMCP tool: ${registeredTool.name}`);
      }

      const parsedInput = JSON.parse(input) as WebMcpToolInput;
      const controller = new AbortController();
      const result = await tool.execute(parsedInput, {
        signal: controller.signal,
      });
      return typeof result === 'string' ? result : JSON.stringify(result);
    },
  };

  Object.defineProperty(document, 'modelContext', {
    configurable: true,
    value: context,
  });

  return {
    context,
    remove() {
      delete (document as DocumentWithModelContext).modelContext;
    },
  };
}

export async function executeWebMcpTestTool(
  context: WebMcpModelContext,
  name: string,
  input: WebMcpToolInput = {},
): Promise<unknown> {
  const tools = await context.getTools();
  const tool = tools.find(
    (candidate: WebMcpRegisteredTool) => candidate.name === name,
  );
  if (tool == null) {
    throw new Error(`WebMCP tool was not registered: ${name}`);
  }

  return JSON.parse(await context.executeTool(tool, JSON.stringify(input)));
}
