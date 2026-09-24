/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WebAppIconPage } from './WebAppIconPage';

afterEach(cleanup);

const PREVIEW_SELECTOR = '.gallery-web-app-icon-demo-surface';

describe('WebAppIconPage', () => {
  it('renders each preview as an interactive container, not a static surface', () => {
    const { container } = render(<WebAppIconPage />);

    const previews = [...container.querySelectorAll<HTMLElement>(
      PREVIEW_SELECTOR,
    )];
    expect(previews.length).toBeGreaterThan(0);

    for (const preview of previews) {
      // The interaction marker is what proves the preview is a Container
      // carrying the material rather than a display-only surface: it is what
      // drives the material's focused state on focus.
      expect(preview).toHaveAttribute('data-uit-interactable');
      expect(preview.tabIndex).toBe(0);
    }
  });

  it('gives each preview container focus, which is what drives the material state', () => {
    const { container } = render(<WebAppIconPage />);

    const preview = container.querySelector<HTMLElement>(PREVIEW_SELECTOR);
    expect(preview).not.toBeNull();

    preview?.focus();

    // Scope note: the focused state is painted to canvas by the material, so
    // jsdom cannot observe it here. What this asserts is the mechanism that
    // produces it — an interactive Container holding the focus. The rendered
    // focused state itself is verified on device against the same material on
    // an interactive surface.
    expect(document.activeElement).toBe(preview);
    expect(preview).toHaveAttribute('data-uit-interactable');
  });

  it('keeps every preview labelled for assistive technology', () => {
    const { container } = render(<WebAppIconPage />);

    for (const preview of container.querySelectorAll<HTMLElement>(
      PREVIEW_SELECTOR,
    )) {
      expect(preview).toHaveAccessibleName();
    }
  });

  it('exposes the fallback preview alongside the artwork previews', () => {
    render(<WebAppIconPage />);

    const fallback = screen.getByLabelText('Web app icon without artwork');
    expect(fallback).toHaveAttribute('data-uit-interactable');
  });
});
