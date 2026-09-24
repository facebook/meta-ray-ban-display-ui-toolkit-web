/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore } from 'react';
import type { CanvasMaterialAssets } from '../ContainerMaterial.types';

/**
 * Shared image loader for canvas materials.
 *
 * Canvas patterns and drawImage need a fully-loaded image, so textures and
 * dynamic image content are preloaded once and shared across every container.
 * Components subscribe through useCanvasMaterialAssets and re-render (triggering a
 * redraw) when any image finishes loading.
 */

const NOISE_TEXTURE_URL = new URL(
  '../assets/container_noise_texture.png',
  import.meta.url,
).href;

interface ImageEntry {
  image: HTMLImageElement;
  loaded: boolean;
  failedAt: number | null;
}

const MAX_CACHED_IMAGE_COUNT = 64;
const MAX_CACHED_IMAGE_BYTES = 32 * 1024 * 1024;
const IMAGE_RETRY_DELAY_MS = 30_000;
const imageCache = new Map<string, ImageEntry>();
const subscribers = new Set<() => void>();
let loadVersion = 0;

function notify(): void {
  loadVersion += 1;
  for (const subscriber of subscribers) {
    subscriber();
  }
}

function imageBytes(entry: ImageEntry): number {
  return entry.loaded
    ? entry.image.naturalWidth * entry.image.naturalHeight * 4
    : 0;
}

function trimImageCache(): void {
  let totalBytes = 0;
  imageCache.forEach(entry => {
    totalBytes += imageBytes(entry);
  });

  while (
    imageCache.size > 1 &&
    (imageCache.size > MAX_CACHED_IMAGE_COUNT || totalBytes > MAX_CACHED_IMAGE_BYTES)
  ) {
    const oldest = imageCache.entries().next().value as
      | [string, ImageEntry]
      | undefined;
    if (oldest == null) {
      return;
    }
    const [url, entry] = oldest;
    imageCache.delete(url);
    totalBytes -= imageBytes(entry);
    entry.image.onload = null;
    entry.image.onerror = null;
    entry.image.src = '';
  }
}

function touchImage(url: string, entry: ImageEntry): void {
  imageCache.delete(url);
  imageCache.set(url, entry);
}

function loadImage(url: string): HTMLImageElement | null {
  if (typeof window === 'undefined') {
    return null;
  }
  let entry = imageCache.get(url);
  if (
    entry?.failedAt != null &&
    performance.now() - entry.failedAt >= IMAGE_RETRY_DELAY_MS
  ) {
    imageCache.delete(url);
    entry = undefined;
  }
  if (entry == null) {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    entry = { image, loaded: false, failedAt: null };
    imageCache.set(url, entry);
    image.onload = () => {
      const current = imageCache.get(url);
      if (current?.image === image) {
        current.loaded = true;
        current.failedAt = null;
        touchImage(url, current);
        trimImageCache();
        notify();
      }
    };
    image.onerror = () => {
      const current = imageCache.get(url);
      if (current?.image === image) {
        current.failedAt = performance.now();
        notify();
      }
    };
    image.src = url;
    if (image.complete && image.naturalWidth > 0) {
      entry.loaded = true;
    }
    trimImageCache();
  } else if (entry.failedAt == null) {
    touchImage(url, entry);
  }
  return entry.loaded ? entry.image : null;
}

function getImage(url: string): CanvasImageSource | null {
  return loadImage(url);
}

function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

let snapshotVersion = -1;
let cachedSnapshot: CanvasMaterialAssets = { noise: null, getImage };

function getSnapshot(): CanvasMaterialAssets {
  if (snapshotVersion !== loadVersion) {
    snapshotVersion = loadVersion;
    cachedSnapshot = { noise: loadImage(NOISE_TEXTURE_URL), getImage };
  }
  return cachedSnapshot;
}

const SERVER_SNAPSHOT: CanvasMaterialAssets = {
  noise: null,
  getImage: () => null,
};

function getServerSnapshot(): CanvasMaterialAssets {
  return SERVER_SNAPSHOT;
}

function doNotSubscribe(): () => void {
  return () => {};
}

/** Subscribe to shared canvas assets only when a canvas surface needs them. */
export function useCanvasMaterialAssets(enabled: boolean = true): CanvasMaterialAssets {
  return useSyncExternalStore(
    enabled ? subscribe : doNotSubscribe,
    enabled ? getSnapshot : getServerSnapshot,
    getServerSnapshot,
  );
}
