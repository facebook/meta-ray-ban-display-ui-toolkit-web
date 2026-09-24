/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ListItem } from '../mrbd/ui/ListItem';
import { SwipeToReveal } from '../mrbd/ui/SwipeToReveal';

const icon = {
  viewBox: '0 0 24 24',
  paths: [{ d: 'M0 0h24v24z' }],
};

describe('SwipeToReveal', () => {
  it('reveals on right key-up and returns focus on left key-up', () => {
    render(
      <SwipeToReveal
        actions={[{ icon, contentDescription: 'Delete', onClick: vi.fn() }]}
      >
        <ListItem title="Message" />
      </SwipeToReveal>,
    );
    const slot = screen.getByRole('button', { name: 'Message' });
    const action = screen.getByRole('button', { name: 'Delete', hidden: true });
    slot.focus();

    fireEvent.keyDown(slot, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(slot);
    fireEvent.keyUp(slot, { key: 'ArrowRight' });

    expect(document.activeElement).toBe(action);
    expect(action).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('status')).toHaveTextContent('Actions shown');

    fireEvent.keyDown(action, { key: 'ArrowLeft' });
    fireEvent.keyUp(action, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(slot);
    expect(action).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('status')).toHaveTextContent('Actions hidden');
  });

  it('moves between actions without hiding until left leaves the primary action', () => {
    render(
      <SwipeToReveal
        actions={[
          { icon, contentDescription: 'Pin', onClick: vi.fn() },
          { icon, contentDescription: 'Delete', onClick: vi.fn() },
        ]}
      >
        <ListItem title="Message" />
      </SwipeToReveal>,
    );
    const slot = screen.getByRole('button', { name: 'Message' });
    const pin = screen.getByRole('button', { name: 'Pin', hidden: true });
    const remove = screen.getByRole('button', { name: 'Delete', hidden: true });
    slot.focus();
    fireEvent.keyDown(slot, { key: 'ArrowRight' });
    fireEvent.keyUp(slot, { key: 'ArrowRight' });

    fireEvent.keyDown(pin, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(remove);
    fireEvent.keyDown(remove, { key: 'ArrowLeft' });
    fireEvent.keyUp(pin, { key: 'ArrowLeft' });

    expect(document.activeElement).toBe(pin);
    expect(screen.getByRole('status')).toHaveTextContent('Actions shown');
  });

  it('hides without consuming vertical navigation', () => {
    const onParentKeyDown = vi.fn();
    render(
      <div onKeyDown={onParentKeyDown}>
        <SwipeToReveal
          actions={[{ icon, contentDescription: 'Delete', onClick: vi.fn() }]}
        >
          <ListItem title="Message" />
        </SwipeToReveal>
      </div>,
    );
    const slot = screen.getByRole('button', { name: 'Message' });
    const action = screen.getByRole('button', { name: 'Delete', hidden: true });
    slot.focus();
    fireEvent.keyDown(slot, { key: 'ArrowRight' });
    fireEvent.keyUp(slot, { key: 'ArrowRight' });

    const wasNotCancelled = fireEvent.keyDown(action, { key: 'ArrowDown' });

    expect(wasNotCancelled).toBe(true);
    expect(onParentKeyDown).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(slot);
    expect(action).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('status')).toHaveTextContent('Actions hidden');
  });

  it('falls back to the slot when the child has no focusable descendant', () => {
    render(
      <SwipeToReveal
        actions={[{ icon, contentDescription: 'Delete', onClick: vi.fn() }]}
      >
        <div>Card</div>
      </SwipeToReveal>,
    );
    const slot = screen.getByText('Card').parentElement as HTMLElement;
    const action = screen.getByRole('button', { name: 'Delete', hidden: true });
    slot.focus();
    fireEvent.keyDown(slot, { key: 'ArrowRight' });
    fireEvent.keyUp(slot, { key: 'ArrowRight' });

    expect(document.activeElement).toBe(action);
    fireEvent.keyDown(action, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(slot);
  });

  it('clears pending directional key-up work when another key hides the tray', () => {
    render(
      <SwipeToReveal
        actions={[{ icon, contentDescription: 'Delete', onClick: vi.fn() }]}
      >
        <ListItem title="Message" />
      </SwipeToReveal>,
    );
    const slot = screen.getByRole('button', { name: 'Message' });
    const action = screen.getByRole('button', { name: 'Delete', hidden: true });
    slot.focus();
    fireEvent.keyDown(slot, { key: 'ArrowRight' });
    fireEvent.keyUp(slot, { key: 'ArrowRight' });

    fireEvent.keyDown(action, { key: 'ArrowLeft' });
    fireEvent.keyDown(action, { key: 'ArrowDown' });
    const staleKeyUp = new KeyboardEvent('keyup', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowLeft',
    });
    slot.dispatchEvent(staleKeyUp);

    expect(staleKeyUp.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(slot);
  });

  it('invokes the selected action and consumes Back while revealed', () => {
    const onClick = vi.fn();
    render(
      <SwipeToReveal
        actions={[{ icon, contentDescription: 'Delete', onClick }]}
      >
        <ListItem title="Message" />
      </SwipeToReveal>,
    );
    const slot = screen.getByRole('button', { name: 'Message' });
    const action = screen.getByRole('button', { name: 'Delete', hidden: true });
    slot.focus();
    fireEvent.keyDown(slot, { key: 'ArrowRight' });
    fireEvent.keyUp(slot, { key: 'ArrowRight' });
    fireEvent.click(action);
    expect(onClick).toHaveBeenCalledOnce();

    const keyDown = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });
    action.dispatchEvent(keyDown);
    expect(keyDown.defaultPrevented).toBe(true);
    fireEvent.keyUp(action, { key: 'Escape' });
    expect(document.activeElement).toBe(slot);
  });
});
