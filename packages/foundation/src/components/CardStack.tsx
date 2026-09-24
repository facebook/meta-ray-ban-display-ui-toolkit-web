/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * CardStack component
 *
 * A Card that appears to be stacked over one or two other cards.
 * Uses Container as its base with Card for the primary content
 * and background cards arranged in a stack formation.
 *
 * Features:
 * - Two stack types: INTERACTIVE (focus-animated) and DISPLAY (static scattered)
 * - Configurable scrims (top/bottom) via Card
 * - Aspect ratio support (SQUARE, PORTRAIT)
 * - Background cards with rotation and scale
 * - Interactive type: cards fan from corner pivot on focus
 * - Display type: cards are rotated/translated in a scattered arrangement
 *
 * Usage:
 * ```tsx
 * <CardStack
 *   type={StackType.INTERACTIVE}
 *   backgroundCards={[
 *     { src: '/img1.jpg' },
 *     { src: '/img2.jpg' },
 *   ]}
 * >
 *   <img src="/main.jpg" />
 * </CardStack>
 * ```
 */

import {
  forwardRef,
  memo,
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
import { Card, ScrimType } from './Card';
import { CornerRadius } from '../material/ContainerMaterial';
import { RoundedRectangleShapeProvider } from '../material/ShapeProvider';
import {
  State,
  type InteractionState,
} from '../base/Interactions';
import { AspectRatio, StackType } from './CardStack.types';
import type { CardStackProps } from './CardStack.types';
import {
  getCardStackBackgroundCardStyle,
  getCardStackBackgroundClassName,
  getCardStackClassName,
  getCardStackContainerStyle,
  getCardStackImageStyle,
  getCardStackMeasuredLayout,
  getCardStackPrimaryCardStyle,
  getCardStackPrimaryTabIndex,
  getValidBackgroundCards,
} from './private/CardStackLayout';
import cardStackStyles from './CardStack.module.css';

export { AspectRatio, StackType } from './CardStack.types';
export type { BackgroundCardConfig, CardStackProps } from './CardStack.types';

const EMPTY_CARD_STACK_STYLE: CSSProperties = {};
const DEFAULT_CARD_STACK_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.MEDIUM);
const FULL_SIZE_CARD_STYLE: CSSProperties = { width: '100%', height: '100%' };
const CARD_STACK_IMAGE_STYLE: CSSProperties = getCardStackImageStyle();
const PRESERVE_CARD_SCALE = () => 1;

function splitUITDataAttributes<T extends object>(
  props: T,
): {
  dataAttributes: Record<`data-uit-${string}`, string | number | boolean | undefined>;
  remainingProps: T;
} {
  const dataAttributes: Record<`data-uit-${string}`, string | number | boolean | undefined> = {};
  const remainingProps = { ...props };
  const propsRecord = props as Record<string, unknown>;
  const remainingPropsRecord = remainingProps as Record<string, unknown>;

  for (const key of Object.keys(propsRecord)) {
    if (key.startsWith('data-uit-')) {
      dataAttributes[key as `data-uit-${string}`] =
        propsRecord[key] as string | number | boolean | undefined;
      delete remainingPropsRecord[key];
    }
  }

  return { dataAttributes, remainingProps };
}

// ============================================================================
// Component
// ============================================================================

export const CardStack = memo(forwardRef<HTMLDivElement, CardStackProps>(
  function CardStack(
    {
      children,
      type = StackType.INTERACTIVE,
      aspectRatio = AspectRatio.PORTRAIT,
      backgroundCards = [],
      topScrim = ScrimType.NONE,
      bottomScrim = ScrimType.NONE,
      shapeProvider = DEFAULT_CARD_STACK_SHAPE_PROVIDER,
      width,
      height,
      maxWidth,
      maxHeight,
      className = '',
      style = EMPTY_CARD_STACK_STYLE,
      onStateChange,
      ...cardProps
    },
    ref
  ) {
    const [interactionState, setInteractionState] = useState<State>(State.DEFAULT);

    const validBackgroundCards = useMemo(
      () => getValidBackgroundCards(backgroundCards, type),
      [backgroundCards, type],
    );
    const { cardWidth, cardHeight, stackDimensions } = useMemo(
      () => getCardStackMeasuredLayout(
        type,
        aspectRatio,
        width,
        height,
        maxWidth,
        maxHeight,
        validBackgroundCards.length,
      ),
      [aspectRatio, height, maxHeight, maxWidth, type, validBackgroundCards.length, width],
    );
    const primaryCardStyle = useMemo(
      () => getCardStackPrimaryCardStyle({
        type,
        hasBackgroundCards: validBackgroundCards.length > 0,
        stackDimensions,
        cardWidth,
        cardHeight,
      }),
      [cardHeight, cardWidth, stackDimensions, type, validBackgroundCards.length],
    );
    const primaryTabIndex = useMemo(
      () => getCardStackPrimaryTabIndex(type, cardProps.tabIndex),
      [cardProps.tabIndex, type],
    );
    const { dataAttributes, remainingProps: primaryCardProps } = useMemo(
      () => splitUITDataAttributes(cardProps),
      [cardProps],
    );
    const containerStyle = useMemo(
      () => getCardStackContainerStyle({
        interactionState,
        stackDimensions,
        style,
      }),
      [interactionState, stackDimensions, style],
    );
    const rootClassName = useMemo(
      () => getCardStackClassName(cardStackStyles, className),
      [className],
    );
    const handlePrimaryStateChange = useCallback((
      _prevState: InteractionState,
      newState: InteractionState,
    ) => {
      setInteractionState(newState.state);
      onStateChange?.(_prevState, newState);
    }, [onStateChange]);

    return (
      <div
        {...dataAttributes}
        ref={ref}
        className={rootClassName}
        style={containerStyle}
      >
        {/* Background cards (rendered behind primary) */}
        {validBackgroundCards.map((bgCard, index) => (
          <div
            key={index}
            className={getCardStackBackgroundClassName(cardStackStyles, type)}
            style={getCardStackBackgroundCardStyle({
              type,
              index,
              interactionState,
              stackDimensions,
              cardWidth,
              cardHeight,
              shapeProvider,
            })}
          >
            <Card
              width={cardWidth}
              height={cardHeight}
              shapeProvider={shapeProvider}
              style={FULL_SIZE_CARD_STYLE}
              tabIndex={-1}
              role="presentation"
              contentScaleForStateFn={PRESERVE_CARD_SCALE}
            >
              {bgCard.children ?? (
                bgCard.src ? (
                  <img
                    src={bgCard.src}
                    alt={bgCard.alt ?? ''}
                    style={CARD_STACK_IMAGE_STYLE}
                  />
                ) : null
              )}
            </Card>
          </div>
        ))}

        {/* Primary card */}
        <div className={cardStackStyles.primaryCard} style={primaryCardStyle}>
          <Card
            {...primaryCardProps}
            topScrim={topScrim}
            bottomScrim={bottomScrim}
            shapeProvider={shapeProvider}
            width={cardWidth}
            height={cardHeight}
            tabIndex={primaryTabIndex}
            style={FULL_SIZE_CARD_STYLE}
            contentScaleForStateFn={PRESERVE_CARD_SCALE}
            onStateChange={handlePrimaryStateChange}
          >
            {children}
          </Card>
        </div>
      </div>
    );
  }
));
