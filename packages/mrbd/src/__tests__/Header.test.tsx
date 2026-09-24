/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Header tests
 *
 * Header wraps Chip with EMPHASIZED style.
 * Features: text, metadata, icon, avatar, loading state.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { ChipAvatarSize } from '../mrbd/ui/Chip';
import { Header, HeaderAvatarSize } from '../mrbd/ui/Header';
import { getHeaderContentDescription } from '../mrbd/ui/private/HeaderAccessibility';
import { headerAvatarSizeToChipAvatarSize } from '../mrbd/ui/private/HeaderAdapters';
import { StatusIndicatorType } from '../mrbd/ui/Avatar.types';
import { TEST_ICON } from './helpers/testIcon';

const ICON_SRC = '/icons/test-icon.svg';
const CSS_SOURCE = readFileSync(
  `${process.cwd()}/packages/mrbd/src/mrbd/ui/Header.module.css`,
  'utf8',
);

describe('Header initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<Header />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('has role=heading', () => {
    render(<Header text="Title" />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('aria-level is 1', () => {
    render(<Header text="Title" />);
    expect(screen.getByRole('heading').getAttribute('aria-level')).toBe('1');
  });
});

describe('Header text', () => {
  it('renders text', () => {
    const { container } = render(<Header text="Page Title" />);
    expect(container.textContent).toContain('Page Title');
  });

  it('updates text on rerender', () => {
    const { container, rerender } = render(<Header text="First" />);
    expect(container.textContent).toContain('First');
    rerender(<Header text="Second" />);
    expect(container.textContent).toContain('Second');
  });
});

describe('Header metadata', () => {
  it('renders metadata text', () => {
    const { container } = render(<Header text="Title" metadata="3 items" />);
    expect(container.textContent).toContain('3 items');
  });

  it('no metadata when not provided', () => {
    const { container } = render(<Header text="Title" />);
    expect(container.textContent).toBe('Title');
  });
});

describe('Header icon', () => {
  it('renders a bundled token icon inline and tints it via currentColor', () => {
    const { container } = render(<Header text="Title" icon={TEST_ICON} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // Observable tint: the inline glyph fills with the inherited color and
    // draws real path data rather than an empty element.
    expect(svg?.getAttribute('fill')).toBe('currentColor');
    expect(svg?.querySelector('path[d]')).not.toBeNull();
  });

  it('renders and tints a uri icon with the inherited color', () => {
    const { container } = render(
      <Header text="Title" icon={{ uri: ICON_SRC }} />
    );
    const icon = container.querySelector('[style*="mask-image"]');
    expect(icon).toBeTruthy();
    const iconStyle = icon?.getAttribute('style') ?? '';
    expect(iconStyle).toContain(ICON_SRC);
    // Observable tint: the masked glyph fills with the inherited color.
    expect(iconStyle).toContain('background-color: currentcolor');
  });

  it('no icon when not provided', () => {
    const { container } = render(<Header text="Title" />);
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe('Header avatar', () => {
  it('renders avatar when showAvatar + avatarSrc', () => {
    const { container } = render(
      <Header text="Title" showAvatar avatarSrc="/avatar.webp" />
    );
    const avatar = container.querySelector('[role="img"]');
    expect(avatar).not.toBeNull();
  });

  it('forwards avatar content slots to the header avatar', () => {
    render(
      <Header
        text="Title"
        icon={TEST_ICON}
        avatarPrimaryContent={<span data-testid="header-avatar-primary">P</span>}
        avatarSecondaryContent={<span data-testid="header-avatar-secondary">S</span>}
        avatarBadgeContent={<span data-testid="header-avatar-badge">B</span>}
      />
    );

    expect(screen.getByTestId('header-avatar-primary')).toBeInTheDocument();
    expect(screen.getByTestId('header-avatar-secondary')).toBeInTheDocument();
    expect(screen.getByTestId('header-avatar-badge')).toBeInTheDocument();
    expect(document.querySelector('[data-chip-leading-kind="icon"]')).toBeNull();
  });

  it('default avatar size is SMALL', () => {
    const { container } = render(
      <Header text="Title" showAvatar avatarSrc="/avatar.webp" />
    );
    expect(container.firstElementChild).not.toBeNull();
  });

  it('supports LARGE avatar size', () => {
    const { container } = render(
      <Header
        text="Title"
        showAvatar
        avatarSrc="/avatar.webp"
        avatarSize={HeaderAvatarSize.LARGE}
      />
    );
    expect(container.firstElementChild).not.toBeNull();
  });

  it('keeps the separately validated header large-avatar gap override', () => {
    expect(CSS_SOURCE).toContain(
      '--uit-chip-large-avatar-gap: var(--uit-spacing-small);',
    );
  });

  it('keeps wrap-content header bounds', () => {
    expect(CSS_SOURCE).toContain('width: max-content;');
    expect(CSS_SOURCE).toContain('--uit-chip-text-letter-spacing: -0.094px;');
  });
});

describe('HeaderAvatarSize enum', () => {
  it('SMALL = "small"', () => {
    expect(HeaderAvatarSize.SMALL).toBe('small');
  });
  it('LARGE = "large"', () => {
    expect(HeaderAvatarSize.LARGE).toBe('large');
  });

  it('maps Header avatar size to Chip avatar size', () => {
    expect(headerAvatarSizeToChipAvatarSize(HeaderAvatarSize.SMALL)).toBe(
      ChipAvatarSize.SMALL
    );
    expect(headerAvatarSizeToChipAvatarSize(HeaderAvatarSize.LARGE)).toBe(
      ChipAvatarSize.LARGE
    );
  });
});

describe('Header loading state', () => {
  it('renders in loading state', () => {
    const { container } = render(<Header text="Loading" isLoading />);
    expect(container.firstElementChild).not.toBeNull();
  });
});

describe('Header accessibility', () => {
  it('accessibility helper combines text and metadata', () => {
    expect(
      getHeaderContentDescription({ text: 'Title', metadata: 'Info' })
    ).toBe('Title, Info');
  });

  it('accessibility helper prefers explicit aria-label over text and metadata', () => {
    expect(
      getHeaderContentDescription({
        ariaLabel: 'Custom',
        text: 'Title',
        metadata: 'Info',
      })
    ).toBe('Custom');
  });

  it('accessibility helper appends status indicator to explicit aria-label', () => {
    expect(
      getHeaderContentDescription({
        ariaLabel: 'Alex profile',
        text: 'Title',
        metadata: 'Info',
        statusIndicator: StatusIndicatorType.ACTIVE,
      })
    ).toBe('Alex profile, Active Status');
  });

  it('accessibility helper returns undefined for empty content', () => {
    expect(getHeaderContentDescription({})).toBeUndefined();
  });

  it('aria-label combines text and metadata', () => {
    render(<Header text="Title" metadata="Info" />);
    const heading = screen.getByRole('heading');
    const label = heading.getAttribute('aria-label') ?? '';
    expect(label).toContain('Title');
    expect(label).toContain('Info');
  });

  it('aria-label is text only when no metadata', () => {
    render(<Header text="Solo" />);
    expect(screen.getByRole('heading').getAttribute('aria-label')).toBe('Solo');
  });

  it('custom aria-label overrides default', () => {
    render(<Header text="Title" metadata="Info" aria-label="Custom" />);
    expect(screen.getByRole('heading').getAttribute('aria-label')).toBe('Custom');
  });
});

describe('Header custom props', () => {
  it('accepts className', () => {
    const { container } = render(<Header text="Test" className="my-header" />);
    expect(container.firstElementChild?.className).toContain('my-header');
  });

  it('accepts custom style', () => {
    const { container } = render(<Header text="Test" style={{ margin: 8 }} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('margin: 8px');
  });
});
