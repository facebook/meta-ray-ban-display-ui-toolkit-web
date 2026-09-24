/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/*
 * Copyright 2022 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Modifications: Meta Platforms, Inc. adapted this file for TypeScript,
 * changed its data representation for JavaScript, and added SVG path
 * serialization. The modifications are licensed under the Apache License,
 * Version 2.0. See LICENSE, NOTICE, and UPSTREAM.md in this package.
 */

/**
 * AndroidX graphics-shapes RoundedPolygon path generation for TypeScript. The
 * toolkit builds card tails, tooltip arrows, and smooth rounded rectangles with
 * RoundedPolygon + CornerRounding; keeping that geometry centralized avoids
 * per-component approximations drifting apart.
 *
 * Derived from AndroidX `androidx.graphics.shapes`, part of the Android Open
 * Source Project and licensed under Apache-2.0. See UPSTREAM.md for source and
 * modification details.
 */
import type {
  AndroidXCubic as Cubic,
  AndroidXCornerRounding,
  AndroidXPoint as Point,
  AndroidXRoundedPolygonVertex,
} from './AndroidXShapes.types';

export type {
  AndroidXCornerRounding,
  AndroidXRoundedPolygonVertex,
} from './AndroidXShapes.types';

const DISTANCE_EPSILON = 1e-4;

export function generateAndroidXRoundedPolygonPath(
  vertices: AndroidXRoundedPolygonVertex[],
): string {
  if (vertices.length === 0) {
    return '';
  }

  if (vertices.length < 3) {
    const [first, ...rest] = vertices;
    return [
      `M ${formatPathNumber(first.x)},${formatPathNumber(first.y)}`,
      ...rest.map(v => `L ${formatPathNumber(v.x)},${formatPathNumber(v.y)}`),
    ].join(' ');
  }

  const cubics = roundedPolygonCubics(vertices);
  const first = cubics[0];
  const d = [
    `M ${formatPathNumber(anchor0X(first))},${formatPathNumber(anchor0Y(first))}`,
  ];

  for (const cubic of cubics) {
    d.push(
      `C ${formatPathNumber(control0X(cubic))},${formatPathNumber(control0Y(cubic))} ` +
        `${formatPathNumber(control1X(cubic))},${formatPathNumber(control1Y(cubic))} ` +
        `${formatPathNumber(anchor1X(cubic))},${formatPathNumber(anchor1Y(cubic))}`,
    );
  }

  d.push('Z');
  return d.join(' ');
}

export function formatPathNumber(n: number): string {
  return parseFloat(n.toFixed(4)).toString();
}

function roundedPolygonCubics(vertices: AndroidXRoundedPolygonVertex[]): Cubic[] {
  const n = vertices.length;
  const roundedCorners: RoundedCorner[] = [];

  for (let i = 0; i < n; i++) {
    roundedCorners.push(
      new RoundedCorner(
        vertices[(i + n - 1) % n],
        vertices[i],
        vertices[(i + 1) % n],
        vertices[i].rounding,
      ),
    );
  }

  const cutAdjusts = vertices.map((vertex, ix) => {
    const nextIx = (ix + 1) % n;
    const expectedRoundCut =
      roundedCorners[ix].expectedRoundCut + roundedCorners[nextIx].expectedRoundCut;
    const expectedCut = roundedCorners[ix].expectedCut + roundedCorners[nextIx].expectedCut;
    const next = vertices[nextIx];
    const sideSize = distance(vertex.x - next.x, vertex.y - next.y);

    if (expectedRoundCut > sideSize) {
      return { roundCutRatio: sideSize / expectedRoundCut, cutRatio: 0 };
    }
    if (expectedCut > sideSize) {
      return {
        roundCutRatio: 1,
        cutRatio: (sideSize - expectedRoundCut) / (expectedCut - expectedRoundCut),
      };
    }
    return { roundCutRatio: 1, cutRatio: 1 };
  });

  const corners = roundedCorners.map((corner, i) => {
    const cuts = [0, 1].map(delta => {
      const { roundCutRatio, cutRatio } = cutAdjusts[(i + n - 1 + delta) % n];
      return (
        corner.expectedRoundCut * roundCutRatio +
        (corner.expectedCut - corner.expectedRoundCut) * cutRatio
      );
    });
    return corner.getCubics(cuts[0], cuts[1]);
  });

  const features: Cubic[][] = [];
  for (let i = 0; i < n; i++) {
    const corner = corners[i];
    const nextCorner = corners[(i + 1) % n];
    features.push(corner);
    features.push([
      straightLine(
        anchor1X(corner[corner.length - 1]),
        anchor1Y(corner[corner.length - 1]),
        anchor0X(nextCorner[0]),
        anchor0Y(nextCorner[0]),
      ),
    ]);
  }

  return flattenFeatures(features, vertices[0]);
}

function flattenFeatures(features: Cubic[][], fallbackCenter: Point): Cubic[] {
  const cubics: Cubic[] = [];
  let firstCubic: Cubic | undefined;
  let lastCubic: Cubic | undefined;
  let firstFeatureSplitStart: Cubic[] | undefined;
  let firstFeatureSplitEnd: Cubic[] | undefined;

  if (features.length > 0 && features[0].length === 3) {
    const [start, end] = split(features[0][1], 0.5);
    firstFeatureSplitStart = [features[0][0], start];
    firstFeatureSplitEnd = [end, features[0][2]];
  }

  for (let i = 0; i <= features.length; i++) {
    let featureCubics: Cubic[] | undefined;
    if (i === 0 && firstFeatureSplitEnd) {
      featureCubics = firstFeatureSplitEnd;
    } else if (i === features.length) {
      featureCubics = firstFeatureSplitStart;
    } else {
      featureCubics = features[i];
    }

    if (!featureCubics) {
      break;
    }

    for (const cubic of featureCubics) {
      if (!zeroLength(cubic)) {
        if (lastCubic) {
          cubics.push(lastCubic);
        }
        lastCubic = cubic;
        if (!firstCubic) {
          firstCubic = cubic;
        }
      } else if (lastCubic) {
        const copied = copyCubic(lastCubic);
        copied.points[6] = anchor1X(cubic);
        copied.points[7] = anchor1Y(cubic);
        lastCubic = copied;
      }
    }
  }

  if (lastCubic && firstCubic) {
    cubics.push(
      cubic(
        anchor0X(lastCubic),
        anchor0Y(lastCubic),
        control0X(lastCubic),
        control0Y(lastCubic),
        control1X(lastCubic),
        control1Y(lastCubic),
        anchor0X(firstCubic),
        anchor0Y(firstCubic),
      ),
    );
  } else {
    cubics.push(
      cubic(
        fallbackCenter.x,
        fallbackCenter.y,
        fallbackCenter.x,
        fallbackCenter.y,
        fallbackCenter.x,
        fallbackCenter.y,
        fallbackCenter.x,
        fallbackCenter.y,
      ),
    );
  }

  return cubics;
}

class RoundedCorner {
  readonly d1: Point;
  readonly d2: Point;
  readonly cornerRadius: number;
  readonly smoothing: number;
  readonly expectedRoundCut: number;

  private readonly p0: Point;
  private readonly p1: Point;
  private readonly p2: Point;

  constructor(
    p0: Point,
    p1: Point,
    p2: Point,
    rounding: AndroidXCornerRounding | undefined,
  ) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;

    const v01 = subtract(p0, p1);
    const v21 = subtract(p2, p1);
    const d01 = pointDistance(v01);
    const d21 = pointDistance(v21);

    if (d01 > 0 && d21 > 0) {
      this.d1 = divide(v01, d01);
      this.d2 = divide(v21, d21);
      this.cornerRadius = rounding?.radius ?? 0;
      this.smoothing = rounding?.smoothing ?? 0;

      const cosAngle = dot(this.d1, this.d2);
      const sinAngle = Math.sqrt(Math.max(0, 1 - square(cosAngle)));
      this.expectedRoundCut =
        sinAngle > 1e-3 ? (this.cornerRadius * (cosAngle + 1)) / sinAngle : 0;
    } else {
      this.d1 = point(0, 0);
      this.d2 = point(0, 0);
      this.cornerRadius = 0;
      this.smoothing = 0;
      this.expectedRoundCut = 0;
    }
  }

  get expectedCut(): number {
    return (1 + this.smoothing) * this.expectedRoundCut;
  }

  getCubics(allowedCut0: number, allowedCut1: number = allowedCut0): Cubic[] {
    const allowedCut = Math.min(allowedCut0, allowedCut1);
    if (
      this.expectedRoundCut < DISTANCE_EPSILON ||
      allowedCut < DISTANCE_EPSILON ||
      this.cornerRadius < DISTANCE_EPSILON
    ) {
      return [straightLine(this.p1.x, this.p1.y, this.p1.x, this.p1.y)];
    }

    const actualRoundCut = Math.min(allowedCut, this.expectedRoundCut);
    const actualSmoothing0 = this.calculateActualSmoothingValue(allowedCut0);
    const actualSmoothing1 = this.calculateActualSmoothingValue(allowedCut1);
    const actualR = (this.cornerRadius * actualRoundCut) / this.expectedRoundCut;
    const centerDistance = Math.sqrt(square(actualR) + square(actualRoundCut));
    const center = add(
      this.p1,
      multiply(direction(add(this.d1, this.d2)), centerDistance),
    );
    const circleIntersection0 = add(this.p1, multiply(this.d1, actualRoundCut));
    const circleIntersection2 = add(this.p1, multiply(this.d2, actualRoundCut));
    const flanking0 = this.computeFlankingCurve(
      actualRoundCut,
      actualSmoothing0,
      this.p1,
      this.p0,
      circleIntersection0,
      circleIntersection2,
      center,
      actualR,
    );
    const flanking2 = reverse(
      this.computeFlankingCurve(
        actualRoundCut,
        actualSmoothing1,
        this.p1,
        this.p2,
        circleIntersection2,
        circleIntersection0,
        center,
        actualR,
      ),
    );

    return [
      flanking0,
      circularArc(
        center.x,
        center.y,
        anchor1X(flanking0),
        anchor1Y(flanking0),
        anchor0X(flanking2),
        anchor0Y(flanking2),
      ),
      flanking2,
    ];
  }

  private calculateActualSmoothingValue(allowedCut: number): number {
    if (allowedCut > this.expectedCut) {
      return this.smoothing;
    }
    if (allowedCut > this.expectedRoundCut) {
      return (
        (this.smoothing * (allowedCut - this.expectedRoundCut)) /
        (this.expectedCut - this.expectedRoundCut)
      );
    }
    return 0;
  }

  private computeFlankingCurve(
    actualRoundCut: number,
    actualSmoothingValue: number,
    corner: Point,
    sideStart: Point,
    circleSegmentIntersection: Point,
    otherCircleSegmentIntersection: Point,
    circleCenter: Point,
    actualR: number,
  ): Cubic {
    const sideDirection = direction(subtract(sideStart, corner));
    const curveStart = add(
      corner,
      multiply(sideDirection, actualRoundCut * (1 + actualSmoothingValue)),
    );
    const p = interpolatePoint(
      circleSegmentIntersection,
      divide(add(circleSegmentIntersection, otherCircleSegmentIntersection), 2),
      actualSmoothingValue,
    );
    const curveEnd = add(
      circleCenter,
      multiply(direction(subtract(p, circleCenter)), actualR),
    );
    const circleTangent = rotate90(subtract(curveEnd, circleCenter));
    const anchorEnd =
      lineIntersection(sideStart, sideDirection, curveEnd, circleTangent) ??
      circleSegmentIntersection;
    const anchorStart = divide(add(curveStart, multiply(anchorEnd, 2)), 3);
    return cubicFromPoints(curveStart, anchorStart, anchorEnd, curveEnd);
  }
}

function lineIntersection(p0: Point, d0: Point, p1: Point, d1: Point): Point | undefined {
  const rotatedD1 = rotate90(d1);
  const den = dot(d0, rotatedD1);
  if (Math.abs(den) < DISTANCE_EPSILON) {
    return undefined;
  }
  const num = dot(subtract(p1, p0), rotatedD1);
  if (Math.abs(den) < DISTANCE_EPSILON * Math.abs(num)) {
    return undefined;
  }
  return add(p0, multiply(d0, num / den));
}

function point(x: number, y: number): Point {
  return { x, y };
}

function add(a: Point, b: Point): Point {
  return point(a.x + b.x, a.y + b.y);
}

function subtract(a: Point, b: Point): Point {
  return point(a.x - b.x, a.y - b.y);
}

function multiply(a: Point, value: number): Point {
  return point(a.x * value, a.y * value);
}

function divide(a: Point, value: number): Point {
  return point(a.x / value, a.y / value);
}

function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

function rotate90(a: Point): Point {
  return point(-a.y, a.x);
}

function pointDistance(a: Point): number {
  return distance(a.x, a.y);
}

function distance(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

function direction(a: Point): Point {
  const d = pointDistance(a);
  if (d <= 0) {
    return point(0, 0);
  }
  return divide(a, d);
}

function directionVector(x: number, y: number): Point {
  const d = distance(x, y);
  if (d <= 0) {
    return point(0, 0);
  }
  return point(x / d, y / d);
}

function square(x: number): number {
  return x * x;
}

function interpolate(start: number, stop: number, fraction: number): number {
  return (1 - fraction) * start + fraction * stop;
}

function interpolatePoint(start: Point, stop: Point, fraction: number): Point {
  return point(
    interpolate(start.x, stop.x, fraction),
    interpolate(start.y, stop.y, fraction),
  );
}

function cubic(
  anchor0XValue: number,
  anchor0YValue: number,
  control0XValue: number,
  control0YValue: number,
  control1XValue: number,
  control1YValue: number,
  anchor1XValue: number,
  anchor1YValue: number,
): Cubic {
  return {
    points: [
      anchor0XValue,
      anchor0YValue,
      control0XValue,
      control0YValue,
      control1XValue,
      control1YValue,
      anchor1XValue,
      anchor1YValue,
    ],
  };
}

function cubicFromPoints(anchor0: Point, control0: Point, control1: Point, anchor1: Point): Cubic {
  return cubic(
    anchor0.x,
    anchor0.y,
    control0.x,
    control0.y,
    control1.x,
    control1.y,
    anchor1.x,
    anchor1.y,
  );
}

function copyCubic(source: Cubic): Cubic {
  return { points: [...source.points] as Cubic['points'] };
}

function straightLine(x0: number, y0: number, x1: number, y1: number): Cubic {
  return cubic(
    x0,
    y0,
    interpolate(x0, x1, 1 / 3),
    interpolate(y0, y1, 1 / 3),
    interpolate(x0, x1, 2 / 3),
    interpolate(y0, y1, 2 / 3),
    x1,
    y1,
  );
}

function circularArc(
  centerX: number,
  centerY: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Cubic {
  const p0d = directionVector(x0 - centerX, y0 - centerY);
  const p1d = directionVector(x1 - centerX, y1 - centerY);
  const rotatedP0 = rotate90(p0d);
  const rotatedP1 = rotate90(p1d);
  const clockwise = dot(rotatedP0, point(x1 - centerX, y1 - centerY)) >= 0;
  const cosa = dot(p0d, p1d);
  if (cosa > 0.999) {
    return straightLine(x0, y0, x1, y1);
  }
  const k =
    (distance(x0 - centerX, y0 - centerY) *
      4 /
      3 *
      (Math.sqrt(2 * (1 - cosa)) - Math.sqrt(1 - cosa * cosa))) /
    (1 - cosa) *
    (clockwise ? 1 : -1);
  return cubic(
    x0,
    y0,
    x0 + rotatedP0.x * k,
    y0 + rotatedP0.y * k,
    x1 - rotatedP1.x * k,
    y1 - rotatedP1.y * k,
    x1,
    y1,
  );
}

function pointOnCurve(c: Cubic, t: number): Point {
  const u = 1 - t;
  return point(
    anchor0X(c) * (u * u * u) +
      control0X(c) * (3 * t * u * u) +
      control1X(c) * (3 * t * t * u) +
      anchor1X(c) * (t * t * t),
    anchor0Y(c) * (u * u * u) +
      control0Y(c) * (3 * t * u * u) +
      control1Y(c) * (3 * t * t * u) +
      anchor1Y(c) * (t * t * t),
  );
}

function split(c: Cubic, t: number): [Cubic, Cubic] {
  const u = 1 - t;
  const curvePoint = pointOnCurve(c, t);
  return [
    cubic(
      anchor0X(c),
      anchor0Y(c),
      anchor0X(c) * u + control0X(c) * t,
      anchor0Y(c) * u + control0Y(c) * t,
      anchor0X(c) * (u * u) + control0X(c) * (2 * u * t) + control1X(c) * (t * t),
      anchor0Y(c) * (u * u) + control0Y(c) * (2 * u * t) + control1Y(c) * (t * t),
      curvePoint.x,
      curvePoint.y,
    ),
    cubic(
      curvePoint.x,
      curvePoint.y,
      control0X(c) * (u * u) + control1X(c) * (2 * u * t) + anchor1X(c) * (t * t),
      control0Y(c) * (u * u) + control1Y(c) * (2 * u * t) + anchor1Y(c) * (t * t),
      control1X(c) * u + anchor1X(c) * t,
      control1Y(c) * u + anchor1Y(c) * t,
      anchor1X(c),
      anchor1Y(c),
    ),
  ];
}

function reverse(c: Cubic): Cubic {
  return cubic(
    anchor1X(c),
    anchor1Y(c),
    control1X(c),
    control1Y(c),
    control0X(c),
    control0Y(c),
    anchor0X(c),
    anchor0Y(c),
  );
}

function zeroLength(c: Cubic): boolean {
  return (
    Math.abs(anchor0X(c) - anchor1X(c)) < DISTANCE_EPSILON &&
    Math.abs(anchor0Y(c) - anchor1Y(c)) < DISTANCE_EPSILON
  );
}

function anchor0X(c: Cubic): number {
  return c.points[0];
}

function anchor0Y(c: Cubic): number {
  return c.points[1];
}

function control0X(c: Cubic): number {
  return c.points[2];
}

function control0Y(c: Cubic): number {
  return c.points[3];
}

function control1X(c: Cubic): number {
  return c.points[4];
}

function control1Y(c: Cubic): number {
  return c.points[5];
}

function anchor1X(c: Cubic): number {
  return c.points[6];
}

function anchor1Y(c: Cubic): number {
  return c.points[7];
}
