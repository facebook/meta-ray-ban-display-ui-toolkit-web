/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const FOUNDATION_DIMENSIONS_CSS = readFileSync(
  `${process.cwd()}/packages/foundation/src/theme/dimensions.css`,
  'utf8',
);
const MRBD_DIMENSIONS_CSS = readFileSync(
  `${process.cwd()}/packages/mrbd/src/mrbd/theme/dimensions.css`,
  'utf8',
);
const MRBD_STYLES_SOURCE = readFileSync(
  `${process.cwd()}/packages/mrbd/src/styles.css`,
  'utf8',
);

const MRBD_COMPONENT_DIMENSIONS = {
  '--uit-button-icon-size': '32px',
  '--uit-button-icon-indicator-size': '4px',
  '--uit-button-icon-indicator-margin': '6px',
  '--uit-chip-min-height': '44px',
  '--uit-chip-image-size': '24px',
  '--uit-chip-text-margin-vertical': '6px',
  '--uit-listitem-icon-size': '32px',
  '--uit-listitem-media-size': '74px',
  '--uit-listitem-secondary-icon-size': '24px',
  '--uit-listitem-trailing-icon-container-size': '56px',
  '--uit-listitem-icon-start-margin': '16px',
  '--uit-listitem-icon-end-margin': '32px',
  '--uit-listitem-secondary-icon-end-margin': '6px',
  '--uit-listitem-status-icon-size': '24px',
  '--uit-listitem-status-indicator-size': '16px',
  '--uit-listitem-min-height': '120px',
  '--uit-listitem-status-indicators-height': '28px',
  '--uit-listitem-control-slider-min-width': '200px',
  '--uit-controltile-icon-container-size': '72px',
  '--uit-controltile-min-height': '120px',
  '--uit-appcontroltile-image-container-size': '72px',
  '--uit-appcontroltile-image-size': '40px',
  '--uit-appcontroltile-min-height': '120px',
  '--uit-appcontroltile-min-width': '144px',
  '--uit-appcontroltile-title-fade-width': '60px',
  '--uit-quick-reply-height': '72px',
  '--uit-quick-reply-min-width': '72px',
  '--uit-container-header-min-height': '94px',
  '--uit-container-header-icon-size': '36px',
  '--uit-container-header-icon-container-size': '56px',
  '--uit-divider-thickness': '2px',
} as const;

describe('theme ownership', () => {
  it('keeps specialized component dimensions in the Meta Ray-Ban Display package', () => {
    for (const [token, value] of Object.entries(MRBD_COMPONENT_DIMENSIONS)) {
      expect(MRBD_DIMENSIONS_CSS).toContain(`${token}: ${value};`);
      expect(FOUNDATION_DIMENSIONS_CSS).not.toContain(token);
    }
  });

  it('keeps the MRBD stylesheet limited to specialized dimensions', () => {
    expect(MRBD_STYLES_SOURCE).not.toContain(
      "@import '@wearables-ui-toolkit/foundation/styles.css';",
    );
    expect(MRBD_STYLES_SOURCE).toContain(
      "@import './mrbd/theme/dimensions.css';",
    );
  });
});
