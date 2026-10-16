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
  it('measures unconstrained text and tag columns before restoring their allocation', () => {
    const outerContainer = document.createElement('div');
    const contentView = document.createElement('div');
    const text = document.createElement('div');
    const tag = document.createElement('div');
    const classNames = { iconContent: 'icon', textContent: 'text', trailingTag: 'tag' };
    text.className = classNames.textContent;
    tag.className = classNames.trailingTag;
    for (const child of [text, tag]) {
      child.style.flexShrink = '1';
      child.style.minWidth = '0px';
    }
    outerContainer.style.width = '344px';
    contentView.style.width = '344px';
    contentView.append(text, tag);
    setLayoutMetrics(text, { offsetLeft: 32, offsetWidth: 115 });
    setLayoutMetrics(tag, { offsetLeft: 175 });
    Object.defineProperty(tag, 'offsetWidth', {
      configurable: true,
      get: () => {
        expect(text.style.flexShrink).toBe('0');
        expect(text.style.minWidth).toBe('max-content');
        expect(tag.style.flexShrink).toBe('0');
        expect(tag.style.minWidth).toBe('max-content');
        return 249;
      },
    });

    expect(measureButtonNaturalContentWidth({
      outerContainer, contentView, renderMode: LeadingAccessoryRenderMode.NONE,
      hasText: true, classNames,
    })).toBe(424);
    for (const child of [text, tag]) {
      expect(child.style.flexShrink).toBe('1');
      expect(child.style.minWidth).toBe('0px');
    }
    expect(outerContainer.style.width).toBe('344px');
    expect(contentView.style.width).toBe('344px');
  });

  it('restores allocation and viewport styles if a layout read fails', () => {
    const outerContainer = document.createElement('div');
    const contentView = document.createElement('div');
    const tag = document.createElement('div');
    const classNames = { iconContent: 'icon', textContent: 'text', trailingTag: 'tag' };
    tag.className = classNames.trailingTag;
    tag.style.flexShrink = '1';
    tag.style.minWidth = '0px';
    outerContainer.style.width = '344px';
    outerContainer.style.transition = 'width 300ms ease';
    contentView.style.width = '344px';
    contentView.append(tag);
    Object.defineProperty(tag, 'offsetWidth', { get: () => { throw new Error('Layout read failed'); } });

    expect(() => measureButtonNaturalContentWidth({
      outerContainer, contentView, renderMode: LeadingAccessoryRenderMode.NONE,
      hasText: true, classNames,
    })).toThrow('Layout read failed');
    expect(tag.style.flexShrink).toBe('1');
    expect(tag.style.minWidth).toBe('0px');
    expect(outerContainer.style.width).toBe('344px');
    expect(outerContainer.style.transition).toBe('width 300ms ease');
    expect(contentView.style.width).toBe('344px');
  });

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

  it.each([
    LeadingAccessoryRenderMode.ICON,
    LeadingAccessoryRenderMode.LOADER,
  ])('measures margin-box width for %s mode and restores temporary styles', (renderMode) => {
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
      renderMode,
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
