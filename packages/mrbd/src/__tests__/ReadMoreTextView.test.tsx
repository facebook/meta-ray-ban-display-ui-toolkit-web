/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { act, render } from '@testing-library/react';
import { createRef, StrictMode } from 'react';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  ReadMoreTextView,
  type ReadMoreTextViewHandle,
} from '../mrbd/ui/ReadMoreTextView';
import {
  READ_MORE_TEXT_VIEW_PADDING,
  READ_MORE_TEXT_VIEW_SCRIM_WIDTH,
} from '../mrbd/ui/private/ReadMoreTextViewMetrics';
import { TextStyle } from '@wearables-ui-toolkit/foundation/components/TextView';

const CSS_SOURCE = readFileSync(
  `${process.cwd()}/packages/mrbd/src/mrbd/ui/ReadMoreTextView.module.css`,
  'utf8',
);

describe('ReadMoreTextView', () => {
  it('renders clamped text without the affordance when content fits', () => {
    const { container } = render(
      <ReadMoreTextView readMoreLabel="Read more">Short text</ReadMoreTextView>,
    );

    expect(container.textContent).toBe('Short text');
  });

  it('renders read-more affordance when text overflows', () => {
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(200);
    const clientHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(100);
    const onVisibilityChange = vi.fn();

    try {
      const { container } = render(
        <ReadMoreTextView
          readMoreLabel="Read more"
          onReadMoreVisibilityChange={onVisibilityChange}
        >
          Details that overflow
        </ReadMoreTextView>,
      );

      expect(container.textContent).toContain('Details that overflow');
      expect(container.textContent).toContain('Read more');
      expect(onVisibilityChange).toHaveBeenCalledWith(true);
    } finally {
      scrollHeightSpy.mockRestore();
      clientHeightSpy.mockRestore();
    }
  });

  it('sizes the text mask from the rendered affordance', () => {
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(200);
    const clientHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(100);
    const boundingRectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(DOMRect.fromRect({ width: 144 }));

    try {
      const { container } = render(
        <ReadMoreTextView readMoreLabel="Read more">
          Details that overflow
        </ReadMoreTextView>,
      );

      expect(container.firstElementChild).toHaveStyle({
        '--uit-read-more-text-view-affordance-width': '144px',
      });
    } finally {
      scrollHeightSpy.mockRestore();
      clientHeightSpy.mockRestore();
      boundingRectSpy.mockRestore();
    }
  });

  it('exposes isShowingReadMore() === false via ref when content fits', () => {
    const ref = createRef<ReadMoreTextViewHandle>();

    act(() => {
      render(
        <ReadMoreTextView ref={ref} readMoreLabel="Read more">
          Short text
        </ReadMoreTextView>,
      );
    });

    expect(ref.current?.isShowingReadMore()).toBe(false);
  });

  it('exposes isShowingReadMore() === true via ref when text overflows', () => {
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(200);
    const clientHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(100);
    const ref = createRef<ReadMoreTextViewHandle>();

    try {
      act(() => {
        render(
          <ReadMoreTextView ref={ref} readMoreLabel="Read more">
            Details that overflow
          </ReadMoreTextView>,
        );
      });

      expect(ref.current?.isShowingReadMore()).toBe(true);
    } finally {
      scrollHeightSpy.mockRestore();
      clientHeightSpy.mockRestore();
    }
  });

  it('uses read-more geometry constants', () => {
    expect(READ_MORE_TEXT_VIEW_PADDING).toBe(2);
    expect(READ_MORE_TEXT_VIEW_SCRIM_WIDTH).toBe(72);
    expect(CSS_SOURCE).not.toMatch(/\.text\s*\{[^}]*line-height:/s);
    expect(CSS_SOURCE).toMatch(
      /\.text\s*\{[^}]*padding-block:\s*0;/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.root\s*\{[^}]*--uit-read-more-text-view-padding:\s*2px;/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.root\s*\{[^}]*--uit-read-more-text-view-scrim-width:\s*72px;/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.readMoreAffordance\s*\{[^}]*padding-left:\s*calc\(/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.readMoreAffordance\s*\{[^}]*width:\s*max-content;/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.readMoreText\s*\{[^}]*white-space:\s*nowrap;/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.textWithReadMore\s*\{[^}]*-webkit-mask-image:/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.textWithReadMore\s*\{[^}]*mask-image:/s,
    );
    expect(CSS_SOURCE).not.toMatch(/color-background-window/);
    expect(CSS_SOURCE).not.toMatch(
      /\.readMoreAffordance\s*\{[^}]*background:/s,
    );
  });

  it('preserves the selected text appearance line height', () => {
    const { container } = render(
      <ReadMoreTextView
        readMoreLabel="Read more"
        textStyle={TextStyle.BODY1}
      >
        Body text
      </ReadMoreTextView>,
    );

    const text = container.querySelector('p');
    expect(text).toHaveClass('uit-text-body1');
    expect(text).not.toHaveStyle({ lineHeight: '31.5px' });
  });

  it('notifies each visibility transition once in StrictMode', () => {
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(200);
    const clientHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(100);
    const onVisibilityChange = vi.fn();

    try {
      render(
        <StrictMode>
          <ReadMoreTextView
            readMoreLabel="Read more"
            onReadMoreVisibilityChange={onVisibilityChange}
          >
            Details that overflow
          </ReadMoreTextView>
        </StrictMode>,
      );

      expect(onVisibilityChange).toHaveBeenCalledTimes(1);
      expect(onVisibilityChange).toHaveBeenCalledWith(true);
    } finally {
      scrollHeightSpy.mockRestore();
      clientHeightSpy.mockRestore();
    }
  });

  it('does not notify the unchanged hidden state on mount', () => {
    const onVisibilityChange = vi.fn();

    render(
      <StrictMode>
        <ReadMoreTextView
          readMoreLabel="Read more"
          onReadMoreVisibilityChange={onVisibilityChange}
        >
          Short text
        </ReadMoreTextView>
      </StrictMode>,
    );

    expect(onVisibilityChange).not.toHaveBeenCalled();
  });
});
