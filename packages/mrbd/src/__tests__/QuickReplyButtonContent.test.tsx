/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { QuickReplyButtonContent } from '../mrbd/ui/private/QuickReplyButtonContent';

describe('QuickReplyButtonContent', () => {
  it('renders clipped viewport with title and icon slots', () => {
    const { container } = render(
      <QuickReplyButtonContent
        contentViewContainerRef={createRef<HTMLDivElement>()}
        contentViewRef={createRef<HTMLDivElement>()}
        titleRef={createRef<HTMLDivElement>()}
        contentViewContainerStyle={{ width: 120, height: 72 }}
        contentViewStyle={{ minWidth: 72 }}
        title="Reply"
        icon={{ uri: '/icons/test-icon.svg' }}
        hasText
        hasIcon
        isExpanded={false}
        iconAlpha={0}
      />,
    );

    expect(container.querySelector('[class*="contentViewContainer"]')).not.toBeNull();
    expect(container.querySelector('[class*="titleLabel"]')).toHaveTextContent('Reply');
    const iconView = container.querySelector('[class*="iconImageView"]');
    expect(iconView).toHaveStyle({ opacity: '0' });
    expect(iconView?.querySelector('[style*="mask-image"]')).toBeTruthy();
  });

  it('uses expanded color classes when state is expanded', () => {
    const { container } = render(
      <QuickReplyButtonContent
        contentViewContainerRef={createRef<HTMLDivElement>()}
        contentViewRef={createRef<HTMLDivElement>()}
        titleRef={createRef<HTMLDivElement>()}
        contentViewContainerStyle={{ width: 120, height: 72 }}
        contentViewStyle={{ minWidth: 72 }}
        title="Reply"
        icon={{ uri: '/icons/test-icon.svg' }}
        hasText
        hasIcon
        isExpanded
        iconAlpha={1}
      />,
    );

    expect(container.querySelector('[class*="titleLabel"]')?.className).toContain(
      'titleExpanded',
    );
    expect(container.querySelector('[class*="iconImageView"]')?.className).toContain(
      'iconExpanded',
    );
  });
});
