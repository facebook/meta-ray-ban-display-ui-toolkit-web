#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import {
  parseDeclaration,
  validatePublicDeclarations,
} from '../../../tools/npm-release/validate-public-declarations.mjs';

const FOUNDATION_PACKAGE = '@wearables-ui-toolkit/foundation';
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const declarationRoot = path.resolve(packageRoot, 'dist');
const declarationPath = path.resolve(declarationRoot, 'index.d.ts');

const rootDeclaration = await parseDeclaration(declarationPath);
const exportsContainerMaterial = rootDeclaration.statements.some(statement => {
  if (
    !ts.isExportDeclaration(statement) ||
    statement.moduleSpecifier == null ||
    !ts.isStringLiteral(statement.moduleSpecifier) ||
    statement.moduleSpecifier.text !== FOUNDATION_PACKAGE ||
    statement.exportClause == null ||
    !ts.isNamedExports(statement.exportClause)
  ) {
    return false;
  }
  return statement.exportClause.elements.some(
    element => element.name.text === 'ContainerMaterial',
  );
});

if (!exportsContainerMaterial) {
  throw new Error(
    `MRBD declarations must re-export ContainerMaterial from ${FOUNDATION_PACKAGE}.`,
  );
}

await validatePublicDeclarations(packageRoot);
