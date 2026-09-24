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

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const declarationPath = path.resolve(
  packageRoot,
  'dist',
  'material',
  'ContainerMaterial.d.ts',
);
await validatePublicDeclarations(packageRoot);
const sourceFile = await parseDeclaration(declarationPath);
const containerMaterial = sourceFile.statements.find(
  statement =>
    ts.isClassDeclaration(statement) &&
    statement.name?.text === 'ContainerMaterial',
);

if (containerMaterial == null || !ts.isClassDeclaration(containerMaterial)) {
  throw new Error('ContainerMaterial declaration was not emitted.');
}

const constructors = containerMaterial.members.filter(
  ts.isConstructorDeclaration,
);
const constructorParameters = constructors[0]?.parameters ?? [];
if (
  constructors.length !== 1 ||
  constructorParameters.length !== 1 ||
  constructorParameters[0].type?.getText(sourceFile) !==
    'ContainerMaterialConfig'
) {
  throw new Error(
    'ContainerMaterial must expose only its public one-argument constructor.',
  );
}

let leakedLayerOwnership = false;
function inspectNode(node) {
  if (
    ts.isIdentifier(node) &&
    (node.text === 'OWNED_LAYERS' || node.text === 'layerOwnership')
  ) {
    leakedLayerOwnership = true;
  }
  ts.forEachChild(node, inspectNode);
}
inspectNode(sourceFile);

if (leakedLayerOwnership) {
  throw new Error(
    'ContainerMaterial declarations leaked the private layer-ownership token.',
  );
}
