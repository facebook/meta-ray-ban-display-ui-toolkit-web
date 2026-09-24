/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import {
  FOCUSABLE_SELECTOR,
  FOCUS_CANDIDATE_SELECTOR,
} from '@wearables-ui-toolkit/foundation/base/FocusNavigationEvents';

function matches(selector: string, html: string): boolean {
  const host = document.createElement('div');
  host.innerHTML = html;
  const element = host.firstElementChild;
  return element != null && element.matches(selector);
}

describe('focus selectors', () => {
  // These two selectors look like duplicates and are not. Consumers of the
  // navigation selector filter only on visibility and geometry, so its
  // `:not()` qualifiers are the only thing keeping disabled controls and
  // `tabindex="-1"` out of the arrow-key order. The candidate selector is
  // deliberately broader because its callers re-filter afterwards.
  it.each([
    ['<button disabled>x</button>'],
    ['<input disabled />'],
    ['<div tabindex="-1">x</div>'],
  ])('keeps %s out of the navigation order', (html) => {
    expect(matches(FOCUSABLE_SELECTOR, html)).toBe(false);
    expect(matches(FOCUS_CANDIDATE_SELECTOR, html)).toBe(true);
  });

  it.each([
    ['<summary>x</summary>'],
    ['<div contenteditable="true">x</div>'],
    ['<area href="#" />'],
  ])('treats %s as a focus candidate only', (html) => {
    expect(matches(FOCUS_CANDIDATE_SELECTOR, html)).toBe(true);
    expect(matches(FOCUSABLE_SELECTOR, html)).toBe(false);
  });

  it.each([
    ['<button>x</button>'],
    ['<a href="#">x</a>'],
    ['<div tabindex="0">x</div>'],
  ])('matches %s in both', (html) => {
    expect(matches(FOCUSABLE_SELECTOR, html)).toBe(true);
    expect(matches(FOCUS_CANDIDATE_SELECTOR, html)).toBe(true);
  });
});
