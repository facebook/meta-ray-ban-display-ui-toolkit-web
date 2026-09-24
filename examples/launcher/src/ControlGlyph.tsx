/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo, type CSSProperties } from 'react';
import {
  CONTROL_GLYPH_ICON_ASSETS,
  pinIconAsset,
  type ControlGlyphKind,
} from './controlGlyphSources';
import { classNames } from './launcherUtils';
import './ControlGlyph.css';

type ControlGlyphStyle = CSSProperties & {
  '--control-glyph-asset-url': string;
};

export const ControlGlyph = memo(function ControlGlyph({
  kind,
  className,
}: {
  kind: ControlGlyphKind;
  className?: string;
}) {
  const style: ControlGlyphStyle = {
    '--control-glyph-asset-url':
      `url("${CONTROL_GLYPH_ICON_ASSETS[kind]}")`,
  };
  return (
    <span
      aria-hidden="true"
      className={classNames(
        'controlGlyph',
        'controlGlyphSvg',
        'controlGlyphAssetIcon',
        `controlGlyph-${kind}`,
        className,
      )}
      style={style}
    />
  );
});

export function PinGlyph({ className }: { className?: string }) {
  const style: ControlGlyphStyle = {
    '--control-glyph-asset-url': `url("${pinIconAsset}")`,
  };
  return (
    <span
      aria-hidden="true"
      className={classNames('controlGlyphAssetIcon', className)}
      style={style}
    />
  );
}
