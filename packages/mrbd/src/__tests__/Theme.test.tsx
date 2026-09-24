/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync } from 'node:fs';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { getCSSVariable } from '@wearables-ui-toolkit/foundation/theme/Theme';
import {
  THEME_ATTRIBUTE_CSS_VAR,
  ThemeAttribute,
} from '@wearables-ui-toolkit/foundation/theme/Theme.types';

const THEME_CSS = readFileSync(
  `${process.cwd()}/packages/foundation/src/theme/theme.css`,
  'utf8',
);
const SEMANTIC_COLORS_CSS = readFileSync(
  `${process.cwd()}/packages/foundation/src/theme/semantic-colors.css`,
  'utf8',
);

// CSS custom properties *declared* (not merely referenced) in theme.css — i.e.
// line-leading `--name:` declarations, ignoring `var(--name)` references.
const DECLARED_CSS_VARS = new Set(
  Array.from(THEME_CSS.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm), (m) => m[1]),
);

const DECLARED_COLOR_CSS_VARS = Array.from(DECLARED_CSS_VARS).filter(
  (cssVar) => cssVar.includes('color-'),
);

const ALL_ATTRIBUTES = Object.values(ThemeAttribute);

const LEGACY_COLOR_ALIASES = [
  '--uit-color-background-elevated',
  '--uit-color-background-primary',
  '--uit-color-background-secondary',
  '--uit-color-button-airesponse-background',
  '--uit-color-icon-on-color',
  '--uit-color-interactive-fill-default',
  '--uit-color-interactive-fill-focused',
  '--uit-color-negative',
  '--uit-color-positive',
  '--uit-color-surface-default',
  '--uit-color-surface-focused',
  '--uit-color-surface-pressed',
  '--uit-color-text-on-color',
  '--uit-color-text-tertiary',
  '--uit-color-utility-dark-overlay-75',
  '--uit-color-utility-occlude',
  '--uit-color-utility-transparent',
  '--uit-color-warning',
] as const;

describe('ThemeAttribute ↔ CSS variable mapping', () => {
  it('names every declared theme token with the --uit-* prefix', () => {
    for (const cssVar of DECLARED_CSS_VARS) {
      expect(cssVar.startsWith('--uit-')).toBe(true);
    }
  });

  it('maps every ThemeAttribute to a "--"-prefixed custom property (exhaustive)', () => {
    for (const attribute of ALL_ATTRIBUTES) {
      const cssVar = THEME_ATTRIBUTE_CSS_VAR[attribute];
      expect(cssVar, `no CSS variable mapped for ${attribute}`).toBeDefined();
      expect(cssVar.startsWith('--')).toBe(true);
    }
  });

  it('resolves every ThemeAttribute to a variable actually declared in theme.css', () => {
    // Guard: a camelCase or typo'd name is not declared in
    // theme.css, so the token silently fails to resolve and currentColor icons
    // fall back to black. Every mapped variable must exist in the stylesheet.
    for (const attribute of ALL_ATTRIBUTES) {
      const cssVar = THEME_ATTRIBUTE_CSS_VAR[attribute];
      expect(
        DECLARED_CSS_VARS.has(cssVar),
        `${attribute} → ${cssVar} is not declared in theme.css`,
      ).toBe(true);
    }
  });

  it('getCSSVariable wraps the mapped name and never emits the camelCase enum value', () => {
    for (const attribute of ALL_ATTRIBUTES) {
      expect(getCSSVariable(attribute)).toBe(
        `var(${THEME_ATTRIBUTE_CSS_VAR[attribute]})`,
      );
      // e.g. must be `var(--uit-color-icon-primary)`, never `var(--colorIconPrimary)`.
      expect(getCSSVariable(attribute)).not.toContain(attribute);
    }
  });

  it('every color ThemeAttribute maps to a --uit-color-* variable', () => {
    const colorAttributes = ALL_ATTRIBUTES.filter((a) => a.startsWith('color'));
    for (const attribute of colorAttributes) {
      expect(THEME_ATTRIBUTE_CSS_VAR[attribute].startsWith('--uit-color-')).toBe(
        true,
      );
    }
  });

  it('names every declared color token with the --uit-color-* prefix', () => {
    for (const cssVar of DECLARED_COLOR_CSS_VARS) {
      expect(cssVar.startsWith('--uit-color-')).toBe(true);
    }
  });

  it('does not declare legacy color aliases', () => {
    for (const alias of LEGACY_COLOR_ALIASES) {
      expect(DECLARED_CSS_VARS.has(alias)).toBe(false);
    }
  });
});

describe('semantic color utilities', () => {
  it.each([
    ['text', '--uit-color-text-secondary'],
    ['icon', '--uit-color-icon-secondary'],
  ])('pairs secondary %s color with semantic blending', (kind, colorToken) => {
    const classRule = SEMANTIC_COLORS_CSS.match(
      new RegExp(`\\.uit-color-${kind}-secondary\\s*\\{([^}]*)\\}`),
    )?.[1];

    expect(classRule).toContain(`color: var(${colorToken})`);
    expect(classRule).toContain(
      'mix-blend-mode: lighten !important',
    );
  });
});
