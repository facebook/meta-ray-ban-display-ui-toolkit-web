/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

export async function collectDeclarationFiles(directory) {
  const declarations = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.resolve(directory, entry.name);
    if (entry.isDirectory()) {
      declarations.push(...await collectDeclarationFiles(entryPath));
    } else if (entry.isFile() && /\.d\.(?:c|m)?ts$/.test(entry.name)) {
      declarations.push(entryPath);
    }
  }
  return declarations.sort();
}

export async function parseDeclaration(declarationFile) {
  return ts.createSourceFile(
    declarationFile,
    await readFile(declarationFile, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function isAllowedModuleReference(
  reference,
  declarationFile,
  declarationRoot,
  allowedPackages,
) {
  if (
    allowedPackages.some(
      packageName =>
        reference === packageName || reference.startsWith(`${packageName}/`),
    )
  ) {
    return true;
  }
  if (!reference.startsWith('.')) return false;
  const resolved = path.resolve(path.dirname(declarationFile), reference);
  const relative = path.relative(declarationRoot, resolved);
  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

export function validateDeclarationModuleReferences(
  sourceFile,
  declarationFile,
  declarationRoot,
  allowedPackages,
) {
  for (const directive of sourceFile.typeReferenceDirectives) {
    if (
      !isAllowedModuleReference(
        directive.fileName,
        declarationFile,
        declarationRoot,
        allowedPackages,
      )
    ) {
      throw new Error(
        `${path.relative(declarationRoot, declarationFile)} contains a non-publishable type reference: ${directive.fileName}`,
      );
    }
  }

  function inspect(node) {
    let reference = null;
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier != null &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      reference = node.moduleSpecifier.text;
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    ) {
      reference = node.argument.literal.text;
    } else if (
      ts.isExternalModuleReference(node) &&
      node.expression != null &&
      ts.isStringLiteral(node.expression)
    ) {
      reference = node.expression.text;
    } else if (
      ts.isModuleDeclaration(node) &&
      ts.isStringLiteral(node.name)
    ) {
      reference = node.name.text;
    }
    if (
      reference != null &&
      !isAllowedModuleReference(
        reference,
        declarationFile,
        declarationRoot,
        allowedPackages,
      )
    ) {
      throw new Error(
        `${path.relative(declarationRoot, declarationFile)} contains a non-publishable module reference: ${reference}`,
      );
    }
    ts.forEachChild(node, inspect);
  }
  inspect(sourceFile);
}

export async function validatePublicDeclarations(packageRoot) {
  const declarationRoot = path.resolve(packageRoot, 'dist');
  const manifest = JSON.parse(
    await readFile(path.resolve(packageRoot, 'package.json'), 'utf8'),
  );
  const allowedPackages = [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ].sort();
  const declarations = await collectDeclarationFiles(declarationRoot);
  if (declarations.length === 0) {
    throw new Error(`${manifest.name} emitted no public declarations.`);
  }
  for (const declarationFile of declarations) {
    validateDeclarationModuleReferences(
      await parseDeclaration(declarationFile),
      declarationFile,
      declarationRoot,
      allowedPackages,
    );
  }
}
