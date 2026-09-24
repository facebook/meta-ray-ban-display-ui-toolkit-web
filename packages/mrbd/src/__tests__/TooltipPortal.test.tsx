/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createRef, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import { FloatingPortalRootProvider } from '@wearables-ui-toolkit/foundation/portal/FloatingPortalRoot';
import { PageTransition } from '@wearables-ui-toolkit/foundation/navigation/PageTransition';
import { TooltipPortal } from '../mrbd/ui/private/TooltipPortal';

describe('TooltipPortal', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders built-in tooltip content into the document body', () => {
    const tooltipRef = createRef<HTMLDivElement>();

    render(
      <TooltipPortal
        tooltipRef={tooltipRef}
        clipBoundary={{ top: 100, left: 100, right: 700, bottom: 700, width: 600, height: 600 }}
        position={{ top: 180, left: 220 }}
        isDismissing={false}
        options={{ text: 'Tooltip', metadata: 'Meta' }}
        accessibleLabel="Tooltip, Meta"
        tailDirection="down"
        tailCenterX={48}
      />,
    );

    const tooltip = screen.getByRole('tooltip', { name: 'Tooltip, Meta' });
    expect(tooltip).toBeInTheDocument();
    expect(tooltip.style.top).toBe('80px');
    expect(tooltip.style.left).toBe('120px');
    expect(document.body.contains(tooltip)).toBe(true);
  });

  it('renders tooltip content without replacing the portal contract', () => {
    const tooltipRef = createRef<HTMLDivElement>();

    render(
      <TooltipPortal
        tooltipRef={tooltipRef}
        clipBoundary={{ top: 0, left: 0, right: 300, bottom: 300, width: 300, height: 300 }}
        position={{ top: 20, left: 30 }}
        isDismissing
        options={{ content: <button>Action</button>, isFocusable: true }}
        accessibleLabel="Action tooltip"
      />,
    );

    const tooltip = screen.getByRole('tooltip', { name: 'Action tooltip' });
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(tooltip.style.pointerEvents).toBe('auto');
  });

  it('retains a portal focus owner while a page transition is active', async () => {
    const root = document.createElement('div');
    root.tabIndex = -1;
    document.body.appendChild(root);
    const portalRoot = document.createElement('div');
    document.body.appendChild(portalRoot);
    const tooltipRef = createRef<HTMLDivElement>();
    let startTransition: (() => void) | null = null;

    function Harness() {
      const [page, setPage] = useState('first');
      startTransition = () => setPage('second');
      return (
        <FloatingPortalRootProvider root={portalRoot}>
          <PageTransition transitionKey={page} initialFocus="none">
            <div>{page}</div>
          </PageTransition>
          <TooltipPortal
            tooltipRef={tooltipRef}
            clipBoundary={{
              top: 0,
              left: 0,
              right: 300,
              bottom: 300,
              width: 300,
              height: 300,
            }}
            position={{ top: 20, left: 30 }}
            isDismissing={false}
            options={{
              content: <Container onClick={() => {}}>Portal action</Container>,
              isFocusable: true,
            }}
            accessibleLabel="Action tooltip"
          />
        </FloatingPortalRootProvider>
      );
    }

    const view = render(<Harness />, { container: root });
    const portalAction = screen.getByRole('button', { name: 'Portal action' });

    try {
      act(() => {
        portalAction.focus();
      });
      act(() => {
        startTransition?.();
      });
      expect(document.querySelector('[data-page-transition-active="true"]'))
        .not.toBeNull();

      await act(async () => {
        root.focus();
        await Promise.resolve();
      });

      expect(document.activeElement).toBe(portalAction);
    } finally {
      view.unmount();
      root.remove();
      portalRoot.remove();
    }
  });
});
