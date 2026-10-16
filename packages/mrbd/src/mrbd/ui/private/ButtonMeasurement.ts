/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ICON_IMAGEVIEW_LEADING_MARGIN_WITH_TEXT,
  LeadingAccessoryRenderMode,
} from './ButtonLayout';

export interface ButtonMeasurementClassNames {
  iconContent: string;
  textContent: string;
  trailingTag: string;
}

export interface MeasureButtonNaturalContentWidthParams {
  outerContainer: HTMLDivElement | null;
  contentView: HTMLDivElement | null;
  renderMode: LeadingAccessoryRenderMode;
  hasText: boolean;
  classNames: ButtonMeasurementClassNames;
}

function getChildMarginBoxWidth(
  childElement: HTMLElement,
  expandedIconOffsetCorrection: number,
  classNames: ButtonMeasurementClassNames,
): number {
  const childStyle = window.getComputedStyle(childElement);
  const marginRight = Number.parseFloat(childStyle.marginRight) || 0;
  const offsetLeft = childElement.classList.contains(classNames.iconContent)
    ? childElement.offsetLeft
    : childElement.offsetLeft - expandedIconOffsetCorrection;

  return (
    offsetLeft +
    childElement.offsetWidth +
    marginRight
  );
}

export function measureButtonNaturalContentWidth({
  outerContainer,
  contentView,
  renderMode,
  hasText,
  classNames,
}: MeasureButtonNaturalContentWidthParams): number {
  if (outerContainer == null || contentView == null) {
    return 0;
  }

  const originalOuterWidth = outerContainer.style.width;
  const originalOuterTransition = outerContainer.style.transition;
  const originalContentWidth = contentView.style.width;
  const textChildren = Array.from(contentView.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      (child.classList.contains(classNames.textContent) ||
        child.classList.contains(classNames.trailingTag)),
  );
  const originalChildStyles = textChildren.map(child => ({
    child,
    flexShrink: child.style.flexShrink,
    minWidth: child.style.minWidth,
  }));

  outerContainer.style.width = 'auto';
  outerContainer.style.transition = 'none';
  contentView.style.width = 'max-content';
  for (const child of textChildren) {
    child.style.flexShrink = '0';
    child.style.minWidth = 'max-content';
  }

  try {
    const usesIconLayout =
      renderMode === LeadingAccessoryRenderMode.ICON ||
      renderMode === LeadingAccessoryRenderMode.LOADER;
    const iconElement = usesIconLayout
      ? Array.from(contentView.children).find(
          (child): child is HTMLElement =>
            child instanceof HTMLElement &&
            child.classList.contains(classNames.iconContent),
        )
      : null;
    const iconLeadingMargin = iconElement != null
      ? Number.parseFloat(window.getComputedStyle(iconElement).marginLeft) || 0
      : 0;
    const expandedIconOffsetCorrection = usesIconLayout && hasText
      ? Math.max(0, iconLeadingMargin - ICON_IMAGEVIEW_LEADING_MARGIN_WITH_TEXT)
      : 0;

    const childMarginBoxWidth = Array.from(contentView.children).reduce(
      (maxWidth, child) => {
        if (!(child instanceof HTMLElement)) {
          return maxWidth;
        }
        return Math.max(
          maxWidth,
          getChildMarginBoxWidth(child, expandedIconOffsetCorrection, classNames),
        );
      },
      0,
    );
    return Math.ceil(
      childMarginBoxWidth > 0 ? childMarginBoxWidth : contentView.offsetWidth,
    );
  } finally {
    for (const { child, flexShrink, minWidth } of originalChildStyles) {
      child.style.flexShrink = flexShrink;
      child.style.minWidth = minWidth;
    }
    contentView.style.width = originalContentWidth;
    outerContainer.style.width = originalOuterWidth;
    outerContainer.style.transition = originalOuterTransition;
  }
}
