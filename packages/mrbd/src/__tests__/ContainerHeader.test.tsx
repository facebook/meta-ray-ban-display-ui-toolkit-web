/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ContainerHeader tests
 *
 * Features:
 * - Title and subtitle text
 * - Optional leading visual: avatar (priority) or icon
 * - role=heading with aria-level=2
 * - Non-interactive display component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContainerHeader } from '../mrbd/ui/ContainerHeader';
import {
  getContainerHeaderAriaLabel,
  getContainerHeaderLeadingVisualState,
} from '../mrbd/ui/private/ContainerHeaderLayout';
import { TEST_ICON } from './helpers/testIcon';

const TEST_ICON_SRC = '/icons/test-icon.svg';

describe('ContainerHeader initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<ContainerHeader />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('has role=heading', () => {
    render(<ContainerHeader title="Section" />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('aria-level is 2', () => {
    render(<ContainerHeader title="Section" />);
    expect(screen.getByRole('heading').getAttribute('aria-level')).toBe('2');
  });
});

describe('ContainerHeader title', () => {
  it('renders title text', () => {
    const { container } = render(<ContainerHeader title="Settings" />);
    expect(container.textContent).toContain('Settings');
  });

  it('renders in title element', () => {
    const { container } = render(<ContainerHeader title="Name" />);
    const titleEl = container.querySelector('[class*="titleTextView"]');
    expect(titleEl).not.toBeNull();
    expect(titleEl?.textContent).toBe('Name');
  });

  it('hides title element when not provided', () => {
    const { container } = render(<ContainerHeader subtitle="Sub" />);
    // Both title and subtitle use *TextView classes. Check no element has title text.
    const textElements = container.querySelectorAll('[class*="TextView"]');
    const titleEl = Array.from(textElements).find(
      el => el.className.includes('title') && !el.className.includes('subtitle')
    );
    expect(titleEl).toBeUndefined();
  });
});

describe('ContainerHeader subtitle', () => {
  it('renders subtitle text', () => {
    const { container } = render(
      <ContainerHeader title="Name" subtitle="Description" />
    );
    expect(container.textContent).toContain('Description');
  });

  it('renders in subtitle element', () => {
    const { container } = render(
      <ContainerHeader title="Name" subtitle="Info" />
    );
    const subEl = container.querySelector('[class*="subtitleTextView"]');
    expect(subEl).not.toBeNull();
    expect(subEl?.textContent).toBe('Info');
  });

  it('hides subtitle when not provided', () => {
    const { container } = render(<ContainerHeader title="Name" />);
    const subEl = container.querySelector('[class*="subtitleTextView"]');
    expect(subEl).toBeNull();
  });
});

describe('ContainerHeader icon', () => {
  it('renders a vector token icon inline as svg when provided', () => {
    const { container } = render(
      <ContainerHeader title="Test" icon={TEST_ICON} />
    );
    const iconContainer = container.querySelector('[class*="iconContainer"]');
    expect(iconContainer).not.toBeNull();
    expect(iconContainer?.querySelector('svg')).toBeTruthy();
  });

  it('renders a URL icon source as a tinted mask when provided', () => {
    const { container } = render(
      <ContainerHeader title="Test" icon={{ uri: TEST_ICON_SRC }} />
    );
    const iconContainer = container.querySelector('[class*="iconContainer"]');
    expect(iconContainer).not.toBeNull();
    const maskIcon = iconContainer?.querySelector('[style*="mask-image"]');
    expect(maskIcon).toBeTruthy();
    expect(maskIcon?.getAttribute('style')).toContain(TEST_ICON_SRC);
  });

  it('hides icon when not provided', () => {
    const { container } = render(<ContainerHeader title="Test" />);
    expect(container.querySelector('[class*="iconContainer"]')).toBeNull();
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();
  });
});

describe('ContainerHeader avatar', () => {
  it('leading visual helper prioritizes avatar over icon', () => {
    expect(
      getContainerHeaderLeadingVisualState({
        avatarSrc: '/avatar.webp',
        icon: TEST_ICON_SRC,
      }),
    ).toEqual({
      hasAvatar: true,
      hasIcon: false,
      hasLeadingVisual: true,
    });
  });

  it('leading visual helper treats avatarPrimaryContent as an avatar', () => {
    expect(
      getContainerHeaderLeadingVisualState({
        avatarPrimaryContent: <span>A</span>,
        icon: TEST_ICON_SRC,
      }),
    ).toEqual({
      hasAvatar: true,
      hasIcon: false,
      hasLeadingVisual: true,
    });
  });

  it('renders avatar when avatarSrc provided', () => {
    const { container } = render(
      <ContainerHeader title="User" avatarSrc="/avatar.webp" />
    );
    const avatarContainer = container.querySelector('[class*="avatarContainer"]');
    expect(avatarContainer).not.toBeNull();
  });

  it('renders avatar primary and badge content', () => {
    render(
      <ContainerHeader
        title="User"
        avatarPrimaryContent={<span data-testid="avatar-primary">A</span>}
        avatarBadgeContent={<span data-testid="avatar-badge">B</span>}
      />,
    );

    expect(screen.getByTestId('avatar-primary')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-badge')).toBeInTheDocument();
  });

  it('avatar takes priority over icon', () => {
    const { container } = render(
      <ContainerHeader
        title="User"
        avatarSrc="/avatar.webp"
        icon={{ uri: TEST_ICON_SRC }}
      />
    );
    const avatarContainer = container.querySelector('[class*="avatarContainer"]');
    expect(avatarContainer).not.toBeNull();
    const iconContainer = container.querySelector('[class*="iconContainer"]');
    expect(iconContainer).toBeNull();
  });
});

describe('ContainerHeader accessibility', () => {
  it('aria helper combines title and subtitle into an accessible label', () => {
    expect(getContainerHeaderAriaLabel({ title: 'Name', subtitle: 'Info' }))
      .toBe('Name, Info');
    expect(getContainerHeaderAriaLabel({})).toBeUndefined();
  });

  it('aria-label combines title and subtitle', () => {
    render(<ContainerHeader title="Name" subtitle="Info" />);
    const heading = screen.getByRole('heading');
    const label = heading.getAttribute('aria-label') ?? '';
    expect(label).toContain('Name');
    expect(label).toContain('Info');
  });

  it('aria-label is title only when no subtitle', () => {
    render(<ContainerHeader title="Solo" />);
    expect(screen.getByRole('heading').getAttribute('aria-label')).toBe('Solo');
  });
});

describe('ContainerHeader custom props', () => {
  it('accepts className', () => {
    const { container } = render(
      <ContainerHeader title="Test" className="my-header" />
    );
    expect(container.firstElementChild?.className).toContain('my-header');
  });

  it('accepts custom style', () => {
    const { container } = render(
      <ContainerHeader title="Test" style={{ margin: 8 }} />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('margin: 8px');
  });

  it('forwards root data attributes for component captures', () => {
    const { container } = render(
      <ContainerHeader title="Test" data-uit-capture-id="container-header" />
    );

    expect(container.firstElementChild).toHaveAttribute(
      'data-uit-capture-id',
      'container-header',
    );
  });
});
