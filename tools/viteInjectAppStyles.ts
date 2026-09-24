/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'node:path';
import MagicString from 'magic-string';
import ts from 'typescript';
import type {Plugin} from 'vite';

const CLIENT_DIRECTIVE = /^(?:\uFEFF)?\s*(?:"use client"|'use client')\s*;?/;

export function injectAppStyles(
  appChunkFileName: string,
  stylesheetFileName = 'styles.css',
): Plugin {
  const normalizedAppChunkFileName = path.posix.normalize(appChunkFileName);
  let foundAppChunk = false;

  return {
    name: 'inject-app-styles',
    buildStart() {
      foundAppChunk = false;
    },
    renderChunk(code, chunk) {
      if (path.posix.normalize(chunk.fileName) !== normalizedAppChunkFileName) {
        return null;
      }
      foundAppChunk = true;

      const relativeStylesheet = path.posix.relative(
        path.posix.dirname(chunk.fileName),
        stylesheetFileName,
      );
      const stylesheetSpecifier = relativeStylesheet.startsWith('.')
        ? relativeStylesheet
        : `./${relativeStylesheet}`;
      const styleImport = `import ${JSON.stringify(stylesheetSpecifier)};`;
      const directive = code.match(CLIENT_DIRECTIVE)?.[0];
      const sourceFile = ts.createSourceFile(
        chunk.fileName,
        code,
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.JS,
      );
      if (sourceFile.statements.some(statement => (
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        path.posix.normalize(statement.moduleSpecifier.text) ===
          path.posix.normalize(stylesheetSpecifier)
      ))) {
        return null;
      }
      const lastImport = sourceFile.statements
        .filter(ts.isImportDeclaration)
        .at(-1);
      const insertionOffset = lastImport?.end ?? directive?.length ?? 0;
      const transformed = new MagicString(code);
      transformed.appendLeft(
        insertionOffset,
        `${insertionOffset === 0 ? '' : '\n'}${styleImport}${lastImport == null ? '\n' : ''}`,
      );
      return {
        code: transformed.toString(),
        map: transformed.generateMap({
          hires: true,
          includeContent: true,
          source: chunk.fileName,
        }),
      };
    },
    generateBundle() {
      if (!foundAppChunk) {
        this.error(`Application entry chunk was not emitted: ${appChunkFileName}`);
      }
    },
  };
}
