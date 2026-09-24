/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import {
  ICON_IMAGEVIEW_LEADING_MARGIN_WITH_TEXT,
  LeadingAccessoryRenderMode,
} from '../mrbd/ui/private/ButtonLayout';
import { measureButtonNaturalContentWidth } from '../mrbd/ui/private/ButtonMeasurement';

function setLayoutMetrics(
  element: HTMLElement,
  metrics: {
    offsetLeft?: number;
    offsetWidth?: number;
  },
): void {
  for (const [key, value] of Object.entries(metrics)) {
    Object.defineProperty(element, key, {
      configurable: true,
      value,
    });
  }
}

describe('measureButtonNaturalContentWidth', () => {
  it('returns zero before button refs are mounted', () => {
    expect(
      measureButtonNaturalContentWidth({
        outerContainer: null,
        contentView: null,
        renderMode: LeadingAccessoryRenderMode.NONE,
        hasText: false,
        classNames: {
          iconContent: 'icon',
          textContent: 'text',
          trailingTag: 'tag',
        },
      }),
    ).toBe(0);
  });

  it('measures margin-box width and restores temporary styles', () => {
    const outerContainer = document.createElement('div');
    const contentView = document.createElement('div');
    const icon = document.createElement('div');
    const text = document.createElement('div');
    const tag = document.createElement('div');
    const classNames = {
      iconContent: 'icon',
      textContent: 'text',
      trailingTag: 'tag',
    };
    icon.className = classNames.iconContent;
    text.className = classNames.textContent;
    tag.className = classNames.trailingTag;
    icon.style.marginLeft = `${ICON_IMAGEVIEW_LEADING_MARGIN_WITH_TEXT + 4}px`;
    text.style.marginRight = '8px';
    tag.style.marginRight = '6px';
    contentView.append(icon, text, tag);
    outerContainer.style.width = '72px';
    outerContainer.style.transition = 'width 300ms ease';
    contentView.style.width = '72px';
    setLayoutMetrics(icon, { offsetLeft: 10, offsetWidth: 32 });
    setLayoutMetrics(text, { offsetLeft: 54, offsetWidth: 100 });
    setLayoutMetrics(tag, { offsetLeft: 160, offsetWidth: 40 });

    const measured = measureButtonNaturalContentWidth({
      outerContainer,
      contentView,
      renderMode: LeadingAccessoryRenderMode.ICON,
      hasText: true,
      classNames,
    });

    expect(measured).toBe(160 - 4 + 40 + 6);
    expect(measured).toBeGreaterThan(
      54 - 4 + 100 + 8,
    );
    expect(outerContainer.style.width).toBe('72px');
    expect(outerContainer.style.transition).toBe('width 300ms ease');
    expect(contentView.style.width).toBe('72px');
  });
});
