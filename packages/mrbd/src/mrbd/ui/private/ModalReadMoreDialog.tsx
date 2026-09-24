/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createPortal } from 'react-dom';
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { useFloatingPortalRoot } from '@wearables-ui-toolkit/foundation/portal/FloatingPortalRoot';
import {
  TextColor,
  TextStyle,
  TextView,
} from '@wearables-ui-toolkit/foundation/components/TextView';
import styles from './ModalReadMoreDialog.module.css';

export interface ModalReadMoreDialogProps {
  text: string;
  onDismiss?: () => void;
}

export const ModalReadMoreDialog = memo(function ModalReadMoreDialog({
  text,
  onDismiss,
}: ModalReadMoreDialogProps) {
  const portalRoot = useFloatingPortalRoot();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onDismiss?.();
      }
    },
    [onDismiss],
  );
  const handleClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  }, []);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  if (portalRoot == null) {
    return null;
  }

  return createPortal(
    <div
      ref={dialogRef}
      className={styles.dialog}
      role="dialog"
      aria-modal="true"
      aria-label={text}
      tabIndex={-1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <TextView
        as="div"
        className={styles.text}
        textStyle={TextStyle.META1}
        textColor={TextColor.SECONDARY}
      >
        {text}
      </TextView>
    </div>,
    portalRoot,
  );
});
