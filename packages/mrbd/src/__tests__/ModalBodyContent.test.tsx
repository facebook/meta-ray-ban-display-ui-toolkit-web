/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModalContentMode } from '../mrbd/ui/Modal';
import { IconTintColor } from '../mrbd/ui/IconTintColor';
import { ModalBodyContent } from '../mrbd/ui/private/ModalBodyContent';
import { TEST_ICON } from './helpers/testIcon';

describe('ModalBodyContent', () => {
  it('renders title, subtitle, and read-more affordance as one body section', () => {
    render(
      <ModalBodyContent
        showTitle
        title="Modal Title"
        contentMode={ModalContentMode.STANDARD}
        showSubtitle
        subtitle="A longer subtitle"
        subtitleRef={createRef<HTMLParagraphElement>()}
        showReadMore
        hasListItems={false}
      />,
    );

    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByText('A longer subtitle')).toBeInTheDocument();
    expect(screen.getByText('Read more')).toBeInTheDocument();
  });

  it('renders modal list rows with icon tint when list content is present', () => {
    const { container } = render(
      <ModalBodyContent
        showTitle={false}
        contentMode={ModalContentMode.STANDARD}
        showSubtitle={false}
        subtitleRef={createRef<HTMLParagraphElement>()}
        showReadMore={false}
        hasListItems
        listItems={[
          {
            icon: TEST_ICON,
            description: 'Connected device',
            iconColor: IconTintColor.NEGATIVE,
          },
        ]}
      />,
    );

    expect(screen.getByText('Connected device')).toBeInTheDocument();
    const listItemIcon = container.querySelector('[class*="listItemIcon"]');
    // Semantic enum resolves to a design-system color token, not a raw color.
    expect(listItemIcon?.getAttribute('style')).toContain(
      'var(--uit-color-persistent-negative',
    );
    // Token renders inline as an <svg> tinted via currentColor from the wrapper.
    expect(listItemIcon?.querySelector('svg')).not.toBeNull();
  });

  it('renders the buttons section after text content', () => {
    render(
      <ModalBodyContent
        showTitle={false}
        contentMode={ModalContentMode.STANDARD}
        showSubtitle={false}
        subtitleRef={createRef<HTMLParagraphElement>()}
        showReadMore={false}
        hasListItems={false}
        buttons={<button>Done</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });
});
