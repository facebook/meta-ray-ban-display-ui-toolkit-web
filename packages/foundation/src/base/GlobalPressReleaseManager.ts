/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Shared singleton that manages global window event listeners for press-release
 * detection. Instead of each InteractableBase instance adding ~7 listeners,
 * ONE set of listeners is shared across all instances.
 *
 * Instances register their release callbacks; when a global event fires the
 * manager iterates all registered callbacks. Listeners are only attached while
 * at least one instance is registered.
 */

type PressEndCallback = () => void;
type KeyUpCallback = (event: KeyboardEvent) => void;

interface RegisteredCallbacks {
  onPressEnd: PressEndCallback;
  onKeyUp: KeyUpCallback;
}

const registeredInstances = new Map<symbol, RegisteredCallbacks>();
let listenersAttached = false;

function handleGlobalPressEnd(): void {
  registeredInstances.forEach(({ onPressEnd }) => {
    onPressEnd();
  });
}

function handleGlobalKeyUp(event: KeyboardEvent): void {
  registeredInstances.forEach(({ onKeyUp }) => {
    onKeyUp(event);
  });
}

function attachListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  window.addEventListener('mouseup', handleGlobalPressEnd);
  window.addEventListener('pointerup', handleGlobalPressEnd);
  window.addEventListener('pointercancel', handleGlobalPressEnd);
  window.addEventListener('touchend', handleGlobalPressEnd);
  window.addEventListener('touchcancel', handleGlobalPressEnd);
  window.addEventListener('keyup', handleGlobalKeyUp);
  window.addEventListener('blur', handleGlobalPressEnd);
}

function detachListeners(): void {
  if (!listenersAttached) return;
  listenersAttached = false;

  window.removeEventListener('mouseup', handleGlobalPressEnd);
  window.removeEventListener('pointerup', handleGlobalPressEnd);
  window.removeEventListener('pointercancel', handleGlobalPressEnd);
  window.removeEventListener('touchend', handleGlobalPressEnd);
  window.removeEventListener('touchcancel', handleGlobalPressEnd);
  window.removeEventListener('keyup', handleGlobalKeyUp);
  window.removeEventListener('blur', handleGlobalPressEnd);
}

/**
 * Register an interactable instance's press-release callbacks.
 * Returns a unique key used to unregister later.
 */
export function registerPressReleaseCallbacks(
  onPressEnd: PressEndCallback,
  onKeyUp: KeyUpCallback,
): symbol {
  const key = Symbol();
  registeredInstances.set(key, { onPressEnd, onKeyUp });
  attachListeners();
  return key;
}

/**
 * Unregister an interactable instance. When the last instance unregisters,
 * global listeners are removed.
 */
export function unregisterPressReleaseCallbacks(key: symbol): void {
  registeredInstances.delete(key);
  if (registeredInstances.size === 0) {
    detachListeners();
  }
}
