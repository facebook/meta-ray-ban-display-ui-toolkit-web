/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { cornerRadiusDefinitions } from './corner-radius.generated';

declare const cornerRadiusBrand: unique symbol;
export type CornerRadius = number & {
  readonly [cornerRadiusBrand]: 'CornerRadius';
};

interface CornerRadiusDefinition {
  cssPixels: number;
  geometryPixels: number;
}

type CornerRadiusName = keyof typeof cornerRadiusDefinitions;

const CORNER_RADIUS_DEFINITIONS = cornerRadiusDefinitions as Record<
  CornerRadiusName,
  CornerRadiusDefinition
>;

export const CornerRadius: {
  readonly [K in keyof typeof CORNER_RADIUS_DEFINITIONS]: CornerRadius;
} = Object.fromEntries(
  Object.entries(CORNER_RADIUS_DEFINITIONS).map(([name, definition]) => [
    name,
    definition.geometryPixels,
  ]),
) as {
  readonly [K in keyof typeof CORNER_RADIUS_DEFINITIONS]: CornerRadius;
};

const CORNER_RADIUS_DEFINITION_BY_VALUE = new Map<number, CornerRadiusDefinition>(
  Object.values(CORNER_RADIUS_DEFINITIONS).map(definition => [
    definition.geometryPixels,
    definition,
  ]),
);

export function getCornerRadiusValue(radius: CornerRadius): string {
  const definition = CORNER_RADIUS_DEFINITION_BY_VALUE.get(radius);
  return `${definition?.cssPixels ?? radius}px`;
}
