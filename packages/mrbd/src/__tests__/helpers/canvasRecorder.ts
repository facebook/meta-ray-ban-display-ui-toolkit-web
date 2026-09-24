/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Canvas 2D test double for material layer canvas rendering.
 *
 * jsdom does not implement Path2D or a real 2D context, so this module records
 * the drawing operations a layer's drawCanvas() issues instead of rasterizing.
 * Tests assert on MEANINGFUL behavior — which op ran (fill / stroke / gradient),
 * the resolved fill/stroke color, the blend mode, the alpha, the gradient color
 * stops, and whether anything drew at all — rather than exact pixel coordinates.
 */

import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import type {
  CanvasLayerDrawParams,
  MaterialShapeContext,
  MaterialStateTransition,
} from '@wearables-ui-toolkit/foundation';
import { defaultShapeProvider } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';

/** A single recorded draw call (method name + arguments) or property set. */
export interface RecordedCall {
  type: string;
  args: unknown[];
  /** Snapshot of the style props in effect when a paint op ran. */
  style?: {
    fillStyle: unknown;
    strokeStyle: unknown;
    globalAlpha: number;
    globalCompositeOperation: string;
    lineWidth: number;
    lineCap: string;
    lineJoin: string;
    shadowColor: string;
    shadowBlur: number;
    filter: string;
  };
}

/** A fake gradient that records the color stops added to it. */
export class FakeGradient {
  readonly kind: 'linear' | 'radial';
  readonly args: number[];
  readonly stops: Array<{ offset: number; color: string }> = [];

  constructor(kind: 'linear' | 'radial', args: number[]) {
    this.kind = kind;
    this.args = args;
  }

  addColorStop(offset: number, color: string): void {
    this.stops.push({ offset, color });
  }
}

/** A fake pattern that records setTransform calls. */
export class FakePattern {
  readonly transforms: unknown[] = [];
  setTransform(matrix: unknown): void {
    this.transforms.push(matrix);
  }
}

/**
 * A minimal Path2D stand-in. drawCanvas() only passes paths straight back into
 * the recorder, so the path needs no real geometry — it just needs an identity.
 */
export class FakePath2D {
  readonly addedPaths: unknown[] = [];
  addPath(path: unknown): void {
    this.addedPaths.push(path);
  }
}

/**
 * Records every method call and exposes the gradients/patterns it created so a
 * test can inspect color stops. Cast to CanvasRenderingContext2D when passed to
 * drawCanvas().
 */
export class CanvasRecorder {
  readonly calls: RecordedCall[] = [];
  readonly gradients: FakeGradient[] = [];
  readonly patterns: FakePattern[] = [];

  // Settable style props the material helpers read/write.
  fillStyle: unknown = '#000000';
  strokeStyle: unknown = '#000000';
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
  lineWidth = 1;
  lineCap = 'butt';
  lineJoin = 'miter';
  shadowColor = 'rgba(0, 0, 0, 0)';
  shadowBlur = 0;
  shadowOffsetX = 0;
  shadowOffsetY = 0;
  filter = 'none';

  private styleSnapshot(): NonNullable<RecordedCall['style']> {
    return {
      fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle,
      globalAlpha: this.globalAlpha,
      globalCompositeOperation: this.globalCompositeOperation,
      lineWidth: this.lineWidth,
      lineCap: this.lineCap,
      lineJoin: this.lineJoin,
      shadowColor: this.shadowColor,
      shadowBlur: this.shadowBlur,
      filter: this.filter,
    };
  }

  private record(type: string, args: unknown[], withStyle = false): void {
    this.calls.push(
      withStyle ? { type, args, style: this.styleSnapshot() } : { type, args },
    );
  }

  // --- State ---
  save(): void {
    this.record('save', []);
  }
  restore(): void {
    this.record('restore', []);
  }
  setTransform(...args: unknown[]): void {
    this.record('setTransform', args);
  }
  translate(x: number, y: number): void {
    this.record('translate', [x, y]);
  }
  scale(x: number, y: number): void {
    this.record('scale', [x, y]);
  }
  rotate(angle: number): void {
    this.record('rotate', [angle]);
  }

  // --- Paint ops (snapshot the active style) ---
  fill(path?: unknown): void {
    this.record('fill', path === undefined ? [] : [path], true);
  }
  stroke(path?: unknown): void {
    this.record('stroke', path === undefined ? [] : [path], true);
  }
  fillRect(x: number, y: number, w: number, h: number): void {
    this.record('fillRect', [x, y, w, h], true);
  }
  clearRect(x: number, y: number, w: number, h: number): void {
    this.record('clearRect', [x, y, w, h]);
  }
  clip(path?: unknown): void {
    this.record('clip', path === undefined ? [] : [path]);
  }
  drawImage(...args: unknown[]): void {
    this.record('drawImage', args, true);
  }

  // --- Gradients / patterns ---
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): FakeGradient {
    const gradient = new FakeGradient('linear', [x0, y0, x1, y1]);
    this.gradients.push(gradient);
    this.record('createLinearGradient', [x0, y0, x1, y1]);
    return gradient;
  }
  createRadialGradient(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number,
  ): FakeGradient {
    const gradient = new FakeGradient('radial', [x0, y0, r0, x1, y1, r1]);
    this.gradients.push(gradient);
    this.record('createRadialGradient', [x0, y0, r0, x1, y1, r1]);
    return gradient;
  }
  createPattern(): FakePattern {
    const pattern = new FakePattern();
    this.patterns.push(pattern);
    this.record('createPattern', []);
    return pattern;
  }

  // --- Query helpers ---
  /** Whether any of the given op types were recorded. */
  has(...types: string[]): boolean {
    return this.calls.some(call => types.includes(call.type));
  }

  /** All recorded calls of a given type. */
  ofType(type: string): RecordedCall[] {
    return this.calls.filter(call => call.type === type);
  }

  /** The paint calls (fill / stroke / fillRect / drawImage) with style snapshots. */
  get paintOps(): RecordedCall[] {
    return this.calls.filter(call => call.style != null);
  }
}

/** A minimal DOMMatrix stand-in for pattern.setTransform in jsdom. */
class FakeDOMMatrix {
  scaleSelf(): FakeDOMMatrix {
    return this;
  }
}

/**
 * jsdom returns null from HTMLCanvasElement.getContext('2d') and provides no
 * Path2D / DOMMatrix, which breaks the offscreen passes some layers run (inner
 * glow, gradient strokes, noise patterns). Install stubs that hand every
 * offscreen canvas its own recorder and provide a no-op DOMMatrix so those layers
 * can draw. Returns a restore function. Tests can optionally capture the
 * offscreen recorders to inspect intermediate rendering.
 */
export function installOffscreenCanvasStub(
  onContextCreated?: (recorder: CanvasRecorder) => void,
): () => void {
  const proto = HTMLCanvasElement.prototype as unknown as {
    getContext: (id: string) => unknown;
  };
  const originalGetContext = Object.getOwnPropertyDescriptor(proto, 'getContext');
  proto.getContext = function getContext(): unknown {
    const recorder = new CanvasRecorder();
    onContextCreated?.(recorder);
    return recorder;
  };

  const globalScope = globalThis as unknown as { DOMMatrix?: unknown };
  const hadDOMMatrix = 'DOMMatrix' in globalScope;
  const originalDOMMatrix = globalScope.DOMMatrix;
  if (!hadDOMMatrix) {
    globalScope.DOMMatrix = FakeDOMMatrix;
  }

  return () => {
    if (originalGetContext) {
      Object.defineProperty(proto, 'getContext', originalGetContext);
    }
    if (!hadDOMMatrix) {
      delete globalScope.DOMMatrix;
    } else {
      globalScope.DOMMatrix = originalDOMMatrix;
    }
  };
}

/** Default shape context for a rounded container. */
export function makeShapeContext(
  overrides: Partial<MaterialShapeContext> = {},
): MaterialShapeContext {
  return { shapeProvider: defaultShapeProvider, ...overrides };
}

export interface DrawParamsOverrides {
  state?: VisualState;
  transition?: MaterialStateTransition;
  width?: number;
  height?: number;
  shapeContext?: MaterialShapeContext;
  partialFocusPosition?: { x: number; y: number };
  dpr?: number;
  time?: number;
  noise?: CanvasImageSource | null;
  getImage?: (url: string) => CanvasImageSource | null;
}

/**
 * Build a minimal CanvasLayerDrawParams for a drawCanvas() call.
 *
 * lerpState evaluates valueForState at the resolved state when no transition is
 * active, otherwise it linearly blends the from/to values by progress — enough
 * to exercise mid-transition interpolation. getInsetStrokePath returns a fresh
 * FakePath2D so stroke layers have a path to hand back to the recorder.
 */
export function makeDrawParams(
  overrides: DrawParamsOverrides = {},
): CanvasLayerDrawParams {
  const state = overrides.state ?? VisualState.DEFAULT;
  const transition = overrides.transition;
  const path = new FakePath2D();

  const lerpState = (valueForState: (s: VisualState) => number): number => {
    if (transition == null) {
      return valueForState(state);
    }
    const from = valueForState(transition.from);
    const to = valueForState(transition.to);
    return from + (to - from) * transition.progress;
  };

  return {
    state,
    transition,
    path: path as unknown as Path2D,
    width: overrides.width ?? 300,
    height: overrides.height ?? 200,
    shapeContext: overrides.shapeContext ?? makeShapeContext(),
    partialFocusPosition: overrides.partialFocusPosition ?? { x: 0, y: 0 },
    dpr: overrides.dpr ?? 1,
    time: overrides.time ?? 0,
    assets: {
      noise: overrides.noise ?? null,
      getImage: overrides.getImage ?? (() => null),
    },
    lerpState,
    getInsetStrokePath: () => new FakePath2D() as unknown as Path2D,
  };
}

/** Run a layer's drawCanvas with a fresh recorder and return the recorder. */
export function drawLayer(
  layer: { drawCanvas?: (ctx: CanvasRenderingContext2D, p: CanvasLayerDrawParams) => void },
  overrides: DrawParamsOverrides = {},
): CanvasRecorder {
  const recorder = new CanvasRecorder();
  layer.drawCanvas?.(
    recorder as unknown as CanvasRenderingContext2D,
    makeDrawParams(overrides),
  );
  return recorder;
}
