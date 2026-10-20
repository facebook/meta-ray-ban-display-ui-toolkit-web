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

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContainerHeader } from '../mrbd/ui/ContainerHeader';
import { PlaceholderStyle, StatusIndicatorType } from '../mrbd/ui/Avatar.types';
import { STATUS_INDICATOR_LABELS } from '../mrbd/ui/private/AvatarMetrics';
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

  it('leading visual helper treats badge-only content as an avatar', () => {
    expect(
      getContainerHeaderLeadingVisualState({
        avatarBadgeSrc: '/badge.webp',
        icon: TEST_ICON_SRC,
      }),
    ).toEqual({
      hasAvatar: true,
      hasIcon: false,
      hasLeadingVisual: true,
    });
    expect(
      getContainerHeaderLeadingVisualState({
        avatarBadgeContent: <span>B</span>,
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

  it('renders a badge-only avatar with its placeholder instead of the icon', () => {
    const { container } = render(
      <ContainerHeader
        title="User"
        avatarBadgeContent={<span data-testid="avatar-badge-only">B</span>}
        icon={TEST_ICON}
      />,
    );

    const avatar = container.querySelector('[class*="avatarContainer"]');
    expect(avatar).not.toBeNull();
    expect(avatar?.querySelector('[data-placeholder-style]')).toHaveAttribute(
      'data-placeholder-style',
      PlaceholderStyle.AVATAR,
    );
    const placeholder = avatar?.querySelector('[data-placeholder-style]');
    expect(placeholder).toHaveStyle('--uit-avatar-placeholder-icon-size: 20px');
    expect(placeholder?.querySelector('svg')).toHaveAttribute('viewBox', '3799.7107 193.8560 8.0078 8.0078');
    expect(placeholder?.querySelectorAll('path')).toHaveLength(2);
    expect(avatar?.querySelector('[role="img"]')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('heading')).toHaveAccessibleName('User');
    expect(screen.getByTestId('avatar-badge-only')).toBeInTheDocument();
    expect(container.querySelector('[class*="iconContainer"]')).toBeNull();
  });

  it('renders a badge-only image with the configured image placeholder', () => {
    const { container } = render(
      <ContainerHeader
        title="Group"
        avatarBadgeSrc="/badge.webp"
        placeholderStyle={PlaceholderStyle.IMAGE}
        icon={TEST_ICON}
      />,
    );

    const avatar = container.querySelector('[class*="avatarContainer"]');
    expect(avatar?.querySelector('[data-placeholder-style]')).toHaveAttribute(
      'data-placeholder-style',
      PlaceholderStyle.IMAGE,
    );
    expect(avatar?.querySelector('[data-placeholder-style] svg')).toHaveAttribute(
      'viewBox', '2078.6966 156.4862 8.0078 8.0078',
    );
    expect(avatar?.querySelector('img')).toHaveAttribute('src', '/badge.webp');
    expect(container.querySelector('[class*="iconContainer"]')).toBeNull();
  });

  it('restores the icon and text-only layout when badge props are removed', () => {
    const { container, rerender } = render(
      <ContainerHeader title="Section" avatarBadgeSrc="/badge.webp" icon={TEST_ICON} />,
    );
    expect(container.querySelector('[class*="avatarContainer"]')).not.toBeNull();
    expect(container.querySelector('[class*="iconContainer"]')).toBeNull();

    rerender(<ContainerHeader title="Section" icon={TEST_ICON} />);
    expect(container.querySelector('[class*="avatarContainer"]')).toBeNull();
    expect(container.querySelector('[class*="iconContainer"]')).not.toBeNull();
    expect(container.querySelector('[class*="badgeContainer"]')).toBeNull();

    rerender(<ContainerHeader title="Section" />);
    expect(container.querySelector('[class*="iconContainer"]')).toBeNull();
    expect(container.querySelector('[class*="textContentWithoutLeading"]')).not.toBeNull();
    expect(screen.getByRole('heading')).toHaveAccessibleName('Section');
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

  it.each(['En ligne', 'オンライン'])(
    'uses the localized status label %s in the heading and decorative avatar',
    label => {
      const { container } = render(
        <ContainerHeader
          title="Name"
          avatarSrc="/avatar.webp"
          statusIndicator={StatusIndicatorType.ACTIVE}
          statusIndicatorLabels={{ [StatusIndicatorType.ACTIVE]: label }}
        />,
      );

      expect(screen.getByRole('heading')).toHaveAccessibleName(`Name, ${label}`);
      expect(container.querySelector('[role="status"]')).toHaveAttribute('aria-label', label);
      expect(container.querySelector('[role="img"]')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.queryByRole('img')).toBeNull();
      expect(screen.queryByRole('status')).toBeNull();
    },
  );

  it('restores default status naming when the active locale override is cleared', () => {
    const { container, rerender } = render(
      <ContainerHeader
        title="Name"
        avatarSrc="/avatar.webp"
        statusIndicator={StatusIndicatorType.ACTIVE}
        statusIndicatorLabels={{ [StatusIndicatorType.ACTIVE]: 'En ligne' }}
      />,
    );
    expect(screen.getByRole('heading')).toHaveAccessibleName('Name, En ligne');

    rerender(
      <ContainerHeader
        title="Name"
        avatarSrc="/avatar.webp"
        statusIndicator={StatusIndicatorType.ACTIVE}
        statusIndicatorLabels={{}}
      />,
    );
    expect(screen.getByRole('heading')).toHaveAccessibleName('Name, Active Status');
    expect(container.querySelector('[role="status"]')).toHaveAttribute('aria-label', 'Active Status');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it.each(['', ' \t\n '])('omits blank status copy without adding an empty heading segment (%j)', label => {
    const statusProps = {
      avatarSrc: '/avatar.webp',
      statusIndicator: StatusIndicatorType.ACTIVE,
      statusIndicatorLabels: { [StatusIndicatorType.ACTIVE]: label },
    };
    const { container, rerender } = render(
      <ContainerHeader title="Name" subtitle="Info" {...statusProps} />,
    );
    expect(screen.getByRole('heading')).toHaveAttribute('aria-label', 'Name, Info');
    expect(container.querySelector('[role="status"]')).toHaveAttribute('aria-label', label);

    rerender(<ContainerHeader {...statusProps} />);
    expect(screen.getByRole('heading')).not.toHaveAttribute('aria-label');
    expect(getContainerHeaderAriaLabel({
      statusIndicator: StatusIndicatorType.ACTIVE,
      statusIndicatorLabels: statusProps.statusIndicatorLabels,
    })).toBeUndefined();

    rerender(<ContainerHeader title="Name" statusIndicator={StatusIndicatorType.ACTIVE} statusIndicatorLabels={statusProps.statusIndicatorLabels} />);
    expect(screen.getByRole('heading')).toHaveAccessibleName('Name');
    expect(container.querySelector('[role="status"]')).toBeNull();

    rerender(<ContainerHeader title="Name" aria-label="Explicit heading" {...statusProps} />);
    expect(screen.getByRole('heading')).toHaveAccessibleName('Explicit heading');
    rerender(<ContainerHeader title="Name" aria-label="" {...statusProps} />);
    expect(screen.getByRole('heading')).toHaveAttribute('aria-label', '');
  });

  it('uses English defaults for non-string overrides without invoking their trim methods', () => {
    const statusProps = {
      title: 'Name',
      subtitle: 'Info',
      avatarPrimaryContent: <span>A</span>,
      statusIndicator: StatusIndicatorType.ACTIVE,
    };
    const labels = (value: unknown) => ({
      [StatusIndicatorType.ACTIVE]: value,
    } as Partial<Record<StatusIndicatorType, string>>);
    const { container, rerender } = render(
      <ContainerHeader {...statusProps} statusIndicatorLabels={labels(42)} />,
    );
    expect(screen.getByRole('heading')).toHaveAccessibleName('Name, Info, Active Status');
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    expect(container.querySelector('[role="img"]')).toHaveAttribute('aria-hidden', 'true');

    const trim = vi.fn(() => 'Not a string label');
    rerender(<ContainerHeader {...statusProps} statusIndicatorLabels={labels({ trim })} />);
    expect(screen.getByRole('heading')).toHaveAccessibleName('Name, Info, Active Status');
    expect(trim).not.toHaveBeenCalled();

    rerender(<ContainerHeader {...statusProps} statusIndicatorLabels={labels(' En ligne ')} />);
    expect(screen.getByRole('heading')).toHaveAttribute('aria-label', 'Name, Info,  En ligne ');
    rerender(<ContainerHeader {...statusProps} statusIndicatorLabels={labels('')} />);
    expect(screen.getByRole('heading')).toHaveAttribute('aria-label', 'Name, Info');
    rerender(<ContainerHeader {...statusProps} />);
    expect(screen.getByRole('heading')).toHaveAccessibleName('Name, Info, Active Status');
  });

  it('omits a missing runtime default while preserving heading text and explicit root labels', () => {
    const runtimeDefaults: Partial<Record<StatusIndicatorType, unknown>> = STATUS_INDICATOR_LABELS;
    const original = runtimeDefaults[StatusIndicatorType.ACTIVE];
    let view: ReturnType<typeof render> | undefined;
    try {
      runtimeDefaults[StatusIndicatorType.ACTIVE] = undefined;
      const statusProps = {
        avatarPrimaryContent: <span>A</span>,
        statusIndicator: StatusIndicatorType.ACTIVE,
      };
      view = render(<ContainerHeader title="Name" subtitle="Info" {...statusProps} />);
      expect(screen.getByRole('heading')).toHaveAccessibleName('Name, Info');
      expect(view.container.querySelector('[role="status"]')).not.toBeNull();
      expect(view.container.querySelector('[role="img"]')).toHaveAttribute('aria-hidden', 'true');

      view.rerender(<ContainerHeader {...statusProps} />);
      expect(screen.getByRole('heading')).not.toHaveAttribute('aria-label');
      expect(getContainerHeaderAriaLabel({ statusIndicator: StatusIndicatorType.ACTIVE })).toBeUndefined();
      view.rerender(<ContainerHeader title="Name" aria-label="Custom heading" {...statusProps} />);
      expect(screen.getByRole('heading')).toHaveAccessibleName('Custom heading');
      view.rerender(<ContainerHeader title="Name" aria-label="" {...statusProps} />);
      expect(screen.getByRole('heading')).toHaveAttribute('aria-label', '');
      view.rerender(<ContainerHeader title="Name" statusIndicator={StatusIndicatorType.ACTIVE} />);
      expect(screen.getByRole('heading')).toHaveAccessibleName('Name');
      expect(view.container.querySelector('[role="status"]')).toBeNull();
    } finally {
      view?.unmount();
      runtimeDefaults[StatusIndicatorType.ACTIVE] = original;
    }
  });

  it('rejects malformed runtime defaults without losing valid localized or blank overrides', () => {
    const runtimeDefaults: Partial<Record<StatusIndicatorType, unknown>> = STATUS_INDICATOR_LABELS;
    const original = runtimeDefaults[StatusIndicatorType.ACTIVE];
    try {
      runtimeDefaults[StatusIndicatorType.ACTIVE] = 42;
      expect(getContainerHeaderAriaLabel({
        title: 'Name',
        subtitle: 'Info',
        statusIndicator: StatusIndicatorType.ACTIVE,
      })).toBe('Name, Info');
      expect(getContainerHeaderAriaLabel({ statusIndicator: StatusIndicatorType.ACTIVE })).toBeUndefined();
      expect(getContainerHeaderAriaLabel({
        statusIndicator: StatusIndicatorType.ACTIVE,
        statusIndicatorLabels: { [StatusIndicatorType.ACTIVE]: 'En ligne' },
      })).toBe('En ligne');
      expect(getContainerHeaderAriaLabel({
        title: 'Name',
        statusIndicator: StatusIndicatorType.ACTIVE,
        statusIndicatorLabels: { [StatusIndicatorType.ACTIVE]: '' },
      })).toBe('Name');
    } finally {
      runtimeDefaults[StatusIndicatorType.ACTIVE] = original;
    }
  });

  it('keeps the fallback for an entry omitted from a partial label map', () => {
    const { container } = render(
      <ContainerHeader
        title="Name"
        avatarSrc="/avatar.webp"
        statusIndicator={StatusIndicatorType.WARNING}
        statusIndicatorLabels={{ [StatusIndicatorType.ACTIVE]: 'En ligne' }}
      />,
    );

    expect(screen.getByRole('heading')).toHaveAccessibleName('Name, Warning Status');
    expect(container.querySelector('[role="status"]')).toHaveAttribute('aria-label', 'Warning Status');
  });

  it('updates composed labels when the locale, status and map change', () => {
    const { container, rerender } = render(
      <ContainerHeader
        title="Name"
        subtitle="Details"
        avatarSrc="/avatar.webp"
        statusIndicator={StatusIndicatorType.ACTIVE}
        statusIndicatorLabels={{ [StatusIndicatorType.ACTIVE]: 'En ligne' }}
      />,
    );
    expect(screen.getByRole('heading')).toHaveAccessibleName('Name, Details, En ligne');

    rerender(
      <ContainerHeader
        title="Name"
        subtitle="Details"
        avatarSrc="/avatar.webp"
        statusIndicator={StatusIndicatorType.ACTIVE}
        statusIndicatorLabels={{ [StatusIndicatorType.ACTIVE]: 'Available' }}
      />,
    );
    expect(screen.getByRole('heading')).toHaveAccessibleName('Name, Details, Available');
    expect(container.querySelector('[role="status"]')).toHaveAttribute('aria-label', 'Available');

    rerender(
      <ContainerHeader
        title="Updated"
        avatarSrc="/avatar.webp"
        statusIndicator={StatusIndicatorType.INACTIVE}
        statusIndicatorLabels={{ [StatusIndicatorType.INACTIVE]: 'Hors ligne' }}
      />,
    );
    expect(screen.getByRole('heading')).toHaveAccessibleName('Updated, Hors ligne');
    expect(container.querySelector('[role="status"]')).toHaveAttribute('aria-label', 'Hors ligne');

    rerender(
      <ContainerHeader title="Updated" avatarSrc="/avatar.webp" statusIndicator={StatusIndicatorType.INACTIVE} />,
    );
    expect(screen.getByRole('heading')).toHaveAccessibleName('Updated, Inactive Status');
    expect(container.querySelector('[role="status"]')).toHaveAttribute('aria-label', 'Inactive Status');

    rerender(<ContainerHeader title="Updated" avatarSrc="/avatar.webp" />);
    expect(screen.getByRole('heading')).toHaveAccessibleName('Updated');
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it('lets an explicit heading label replace the composed localized name', () => {
    const { container } = render(
      <ContainerHeader
        title="Name"
        subtitle="Details"
        avatarSrc="/avatar.webp"
        statusIndicator={StatusIndicatorType.ACTIVE}
        statusIndicatorLabels={{ [StatusIndicatorType.ACTIVE]: 'En ligne' }}
        aria-label="Custom heading"
      />,
    );

    expect(screen.getByRole('heading')).toHaveAccessibleName('Custom heading');
    expect(container.querySelector('[role="status"]')).toHaveAttribute('aria-label', 'En ligne');
  });

  it.each([
    ['text-only', undefined],
    ['icon-only', TEST_ICON],
  ] as const)('does not announce status on a %s header without an avatar', (_name, icon) => {
    const { container } = render(
      <ContainerHeader
        title="Name"
        subtitle="Details"
        icon={icon}
        statusIndicator={StatusIndicatorType.ACTIVE}
        statusIndicatorLabels={{ [StatusIndicatorType.ACTIVE]: 'En ligne' }}
      />,
    );

    expect(screen.getByRole('heading')).toHaveAccessibleName('Name, Details');
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(container.querySelector('[class*="avatarContainer"]')).toBeNull();
  });

  it('announces a localized status on a badge-only avatar without heading text', () => {
    const { container } = render(
      <ContainerHeader
        avatarBadgeContent={<span>Badge</span>}
        statusIndicator={StatusIndicatorType.WARNING}
        statusIndicatorLabels={{ [StatusIndicatorType.WARNING]: 'Avertissement' }}
      />,
    );

    expect(screen.getByRole('heading')).toHaveAccessibleName('Avertissement');
    expect(container.querySelector('[role="status"]')).toHaveAttribute('aria-label', 'Avertissement');
    expect(container.querySelector('[data-placeholder-style]')).not.toBeNull();
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
