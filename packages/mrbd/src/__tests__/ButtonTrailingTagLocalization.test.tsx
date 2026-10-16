/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, type ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../mrbd/ui/Button';
import type { ButtonHandle, ButtonProps } from '../mrbd/ui/Button';
import { TrailingTag } from '../mrbd/ui/TrailingTag';
import * as ButtonMeasurement from '../mrbd/ui/private/ButtonMeasurement';

vi.mock('@wearables-ui-toolkit/foundation/motion/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => true,
}));

const DEFAULT_PROPS: ButtonProps = {
  title: 'Try action',
  icon: '/icons/action.svg',
  alwaysShowText: true,
  trailingTag: TrailingTag.BETA,
};

function button(props: ComponentProps<typeof Button> = {}) {
  return <Button {...DEFAULT_PROPS} {...props} />;
}

describe('Button trailing-tag localization', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it.each([
    ['omitted map', undefined],
    ['omitted tag label', {}],
    ['empty label', { [TrailingTag.BETA]: '' }],
    ['whitespace-only label', { [TrailingTag.BETA]: ' \t\n\u00a0\u2003' }],
  ])('keeps the built-in tag label for an %s', (_name, trailingTagLabels) => {
    render(button({ trailingTagLabels }));

    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try action' })).toBeInTheDocument();
  });

  it.each(['Bêta', '测试', '  Bêta  '])('displays the supplied nonblank label unchanged: %s', label => {
    render(button({ trailingTagLabels: { [TrailingTag.BETA]: label } }));

    const tag = screen.getByText(label.trim());
    expect(tag.textContent).toBe(label);
    expect(tag.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByRole('button')).toHaveAccessibleName('Try action');
    expect(screen.queryByText('Beta')).toBeNull();
  });

  it.each([undefined, TrailingTag.NONE])('does not create a tag when the semantic tag is %s', trailingTag => {
    render(button({
      trailingTag,
      trailingTagLabels: { [TrailingTag.BETA]: 'Bêta' },
    }));

    expect(screen.queryByText('Bêta')).toBeNull();
    expect(screen.queryByText('Beta')).toBeNull();
    expect(screen.getByRole('button')).toHaveAccessibleName('Try action');
  });

  it('does not create an orphan tag on an icon-only action', () => {
    render(button({
      title: undefined,
      ariaLabel: 'Try action',
      trailingTagLabels: { [TrailingTag.BETA]: 'Bêta' },
    }));

    expect(screen.queryByText('Bêta')).toBeNull();
    expect(screen.getByRole('button')).toHaveAccessibleName('Try action');
  });

  it('updates locale and fallback in place without losing focus or activation', () => {
    const ref = createRef<ButtonHandle>();
    const onClick = vi.fn();
    const view = render(button({ ref, onClick }));
    const root = screen.getByRole('button');

    act(() => root.focus());
    for (const [trailingTagLabels, label] of [
      [{ [TrailingTag.BETA]: 'Bêta' }, 'Bêta'],
      [{ [TrailingTag.BETA]: 'Prueba' }, 'Prueba'],
      [{ [TrailingTag.BETA]: '' }, 'Beta'],
      [undefined, 'Beta'],
    ] as const) {
      view.rerender(button({ ref, onClick, trailingTagLabels }));
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(ref.current?.getElement()).toBe(root);
      expect(root).toHaveFocus();
      expect(root).toHaveAccessibleName('Try action');
      expect(root).not.toHaveAttribute('trailingTagLabels');
    }

    fireEvent.keyDown(root, { key: 'Enter', code: 'Enter' });
    fireEvent.keyUp(root, { key: 'Enter', code: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a decorative localized tag for a subtitle-only action', () => {
    render(button({
      title: undefined,
      subtitle: 'Short description',
      trailingTagLabels: { [TrailingTag.BETA]: 'Bêta' },
    }));

    expect(screen.getByRole('button')).toHaveAccessibleName('Short description');
    expect(screen.getByText('Bêta').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('adds and removes the semantic tag in place without changing focus or name', () => {
    const ref = createRef<ButtonHandle>();
    const labels = { [TrailingTag.BETA]: 'Bêta' };
    const view = render(button({ ref, trailingTag: TrailingTag.NONE, trailingTagLabels: labels }));
    const root = screen.getByRole('button');
    act(() => root.focus());

    for (const trailingTag of [TrailingTag.BETA, TrailingTag.NONE]) {
      view.rerender(button({ ref, trailingTag, trailingTagLabels: labels }));
      expect(screen.getByRole('button')).toBe(root);
      expect(ref.current?.getElement()).toBe(root);
      expect(root).toHaveFocus();
      expect(root).toHaveAccessibleName('Try action');
      if (trailingTag === TrailingTag.BETA) {
        expect(screen.getByText('Bêta')).toBeInTheDocument();
      } else {
        expect(screen.queryByText('Bêta')).toBeNull();
      }
    }
  });

  it('updates the localized tag without taking focus from another action', () => {
    const ref = createRef<ButtonHandle>();
    const content = (label: string) => (
      <>
        {button({ ref, trailingTagLabels: { [TrailingTag.BETA]: label } })}
        <Button title="Peer action" />
      </>
    );
    const view = render(content('Bêta'));
    const root = screen.getByRole('button', { name: 'Try action' });
    const peer = screen.getByRole('button', { name: 'Peer action' });
    act(() => peer.focus());

    view.rerender(content('Prueba'));

    expect(screen.getByRole('button', { name: 'Try action' })).toBe(root);
    expect(ref.current?.getElement()).toBe(root);
    expect(screen.getByText('Prueba')).toBeInTheDocument();
    expect(peer).toHaveFocus();
    expect(root).not.toHaveFocus();
  });

  it('keeps a localized disabled action named without allowing activation', () => {
    const onClick = vi.fn();
    render(button({ disabled: true, onClick, trailingTagLabels: { [TrailingTag.BETA]: 'Bêta' } }));
    const root = screen.getByRole('button', { name: 'Try action' });
    act(() => root.focus());

    fireEvent.keyDown(root, { key: 'Enter', code: 'Enter' });
    fireEvent.keyUp(root, { key: 'Enter', code: 'Enter' });

    expect(root).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Bêta')).toBeInTheDocument();
    expect(root).toHaveAccessibleName('Try action');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('remeasures and rearms font readiness only when the displayed tag changes', () => {
    const measurement = vi.spyOn(ButtonMeasurement, 'measureButtonNaturalContentWidth');
    const ready = Promise.resolve();
    const fontReadyThen = vi.spyOn(ready, 'then');
    const originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts');
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready } });

    try {
      const view = render(button({ trailingTagLabels: { [TrailingTag.BETA]: 'Bêta' } }));
      const root = screen.getByRole('button', { name: 'Try action' });
      expect(measurement).toHaveBeenCalled();
      expect(fontReadyThen).toHaveBeenCalled();
      measurement.mockClear();
      fontReadyThen.mockClear();

      view.rerender(button({
        id: 'unrelated-parent-update',
        trailingTagLabels: { [TrailingTag.BETA]: 'Bêta' },
      }));
      expect(root).toHaveAttribute('id', 'unrelated-parent-update');
      expect(screen.getByText('Bêta')).toBeInTheDocument();
      expect(measurement).not.toHaveBeenCalled();
      expect(fontReadyThen).not.toHaveBeenCalled();

      view.rerender(button({ trailingTagLabels: { [TrailingTag.BETA]: 'Prueba' } }));
      expect(screen.getByText('Prueba')).toBeInTheDocument();
      expect(measurement).toHaveBeenCalledTimes(1);
      expect(fontReadyThen).toHaveBeenCalledTimes(1);

      view.rerender(button({ trailingTagLabels: { [TrailingTag.BETA]: '' } }));
      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(measurement).toHaveBeenCalledTimes(2);
      expect(fontReadyThen).toHaveBeenCalledTimes(2);
      view.rerender(button({ trailingTagLabels: { [TrailingTag.BETA]: ' \t\u00a0\u2003' } }));
      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(measurement).toHaveBeenCalledTimes(2);
      expect(fontReadyThen).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('button', { name: 'Try action' })).toBe(root);
    } finally {
      cleanup();
      if (originalFonts != null) {
        Object.defineProperty(document, 'fonts', originalFonts);
      } else {
        Reflect.deleteProperty(document, 'fonts');
      }
      measurement.mockRestore();
      fontReadyThen.mockRestore();
    }
  });

  it.each([
    { trailingTag: TrailingTag.NONE },
    { title: undefined, ariaLabel: 'Try action' },
  ])('does not remeasure a localization change without a rendered tag: %o', props => {
    const measurement = vi.spyOn(ButtonMeasurement, 'measureButtonNaturalContentWidth');
    try {
      const view = render(button({ ...props, trailingTagLabels: { [TrailingTag.BETA]: 'Bêta' } }));
      expect(measurement).toHaveBeenCalled();
      measurement.mockClear();

      view.rerender(button({ ...props, trailingTagLabels: { [TrailingTag.BETA]: 'Prueba' } }));

      expect(screen.queryByText('Bêta')).toBeNull();
      expect(screen.queryByText('Prueba')).toBeNull();
      expect(screen.getByRole('button')).toHaveAccessibleName('Try action');
      expect(measurement).not.toHaveBeenCalled();
    } finally {
      measurement.mockRestore();
    }
  });

  it('keeps a completed action title when only its tag localization changes', () => {
    const ref = createRef<ButtonHandle>();
    const view = render(button({ ref }));
    const root = screen.getByRole('button');

    act(() => {
      ref.current?.animateActionTransition({
        endingIcon: '/icons/complete.svg',
        endingTitle: 'Complete',
      });
    });
    view.rerender(button({
      ref,
      trailingTagLabels: { [TrailingTag.BETA]: 'Bêta' },
    }));

    expect(screen.getByRole('button')).toBe(root);
    expect(root).toHaveAccessibleName('Complete');
    expect(screen.getByText('Bêta')).toBeInTheDocument();
    expect(screen.queryByText('Try action')).toBeNull();
  });
});
