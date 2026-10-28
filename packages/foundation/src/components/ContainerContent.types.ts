/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';

/** Outer placement/composition. Content insets and layout belong to contentStyle. */
export type ContainerRootStyle = Omit<CSSProperties,
  | 'display'
  | 'padding' | 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft'
  | 'paddingBlock' | 'paddingBlockStart' | 'paddingBlockEnd'
  | 'paddingInline' | 'paddingInlineStart' | 'paddingInlineEnd'
  | 'border' | 'borderWidth' | 'borderTop' | 'borderRight' | 'borderBottom' | 'borderLeft'
  | 'borderTopWidth' | 'borderRightWidth' | 'borderBottomWidth' | 'borderLeftWidth'
  | 'borderBlock' | 'borderBlockStart' | 'borderBlockEnd' | 'borderBlockWidth'
  | 'borderBlockStartWidth' | 'borderBlockEndWidth' | 'borderInline' | 'borderInlineStart'
  | 'borderInlineEnd' | 'borderInlineWidth' | 'borderInlineStartWidth' | 'borderInlineEndWidth'
  | 'alignItems' | 'alignContent' | 'justifyItems' | 'justifyContent' | 'placeItems' | 'placeContent'
  | 'gap' | 'rowGap' | 'columnGap'
  | 'flexDirection' | 'flexWrap' | 'gridTemplateColumns' | 'gridTemplateRows'
  | 'overflow' | 'overflowX' | 'overflowY' | 'clipPath' | 'WebkitClipPath'
  | 'width' | 'height' | 'boxSizing'
> & {
  display?: 'block' | 'flex' | 'grid' | 'inline-block' | 'inline-flex' | 'inline-grid' | 'flow-root' | 'none';
};

export type ContentClipMode = 'shape' | 'bounds' | 'none';

/** Styling for the content surface; its clipping envelope is toolkit-owned. */
export type ContainerContentStyle = Omit<CSSProperties,
  | 'position' | 'top' | 'right' | 'bottom' | 'left' | 'inset'
  | 'width' | 'height' | 'minWidth' | 'minHeight' | 'maxWidth' | 'maxHeight'
  | 'boxSizing' | 'overflow' | 'overflowX' | 'overflowY'
  | 'clipPath' | 'WebkitClipPath' | 'transform' | 'translate' | 'scale' | 'rotate' | 'zoom' | 'display'
  | 'margin' | 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft'
  | 'marginBlock' | 'marginBlockStart' | 'marginBlockEnd' | 'marginInline' | 'marginInlineStart' | 'marginInlineEnd'
  | 'insetBlock' | 'insetBlockStart' | 'insetBlockEnd' | 'insetInline' | 'insetInlineStart' | 'insetInlineEnd'
  | 'inlineSize' | 'blockSize' | 'minInlineSize' | 'maxInlineSize' | 'minBlockSize' | 'maxBlockSize'
  | 'flex' | 'flexBasis' | 'flexGrow' | 'flexShrink' | 'alignSelf' | 'order'
> & {
  /** Box-generating content layout; use visibility to hide content without removing its envelope. */
  display?: 'block' | 'flex' | 'grid' | 'inline-block' | 'inline-flex' | 'inline-grid' | 'flow-root';
};
