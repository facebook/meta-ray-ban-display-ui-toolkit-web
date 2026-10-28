/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SharedBoxResizeObserver } from '../../../foundation/src/utils/SharedBoxResizeObserver';
class NativeObserver {
  static instances: NativeObserver[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(readonly callback: ResizeObserverCallback) { NativeObserver.instances.push(this); }
  emit(...targets: Element[]) { this.callback(targets.map(target => ({ target } as ResizeObserverEntry)), this as unknown as ResizeObserver); }
  emitSized(target: Element, width: number, height: number) {
    const sizes = [{ inlineSize: width, blockSize: height }];
    this.callback([{ target, contentBoxSize: sizes, borderBoxSize: sizes } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
}
beforeEach(() => { NativeObserver.instances = []; vi.stubGlobal('ResizeObserver', NativeObserver); });
afterEach(() => vi.unstubAllGlobals());

describe('SharedBoxResizeObserver', () => {
  it('routes one shared native batch to each owner and releases only its own target', () => {
    const one = document.createElement('div'), two = document.createElement('div');
    const a = vi.fn(), b = vi.fn();
    const first = new SharedBoxResizeObserver(a), second = new SharedBoxResizeObserver(b);
    try {
      first.observe(one); second.observe(two);
      expect(NativeObserver.instances).toHaveLength(1);
      const native = NativeObserver.instances[0];
      native.emit(one, two);
      expect(a.mock.calls[0][0].map((entry: ResizeObserverEntry) => entry.target)).toEqual([one]);
      expect(b.mock.calls[0][0].map((entry: ResizeObserverEntry) => entry.target)).toEqual([two]);
      first.disconnect();
      expect(native.unobserve).toHaveBeenCalledWith(one);
      expect(native.disconnect).not.toHaveBeenCalled();
      a.mockClear(); native.emit(one, two);
      expect(a).not.toHaveBeenCalled();
      expect(b).toHaveBeenCalledTimes(2);
    } finally { first.disconnect(); second.disconnect(); }
    expect(NativeObserver.instances[0].disconnect).toHaveBeenCalledOnce();
  });

  it('preserves two native box modes and retains an empty content pool while border observation remains', () => {
    const root = document.createElement('div');
    const borderCallback = vi.fn();
    const border = new SharedBoxResizeObserver(borderCallback, 'border-box');
    const content = new SharedBoxResizeObserver(vi.fn());
    try {
      border.observe(root, { box: 'border-box' }); content.observe(root);
      expect(NativeObserver.instances).toHaveLength(2);
      expect(NativeObserver.instances[0].observe).toHaveBeenCalledWith(root, { box: 'border-box' });
      expect(NativeObserver.instances[1].observe).toHaveBeenCalledWith(root, { box: 'content-box' });
      content.disconnect();
      NativeObserver.instances[0].emitSized(root, 160, 80);
      expect(borderCallback).toHaveBeenCalledOnce();
      content.observe(root);
      expect(NativeObserver.instances).toHaveLength(2);
      expect(NativeObserver.instances[0].disconnect).not.toHaveBeenCalled();
    } finally { content.disconnect(); border.disconnect(); }
    expect(NativeObserver.instances.every(native => native.disconnect.mock.calls.length === 1)).toBe(true);
  });

  it('continues independent owner delivery and reports the original exception', () => {
    const error = new Error('owner failed');
    const report = vi.fn();
    vi.stubGlobal('reportError', report);
    const one = document.createElement('div'), two = document.createElement('div');
    const first = new SharedBoxResizeObserver(() => { throw error; });
    const callback = vi.fn(), second = new SharedBoxResizeObserver(callback);
    try {
      first.observe(one); second.observe(two);
      expect(() => NativeObserver.instances[0].emit(one, two)).not.toThrow();
      expect(callback).toHaveBeenCalledOnce();
      expect(report).toHaveBeenCalledOnce();
      expect(report).toHaveBeenCalledWith(error);
    } finally { first.disconnect(); second.disconnect(); }
  });

  it('preserves uncaught reporting through a deferred throw when reportError is unavailable', () => {
    const error = new Error('fallback owner failed');
    vi.stubGlobal('reportError', undefined);
    let deferred: (() => void) | undefined;
    const timer = vi.spyOn(window, 'setTimeout').mockImplementation(callback => {
      deferred = callback as () => void;
      return 1;
    });
    const one = document.createElement('div'), two = document.createElement('div');
    const first = new SharedBoxResizeObserver(() => { throw error; });
    const callback = vi.fn(), second = new SharedBoxResizeObserver(callback);
    try {
      first.observe(one); second.observe(two);
      NativeObserver.instances[0].emit(one, two);
      expect(callback).toHaveBeenCalledOnce();
      expect(deferred).toBeDefined();
      expect(() => deferred!()).toThrow(error);
    } finally { first.disconnect(); second.disconnect(); timer.mockRestore(); }
  });

  it('requests fresh initial delivery for a late owner without dropping existing subscribers', () => {
    const root = document.createElement('div');
    const a = vi.fn(), b = vi.fn();
    const first = new SharedBoxResizeObserver(a), late = new SharedBoxResizeObserver(b);
    try {
      first.observe(root); const native = NativeObserver.instances[0]; native.emitSized(root, 100, 40);
      late.observe(root);
      expect(native.unobserve).toHaveBeenCalledWith(root);
      expect(native.observe).toHaveBeenCalledTimes(2);
      native.emitSized(root, 100, 40);
      expect(a).toHaveBeenCalledOnce(); expect(b).toHaveBeenCalledOnce();
      native.emitSized(root, 110, 40);
      expect(a).toHaveBeenCalledTimes(2); expect(b).toHaveBeenCalledTimes(2);
      first.disconnect(); native.emitSized(root, 120, 40);
      expect(a).toHaveBeenCalledTimes(2); expect(b).toHaveBeenCalledTimes(3);
    } finally { first.disconnect(); late.disconnect(); }
  });
});
