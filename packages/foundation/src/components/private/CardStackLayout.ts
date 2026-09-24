/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * CardStack layout model.
 */

import type { CSSProperties } from 'react';
import { AspectRatio, StackType } from '../CardStack.types';
import type { BackgroundCardConfig } from '../CardStack.types';
import { RoundedRectangleShapeProvider } from '../../material/ShapeProvider';
import { State, getDefaultContentScaleForState } from '../../base/Interactions';
import { AnimationDurations, Interpolators } from '../../motion/Animations';
import type {
  CardStackBackgroundStyleParams,
  CardStackContainerStyleParams,
  CardStackMeasuredLayout,
  CardStackMetrics,
  CardStackPrimaryStyleParams,
  CardStackSize,
} from './CardStackLayout.types';

export type {
  CardStackBackgroundStyleParams,
  CardStackContainerStyleParams,
  CardStackMeasuredLayout,
  CardStackMetrics,
  CardStackPrimaryStyleParams,
  CardStackSize,
} from './CardStackLayout.types';

// Background-card rotation and translation states.
// Angles in degrees (~4 degrees).
export const DISPLAY_STATES = [
  { rotation: 4, translateX: 0, translateY: 0 },
  { rotation: -4, translateX: -48, translateY: -32 },
  { rotation: 4, translateX: 48, translateY: -70 },
  { rotation: -4, translateX: -32, translateY: -94 },
];

// Interactive background-card states.
export const INTERACTIVE_STATES = [
  { idleDeg: 8, targetedDeg: 16, scale: 0.88 },
  { idleDeg: 14, targetedDeg: 24, scale: 0.88 * 0.88 },
];

/**
 * Fallback card size used before/without a measured size. An unsized stack is
 * seeded from these defaults. The 200x300 ratio is immediately normalized by
 * `coerceToRatio`, so these only matter as a pre-measurement seed.
 */
export const DEFAULT_MEASURED_WIDTH = 200;
export const DEFAULT_MEASURED_HEIGHT = 300;

export function getAspectRatioValue(ratio: AspectRatio): number {
  switch (ratio) {
    case AspectRatio.SQUARE:
      return 1;
    case AspectRatio.PORTRAIT:
      return 0.75;
  }
}

export function getMaxCards(type: StackType): number {
  switch (type) {
    case StackType.INTERACTIVE:
      return 2;
    case StackType.DISPLAY:
      return 3;
  }
}

export function coerceToRatio(
  width: number,
  height: number,
  ratio: number,
): CardStackSize {
  const coercedWidth = Math.round(height * ratio);
  const coercedHeight = Math.round(width / ratio);
  const coercedWidthFits = coercedWidth <= width;
  const coercedHeightFits = coercedHeight <= height;

  if (coercedWidthFits && coercedHeightFits) {
    return coercedWidth * height > width * coercedHeight
      ? { width: coercedWidth, height }
      : { width, height: coercedHeight };
  }

  return coercedWidthFits
    ? { width: coercedWidth, height }
    : { width, height: coercedHeight };
}

export function getInteractiveScaleConstant(cardCount: number): number {
  if (cardCount <= 0) {
    return 0;
  }

  const state = INTERACTIVE_STATES[Math.min(cardCount - 1, INTERACTIVE_STATES.length - 1)];
  const targetedRad = state.targetedDeg * Math.PI / 180;
  return Math.sin(targetedRad) * state.scale;
}

function getInteractiveStackHeightFromStackWidth(
  stackWidth: number,
  ratio: number,
  backgroundCardCount: number,
): number {
  return stackWidth / (getInteractiveScaleConstant(backgroundCardCount) + ratio);
}

function getInteractiveStackWidthFromStackHeight(
  stackHeight: number,
  ratio: number,
  backgroundCardCount: number,
): number {
  return stackHeight * (getInteractiveScaleConstant(backgroundCardCount) + ratio);
}

function getInteractiveCardSizeFromStackWidth(
  stackWidth: number,
  ratio: number,
  backgroundCardCount: number,
): CardStackSize {
  const cardWidth =
    ratio * getInteractiveStackHeightFromStackWidth(stackWidth, ratio, backgroundCardCount);
  return {
    width: Math.round(cardWidth),
    height: Math.round(cardWidth / ratio),
  };
}

function getDisplayCorners(cardWidth: number, cardHeight: number): Array<[number, number]> {
  const halfWidth = cardWidth / 2;
  const halfHeight = cardHeight / 2;
  return [
    [-halfWidth, -halfHeight],
    [-halfWidth, halfHeight],
    [halfWidth, -halfHeight],
    [halfWidth, halfHeight],
  ];
}

export function getDisplayStackMetrics(
  cardWidth: number,
  cardHeight: number,
  cardCount: number,
): CardStackMetrics {
  const halfWidth = cardWidth / 2;
  const halfHeight = cardHeight / 2;
  const corners = getDisplayCorners(cardWidth, cardHeight);

  let widthMin = -halfWidth;
  let widthMax = halfWidth;
  let heightMin = -halfHeight;
  let heightMax = halfHeight;
  let positionMinX = -halfWidth;
  let positionMinY = -halfHeight;

  for (let i = 0; i < cardCount && i < DISPLAY_STATES.length; i++) {
    const state = DISPLAY_STATES[i];
    const rad = state.rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    for (const [x, y] of corners) {
      const newX = x * cos - y * sin + state.translateX;
      const newHeightY = y * cos + x * sin + state.translateY;
      const newPositionY = x * sin - y * cos + state.translateY;

      widthMin = Math.min(widthMin, newX);
      widthMax = Math.max(widthMax, newX);
      heightMin = Math.min(heightMin, newHeightY);
      heightMax = Math.max(heightMax, newHeightY);
      positionMinX = Math.min(positionMinX, newX);
      positionMinY = Math.min(positionMinY, newPositionY);
    }
  }

  return {
    width: Math.round(widthMax - widthMin),
    height: Math.round(heightMax - heightMin),
    offsetX: Math.round(Math.abs(positionMinX - -halfWidth)),
    offsetY: Math.round(Math.abs(positionMinY - -halfHeight)),
  };
}

function getDisplayCardWidthFromStackWidth(
  stackWidth: number,
  ratio: number,
  cardCount: number,
): number {
  let leftOffset = 0;
  let leftAngleRad = 0;
  let rightOffset = 0;
  let rightAngleRad = 0;

  for (let i = 0; i < cardCount && i < DISPLAY_STATES.length; i++) {
    const state = DISPLAY_STATES[i];
    const x = state.translateX;
    const angleRad = Math.abs(state.rotation * Math.PI / 180);

    if (x <= leftOffset) {
      leftOffset = x;
      leftAngleRad = angleRad;
    }
    if (x >= rightOffset) {
      rightOffset = x;
      rightAngleRad = angleRad;
    }
  }

  const leftFactor = Math.sin(leftAngleRad) / ratio;
  const rightFactor = Math.sin(rightAngleRad) / ratio;
  return (stackWidth - Math.abs(leftOffset) - rightOffset)
    / (1 + leftFactor + rightFactor);
}

function getDisplayCardHeightFromStackHeight(
  stackHeight: number,
  ratio: number,
  cardCount: number,
): number {
  let topOffset = 0;
  let topAngleRad = 0;
  let bottomOffset = 0;
  let bottomAngleRad = 0;

  for (let i = 0; i < cardCount && i < DISPLAY_STATES.length; i++) {
    const state = DISPLAY_STATES[i];
    const y = state.translateY;
    const angleRad = state.rotation * Math.PI / 180;

    if (y <= topOffset) {
      topOffset = y;
      topAngleRad = angleRad;
    }
    if (y >= bottomOffset) {
      bottomOffset = y;
      bottomAngleRad = angleRad;
    }
  }

  const topFactor = Math.sin(topAngleRad) * ratio;
  const bottomFactor = Math.sin(bottomAngleRad) * ratio;
  return (stackHeight - Math.abs(topOffset) - bottomOffset)
    / (1 + topFactor + bottomFactor);
}

function getDisplayStackHeightFromStackWidth(
  stackWidth: number,
  ratio: number,
  cardCount: number,
): number {
  const cardWidth = getDisplayCardWidthFromStackWidth(stackWidth, ratio, cardCount);
  return getDisplayStackMetrics(cardWidth, cardWidth / ratio, cardCount).height;
}

function getDisplayStackWidthFromStackHeight(
  stackHeight: number,
  ratio: number,
  cardCount: number,
): number {
  const cardHeight = getDisplayCardHeightFromStackHeight(stackHeight, ratio, cardCount);
  return getDisplayStackMetrics(cardHeight * ratio, cardHeight, cardCount).width;
}

function pickBestFit(
  bounds: CardStackSize,
  sizeByWidth: CardStackSize,
  sizeByHeight: CardStackSize,
): CardStackSize {
  const widthFits = sizeByWidth.width <= bounds.width && sizeByWidth.height <= bounds.height;
  const heightFits = sizeByHeight.width <= bounds.width && sizeByHeight.height <= bounds.height;

  if (widthFits && heightFits) {
    return sizeByWidth.width > sizeByHeight.width ? sizeByWidth : sizeByHeight;
  }

  if (widthFits) {
    return sizeByWidth;
  }

  if (heightFits) {
    return sizeByHeight;
  }

  return bounds;
}

function constrainStackDimensions(
  type: StackType,
  stackDimensions: CardStackMetrics,
  ratio: number,
  backgroundCardCount: number,
  maxWidth: number | undefined,
  maxHeight: number | undefined,
): CardStackMetrics {
  const bounds = {
    width: maxWidth ?? Number.POSITIVE_INFINITY,
    height: maxHeight ?? Number.POSITIVE_INFINITY,
  };

  if (stackDimensions.width <= bounds.width && stackDimensions.height <= bounds.height) {
    return stackDimensions;
  }

  if (type === StackType.DISPLAY) {
    const cardCount = backgroundCardCount + 1;
    const size = pickBestFit(
      bounds,
      {
        width: bounds.width,
        height: getDisplayStackHeightFromStackWidth(bounds.width, ratio, cardCount),
      },
      {
        width: getDisplayStackWidthFromStackHeight(bounds.height, ratio, cardCount),
        height: bounds.height,
      },
    );

    return {
      width: Math.round(size.width),
      height: Math.round(size.height),
      offsetX: stackDimensions.offsetX,
      offsetY: stackDimensions.offsetY,
    };
  }

  const size = pickBestFit(
    bounds,
    {
      width: bounds.width,
      height: getInteractiveStackHeightFromStackWidth(
        bounds.width,
        ratio,
        backgroundCardCount,
      ),
    },
    {
      width: getInteractiveStackWidthFromStackHeight(
        bounds.height,
        ratio,
        backgroundCardCount,
      ),
      height: bounds.height,
    },
  );

  return {
    width: Math.round(size.width),
    height: Math.round(size.height),
    offsetX: 0,
    offsetY: 0,
  };
}

function getFinalCardSize(
  type: StackType,
  cardWidth: number,
  cardHeight: number,
  ratio: number,
  stackDimensions: CardStackMetrics,
  backgroundCardCount: number,
): CardStackSize {
  if (backgroundCardCount === 0) {
    return { width: cardWidth, height: cardHeight };
  }

  if (type === StackType.DISPLAY) {
    const finalCardWidth = getDisplayCardWidthFromStackWidth(
      stackDimensions.width,
      ratio,
      backgroundCardCount + 1,
    );
    return {
      width: Math.round(finalCardWidth),
      height: Math.round(finalCardWidth / ratio),
    };
  }

  return getInteractiveCardSizeFromStackWidth(
    stackDimensions.width,
    ratio,
    backgroundCardCount,
  );
}

/**
 * Returns the background cards clamped to the maximum allowed for the stack type.
 *
 * Over-provisioning is a misuse: this throws in development so the misuse
 * surfaces immediately; production builds degrade gracefully by truncating (with
 * a warning) rather than crashing the app.
 */
export function getValidBackgroundCards(
  backgroundCards: BackgroundCardConfig[],
  type: StackType,
): BackgroundCardConfig[] {
  const maxCards = getMaxCards(type);
  if (backgroundCards.length > maxCards) {
    const message = `CardStack of type ${type} can only have ${maxCards} cards`;
    if (import.meta.env.DEV) {
      throw new Error(message);
    }
    // eslint-disable-next-line no-console
    console.warn(
      `${message}; received ${backgroundCards.length} and the extra cards were truncated.`,
    );
  }
  return backgroundCards.slice(0, maxCards);
}

export function getCardStackDimensions(
  type: StackType,
  cardWidth: number,
  cardHeight: number,
  ratio: number,
  backgroundCardCount: number,
): CardStackMetrics {
  if (backgroundCardCount === 0) {
    return { width: cardWidth, height: cardHeight, offsetX: 0, offsetY: 0 };
  }

  if (type === StackType.DISPLAY) {
    return getDisplayStackMetrics(cardWidth, cardHeight, backgroundCardCount + 1);
  }

  const scaleConstant = getInteractiveScaleConstant(backgroundCardCount);
  const stackWidth = cardHeight * (scaleConstant + ratio);
  return {
    width: Math.round(stackWidth),
    height: cardHeight,
    offsetX: 0,
    offsetY: 0,
  };
}

export function getCardStackMeasuredLayout(
  type: StackType,
  aspectRatio: AspectRatio,
  width: number | undefined,
  height: number | undefined,
  maxWidth: number | undefined,
  maxHeight: number | undefined,
  backgroundCardCount: number,
): CardStackMeasuredLayout {
  const ratio = getAspectRatioValue(aspectRatio);
  const measuredWidth = width ?? DEFAULT_MEASURED_WIDTH;
  const measuredHeight = height ?? DEFAULT_MEASURED_HEIGHT;
  const coercedCardSize = coerceToRatio(measuredWidth, measuredHeight, ratio);
  const initialCardWidth = coercedCardSize.width;
  const initialCardHeight = coercedCardSize.height;
  const initialStackDimensions = getCardStackDimensions(
    type,
    initialCardWidth,
    initialCardHeight,
    ratio,
    backgroundCardCount,
  );
  const measuredStackDimensions = constrainStackDimensions(
    type,
    initialStackDimensions,
    ratio,
    backgroundCardCount,
    maxWidth,
    maxHeight,
  );
  const finalCardSize = getFinalCardSize(
    type,
    initialCardWidth,
    initialCardHeight,
    ratio,
    measuredStackDimensions,
    backgroundCardCount,
  );
  const finalStackPosition =
    type === StackType.DISPLAY && backgroundCardCount > 0
      ? getDisplayStackMetrics(
        finalCardSize.width,
        finalCardSize.height,
        backgroundCardCount + 1,
      )
      : measuredStackDimensions;
  const stackDimensions = {
    ...measuredStackDimensions,
    offsetX: finalStackPosition.offsetX,
    offsetY: finalStackPosition.offsetY,
  };

  return {
    ratio,
    cardWidth: finalCardSize.width,
    cardHeight: finalCardSize.height,
    stackDimensions,
  };
}

export function getCardStackBackgroundCardStyle({
  type,
  index,
  interactionState,
  stackDimensions,
  cardWidth,
  cardHeight,
  shapeProvider,
}: CardStackBackgroundStyleParams): CSSProperties {
  if (type === StackType.DISPLAY) {
    const state = DISPLAY_STATES[index + 1];
    if (!state) {
      return {};
    }

    return {
      transform: `translate(${state.translateX + stackDimensions.offsetX}px, ${state.translateY + stackDimensions.offsetY}px) rotate(${state.rotation}deg)`,
      zIndex: DISPLAY_STATES.length - index - 1,
      width: cardWidth,
      height: cardHeight,
    };
  }

  const state = INTERACTIVE_STATES[index];
  if (!state) {
    return {};
  }

  const angleDeg = interactionState === State.FOCUSED ? state.targetedDeg : state.idleDeg;
  const cornerRadiusPx = shapeProvider instanceof RoundedRectangleShapeProvider
    ? shapeProvider.cornerRadius
    : 0;
  const cornerPivotInset = Math.sqrt(2 * cornerRadiusPx * cornerRadiusPx) - cornerRadiusPx;
  const pivotX = cardWidth - cornerPivotInset;
  const pivotY = cardHeight - cornerPivotInset;

  return {
    transform: `rotate(${angleDeg}deg) scale(${state.scale})`,
    transformOrigin: `${pivotX}px ${pivotY}px`,
    zIndex: 2 - index,
    width: cardWidth,
    height: cardHeight,
    // Anchor from the same computed origin as the primary card. Primary and every
    // background card share an identical top (stackHeight - cardHeight); deriving
    // both from one expression here (rather than relying on the CSS `top: 0`
    // literal) prevents a sub-pixel drift when cardWidth/cardHeight round
    // independently.
    position: 'absolute',
    top: stackDimensions.height - cardHeight,
    left: 0,
    transition: `transform ${AnimationDurations.CONTAINER_STATE_CHANGE}ms ${Interpolators.CONTAINER_SCALE}`,
  };
}

export function getCardStackPrimaryCardStyle({
  type,
  hasBackgroundCards,
  stackDimensions,
  cardWidth,
  cardHeight,
}: CardStackPrimaryStyleParams): CSSProperties {
  const primaryCardStyle: CSSProperties = {
    width: cardWidth,
    height: cardHeight,
  };

  if (type === StackType.DISPLAY) {
    const primaryState = DISPLAY_STATES[0];
    return {
      ...primaryCardStyle,
      transform: `translate(${primaryState.translateX + stackDimensions.offsetX}px, ${primaryState.translateY + stackDimensions.offsetY}px) rotate(${primaryState.rotation}deg)`,
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: DISPLAY_STATES.length,
    };
  }

  if (hasBackgroundCards) {
    return {
      ...primaryCardStyle,
      zIndex: 3,
      position: 'absolute',
      top: stackDimensions.height - cardHeight,
      left: 0,
    };
  }

  return primaryCardStyle;
}

export function getCardStackContainerStyle({
  interactionState,
  stackDimensions,
  style,
}: CardStackContainerStyleParams): CSSProperties {
  const incomingStyle = style ?? {};
  const scaleReferenceWidth =
    typeof incomingStyle.width === 'number' ? incomingStyle.width : stackDimensions.width;
  const stackScale = getDefaultContentScaleForState(
    interactionState,
    { width: scaleReferenceWidth, height: stackDimensions.height },
  );

  return {
    width: stackDimensions.width,
    height: stackDimensions.height,
    transform: `scale(${stackScale})`,
    transition: `transform ${AnimationDurations.CONTAINER_STATE_CHANGE}ms ${Interpolators.CONTAINER_SCALE}`,
    ...incomingStyle,
  };
}

export function getCardStackPrimaryTabIndex(
  type: StackType,
  tabIndex: number | undefined,
): number | undefined {
  return type === StackType.DISPLAY ? -1 : tabIndex;
}

export function getCardStackClassName(
  styles: Record<string, string>,
  className: string,
): string {
  return `${styles.cardStack} ${className}`;
}

export function getCardStackBackgroundClassName(
  styles: Record<string, string>,
  type: StackType,
): string {
  return `${styles.backgroundCard} ${
    type === StackType.INTERACTIVE
      ? styles.backgroundCardInteractive
      : styles.backgroundCardDisplay
  }`;
}

export function getCardStackImageStyle(): CSSProperties {
  return {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };
}
