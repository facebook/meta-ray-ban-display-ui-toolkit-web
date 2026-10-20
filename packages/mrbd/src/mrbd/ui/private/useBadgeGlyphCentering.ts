/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {useLayoutEffect, type CSSProperties, type RefObject} from 'react';

const MAX_INK_WIDTH = 512;
const INK_HEIGHT = 128;
const INK_MARGIN = 16;
const INK_BASELINE = INK_HEIGHT / 2;
// Layout advances are quantized to 1/64px; a different shaped run is not safe to align.
const ADVANCE_TOLERANCE = 1 / 64;

/** Aligns the badge's painted glyph footprint without resizing its text box. */
export function useBadgeGlyphCentering(
  labelRef: RefObject<HTMLSpanElement | null>,
  text: string | number,
  style: CSSProperties,
  className: string,
): void {
  useLayoutEffect(() => {
    const label = labelRef.current;
    if (!label) return;
    const document = label.ownerDocument;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', {willReadFrequently: true});
    if (!context) return;
    const marker = document.createElement('span');
    marker.setAttribute('aria-hidden', 'true');
    marker.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    let active = true;
    const setFont = () => {
      const css = getComputedStyle(label);
      context.font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
      context.textAlign = 'left';
      context.textBaseline = 'alphabetic';
      context.direction = css.direction === 'rtl' ? 'rtl' : 'ltr';
      context.fontKerning = css.fontKerning as CanvasFontKerning;
      context.letterSpacing = css.letterSpacing === 'normal' ? '0px' : css.letterSpacing;
    };
    const update = () => {
      if (!active) return;
      label.style.translate = '';
      const css = getComputedStyle(label);
      if (css.textTransform && css.textTransform !== 'none' || css.fontFeatureSettings && css.fontFeatureSettings !== 'normal' || css.fontVariationSettings && css.fontVariationSettings !== 'normal') return;
      for (let element: HTMLElement | null = label; element; element = element.parentElement) {
        const geometry = getComputedStyle(element);
        if (geometry.perspective && geometry.perspective !== 'none' || geometry.rotate && geometry.rotate !== 'none' && geometry.rotate !== '0deg' || geometry.scale && geometry.scale !== 'none' && geometry.scale !== '1') return;
        if (geometry.transform && geometry.transform !== 'none') {
          if (typeof DOMMatrixReadOnly === 'undefined') return;
          const matrix = new DOMMatrixReadOnly(geometry.transform);
          if (matrix.a !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.d !== 1 || matrix.m13 !== 0 || matrix.m14 !== 0 || matrix.m23 !== 0 || matrix.m24 !== 0 || matrix.m31 !== 0 || matrix.m32 !== 0 || matrix.m33 !== 1 || matrix.m34 !== 0 || matrix.m44 !== 1) return;
        }
      }
      setFont();
      const advance = context.measureText(String(text)).width;
      const range = document.createRange();
      range.selectNodeContents(label);
      const renderedAdvance = range.getBoundingClientRect().width;
      if (!(advance > 0 && advance <= MAX_INK_WIDTH) || !Number.isFinite(renderedAdvance) || Math.abs(advance - renderedAdvance) > ADVANCE_TOLERANCE) return;
      label.append(marker);
      const baseline = marker.getBoundingClientRect().top;
      marker.remove();
      const box = label.getBoundingClientRect();
      if (!(box.width > 0 && box.height > 0)) return;
      const origin = box.x + (box.width - advance) / 2;
      canvas.width = Math.ceil(advance) + INK_MARGIN * 2;
      canvas.height = INK_HEIGHT;
      setFont();
      const x = INK_MARGIN + origin - Math.floor(origin);
      const y = INK_BASELINE + baseline - Math.floor(baseline);
      context.fillText(String(text), x, y);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let left = canvas.width;
      let right = 0;
      let top = canvas.height;
      let bottom = 0;
      for (let row = 0; row < canvas.height; row++) {
        for (let column = 0; column < canvas.width; column++) {
          if (pixels[(row * canvas.width + column) * 4 + 3] > 0) {
            left = Math.min(left, column);
            right = Math.max(right, column + 1);
            top = Math.min(top, row);
            bottom = Math.max(bottom, row + 1);
          }
        }
      }
      if (right <= left || bottom <= top || left === 0 || right === canvas.width || top === 0 || bottom === INK_HEIGHT) return;
      const dx = box.width / 2 - (origin - box.x + (left + right) / 2 - x);
      const dy = box.height / 2 - (baseline - box.y + (top + bottom) / 2 - y);
      label.style.translate = `${dx}px ${dy}px`;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(label);
    document.fonts?.addEventListener('loadingdone', update);
    return () => {
      active = false;
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', update);
      marker.remove();
      label.style.translate = '';
    };
  }, [labelRef, text, style, className]);
}
