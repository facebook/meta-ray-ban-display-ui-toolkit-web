/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FloatingPortalRootProvider } from '@wearables-ui-toolkit/foundation/portal/FloatingPortalRoot';
import { ToastContainerFrame } from '../mrbd/ui/private/ToastContainerFrame';
import { ToastStyle } from '../mrbd/ui/Toast.types';

const toast = {
  message: 'Saved',
  metadata: 'Just now',
  style: ToastStyle.STANDARD,
  token: 1,
};
const TOAST_CSS = readFileSync(
  `${process.cwd()}/packages/mrbd/src/mrbd/ui/Toast.module.css`,
  'utf8',
);

describe('ToastContainerFrame', () => {
  it('renders nothing without an active toast', () => {
    const { container } = render(
      <ToastContainerFrame toast={null} visible={false} />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders status frame with elevated chip content', () => {
    const { container } = render(
      <ToastContainerFrame toast={toast} visible className="custom-toast" />,
    );
    const status = screen.getByRole('status');

    expect(container.innerHTML).toBe('');
    expect(status).toHaveClass('custom-toast');
    expect(status).toHaveStyle({ position: 'fixed' });
    expect(TOAST_CSS).toMatch(/\.toastContainer\s*\{[^}]*overflow:\s*clip;/s);
    expect(status.textContent).toContain('Saved');
    expect(status.textContent).toContain('Just now');
    expect(status.querySelector('[class*="toastVisible"]')).not.toBeNull();
  });

  it('keeps hidden toast mounted during exit animation', () => {
    render(
      <ToastContainerFrame toast={toast} visible={false} />,
    );
    const status = screen.getByRole('status');

    expect(status.textContent).toContain('Saved');
    expect(status.querySelector('[class*="toastHidden"]')).not.toBeNull();
  });

  it('renders into the scoped app portal when one is available', () => {
    const portalRoot = document.createElement('div');
    document.body.appendChild(portalRoot);

    try {
      render(
        <FloatingPortalRootProvider root={portalRoot}>
          <ToastContainerFrame toast={toast} visible />
        </FloatingPortalRootProvider>,
      );

      const status = portalRoot.querySelector<HTMLElement>('[role="status"]');
      expect(status).not.toBeNull();
      expect(status).toHaveStyle({ position: 'absolute' });
      expect(status?.textContent).toContain('Saved');
    } finally {
      portalRoot.remove();
    }
  });
});
