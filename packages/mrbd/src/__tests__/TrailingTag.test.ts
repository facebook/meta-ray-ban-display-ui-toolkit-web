/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { getTrailingTagLabel, TrailingTag } from '../mrbd/ui/TrailingTag';

describe('TrailingTag', () => {
  it('resolves the built-in label by default', () => {
    expect(getTrailingTagLabel(TrailingTag.BETA)).toBe('Beta');
    expect(getTrailingTagLabel(TrailingTag.BETA, {})).toBe('Beta');
  });

  it.each(['Bêta', ' Bêta ', 'βήτα', 'ベータ'])(
    'preserves the nonblank localized label %s unchanged',
    label => {
      expect(
        getTrailingTagLabel(TrailingTag.BETA, {
          [TrailingTag.BETA]: label,
        }),
      ).toBe(label);
    },
  );

  it.each(['', '   ', '\n\t', '\u2000'])(
    'falls back when the localized label is blank',
    label => {
      expect(
        getTrailingTagLabel(TrailingTag.BETA, {
          [TrailingTag.BETA]: label,
        }),
      ).toBe('Beta');
    },
  );

  it('does not render a label for NONE', () => {
    expect(getTrailingTagLabel(TrailingTag.NONE)).toBeNull();
    expect(
      getTrailingTagLabel(TrailingTag.NONE, {
        [TrailingTag.BETA]: 'Bêta',
      }),
    ).toBeNull();
  });
});
