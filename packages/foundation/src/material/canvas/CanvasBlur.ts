/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Canvas 2D `filter: blur()` with a software fallback for engines that do not
 * implement `CanvasRenderingContext2D.filter` (Safari). Where the property
 * exists, drawing goes through the native filter unchanged.
 *
 * The fallback reproduces the native semantics: the blur length is measured in
 * canvas pixels (it does not inherit the context transform), the drawing is
 * blurred as an isolated layer that includes content up to 3 sigma outside the
 * canvas, and the context's clip, global alpha, and composite operation apply
 * when that layer is composited.
 */

type Canvas2D = CanvasRenderingContext2D;

let nativeCanvasFilter: boolean | null = null;

export function supportsNativeCanvasFilter(): boolean {
  if (nativeCanvasFilter == null) {
    nativeCanvasFilter =
      typeof CanvasRenderingContext2D === 'undefined' ||
      'filter' in CanvasRenderingContext2D.prototype;
  }
  return nativeCanvasFilter;
}

/** Test-only override of feature detection. Pass null to re-detect. */
export function setNativeCanvasFilterSupportForTesting(value: boolean | null): void {
  nativeCanvasFilter = value;
  pooledLayer = null;
}

/**
 * Runs `draw` against `ctx` with a gaussian blur of standard deviation `sigma`
 * canvas pixels applied to everything it draws. `draw` may run against a
 * different context with the same transform, so it must not depend on any
 * other `ctx` state. Returns false when the fallback has to draw unblurred
 * because an offscreen layer is unavailable or unreadable.
 */
export function drawWithCanvasBlur(
  ctx: Canvas2D,
  sigma: number,
  draw: (target: Canvas2D) => void,
): boolean {
  if (!(sigma > 0)) {
    draw(ctx);
    return true;
  }
  if (supportsNativeCanvasFilter()) {
    ctx.filter = `blur(${sigma}px)`;
    draw(ctx);
    ctx.filter = 'none';
    return true;
  }

  const pad = Math.ceil(sigma * 3);
  const width = ctx.canvas.width + pad * 2;
  const height = ctx.canvas.height + pad * 2;
  const layer = acquireLayer(width, height);
  if (layer == null) {
    draw(ctx);
    return false;
  }
  let readable = false;
  let unreadable = false;
  try {
    layer.ctx.save();
    try {
      const m = ctx.getTransform();
      layer.ctx.setTransform(m.a, m.b, m.c, m.d, m.e + pad, m.f + pad);
      layer.ctx.imageSmoothingEnabled = ctx.imageSmoothingEnabled;
      layer.ctx.imageSmoothingQuality = ctx.imageSmoothingQuality;
      draw(layer.ctx);
    } finally {
      layer.ctx.restore();
    }

    let blurred = false;
    try {
      const image = layer.ctx.getImageData(0, 0, width, height);
      readable = true;
      gaussianBlurImageData(image, sigma);
      layer.ctx.putImageData(image, 0, 0);
      blurred = true;
    } catch {
      unreadable = !readable;
    }

    ctx.save();
    try {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (blurred) {
        ctx.drawImage(layer.canvas, -pad, -pad);
      }
    } finally {
      ctx.restore();
    }
    if (!blurred) {
      draw(ctx);
    }
    return blurred;
  } finally {
    if (!readable) {
      if (unreadable) {
        // A size reset may restore origin-clean status, but only reuse after a read probe.
        layer.canvas.width = width;
      }
      try {
        layer.ctx.getImageData(0, 0, 1, 1);
        readable = true;
      } catch {
        // The browser may retain taint after a reset; never pool an unreadable layer.
      }
    }
    if (readable) {
      releaseLayer(layer);
    }
  }
}

interface Layer {
  canvas: HTMLCanvasElement;
  ctx: Canvas2D;
}

let pooledLayer: Layer | null = null;

function acquireLayer(width: number, height: number): Layer | null {
  let layer = pooledLayer;
  pooledLayer = null;
  if (layer == null) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx == null) {
      return null;
    }
    layer = { canvas, ctx };
  }
  if (layer.canvas.width !== width || layer.canvas.height !== height) {
    layer.canvas.width = width;
    layer.canvas.height = height;
  } else {
    layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
    layer.ctx.clearRect(0, 0, width, height);
  }
  layer.ctx.globalAlpha = 1;
  layer.ctx.globalCompositeOperation = 'source-over';
  return layer;
}

function releaseLayer(layer: Layer): void {
  pooledLayer = layer;
}

interface BlurBuffers {
  r: Float32Array;
  g: Float32Array;
  b: Float32Array;
  a: Float32Array;
  line: Float32Array;
  scratch: Float32Array;
}

let pooledBlurBuffers: BlurBuffers | null = null;
const MAX_POOLED_BLUR_PIXELS = 4_000_000;

function acquireBlurBuffers(n: number, lineLength: number): BlurBuffers {
  const buffers = pooledBlurBuffers;
  pooledBlurBuffers = null;
  if (buffers != null && buffers.r.length >= n && buffers.line.length >= lineLength) {
    return buffers;
  }
  return {
    r: new Float32Array(n),
    g: new Float32Array(n),
    b: new Float32Array(n),
    a: new Float32Array(n),
    line: new Float32Array(lineLength),
    scratch: new Float32Array(lineLength),
  };
}

/**
 * In-place gaussian blur of `image` (straight alpha), computed in
 * premultiplied space. Uses a sampled gaussian kernel for small sigma and the
 * three-box approximation from the filter effects spec otherwise.
 */
export function gaussianBlurImageData(image: ImageData, sigma: number): void {
  const { width, height, data } = image;
  const n = width * height;
  const buffers = acquireBlurBuffers(n, Math.max(width, height));
  const { r, g, b, a, line, scratch } = buffers;
  try {
    for (let i = 0, p = 0; i < n; i += 1, p += 4) {
      const alpha = data[p + 3];
      a[i] = alpha;
      if (alpha !== 0) {
        const k = alpha / 255;
        r[i] = data[p] * k;
        g[i] = data[p + 1] * k;
        b[i] = data[p + 2] * k;
      } else {
        r[i] = 0;
        g[i] = 0;
        b[i] = 0;
      }
    }
    for (const channel of [r, g, b, a]) {
      blurChannel(channel, width, height, sigma, line, scratch);
    }
    for (let i = 0, p = 0; i < n; i += 1, p += 4) {
      const alpha = a[i];
      if (alpha <= 0.5) {
        data[p] = 0;
        data[p + 1] = 0;
        data[p + 2] = 0;
        data[p + 3] = 0;
        continue;
      }
      const k = 255 / alpha;
      data[p] = r[i] * k;
      data[p + 1] = g[i] * k;
      data[p + 2] = b[i] * k;
      data[p + 3] = alpha;
    }
  } finally {
    if (n <= MAX_POOLED_BLUR_PIXELS) {
      pooledBlurBuffers = buffers;
    }
  }
}

function blurChannel(
  channel: Float32Array,
  width: number,
  height: number,
  sigma: number,
  line: Float32Array,
  scratch: Float32Array,
): void {
  for (let y = 0; y < height; y += 1) {
    const o = y * width;
    for (let x = 0; x < width; x += 1) line[x] = channel[o + x];
    blurLine(line, width, sigma, scratch);
    for (let x = 0; x < width; x += 1) channel[o + x] = line[x];
  }
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) line[y] = channel[y * width + x];
    blurLine(line, height, sigma, scratch);
    for (let y = 0; y < height; y += 1) channel[y * width + x] = line[y];
  }
}

const kernelCache = new Map<number, Float32Array>();
const MAX_KERNEL_CACHE_ENTRIES = 32;

function gaussianKernel(sigma: number): Float32Array {
  const cached = kernelCache.get(sigma);
  if (cached != null) {
    kernelCache.delete(sigma);
    kernelCache.set(sigma, cached);
    return cached;
  }
  const radius = Math.ceil(sigma * 3);
  const kernel = new Float32Array(radius * 2 + 1);
  let sum = 0;
  for (let i = -radius; i <= radius; i += 1) {
    const w = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + radius] = w;
    sum += w;
  }
  for (let i = 0; i < kernel.length; i += 1) kernel[i] /= sum;
  if (kernelCache.size >= MAX_KERNEL_CACHE_ENTRIES) {
    const oldest = kernelCache.keys().next().value;
    if (oldest != null) {
      kernelCache.delete(oldest);
    }
  }
  kernelCache.set(sigma, kernel);
  return kernel;
}

function blurLine(line: Float32Array, length: number, sigma: number, scratch: Float32Array): void {
  if (sigma < 2) {
    const kernel = gaussianKernel(sigma);
    const radius = (kernel.length - 1) / 2;
    for (let i = 0; i < length; i += 1) {
      let sum = 0;
      const lo = Math.max(0, i - radius);
      const hi = Math.min(length - 1, i + radius);
      for (let j = lo; j <= hi; j += 1) sum += line[j] * kernel[j - i + radius];
      scratch[i] = sum;
    }
    for (let i = 0; i < length; i += 1) line[i] = scratch[i];
    return;
  }
  const d = Math.floor(sigma * 3 * Math.sqrt(2 * Math.PI) / 4 + 0.5);
  if (d % 2 === 1) {
    const h = (d - 1) / 2;
    boxBlur(line, scratch, length, h, h);
    boxBlur(scratch, line, length, h, h);
    boxBlur(line, scratch, length, h, h);
  } else {
    const h = d / 2;
    boxBlur(line, scratch, length, h, h - 1);
    boxBlur(scratch, line, length, h - 1, h);
    boxBlur(line, scratch, length, h, h);
  }
  for (let i = 0; i < length; i += 1) line[i] = scratch[i];
}

/** out[i] = mean(src[i - left .. i + right]); samples outside are zero. */
function boxBlur(src: Float32Array, out: Float32Array, length: number, left: number, right: number): void {
  const size = left + right + 1;
  let sum = 0;
  for (let j = 0; j <= Math.min(right, length - 1); j += 1) sum += src[j];
  for (let i = 0; i < length; i += 1) {
    out[i] = sum / size;
    const add = i + right + 1;
    const remove = i - left;
    if (add < length) sum += src[add];
    if (remove >= 0) sum -= src[remove];
  }
}
