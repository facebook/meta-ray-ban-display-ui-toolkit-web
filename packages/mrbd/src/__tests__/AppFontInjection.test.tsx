/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../mrbd/app/App';

const NOTO_SANS_LINK_ID = 'uit-noto-sans-font';
const NOTO_SANS_LOCAL_STYLE_ID = 'uit-noto-sans-local-faces';

afterEach(() => {
  cleanup();
  // Font links/styles are injected into <head> and intentionally persist across
  // mounts; clear them so each test observes a clean injection.
  document
    .querySelectorAll(
      `link[rel="preconnect"], link[rel="stylesheet"], style#${NOTO_SANS_LOCAL_STYLE_ID}`,
    )
    .forEach(node => node.remove());
});

describe('App web font injection', () => {
  it('injects the Noto Sans stylesheet (weights 400/500/700) into <head>', () => {
    render(<App>content</App>);

    const stylesheet = document.getElementById(
      NOTO_SANS_LINK_ID,
    ) as HTMLLinkElement | null;
    expect(stylesheet).not.toBeNull();
    expect(stylesheet?.rel).toBe('stylesheet');
    expect(stylesheet?.href).toContain('family=Noto+Sans');
    expect(stylesheet?.href).toContain('wght@400;500;700');
  });

  it('adds the Google Fonts preconnect hints', () => {
    render(<App>content</App>);

    const preconnects = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="preconnect"]'),
    ).map(link => link.href);
    expect(preconnects.some(href => href.includes('fonts.googleapis.com'))).toBe(
      true,
    );
    expect(preconnects.some(href => href.includes('fonts.gstatic.com'))).toBe(
      true,
    );
  });

  it('registers local-only Noto Sans @font-face so an installed font is used with no download', () => {
    render(<App>content</App>);
    const localStyle = document.getElementById(NOTO_SANS_LOCAL_STYLE_ID);
    expect(localStyle).not.toBeNull();
    const css = localStyle?.textContent ?? '';
    expect(css).toContain("font-family: 'Noto Sans Local'");
    // Local sources only — these faces carry no url(), so an installed Noto Sans
    // satisfies the text with zero network requests.
    expect(css).toContain("local('Noto Sans')");
    expect(css).not.toContain('url(');
    // All three design-system weights are covered.
    for (const weight of ['400', '500', '700']) {
      expect(css).toContain(`font-weight: ${weight}`);
    }
  });

  it('injects no @font-face family other than the local Noto Sans alias', () => {
    render(<App>content</App>);
    // The App registers only the local Noto Sans alias. Assert via an allowlist:
    // every injected @font-face family must be the expected shipped family.
    const faceBlocks = document.head.innerHTML.match(/@font-face[^}]*}/gi) ?? [];
    for (const block of faceBlocks) {
      const family = block.match(/font-family:\s*'([^']+)'/i)?.[1];
      expect(family).toBe('Noto Sans Local');
    }
  });

  it('injects the font link and local faces only once across multiple App mounts', () => {
    render(
      <>
        <App>a</App>
        <App>b</App>
      </>,
    );
    expect(document.querySelectorAll(`link#${NOTO_SANS_LINK_ID}`).length).toBe(1);
    expect(
      document.querySelectorAll(`style#${NOTO_SANS_LOCAL_STYLE_ID}`).length,
    ).toBe(1);
  });
});
