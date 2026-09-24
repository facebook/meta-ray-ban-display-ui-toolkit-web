/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import { Container } from '../Container';
import type { ContainerProps } from '../Container.types';
import { MaterialLibrary } from '../../material/MaterialLibrary';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '../../material/ShapeProvider';

export type PanelInternalProps = Omit<ContainerProps, 'interactive'>;

const EMPTY_PANEL_STYLE: CSSProperties = {};
const PANEL_CONTENT_SCALE_FOR_STATE = () => 1;
const DEFAULT_PANEL_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.MEDIUM);

export const PanelInternal = memo(forwardRef<
  HTMLDivElement,
  PanelInternalProps
>(function PanelInternal(
  {
    children,
    material: materialProp,
    shapeProvider = DEFAULT_PANEL_SHAPE_PROVIDER,
    className = '',
    style = EMPTY_PANEL_STYLE,
    focusable = false,
    pressable = false,
    clickable = false,
    ...containerProps
  },
  ref,
) {
  const material = useMemo(
    () => materialProp ?? MaterialLibrary.panel(),
    [materialProp],
  );
  const panelStyle: CSSProperties = useMemo(
    () => ({
      cursor: 'default',
      ...style,
    }),
    [style],
  );
  const interactive = focusable || pressable || clickable;

  return (
    <Container
      {...containerProps}
      ref={ref}
      material={material}
      shapeProvider={shapeProvider}
      className={`Panel ${className}`.trim()}
      style={panelStyle}
      contentScaleForStateFn={PANEL_CONTENT_SCALE_FOR_STATE}
      interactive={interactive}
      focusable={focusable}
      pressable={pressable}
      clickable={clickable}
    >
      {children}
    </Container>
  );
}));
