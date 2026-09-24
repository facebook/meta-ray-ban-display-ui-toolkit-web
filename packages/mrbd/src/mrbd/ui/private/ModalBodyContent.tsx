/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  ReactNode,
  RefObject,
} from 'react';
import {
  memo,
  useMemo,
} from 'react';
import { ModalContentMode, type ModalListItem } from '../Modal.types';
import { getIconTintCSSVariable, getIconTintBlendMode } from '../IconTintColor';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import styles from '../Modal.module.css';

export interface ModalBodyContentProps {
  showTitle: boolean;
  title?: string;
  contentMode: ModalContentMode;
  showSubtitle: boolean;
  subtitle?: string;
  subtitleRef: RefObject<HTMLParagraphElement | null>;
  showReadMore: boolean;
  hasListItems: boolean;
  listItems?: ModalListItem[];
  buttons?: ReactNode;
}

interface ModalListItemRowProps {
  item: ModalListItem;
}

const ModalListItemRow = memo(function ModalListItemRow({
  item,
}: ModalListItemRowProps) {
  const iconStyle = useMemo<CSSProperties | undefined>(
    () =>
      item.iconColor != null
        ? {
            color: getIconTintCSSVariable(item.iconColor),
            mixBlendMode: getIconTintBlendMode(item.iconColor),
          }
        : undefined,
    [item.iconColor],
  );

  return (
    <div className={styles.listItem}>
      <div
        className={styles.listItemIcon}
        style={iconStyle}
      >
        {item.icon != null && <IconImage source={item.icon} />}
      </div>
      <span className={styles.listItemDescription}>
        {item.description}
      </span>
    </div>
  );
});

export const ModalBodyContent = memo(function ModalBodyContent({
  showTitle,
  title,
  contentMode,
  showSubtitle,
  subtitle,
  subtitleRef,
  showReadMore,
  hasListItems,
  listItems,
  buttons,
}: ModalBodyContentProps) {
  const titleClass =
    contentMode === ModalContentMode.TITLE_ONLY
      ? styles.titleOnly
      : styles.titleStandard;
  const titleMarginClass = showSubtitle ? styles.titleWithSubtitle : '';
  const titleClassName = useMemo(
    () => `${styles.title} ${titleClass} ${titleMarginClass}`,
    [titleClass, titleMarginClass],
  );

  return (
    <>
      {showTitle && (
        <p className={titleClassName}>
          {title}
        </p>
      )}

      {showSubtitle && (
        <div className={styles.subtitleContainer}>
          <p ref={subtitleRef} className={styles.subtitle}>{subtitle}</p>
          {showReadMore && (
            <span className={styles.readMoreAffordance} aria-hidden="true">
              <span className={styles.readMoreText}>Read more</span>
            </span>
          )}
        </div>
      )}

      {hasListItems && listItems && (
        <div className={styles.listContainer}>
          {listItems.map((item, index) => (
            <ModalListItemRow key={index} item={item} />
          ))}
        </div>
      )}

      {buttons && (
        <div className={styles.buttonsContainer}>{buttons}</div>
      )}
    </>
  );
});
