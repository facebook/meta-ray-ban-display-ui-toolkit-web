/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import { APP_CONTROL_TILE_PADDING } from './AppControlTileMetrics';
import type {
  AppControlTileAccessibilityLabelOptions,
  AppControlTileClassNameOptions,
  AppControlTileTitleState,
} from './AppControlTileLayout.types';

export type {
  AppControlTileAccessibilityLabelOptions,
  AppControlTileClassNameOptions,
  AppControlTileTitleState,
} from './AppControlTileLayout.types';

export function hasAppControlTileTitle(title?: string): boolean {
  return title != null && title.length > 0;
}

export function getAppControlTileAccessibilityLabel({
  title,
}: AppControlTileAccessibilityLabelOptions): string | undefined {
  // The label derives from the title only; it is never synthesized from the
  // avatar.
  return hasAppControlTileTitle(title) ? title : undefined;
}

export function getAppControlTileRootStyle(hasTitle: boolean): CSSProperties {
  return hasTitle
    ? { padding: APP_CONTROL_TILE_PADDING }
    : {};
}

export function getAppControlTileClassNames({
  styles,
  hasTitle,
  hasStatusIcon,
  enableTitleMarquee,
  isTitleOverflowing,
}: AppControlTileClassNameOptions): AppControlTileTitleState {
  const titleClasses = [styles.title];
  if (hasStatusIcon) {
    titleClasses.push(styles.titleSingleLine);
  }
  if (enableTitleMarquee && isTitleOverflowing) {
    titleClasses.push(styles.titleMarquee, styles.titleFadeBoth);
  } else if (isTitleOverflowing) {
    titleClasses.push(styles.titleFadeRight);
  }

  const rootClasses = [styles.root];
  if (hasTitle) {
    rootClasses.push(styles.rootWithTitle);
  }

  return {
    titleClassName: titleClasses.join(' '),
    rootClassName: rootClasses.join(' '),
    rootStyle: getAppControlTileRootStyle(hasTitle),
  };
}
