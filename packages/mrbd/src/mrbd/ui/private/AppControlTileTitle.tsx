/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  memo,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  APP_CONTROL_TILE_STATUS_ICON_MARGIN_TOP,
  APP_CONTROL_TILE_STATUS_ICON_SIZE,
  APP_CONTROL_TILE_TITLE_MARGIN_START,
} from './AppControlTileMetrics';
import styles from '../AppControlTile.module.css';

const TITLE_CONTAINER_STYLE: CSSProperties = {
  marginLeft: APP_CONTROL_TILE_TITLE_MARGIN_START,
};
const STATUS_ICON_STYLE: CSSProperties = {
  width: APP_CONTROL_TILE_STATUS_ICON_SIZE,
  height: APP_CONTROL_TILE_STATUS_ICON_SIZE,
  marginTop: APP_CONTROL_TILE_STATUS_ICON_MARGIN_TOP,
};

export interface AppControlTileTitleProps {
  title: string;
  titleClassName: string;
  titleRef: RefObject<HTMLDivElement | null>;
  statusIcon?: ReactNode;
}

export const AppControlTileTitle = memo(function AppControlTileTitle({
  title,
  titleClassName,
  titleRef,
  statusIcon,
}: AppControlTileTitleProps) {
  return (
    <div
      className={styles.titleContainer}
      style={TITLE_CONTAINER_STYLE}
    >
      <div className={titleClassName} ref={titleRef}>
        {title}
      </div>
      {statusIcon != null && (
        <div
          className={styles.statusIcon}
          style={STATUS_ICON_STYLE}
        >
          {statusIcon}
        </div>
      )}
    </div>
  );
});
