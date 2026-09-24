/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../mrbd/app/App';
import { FloatingPortalRootProvider } from '@wearables-ui-toolkit/foundation/portal/FloatingPortalRoot';
import { InteractableTooltipPortal } from '@wearables-ui-toolkit/foundation/base/InteractableTooltipPortal';
import { TooltipPosition } from '@wearables-ui-toolkit/foundation/base/TooltipPositioning';
import type { TooltipPopupProps } from '@wearables-ui-toolkit/foundation/base/TooltipPopup.types';

function createAnchorRef() {
  const anchor = document.createElement('div');
  document.body.appendChild(anchor);
  anchor.getBoundingClientRect = vi.fn(() => ({
    x: 100,
    y: 100,
    top: 100,
    left: 100,
    right: 200,
    bottom: 140,
    width: 100,
    height: 40,
    toJSON: () => '',
  }));

  return { current: anchor };
}

interface TestRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

function createAnchorRefWithRect(rect: TestRect) {
  const anchor = document.createElement('div');
  document.body.appendChild(anchor);
  anchor.getBoundingClientRect = vi.fn(() => ({
    x: rect.left,
    y: rect.top,
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
    toJSON: () => '',
  }));

  Object.defineProperties(anchor, {
    offsetWidth: { configurable: true, value: rect.width },
    offsetHeight: { configurable: true, value: rect.height },
  });

  return { current: anchor };
}

function createTooltipProps(
  overrides: Partial<TooltipPopupProps> = {},
): TooltipPopupProps {
  return {
    isVisible: true,
    text: 'Portal tooltip',
    focusable: false,
    showTail: true,
    position: TooltipPosition.ANCHORED,
    anchorRef: createAnchorRef(),
    onFocusWithinChange: vi.fn(),
    onExited: vi.fn(),
    ...overrides,
  };
}

function mockTooltipPopupSize(width: number, height: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.getAttribute('role') === 'tooltip') {
      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        width,
        height,
        toJSON: () => '',
      };
    }

    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON: () => '',
    };
  });
}

describe('InteractableTooltipPortal', () => {
  afterEach(() => vi.restoreAllMocks());

  it('falls back to document body without a scoped portal root', () => {
    render(
      <InteractableTooltipPortal
        isMounted
        {...createTooltipProps()}
      />,
    );

    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip).toHaveTextContent('Portal tooltip');
    expect(tooltip.parentElement?.parentElement).toBe(document.body);
  });

  it('uses the scoped floating portal root when one is provided', () => {
    const portalRoot = document.createElement('div');
    document.body.appendChild(portalRoot);

    render(
      <FloatingPortalRootProvider root={portalRoot}>
        <InteractableTooltipPortal
          isMounted
          {...createTooltipProps({
            content: <TestContextMenu />,
            text: undefined,
          })}
        />
      </FloatingPortalRootProvider>,
    );

    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip).toContainElement(screen.getByRole('menu', { hidden: true }));
    expect(portalRoot).toContainElement(tooltip);
  });

  it('uses the app root portal for app-owned floating surfaces', async () => {
    render(
      <App>
        <InteractableTooltipPortal
          isMounted
          {...createTooltipProps()}
        />
      </App>,
    );

    const tooltip = await screen.findByRole('tooltip', { hidden: true });
    const appPortalRoot = document.querySelector('[data-app-floating-portal-root]');
    expect(appPortalRoot).toContainElement(tooltip);
  });

  it('keeps built-in bottom tooltips below the anchor and clamps instead of flipping', async () => {
    Object.defineProperties(window, {
      innerWidth: { configurable: true, value: 600 },
      innerHeight: { configurable: true, value: 600 },
    });
    mockTooltipPopupSize(107, 88);

    render(
      <InteractableTooltipPortal
        isMounted
        {...createTooltipProps({
          anchorRef: createAnchorRefWithRect({
            left: 32,
            top: 440,
            right: 239,
            bottom: 528,
            width: 207,
            height: 88,
          }),
          position: TooltipPosition.ANCHORED_BOTTOM,
        })}
      />,
    );

    const tooltip = await screen.findByRole('tooltip', { hidden: true });
    await waitFor(() => expect(tooltip).toHaveStyle({ top: '518px' }));
  });

  it('does not clamp built-in tooltips into view when the anchor is outside the boundary', async () => {
    Object.defineProperties(window, {
      innerWidth: { configurable: true, value: 600 },
      innerHeight: { configurable: true, value: 600 },
    });
    mockTooltipPopupSize(140, 88);

    render(
      <InteractableTooltipPortal
        isMounted
        {...createTooltipProps({
          anchorRef: createAnchorRefWithRect({
            left: 52,
            top: 1390,
            right: 230,
            bottom: 1462,
            width: 178,
            height: 72,
          }),
          text: 'Always',
          position: TooltipPosition.ANCHORED,
        })}
      />,
    );

    const tooltip = await screen.findByRole('tooltip', { hidden: true });
    await waitFor(() => expect(Number.parseFloat(tooltip.style.top)).toBeGreaterThan(600));
  });

  it('updates always tooltip placement as its anchor scrolls into and out of view', async () => {
    Object.defineProperties(window, {
      innerWidth: { configurable: true, value: 600 },
      innerHeight: { configurable: true, value: 600 },
    });
    mockTooltipPopupSize(140, 88);

    const anchorRect = {
      left: 52,
      top: 1390,
      right: 230,
      bottom: 1462,
      width: 178,
      height: 72,
    };

    render(
      <InteractableTooltipPortal
        isMounted
        {...createTooltipProps({
          anchorRef: createAnchorRefWithRect(anchorRect),
          text: 'Always',
          position: TooltipPosition.ANCHORED,
        })}
      />,
    );

    const tooltip = await screen.findByRole('tooltip', { hidden: true });
    await waitFor(() => expect(Number.parseFloat(tooltip.style.top)).toBeGreaterThan(600));

    Object.assign(anchorRect, {
      top: 343,
      bottom: 415,
    });
    window.dispatchEvent(new Event('scroll'));
    await waitFor(() => expect(Number.parseFloat(tooltip.style.top)).toBeLessThan(600));

    Object.assign(anchorRect, {
      top: 1390,
      bottom: 1462,
    });
    window.dispatchEvent(new Event('scroll'));
    await waitFor(() => expect(Number.parseFloat(tooltip.style.top)).toBeGreaterThan(600));
  });

  it('still auto-flips focusable tooltip content like context menus', async () => {
    Object.defineProperties(window, {
      innerWidth: { configurable: true, value: 600 },
      innerHeight: { configurable: true, value: 600 },
    });
    mockTooltipPopupSize(107, 88);

    render(
      <InteractableTooltipPortal
        isMounted
        {...createTooltipProps({
          anchorRef: createAnchorRefWithRect({
            left: 32,
            top: 440,
            right: 239,
            bottom: 528,
            width: 207,
            height: 88,
          }),
          content: <TestContextMenu />,
          text: undefined,
          focusable: true,
          position: TooltipPosition.ANCHORED_BOTTOM,
        })}
      />,
    );

    const tooltip = await screen.findByRole('tooltip', { hidden: true });
    await waitFor(() => expect(tooltip).toHaveStyle({ top: '360px' }));
  });

  it('anchors interactable tooltips to a target rect inside the anchor', async () => {
    Object.defineProperties(window, {
      innerWidth: { configurable: true, value: 600 },
      innerHeight: { configurable: true, value: 600 },
    });
    mockTooltipPopupSize(120, 60);

    render(
      <InteractableTooltipPortal
        isMounted
        {...createTooltipProps({
          anchorRef: createAnchorRefWithRect({
            left: 100,
            top: 100,
            right: 300,
            bottom: 180,
            width: 200,
            height: 80,
          }),
          centerPositionProvider: () => ({ x: 40, y: 20 }),
          targetRectProvider: () => ({
            left: 20,
            top: 10,
            right: 120,
            bottom: 50,
          }),
        })}
      />,
    );

    const tooltip = await screen.findByRole('tooltip', { hidden: true });
    await waitFor(() => {
      expect(tooltip).toHaveStyle({ left: '80px', top: '60px' });
    });
  });
});

function TestContextMenu() {
  return <div role="menu">Context menu body</div>;
}
