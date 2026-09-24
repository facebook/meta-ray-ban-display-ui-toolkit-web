/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TextAppearance } from '@wearables-ui-toolkit/foundation/theme/TextAppearance';

const THEME_CSS = readFileSync(
  `${process.cwd()}/packages/foundation/src/theme/theme.css`,
  'utf8',
);
const DIMENSIONS_CSS = readFileSync(
  `${process.cwd()}/packages/foundation/src/theme/dimensions.css`,
  'utf8',
);
const TEXT_STYLES_CSS = readFileSync(
  `${process.cwd()}/packages/foundation/src/theme/text-styles.css`,
  'utf8',
);

const EXPECTED_FONT_STACK = "'Noto Sans Local', 'Noto Sans', system-ui, sans-serif";
const ALLOWED_FAMILIES = new Set(['Noto Sans Local', 'Noto Sans']);
const LEGACY_FALLBACKS = [
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Roboto',
];
const REMOVED_TYPOGRAPHY_TOKEN_PREFIXES = [
  '--font-family',
  '--font-size-',
  '--font-weight-',
  '--line-height-',
  '--uit-font-family-',
  '--uit-line-height-',
  '--uit-text-padding-block-',
  '--uit-text-size-',
];

function classRule(className: string): string {
  const match = TEXT_STYLES_CSS.match(
    new RegExp(`\\.${className}\\s*\\{([^}]*)\\}`),
  );
  return match?.[1] ?? '';
}

describe('UI Toolkit for Meta Ray-Ban Display typography', () => {
  it('defines every public appearance as a complete CSS class', () => {
    for (const className of Object.values(TextAppearance)) {
      const rule = classRule(className);
      expect(rule, className).toContain(`font-family: ${EXPECTED_FONT_STACK}`);
      expect(rule, className).toMatch(/font-size:\s*\d+(?:\.\d+)?px;/);
      expect(rule, className).toMatch(/line-height:\s*\d+(?:\.\d+)?px;/);
      expect(rule, className).toMatch(/font-weight:\s*\d+;/);
    }
  });

  it('uses the local-first Noto Sans stack for base and appearance text', () => {
    expect(THEME_CSS).toContain(`font-family: ${EXPECTED_FONT_STACK}`);
    for (const className of Object.values(TextAppearance)) {
      expect(classRule(className)).toContain(
        `font-family: ${EXPECTED_FONT_STACK}`,
      );
    }
  });

  it('does not expose piecemeal typography variables', () => {
    const css = `${THEME_CSS}\n${DIMENSIONS_CSS}\n${TEXT_STYLES_CSS}`;
    for (const prefix of REMOVED_TYPOGRAPHY_TOKEN_PREFIXES) {
      expect(css).not.toContain(prefix);
    }
  });

  it('declares only the allowed Noto Sans families', () => {
    for (const css of [THEME_CSS, DIMENSIONS_CSS, TEXT_STYLES_CSS]) {
      const declarations = css.match(/font-family[^;]*;/gi) ?? [];
      const quotedFamilies = declarations.flatMap(declaration =>
        [...declaration.matchAll(/'([^']+)'/g)].map(match => match[1]),
      );
      for (const family of quotedFamilies) {
        expect(ALLOWED_FAMILIES.has(family)).toBe(true);
      }
    }
  });

  it('drops legacy platform-specific font fallbacks', () => {
    for (const css of [THEME_CSS, DIMENSIONS_CSS, TEXT_STYLES_CSS]) {
      for (const legacy of LEGACY_FALLBACKS) {
        expect(css).not.toContain(legacy);
      }
    }
  });
});
