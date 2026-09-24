/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Card component
 */

import {
  Children,
  forwardRef,
  isValidElement,
  memo,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Container } from './Container';
import { useComposedRef } from '../utils/useComposedRef';
import { useMeasuredElementDimensions } from '../utils/useMeasuredElementDimensions';
import { CARD_FULL_SCRIM_FALLBACK_HEIGHT } from './private/CardMetrics';
import {
  getCardScrimStyle,
  isCardScrimVisible,
} from './private/CardScrim';
import {
  ScrimType,
  type CardProps,
  type CardScrimLayerProps,
} from './Card.types';
import { MaterialLibrary } from '../material/MaterialLibrary';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '../material/ShapeProvider';
import cardStyles from './Card.module.css';

export {
  ScrimType,
} from './Card.types';
export type {
  CardProps,
  CardScrimLayerProps,
} from './Card.types';

const DEFAULT_CARD_LAYER_STYLE: CSSProperties = {};
const DEFAULT_CARD_STYLE: CSSProperties = {};
const DEFAULT_CARD_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.MEDIUM);

/**
 * Marks Card children that must paint ON TOP of the gradient scrim.
 *
 * Children opt into above-scrim ordering by wrapping in `CardAboveScrim`;
 * below-scrim is the default. `Card` paints below-scrim children, then the
 * top/bottom gradient scrim(s), then any above-scrim children on top. It
 * partitions on the element type and emits these after the scrim layer in DOM
 * order.
 */
export const CardAboveScrim = memo(forwardRef<HTMLDivElement, CardScrimLayerProps>(
  function CardAboveScrim({ children, className = '', style = DEFAULT_CARD_LAYER_STYLE }, ref) {
    const layerClassName = useMemo(
      () => `${cardStyles.aboveScrim} ${className}`,
      [className],
    );

    return (
      <div
        ref={ref}
        className={layerClassName}
        style={style}
      >
        {children}
      </div>
    );
  },
));

/**
 * Marks Card children that paint BELOW the gradient scrim (the default).
 *
 * Below-scrim is the default. Wrapping is optional: a bare child not wrapped in {@link CardAboveScrim} is
 * already treated as below-scrim. This component exists for symmetry and
 * explicit intent and renders before the scrim layer in DOM order.
 */
export const CardBelowScrim = memo(forwardRef<HTMLDivElement, CardScrimLayerProps>(
  function CardBelowScrim({ children, className = '', style = DEFAULT_CARD_LAYER_STYLE }, ref) {
    const layerClassName = useMemo(
      () => `${cardStyles.belowScrim} ${className}`,
      [className],
    );

    return (
      <div
        ref={ref}
        className={layerClassName}
        style={style}
      >
        {children}
      </div>
    );
  },
));

/**
 * Splits Card children into below-scrim and above-scrim groups.
 *
 * Layering order: below-scrim children are drawn first, then the gradient scrim(s), then
 * above-scrim children on top. A child opts into the above-scrim group by being
 * wrapped in {@link CardAboveScrim}. Any child not wrapped in `CardAboveScrim`
 * (including a bare child or one wrapped in {@link CardBelowScrim}) is treated
 * as below-scrim, which is the default.
 *
 * Note: above-scrim detection is an exact element-type identity check against
 * `CardAboveScrim`. Children whose type is not that exact element — e.g. a
 * further-wrapped `CardAboveScrim`, a fragment of above-scrim children, or
 * `CardAboveScrim` imported from a duplicate module instance — fall into the
 * below-scrim group. Wrap above-scrim content directly in `CardAboveScrim`.
 *
 * Within each group children are drawn in DOM order. There is no per-child
 * z-offset, so two same-group children cannot reorder relative to DOM order.
 */
function partitionScrimChildren(children: ReactNode): {
  belowScrim: ReactNode[];
  aboveScrim: ReactNode[];
} {
  const belowScrim: ReactNode[] = [];
  const aboveScrim: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === CardAboveScrim) {
      aboveScrim.push(child);
    } else {
      belowScrim.push(child);
    }
  });

  return { belowScrim, aboveScrim };
}

/**
 * Card component
 * Container for featured content with optional gradient scrims.
 */
export const Card = memo(forwardRef<HTMLDivElement, CardProps>(
  function Card(
    {
      children,
      topScrim = ScrimType.NONE,
      bottomScrim = ScrimType.NONE,
      shapeProvider = DEFAULT_CARD_SHAPE_PROVIDER,
      material: materialProp,
      className = '',
      style = DEFAULT_CARD_STYLE,
      height,
      ...containerProps
    },
    ref,
  ) {
    const hasTopScrim = isCardScrimVisible(topScrim);
    const hasBottomScrim = isCardScrimVisible(bottomScrim);
    const hasScrim = hasTopScrim || hasBottomScrim;
    const baseMaterial = useMemo(
      () => materialProp ?? MaterialLibrary.card(),
      [materialProp],
    );

    const cardRef = useRef<HTMLDivElement>(null);
    const setCardRef = useComposedRef(ref, cardRef);
    const measuredDims = useMeasuredElementDimensions(cardRef);

    // FULL scrim sizes against the real rendered card height, measured via the
    // same ResizeObserver hook Container uses. The height prop (when numeric) and
    // the named fallback only seed the value before the first measurement / for
    // the rare non-numeric-height path.
    const scrimStyle = useMemo((): CSSProperties | null => {
      const measuredHeight = measuredDims?.h;
      const containerHeight =
        measuredHeight != null && measuredHeight > 0
          ? measuredHeight
          : typeof height === 'number'
            ? height
            : CARD_FULL_SCRIM_FALLBACK_HEIGHT;
      return getCardScrimStyle({ topScrim, bottomScrim, containerHeight });
    }, [topScrim, bottomScrim, height, measuredDims]);

    const cardClassName = useMemo(
      () => `${cardStyles.card} ${className}`,
      [className],
    );

    const { belowScrim, aboveScrim } = useMemo(
      () => partitionScrimChildren(children),
      [children],
    );

    return (
      <Container
        ref={setCardRef}
        material={baseMaterial}
        shapeProvider={shapeProvider}
        className={cardClassName}
        style={style}
        height={height}
        tabIndex={0}
        {...containerProps}
      >
        <div className={cardStyles.contentStack}>
          {belowScrim}

          {hasScrim && scrimStyle && (
            <div
              className={cardStyles.scrimLayer}
              style={scrimStyle}
              aria-hidden="true"
            />
          )}

          {aboveScrim}
        </div>
      </Container>
    );
  },
));
