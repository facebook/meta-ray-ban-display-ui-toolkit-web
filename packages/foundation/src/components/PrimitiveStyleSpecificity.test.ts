/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';

function readCss(fileName: string): string {
  return readFileSync(new URL(fileName, import.meta.url), 'utf8');
}

function extractRule(css: string, selector: string): string {
  const start = css.indexOf(selector);
  const end = css.indexOf('}', start);

  if (start < 0 || end < 0) {
    throw new Error(`Missing CSS rule for ${selector}`);
  }

  return css.slice(start, end + 1);
}

function renderWithLateBaseRule(
  baseRule: string,
  specializedRule: string,
  className: string,
): HTMLElement {
  const style = document.createElement('style');
  style.dataset.testStyle = 'primitive-specificity';
  style.textContent = `${specializedRule}\n${baseRule}`;
  document.head.appendChild(style);

  const element = document.createElement('div');
  element.className = className;
  document.body.appendChild(element);
  return element;
}

afterEach(() => {
  document.querySelectorAll('[data-test-style="primitive-specificity"]')
    .forEach(element => element.remove());
  document.body.replaceChildren();
});

describe('foundation primitive CSS specificity', () => {
  it('lets a specialized Container class override layout defaults', () => {
    const baseRule = extractRule(
      readCss('Container.module.css'),
      ':where(.container)',
    );
    const element = renderWithLateBaseRule(
      baseRule,
      '.specialized { display: flex; position: absolute; }',
      'container specialized',
    );
    const style = getComputedStyle(element);

    expect(style.display).toBe('flex');
    expect(style.position).toBe('absolute');
  });

  it('lets an IconImage host class override fill sizing', () => {
    const baseRule = extractRule(
      readCss('IconImage.module.css'),
      ':where(.fill)',
    );
    const element = renderWithLateBaseRule(
      baseRule,
      '.specialized { width: 20px; height: 24px; }',
      'fill specialized',
    );
    const style = getComputedStyle(element);

    expect(style.width).toBe('20px');
    expect(style.height).toBe('24px');
  });

  it('lets a TextView caller class override reset values', () => {
    const baseRule = extractRule(
      readCss('TextView.module.css'),
      ':where(.textView)',
    );
    const element = renderWithLateBaseRule(
      baseRule,
      '.specialized { margin: 12px; padding: 8px; }',
      'textView specialized',
    );
    const style = getComputedStyle(element);

    expect(style.margin).toBe('12px');
    expect(style.padding).toBe('8px');
  });
});
