/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type ManifestIssue = {
  path: string;
  message: string;
  severity: 'error' | 'warning';
};

export type AppIconManifest = {
  version: number;
  name: string;
  description?: string;
  appearance: {
    theme_color?: string;
    icon: {
      src: string;
      type?: string;
    };
    icon_background?: {
      colors?: string[];
      stops?: number[];
      inner_glow_color?: string;
    };
  };
};

const COLOR_PATTERN = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function unknownKeyIssues(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
): ManifestIssue[] {
  return Object.keys(value)
    .filter(key => !allowed.includes(key))
    .map(key => ({
      path: `${path}.${key}`,
      message: 'Unknown key. Version 1 clients ignore this field.',
      severity: 'warning' as const,
    }));
}

export function isManifestColor(value: unknown): value is string {
  return typeof value === 'string' && COLOR_PATTERN.test(value);
}

export function validateManifest(value: unknown): ManifestIssue[] {
  if (!isObject(value)) {
    return [{ path: '$', message: 'Manifest must be a JSON object.', severity: 'error' }];
  }

  const issues = unknownKeyIssues(value, ['version', 'name', 'description', 'appearance'], '$');
  if (value.version !== 1) {
    issues.push({ path: '$.version', message: 'Version must be the integer 1.', severity: 'error' });
  }
  if (typeof value.name !== 'string' || value.name.trim().length === 0) {
    issues.push({ path: '$.name', message: 'Name is required and cannot be empty.', severity: 'error' });
  } else if ([...value.name.trim()].length > 100) {
    issues.push({ path: '$.name', message: 'Name cannot exceed 100 characters.', severity: 'error' });
  }
  if (value.description != null) {
    if (typeof value.description !== 'string') {
      issues.push({ path: '$.description', message: 'Description must be a string.', severity: 'error' });
    } else if ([...value.description].length > 500) {
      issues.push({ path: '$.description', message: 'Description cannot exceed 500 characters.', severity: 'error' });
    }
  }
  if (!isObject(value.appearance)) {
    issues.push({ path: '$.appearance', message: 'Appearance is required and must be an object.', severity: 'error' });
    return issues;
  }

  const appearance = value.appearance;
  issues.push(...unknownKeyIssues(
    appearance,
    ['theme_color', 'icon', 'icon_background'],
    '$.appearance',
  ));
  const themeIsValid = isManifestColor(appearance.theme_color);
  if (appearance.theme_color != null && !themeIsValid) {
    issues.push({
      path: '$.appearance.theme_color',
      message: 'Use #RGB, #RGBA, #RRGGBB, or #RRGGBBAA.',
      severity: 'error',
    });
  }

  if (!isObject(appearance.icon)) {
    issues.push({ path: '$.appearance.icon', message: 'Icon is required and must be an object.', severity: 'error' });
  } else {
    issues.push(...unknownKeyIssues(appearance.icon, ['src', 'type'], '$.appearance.icon'));
    if (typeof appearance.icon.src !== 'string' || appearance.icon.src.trim().length === 0) {
      issues.push({ path: '$.appearance.icon.src', message: 'Icon src is required.', severity: 'error' });
    }
    if (appearance.icon.type != null && appearance.icon.type !== 'monochrome') {
      issues.push({
        path: '$.appearance.icon.type',
        message: 'Icon type must be "monochrome" when present.',
        severity: 'error',
      });
    }
  }

  let gradientIsValid = false;
  const background = appearance.icon_background;
  if (background != null && !isObject(background)) {
    issues.push({
      path: '$.appearance.icon_background',
      message: 'Icon background must be an object.',
      severity: 'error',
    });
  } else if (isObject(background)) {
    issues.push(...unknownKeyIssues(
      background,
      ['colors', 'stops', 'inner_glow_color'],
      '$.appearance.icon_background',
    ));
    if (background.colors != null) {
      if (!Array.isArray(background.colors) || background.colors.length < 2) {
        issues.push({
          path: '$.appearance.icon_background.colors',
          message: 'Provide at least two gradient colors.',
          severity: 'error',
        });
      } else if (!background.colors.every(isManifestColor)) {
        issues.push({
          path: '$.appearance.icon_background.colors',
          message: 'Every gradient color must use a supported hexadecimal form.',
          severity: 'error',
        });
      } else {
        gradientIsValid = true;
      }
    }
    if (background.stops != null) {
      const stops = background.stops;
      const colorCount = Array.isArray(background.colors) ? background.colors.length : 0;
      const valid = Array.isArray(stops) &&
        stops.length >= 2 &&
        stops.length === colorCount &&
        stops.every((stop, index) =>
          typeof stop === 'number' && Number.isFinite(stop) && stop >= 0 && stop <= 1 &&
          (index === 0 || stop >= (stops[index - 1] as number)),
        );
      if (!valid) {
        issues.push({
          path: '$.appearance.icon_background.stops',
          message: 'Stops must match the colors, stay between 0 and 1, and never decrease. The device will otherwise choose standard stops.',
          severity: 'warning',
        });
      }
    }
    if (background.inner_glow_color != null && !isManifestColor(background.inner_glow_color)) {
      issues.push({
        path: '$.appearance.icon_background.inner_glow_color',
        message: 'Inner glow must use a supported hexadecimal form.',
        severity: 'error',
      });
    }
  }

  if (!themeIsValid && !gradientIsValid) {
    issues.push({
      path: '$.appearance',
      message: 'Provide a valid theme_color or at least two valid gradient colors.',
      severity: 'error',
    });
  }
  return issues;
}

export function parseAndValidateManifest(text: string): {
  manifest: AppIconManifest | null;
  issues: ManifestIssue[];
} {
  try {
    const value: unknown = JSON.parse(text);
    const issues = validateManifest(value);
    return {
      manifest: issues.some(issue => issue.severity === 'error')
        ? null
        : value as AppIconManifest,
      issues,
    };
  } catch (error) {
    return {
      manifest: null,
      issues: [{
        path: '$',
        message: error instanceof Error ? error.message : 'Invalid JSON.',
        severity: 'error',
      }],
    };
  }
}
