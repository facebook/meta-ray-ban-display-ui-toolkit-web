/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../mrbd/ui/Button';
import type { ButtonHandle } from '../mrbd/ui/Button';

const motionPreference = vi.hoisted(() => ({ reduced: false }));
vi.mock('@wearables-ui-toolkit/foundation/motion/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => motionPreference.reduced,
}));

const START_ICON_SRC = '/icons/send.svg';
const UPDATED_ICON_SRC = '/icons/check.svg';

function getMaskUris(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll<HTMLElement>('span'))
    .map(element => element.style.maskImage || element.style.webkitMaskImage)
    .filter(Boolean);
}

function getLoader(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>(
    '[role="progressbar"][aria-hidden="true"]',
  );
}

afterEach(() => {
  motionPreference.reduced = false;
  vi.useRealTimers();
});

describe('Button loading', () => {
  it('replaces the icon with a decorative small loader and restores the latest icon state', () => {
    const view = render(
      <Button
        icon={START_ICON_SRC}
        title="Adding"
        showIconActiveIndicator
      />,
    );
    const button = screen.getByRole('button');
    act(() => button.focus());

    view.rerender(
      <Button
        icon={START_ICON_SRC}
        title="Adding"
        showIconActiveIndicator
        showLoader
      />,
    );

    const loader = getLoader(view.container);
    expect(loader).not.toBeNull();
    expect(loader?.className).toContain('small');
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByRole('button')).toHaveAccessibleName('Adding');
    expect(getMaskUris(view.container)).toEqual([]);
    expect(
      view.container.querySelector('[class*="iconIndicator"]'),
    ).toHaveStyle({ visibility: 'hidden' });
    expect(screen.getByRole('button')).toBe(button);
    expect(document.activeElement).toBe(button);

    view.rerender(
      <Button
        icon={{ uri: UPDATED_ICON_SRC }}
        title="Adding"
        showIconActiveIndicator
        showLoader
      />,
    );
    expect(getMaskUris(view.container)).toEqual([]);

    view.rerender(
      <Button
        icon={{ uri: UPDATED_ICON_SRC }}
        title="Adding"
        showIconActiveIndicator
      />,
    );

    const restoredUris = getMaskUris(view.container);
    expect(getLoader(view.container)).toBeNull();
    expect(restoredUris.some(uri => uri.includes('check.svg'))).toBe(true);
    expect(restoredUris.some(uri => uri.includes('send.svg'))).toBe(false);
    expect(
      view.container.querySelector('[class*="iconIndicator"]'),
    ).toHaveStyle({ visibility: 'visible' });
    expect(screen.getByRole('button')).toBe(button);
    expect(document.activeElement).toBe(button);
  });

  it('restores avatar props updated while loading', () => {
    const view = render(
      <Button
        avatarSrc="/avatars/original.webp"
        avatarAlt="Original contact"
        title="Call"
        showLoader
      />,
    );

    expect(getLoader(view.container)).not.toBeNull();
    expect(screen.queryByLabelText('Original contact')).toBeNull();

    view.rerender(
      <Button
        avatarSrc="/avatars/updated.webp"
        avatarAlt="Updated contact"
        title="Call"
        showLoader
      />,
    );
    expect(screen.queryByLabelText('Updated contact')).toBeNull();

    view.rerender(
      <Button
        avatarSrc="/avatars/updated.webp"
        avatarAlt="Updated contact"
        title="Call"
      />,
    );

    expect(getLoader(view.container)).toBeNull();
    expect(screen.getByLabelText('Updated contact')).toBeInTheDocument();
  });

  it('reveals a completed action transition after loading ends', () => {
    vi.useFakeTimers();
    const ref = createRef<ButtonHandle>();
    const view = render(
      <Button
        ref={ref}
        icon={START_ICON_SRC}
        title="Sending"
        showLoader
      />,
    );
    const button = screen.getByRole('button');
    act(() => button.focus());

    act(() => {
      ref.current?.animateActionTransition({
        endingIcon: { uri: UPDATED_ICON_SRC },
        endingTitle: 'Sent',
      });
      vi.advanceTimersByTime(600);
    });

    expect(getLoader(view.container)).not.toBeNull();
    expect(screen.getByRole('button')).toHaveAccessibleName('Sent');
    expect(getMaskUris(view.container)).toEqual([]);

    view.rerender(
      <Button
        ref={ref}
        icon={START_ICON_SRC}
        title="Sending"
      />,
    );

    expect(getLoader(view.container)).toBeNull();
    expect(
      getMaskUris(view.container).some(uri => uri.includes('check.svg')),
    ).toBe(true);
    expect(screen.getByRole('button')).toBe(button);
    expect(document.activeElement).toBe(button);
  });

  it('pauses the loader when reduced motion is requested', () => {
    motionPreference.reduced = true;
    const { container } = render(<Button title="Loading" showLoader />);

    expect(getLoader(container)?.className).toContain('Paused');
  });
});
