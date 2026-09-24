/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { parseAndValidateManifest, validateManifest } from './manifest';

const validManifest = {
  version: 1,
  name: 'Trail guide',
  appearance: {
    theme_color: '#3867D6',
    icon: { src: '../icons/app-icon.svg', type: 'monochrome' },
  },
};

describe('manifest validation', () => {
  it('accepts a theme-color manifest', () => {
    expect(validateManifest(validManifest)).toEqual([]);
  });

  it('accepts a custom gradient without a theme color', () => {
    expect(validateManifest({
      version: 1,
      name: 'Weather',
      appearance: {
        icon: { src: '../icons/weather.svg' },
        icon_background: {
          colors: ['#72D9FF', '#111B55'],
          stops: [0, 1],
        },
      },
    })).toEqual([]);
  });

  it('reports malformed JSON', () => {
    expect(parseAndValidateManifest('{"version":')).toMatchObject({
      manifest: null,
      issues: [{ path: '$', severity: 'error' }],
    });
  });

  it('reports missing fields and unsupported icon types', () => {
    const issues = validateManifest({
      version: 2,
      name: '',
      appearance: { icon: { src: '', type: 'full-color' } },
    });
    expect(issues.map(issue => issue.path)).toEqual(expect.arrayContaining([
      '$.version',
      '$.name',
      '$.appearance.icon.src',
      '$.appearance.icon.type',
      '$.appearance',
    ]));
  });

  it('warns when stops fall back or unknown keys are ignored', () => {
    const issues = validateManifest({
      ...validManifest,
      future_field: true,
      appearance: {
        icon: { src: '../icons/app-icon.svg' },
        icon_background: {
          colors: ['#FFFFFF', '#000000'],
          stops: [0.8, 0.2],
        },
      },
    });
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: '$.future_field', severity: 'warning' }),
      expect.objectContaining({ path: '$.appearance.icon_background.stops', severity: 'warning' }),
    ]));
  });
});
