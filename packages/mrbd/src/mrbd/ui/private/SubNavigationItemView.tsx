/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import { IndeterminateLoader, IndeterminateLoaderSize } from '../IndeterminateLoader';
import {
  TEXT_FADING_EDGE,
} from './SubNavigationMetrics';
import { getSubNavigationItemLayout } from './SubNavigationLayout';
import type { SubNavigationItem } from '../SubNavigation.types';
import styles from '../SubNavigation.module.css';

interface SubNavigationItemViewProps {
  id: string;
  item: SubNavigationItem;
  isActive: boolean;
  isParentFocused: boolean;
  onClick: () => void;
}

export const SubNavItemView = memo(function SubNavItemView({
  id,
  item,
  isActive,
  isParentFocused,
  onClick,
}: SubNavigationItemViewProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const [textWidth, setTextWidth] = useState(0);

  // Measure text width on mount and when label changes. The label is measured in
  // an isolated off-screen clone rather than an in-tree node: the rendered row's
  // wrapper (`.itemWrapper`) and the host Container both clip with
  // `overflow: hidden`, so a hidden measuring node left inside the row is subject
  // to that clip and to the Container's scale transform. Measuring a detached
  // clone (which carries the `.textLabel` class, so the META2 font still
  // applies) yields the natural single-line width free of any ancestor clip, so
  // the revealed width stays in sync with the animated wrapper width and the
  // label is never clipped prematurely during page transitions.
  useEffect(() => {
    let isCancelled = false;

    const measureText = () => {
      if (!textRef.current || isCancelled) {
        return;
      }

      const el = textRef.current;
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.width = 'auto';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '-9999px';
      clone.style.visibility = 'hidden';
      clone.style.paddingRight = `${TEXT_FADING_EDGE}px`;
      clone.style.boxSizing = 'border-box';
      document.body.appendChild(clone);

      const rectWidth = clone.getBoundingClientRect().width;
      const w = Math.ceil(Math.max(rectWidth, clone.scrollWidth));
      clone.remove();
      setTextWidth(w);
    };

    measureText();
    document.fonts?.ready.then(measureText).catch(() => {
      // Font readiness is best-effort; the initial measurement still keeps the item usable.
    });

    return () => {
      isCancelled = true;
    };
  }, [item.label]);

  const isLoading = item.isLoading ?? false;
  const {
    wrapperStyle,
    contentStyle,
    iconContainerStyle,
    iconStyle,
    iconLayerStyle,
    loaderLayerStyle,
    textStyle,
  } = useMemo(
    () => getSubNavigationItemLayout({
      textWidth,
      isActive,
      isParentFocused,
      isLoading,
    }),
    [textWidth, isActive, isParentFocused, isLoading],
  );

  return (
    <div
      id={id}
      className={styles.itemWrapper}
      style={wrapperStyle}
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      tabIndex={-1}
    >
      <div className={styles.itemContent} style={contentStyle}>
        <div className={styles.iconContainer} style={iconContainerStyle}>
          <div className={styles.iconImageView} style={iconStyle}>
            <div
              className={styles.swapLayer}
              style={iconLayerStyle}
              aria-hidden={isLoading}
            >
              {item.icon != null && <IconImage source={item.icon} />}
            </div>
            <div
              className={styles.swapLayer}
              style={loaderLayerStyle}
              aria-hidden={!isLoading}
            >
              <IndeterminateLoader
                size={IndeterminateLoaderSize.XSMALL}
                isAnimating={isLoading}
              />
            </div>
          </div>
        </div>
        <div
          ref={textRef}
          className={styles.textLabel}
          style={textStyle}
        >
          {item.label}
        </div>
      </div>
    </div>
  );
});
