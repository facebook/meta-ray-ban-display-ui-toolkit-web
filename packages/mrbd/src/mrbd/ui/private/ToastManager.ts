/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  TOAST_ANIMATION_DURATION_MS,
  TOAST_DISPLAY_DURATION_MS,
  TOAST_QUEUE_DELAY_MS,
  TOAST_UPDATE_EVENT,
} from './ToastMetrics';
import { ToastStyle } from '../Toast.types';
import type {
  ToastData,
  ToastIdentifier,
  ToastPresentation,
} from '../Toast.types';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';

export interface ToastManagerState {
  incrementingId: number;
  toastQueue: ToastData[];
  currentToast: ToastData | null;
  renderedToast: ToastData | null;
  isVisible: boolean;
  enterTimer: ReturnType<typeof setTimeout> | null;
  displayTimer: ReturnType<typeof setTimeout> | null;
  hideTimer: ReturnType<typeof setTimeout> | null;
  queueDelayTimer: ReturnType<typeof setTimeout> | null;
}

declare global {
  interface Window {
    __uit_toast_state__?: ToastManagerState;
  }
}

/**
 * Inert, frozen state used for READS when there is no DOM (SSR / React Server
 * Components) — toasts only exist on the client. The public mutators
 * (`showManagedToast`/`cancelManagedToast`/`cancelAllManagedToasts`) early-return
 * under SSR so they never write to this frozen object; it backs the read paths
 * (`getToastPresentation`) so they return a stable empty presentation.
 */
const SSR_TOAST_STATE: ToastManagerState = Object.freeze({
  incrementingId: 0,
  toastQueue: Object.freeze([]) as readonly ToastData[] as ToastData[],
  currentToast: null,
  renderedToast: null,
  isVisible: false,
  enterTimer: null,
  displayTimer: null,
  hideTimer: null,
  queueDelayTimer: null,
}) as ToastManagerState;

function getManagerState(): ToastManagerState {
  if (typeof window === 'undefined') {
    return SSR_TOAST_STATE;
  }
  if (!window.__uit_toast_state__) {
    window.__uit_toast_state__ = {
      incrementingId: 0,
      toastQueue: [],
      currentToast: null,
      renderedToast: null,
      isVisible: false,
      enterTimer: null,
      displayTimer: null,
      hideTimer: null,
      queueDelayTimer: null,
    };
  }
  const state = window.__uit_toast_state__;
  state.renderedToast ??= state.currentToast;
  state.isVisible ??= state.currentToast !== null;
  state.enterTimer ??= null;
  state.hideTimer ??= null;
  return state;
}

function getNextId(): ToastIdentifier {
  const state = getManagerState();
  return state.incrementingId++;
}

export function getToastPresentation(): ToastPresentation {
  const state = getManagerState();
  return { toast: state.renderedToast, visible: state.isVisible };
}

export function subscribeToastPresentation(
  listener: (presentation: ToastPresentation) => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const handler = (event: Event) => {
    listener((event as CustomEvent<ToastPresentation>).detail);
  };
  window.addEventListener(TOAST_UPDATE_EVENT, handler);
  return () => {
    window.removeEventListener(TOAST_UPDATE_EVENT, handler);
  };
}

function notifyListeners(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent(TOAST_UPDATE_EVENT, { detail: getToastPresentation() }),
  );
}

function hasActiveLifecycle(state: ToastManagerState): boolean {
  return (
    state.currentToast !== null ||
    state.hideTimer !== null ||
    state.queueDelayTimer !== null
  );
}

function clearTimer(timer: ReturnType<typeof setTimeout> | null): void {
  if (timer) clearTimeout(timer);
}

function displayNextToast(): void {
  const state = getManagerState();
  if (hasActiveLifecycle(state)) {
    return;
  }
  if (state.toastQueue.length === 0) {
    state.renderedToast = null;
    state.isVisible = false;
    notifyListeners();
    return;
  }
  const toastData = state.toastQueue.shift();
  if (toastData) {
    showToastData(toastData);
  }
}

function showToastData(toastData: ToastData): void {
  const state = getManagerState();
  clearTimer(state.enterTimer);
  clearTimer(state.displayTimer);
  clearTimer(state.hideTimer);
  state.currentToast = toastData;
  state.renderedToast = toastData;
  state.isVisible = false;
  notifyListeners();

  state.enterTimer = setTimeout(() => {
    const currentState = getManagerState();
    if (currentState.currentToast?.token !== toastData.token) {
      return;
    }
    currentState.isVisible = true;
    currentState.enterTimer = null;
    notifyListeners();
  }, 16);

  state.displayTimer = setTimeout(() => {
    hideCurrentToast(toastData.token);
  }, TOAST_DISPLAY_DURATION_MS);
}

function completeCurrentToastHide(token: ToastIdentifier): void {
  const state = getManagerState();
  if (state.currentToast?.token !== token) {
    return;
  }
  state.currentToast = null;
  state.renderedToast = null;
  state.isVisible = false;
  state.hideTimer = null;
  notifyListeners();

  clearTimer(state.queueDelayTimer);
  state.queueDelayTimer = setTimeout(() => {
    const currentState = getManagerState();
    currentState.queueDelayTimer = null;
    displayNextToast();
  }, TOAST_QUEUE_DELAY_MS);
}

function hideCurrentToast(token?: ToastIdentifier): void {
  const state = getManagerState();
  if (state.currentToast === null) {
    return;
  }
  if (token !== undefined && state.currentToast.token !== token) {
    return;
  }

  const currentToken = state.currentToast.token;
  clearTimer(state.enterTimer);
  clearTimer(state.displayTimer);
  clearTimer(state.hideTimer);
  state.enterTimer = null;
  state.displayTimer = null;
  state.isVisible = false;
  notifyListeners();
  state.hideTimer = setTimeout(
    () => completeCurrentToastHide(currentToken),
    TOAST_ANIMATION_DURATION_MS,
  );
}

export function showManagedToast(
  message: string,
  metadata?: string,
  icon?: IconSource,
  style: ToastStyle = ToastStyle.STANDARD,
): ToastIdentifier {
  if (typeof window === 'undefined') {
    return 0;
  }
  const state = getManagerState();
  const token = getNextId();
  const toastData: ToastData = { message, metadata, icon, style, token };
  state.toastQueue.push(toastData);
  if (!hasActiveLifecycle(state)) {
    displayNextToast();
  }
  return token;
}

export function cancelManagedToast(token: ToastIdentifier): void {
  if (typeof window === 'undefined') {
    return;
  }
  const state = getManagerState();
  const queueIndex = state.toastQueue.findIndex((toast) => toast.token === token);
  if (queueIndex !== -1) {
    state.toastQueue.splice(queueIndex, 1);
  }
  if (state.currentToast?.token === token) {
    hideCurrentToast(token);
  }
}

export function cancelAllManagedToasts(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const state = getManagerState();
  // Clear the pending queue only, leaving the currently-shown toast and its
  // display/hide lifecycle running.
  state.toastQueue.length = 0;
  notifyListeners();
}
