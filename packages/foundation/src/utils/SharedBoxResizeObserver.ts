/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type ObserverConstructor = typeof ResizeObserver;
interface RealmPools {
  boxes: Map<ResizeObserverBoxOptions, Pool>;
}
interface Pool {
  observer: ResizeObserver;
  subscribers: Map<Element, Set<SharedBoxResizeObserver>>;
  realm: RealmPools;
}
const pools = new WeakMap<ObserverConstructor, RealmPools>();

function poolFor(target: Element, box: ResizeObserverBoxOptions): Pool {
  const view = target.ownerDocument.defaultView as (Window & typeof globalThis) | null;
  const constructor = view?.ResizeObserver ?? ResizeObserver;
  let realm = pools.get(constructor);
  if (realm == null) {
    realm = { boxes: new Map() };
    pools.set(constructor, realm);
  }
  let pool = realm.boxes.get(box);
  if (pool == null) {
    const subscribers = new Map<Element, Set<SharedBoxResizeObserver>>();
    const observer = new constructor(entries => {
      const deliveries = new Map<SharedBoxResizeObserver, ResizeObserverEntry[]>();
      for (const entry of entries) {
        subscribers.get(entry.target)?.forEach(subscriber => {
          const batch = deliveries.get(subscriber) ?? [];
          batch.push(entry);
          deliveries.set(subscriber, batch);
        });
      }
      deliveries.forEach((batch, subscriber) => {
        try {
          subscriber.deliver(batch);
        } catch (error) {
          if (typeof view?.reportError === 'function') {
            view.reportError(error);
          } else {
            (view ?? window).setTimeout(() => { throw error; }, 0);
          }
        }
      });
    });
    pool = { observer, subscribers, realm };
    realm.boxes.set(box, pool);
  }
  return pool;
}

/** One observation mode per owner; native observers are shared by realm and box mode. */
export class SharedBoxResizeObserver implements ResizeObserver {
  private readonly targets = new Map<Element, Pool>();
  private readonly reportedSizes = new WeakMap<Element, readonly ResizeObserverSize[]>();
  constructor(
    private readonly callback: ResizeObserverCallback,
    private readonly box: ResizeObserverBoxOptions = 'content-box',
  ) {}

  observe(target: Element, options?: ResizeObserverOptions): void {
    if (options?.box != null && options.box !== this.box) {
      throw new Error('SharedBoxResizeObserver cannot mix observation modes');
    }
    if (this.targets.has(target)) return;
    const pool = poolFor(target, this.box);
    let subscribers = pool.subscribers.get(target);
    const alreadyObserved = subscribers != null;
    if (subscribers == null) {
      subscribers = new Set();
      pool.subscribers.set(target, subscribers);
    }
    subscribers.add(this);
    this.targets.set(target, pool);
    // A newly subscribing owner needs a fresh initial delivery even if the box has not changed.
    if (alreadyObserved) pool.observer.unobserve(target);
    pool.observer.observe(target, { box: this.box });
  }

  unobserve(target: Element): void {
    const pool = this.targets.get(target);
    if (pool == null) return;
    this.targets.delete(target);
    this.reportedSizes.delete(target);
    const subscribers = pool.subscribers.get(target);
    if (subscribers == null) return;
    subscribers.delete(this);
    if (subscribers.size === 0) {
      pool.subscribers.delete(target);
      pool.observer.unobserve(target);
      if (Array.from(pool.realm.boxes.values()).every(box => box.subscribers.size === 0)) {
        pool.realm.boxes.forEach(box => box.observer.disconnect());
        pool.realm.boxes.clear();
      }
    }
  }

  disconnect(): void {
    for (const target of this.targets.keys()) this.unobserve(target);
  }

  deliver(entries: ResizeObserverEntry[]): void {
    const active = entries.filter(entry => {
      if (!this.targets.has(entry.target)) return false;
      const raw = (this.box === 'border-box' ? entry.borderBoxSize
        : this.box === 'device-pixel-content-box' ? entry.devicePixelContentBoxSize
        : entry.contentBoxSize) as readonly ResizeObserverSize[] | ResizeObserverSize | undefined;
      if (raw == null) return true;
      const sizes: readonly ResizeObserverSize[] = Array.isArray(raw) ? raw : [raw as ResizeObserverSize];
      if (sizes.length === 0) return true;
      const previous = this.reportedSizes.get(entry.target);
      if (previous?.length === sizes.length && previous.every((size, index) =>
        size.inlineSize === sizes[index].inlineSize && size.blockSize === sizes[index].blockSize)) return false;
      this.reportedSizes.set(entry.target, sizes);
      return true;
    });
    if (active.length > 0) this.callback(active, this);
  }
}
