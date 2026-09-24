/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../mrbd/app/App';
import { Button } from '../mrbd/ui/Button';

describe('App', () => {
  it('keeps app content full bleed', () => {
    const { container } = render(
      <App>
        <div>Content</div>
      </App>,
    );

    const root = container.querySelector('[data-app-root]');
    const contentRoot = container.querySelector('[data-app-content-root]');
    expect(root).not.toHaveAttribute('data-system-bar-inset');
    expect(contentRoot).toHaveAttribute('data-uit-tooltip-boundary');
    expect(contentRoot).toHaveAttribute('tabindex', '-1');
    expect(contentRoot).toHaveStyle({
      height: '100%',
      width: '100%',
    });
    expect((contentRoot as HTMLElement).style.marginTop).toBe('');
    expect((contentRoot as HTMLElement).style.paddingTop).toBe('');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('keeps the floating portal inside the content root', () => {
    const { container } = render(
      <App>
        <div>Content</div>
      </App>,
    );

    const contentRoot = container.querySelector<HTMLElement>('[data-app-content-root]');
    const portalRoot = container.querySelector<HTMLElement>('[data-app-floating-portal-root]');
    expect(contentRoot).toContainElement(portalRoot);
  });

  it('installs directional focus navigation for app content', () => {
    const { container } = render(
      <App>
        <button>First</button>
        <button>Second</button>
      </App>,
    );

    const contentRoot = container.querySelector<HTMLElement>('[data-app-content-root]');
    const first = screen.getByRole('button', { name: 'First' });
    const second = screen.getByRole('button', { name: 'Second' });
    contentRoot!.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
      toJSON: () => {},
    });
    first.getBoundingClientRect = () => ({
      x: 0,
      y: 20,
      left: 10,
      top: 20,
      right: 80,
      bottom: 60,
      width: 70,
      height: 40,
      toJSON: () => {},
    });
    second.getBoundingClientRect = () => ({
      x: 0,
      y: 20,
      left: 100,
      top: 20,
      right: 170,
      bottom: 60,
      width: 70,
      height: 40,
      toJSON: () => {},
    });

    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });

    expect(document.activeElement).toBe(second);
  });

  it('keeps the app content root focused when it has no interactables', () => {
    const { container } = render(
      <App>
        <div>Static content</div>
      </App>,
    );

    expect(document.activeElement).toBe(
      container.querySelector('[data-app-content-root]'),
    );
  });

  it('promotes focus from the app root to the first interactable', async () => {
    const boundsSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => ({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: 100,
        bottom: 40,
        width: 100,
        height: 40,
        toJSON: () => {},
      }));

    try {
      render(
        <App>
          <Button title="First action" />
        </App>,
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(
          screen.getByRole('button', { name: 'First action' }),
        );
      });
    } finally {
      boundsSpy.mockRestore();
    }
  });
});

describe('App theme reset scoping', () => {
  const TEST_DIR = dirname(fileURLToPath(import.meta.url));
  const THEME_CSS = readFileSync(
    resolve(TEST_DIR, '../../../foundation/src/theme/theme.css'),
    'utf8',
  );

  it('does not ship a global universal reset that leaks into consumers', () => {
    // A bare top-level `* { … }` rule is unlayered, so it overrides consumer
    // styles app-wide (e.g. Tailwind utilities) regardless of specificity.
    // The reset must never be applied via a standalone universal selector.
    expect(THEME_CSS).not.toMatch(/^\s*\*\s*\{/m);
  });

  it('does not globally restyle the consuming document <body>', () => {
    // Base typography/background belongs on the toolkit app root, not the
    // consumer's <body>.
    expect(THEME_CSS).not.toMatch(/^\s*body\s*\{/m);
  });

  it('scopes the box-sizing/margin/padding reset to the [data-app-root] subtree', () => {
    expect(THEME_CSS).toMatch(/:where\(\[data-app-root\] \*\)[\s\S]*?box-sizing:\s*border-box/);
    expect(THEME_CSS).toMatch(/:where\(\[data-app-root\] \*\)[\s\S]*?margin:\s*0/);
  });

  it('scopes base typography/background to the [data-app-root] subtree', () => {
    expect(THEME_CSS).toMatch(/:where\(\[data-app-root\]\)\s*\{[\s\S]*?font-family/);
    expect(THEME_CSS).toMatch(/:where\(\[data-app-root\]\)\s*\{[\s\S]*?background-color/);
  });

  it('applies the reset at zero specificity via :where() so component styles win', () => {
    // A bare `[data-app-root] *` reset is specificity (0,1,0); it ties with and
    // overrides single-class component rules (e.g. a tooltip's
    // `.contentContainer { padding: 8px 16px }`), silently zeroing their
    // padding/margin across the subtree. Wrapping the scope in :where() keeps it
    // at (0,0,0) — like the original global `*` reset — so component styles win.
    expect(THEME_CSS).toMatch(/:where\(\[data-app-root\] \*\)\s*\{[\s\S]*?padding:\s*0/);
    // The specificity-bearing, unwrapped subtree reset must not come back.
    expect(THEME_CSS).not.toMatch(/^\s*\[data-app-root\]\s*\*\s*\{/m);
  });

  it('the box-sizing/margin/padding reset rule carries ZERO specificity', () => {
    // Strongest regression guard for the tooltip-padding regression:
    // the reset rule must not carry ANY specificity, or it overrides component
    // styles. Extract the actual reset rule's selector list, remove every
    // :where(...) group (zero specificity by definition), and assert nothing
    // specificity-bearing (element/class/id/attribute) remains outside :where().
    const cssNoComments = THEME_CSS.replace(/\/\*[\s\S]*?\*\//g, '');
    const resetRule = cssNoComments.match(
      /([^{}]+)\{[^{}]*box-sizing:\s*border-box[^{}]*\}/,
    );
    expect(resetRule, 'could not find the box-sizing reset rule').not.toBeNull();
    const selectorsOutsideWhere = resetRule![1].replace(/:where\([^)]*\)/g, '');
    // Any leftover element/class/id/attribute token means the reset has
    // specificity and can override a component's own padding/margin.
    expect(selectorsOutsideWhere).not.toMatch(/[A-Za-z.#[\]]/);
  });

  it('keeps the :root design tokens global so components resolve them anywhere', () => {
    expect(THEME_CSS).toMatch(/:root\s*\{[\s\S]*?--uit-color-/);
  });

  it('renders the [data-app-root] scope anchor that the reset targets', () => {
    const { container } = render(
      <App>
        <div>Content</div>
      </App>,
    );
    expect(container.querySelector('[data-app-root]')).not.toBeNull();
  });
});
