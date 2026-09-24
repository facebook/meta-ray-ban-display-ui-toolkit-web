/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Modal tests
 *
 * Panel with MEDIUM corner radius, title/subtitle,
 * mutually exclusive leading area (icon/banner/logo/avatar),
 * list items, and buttons.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import {
  Modal,
  ModalContentMode,
  ModalBannerSize,
  ModalBannerTag,
} from '../mrbd/ui/Modal';
import { StatusIndicatorType } from '../mrbd/ui/Avatar.types';
import {
  getModalBannerHeightRatio,
  getModalBannerTagText,
  getModalContentDescription,
  getModalLeadingVisibility,
  hasModalListItems,
  shouldModalBeClickableForReadMore,
  shouldModalBeFocusable,
  shouldModalShowReadMore,
  shouldShowModalBannerTag,
  shouldShowModalSubtitle,
  shouldShowModalTitle,
} from '../mrbd/ui/private/ModalLayout';
import {
  MODAL_BANNER_BACKGROUND_STYLE,
  createModalBannerMaterial,
  createModalMaterial,
} from '../mrbd/ui/private/ModalMaterials';
import {
  MODAL_BANNER_CORNER_RADIUS,
  MODAL_BANNER_STANDARD_HEIGHT_RATIO,
  MODAL_BANNER_TALLER_HEIGHT_RATIO,
  MODAL_PANEL_CORNER_RADIUS,
  MODAL_READ_MORE_PADDING,
  MODAL_READ_MORE_SCRIM_WIDTH,
  MODAL_STANDARD_TITLE_TEXT_VIEW_HEIGHT,
} from '../mrbd/ui/private/ModalMetrics';
import {
  BackgroundStyle,
} from '@wearables-ui-toolkit/foundation';
import { CornerRadius } from '@wearables-ui-toolkit/foundation';
import { State } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { App } from '../mrbd/app/App';
import { Button } from '../mrbd/ui/Button';

const CSS_SOURCE = readFileSync(
  `${process.cwd()}/packages/mrbd/src/mrbd/ui/Modal.module.css`,
  'utf8',
);
const MODAL_BANNER_IMAGE_SOURCE = readFileSync(
  `${process.cwd()}/packages/mrbd/src/mrbd/ui/private/ModalBannerImage.tsx`,
  'utf8',
);
const READ_MORE_DIALOG_CSS_SOURCE = readFileSync(
  `${process.cwd()}/packages/mrbd/src/mrbd/ui/private/ModalReadMoreDialog.module.css`,
  'utf8',
);

const TEST_ICON_SRC = '/icons/modal-icon.svg';

describe('Modal initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<Modal title="Test" />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('does not claim browser dialog or popup ownership', () => {
    const { container } = render(<Modal title="Test" />);
    const modal = container.firstElementChild;
    expect(modal?.getAttribute('role')).toBeNull();
    expect(modal?.getAttribute('aria-modal')).toBeNull();
    expect(modal?.getAttribute('data-uit-focus-popup-root')).toBeNull();
    expect(container.querySelector('[class*="overlay"]')).toBeNull();
  });

  it('honors an explicit accessible label', () => {
    const { container } = render(
      <Modal title="Visible title" aria-label="Account setup" />,
    );

    expect(container.firstElementChild).toHaveAttribute(
      'aria-label',
      'Account setup',
    );
  });

  it('is not focusable or clickable by default', () => {
    const { container } = render(<Modal title="Test" />);
    const modal = container.firstElementChild;
    expect(modal?.getAttribute('role')).toBeNull();
    expect(modal?.getAttribute('tabindex')).toBeNull();
    expect(modal?.getAttribute('aria-disabled')).toBeNull();
  });

  it('can be focusable for carousel cases without dialog or button semantics', () => {
    const { container } = render(<Modal title="Test" isCarouselItem />);
    const modal = container.firstElementChild;
    expect(modal?.getAttribute('tabindex')).toBe('0');
    expect(modal?.getAttribute('role')).toBeNull();
  });

  it('does not enter pressed state when a focusable modal is clicked', () => {
    const states: State[] = [];
    const { container } = render(
      <Modal
        title="Test"
        isCarouselItem
        onStateChange={(_previous, next) => states.push(next.state)}
      />
    );
    const modal = container.firstElementChild as HTMLElement;

    modal.focus();
    expect(states[states.length - 1]).toBe(State.FOCUSED);

    states.length = 0;
    fireEvent.mouseDown(modal);
    fireEvent.mouseUp(modal);
    fireEvent.click(modal);

    expect(states).toEqual([]);
  });

  it('lets inset children own their crop paths', () => {
    const { container } = render(<Modal title="Test" bannerSrc="/banner.jpg" />);
    const modal = container.firstElementChild as HTMLElement;
    expect(modal.getAttribute('style')).toContain('overflow: visible');
  });
});

describe('Modal title and subtitle', () => {
  it('renders title', () => {
    const { container } = render(<Modal title="Welcome" />);
    expect(container.textContent).toContain('Welcome');
  });

  it('renders subtitle', () => {
    const { container } = render(<Modal title="Title" subtitle="Details" />);
    expect(container.textContent).toContain('Details');
  });

  it('renders read more affordance when subtitle overflows', () => {
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(200);
    const clientHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(100);

    try {
      const { container } = render(
        <Modal title="Title" subtitle="Details that overflow" />,
      );
      expect(container.textContent).toContain('Read more');
    } finally {
      scrollHeightSpy.mockRestore();
      clientHeightSpy.mockRestore();
    }
  });

  it('opens read more dialog when overflowing subtitle is activated', () => {
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(200);
    const clientHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(100);

    try {
      const subtitle = 'Details that overflow into the read more dialog';
      const { container } = render(
        <Modal title="Title" subtitle={subtitle} />,
      );
      const modal = container.firstElementChild as HTMLElement;

      fireEvent.click(modal);

      const dialog = screen.getByRole('dialog', { name: subtitle });
      expect(dialog).toBeInTheDocument();

      fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(screen.queryByRole('dialog', { name: subtitle })).toBeNull();
    } finally {
      scrollHeightSpy.mockRestore();
      clientHeightSpy.mockRestore();
    }
  });

  it('hides subtitle in TITLE_ONLY mode', () => {
    const { container } = render(
      <Modal
        title="Quick Tip"
        subtitle="Hidden"
        contentMode={ModalContentMode.TITLE_ONLY}
      />
    );
    expect(container.textContent).not.toContain('Hidden');
  });
});

describe('ModalContentMode enum', () => {
  it('STANDARD = "standard"', () => {
    expect(ModalContentMode.STANDARD).toBe('standard');
  });
  it('TITLE_ONLY = "title_only"', () => {
    expect(ModalContentMode.TITLE_ONLY).toBe('title_only');
  });
});

describe('ModalBannerSize enum', () => {
  it('STANDARD = "standard"', () => {
    expect(ModalBannerSize.STANDARD).toBe('standard');
  });
  it('TALLER = "taller"', () => {
    expect(ModalBannerSize.TALLER).toBe('taller');
  });
});

describe('ModalBannerTag enum', () => {
  it('NONE = "none"', () => {
    expect(ModalBannerTag.NONE).toBe('none');
  });
  it('BETA = "beta"', () => {
    expect(ModalBannerTag.BETA).toBe('beta');
  });
});

describe('Modal helpers', () => {
  it('leading visibility follows the banner > avatar > icon priority', () => {
    expect(
      getModalLeadingVisibility({
        contentMode: ModalContentMode.STANDARD,
        icon: TEST_ICON_SRC,
        bannerSrc: '/banner.jpg',
        logoSrc: '/logo.webp',
        avatarSrc: '/avatar.webp',
        avatarPrimaryContent: <span>A</span>,
      }),
    ).toEqual({
      hasBanner: true,
      hasLogo: false,
      hasAvatar: false,
      hasIcon: false,
    });

    expect(
      getModalLeadingVisibility({
        contentMode: ModalContentMode.TITLE_ONLY,
        icon: TEST_ICON_SRC,
        bannerSrc: '/banner.jpg',
        avatarSrc: '/avatar.webp',
        avatarPrimaryContent: <span>A</span>,
      }),
    ).toEqual({
      hasBanner: false,
      hasLogo: false,
      hasAvatar: false,
      hasIcon: false,
    });

    expect(
      getModalLeadingVisibility({
        contentMode: ModalContentMode.STANDARD,
        icon: TEST_ICON_SRC,
        avatarPrimaryContent: <span>A</span>,
      }),
    ).toEqual({
      hasBanner: false,
      hasLogo: false,
      hasAvatar: true,
      hasIcon: false,
    });
  });

  it('title, subtitle, list, and banner tag rules match content mode', () => {
    const listItems = [{ icon: TEST_ICON_SRC, description: 'One' }];
    expect(shouldShowModalTitle('Title')).toBe(true);
    expect(hasModalListItems(listItems, ModalContentMode.STANDARD)).toBe(true);
    expect(hasModalListItems(listItems, ModalContentMode.TITLE_ONLY)).toBe(false);
    expect(
      shouldShowModalSubtitle({
        subtitle: 'Subtitle',
        contentMode: ModalContentMode.STANDARD,
        hasListItems: false,
      }),
    ).toBe(true);
    expect(
      shouldShowModalSubtitle({
        subtitle: 'Subtitle',
        contentMode: ModalContentMode.STANDARD,
        hasListItems: true,
      }),
    ).toBe(false);
    expect(getModalBannerTagText(ModalBannerTag.BETA)).toBe('Beta');
    expect(
      shouldShowModalBannerTag({
        bannerTag: ModalBannerTag.BETA,
        hasBanner: true,
      }),
    ).toBe(true);
  });

  it('builds accessibility description parts', () => {
    expect(
      getModalContentDescription({
        showTitle: true,
        title: 'Title',
        showSubtitle: true,
        subtitle: 'Subtitle',
        showBannerTag: true,
        bannerTagText: 'Beta',
      }),
    ).toBe('Title, Subtitle, Beta');
  });

  it('focus, click, and press helpers preserve modal defaults', () => {
    expect(
      shouldModalBeFocusable({
        isCarouselItem: false,
        isSubtitleOverflowing: false,
      }),
    ).toBe(false);
    expect(
      shouldModalBeFocusable({
        isCarouselItem: true,
        isSubtitleOverflowing: false,
      }),
    ).toBe(true);
    expect(
      shouldModalBeClickableForReadMore({
        isSubtitleOverflowing: true,
      }),
    ).toBe(true);
    expect(
      shouldModalShowReadMore({
        showSubtitle: true,
        isSubtitleOverflowing: true,
      }),
    ).toBe(true);
  });

  it('exports modal metrics and per-instance materials', () => {
    expect(MODAL_PANEL_CORNER_RADIUS).toBe(CornerRadius.MEDIUM);
    expect(MODAL_BANNER_CORNER_RADIUS).toBe(CornerRadius.XXSMALL);
    expect(MODAL_BANNER_BACKGROUND_STYLE).toBe(BackgroundStyle.NONE);
    expect(getModalBannerHeightRatio(ModalBannerSize.STANDARD)).toBe(
      MODAL_BANNER_STANDARD_HEIGHT_RATIO,
    );
    expect(getModalBannerHeightRatio(ModalBannerSize.TALLER)).toBe(
      MODAL_BANNER_TALLER_HEIGHT_RATIO,
    );
    expect(createModalMaterial()).not.toBe(createModalMaterial());
    expect(createModalBannerMaterial()).not.toBe(createModalBannerMaterial());
    expect(MODAL_READ_MORE_PADDING).toBe(2);
    expect(MODAL_READ_MORE_SCRIM_WIDTH).toBe(72);
    expect(MODAL_STANDARD_TITLE_TEXT_VIEW_HEIGHT).toBe(51);
  });

  it('keeps title and subtitle CSS aligned with their metrics', () => {
    expect(CSS_SOURCE).toMatch(
      /\.titleStandard\s*\{[^}]*min-height:\s*51px;/s,
    );
    expect(CSS_SOURCE).toMatch(/\.subtitle\s*\{[^}]*composes:\s*uit-text-meta1 from global;/s);
    expect(CSS_SOURCE).toMatch(
      /\.subtitle\s*\{[^}]*padding-block:\s*0;/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.subtitleContainer\s*\{[^}]*isolation:\s*isolate;/s,
    );
  });

  it('keeps the read-more affordance layout contract', () => {
    expect(CSS_SOURCE).toMatch(
      /\.readMoreAffordance\s*\{[^}]*--modal-read-more-padding:\s*2px;/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.readMoreAffordance\s*\{[^}]*--modal-read-more-scrim-width:\s*72px;/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.readMoreAffordance\s*\{[^}]*padding-left:\s*calc\(var\(--modal-read-more-scrim-width\) \+ var\(--modal-read-more-padding\)\);/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.readMoreAffordance\s*\{[^}]*padding-right:\s*var\(--modal-read-more-padding\);/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.readMoreAffordance\s*\{[^}]*width:\s*max-content;/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.readMoreAffordance\s*\{[^}]*white-space:\s*nowrap;/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.readMoreAffordance\s*\{[^}]*var\(--uit-color-background-window, #000\) var\(--modal-read-more-scrim-width\)/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.readMoreAffordance\s*\{[^}]*z-index:\s*1;/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.readMoreText\s*\{[^}]*display:\s*inline-block;/s,
    );
    expect(CSS_SOURCE).toMatch(
      /\.readMoreText\s*\{[^}]*white-space:\s*nowrap;/s,
    );
  });

  it('keeps the read-more dialog fullscreen with centered text', () => {
    expect(READ_MORE_DIALOG_CSS_SOURCE).toMatch(
      /\.dialog\s*\{[^}]*position:\s*fixed;/s,
    );
    expect(READ_MORE_DIALOG_CSS_SOURCE).toMatch(
      /\.dialog\s*\{[^}]*padding:\s*var\(--uit-spacing-3xl\);/s,
    );
    expect(READ_MORE_DIALOG_CSS_SOURCE).toMatch(
      /\.text\s*\{[^}]*text-align:\s*center;/s,
    );
  });
});

describe('Modal leading area (mutually exclusive)', () => {
  it('renders icon', () => {
    const { container } = render(<Modal title="Test" icon={TEST_ICON_SRC} />);
    const iconContainer = container.querySelector('[class*="iconContainer"]');
    expect(iconContainer).not.toBeNull();
    const maskedIcon = iconContainer?.querySelector('[style*="mask-image"]');
    expect(maskedIcon).not.toBeNull();
    expect(maskedIcon?.getAttribute('style')).toContain(TEST_ICON_SRC);
  });

  it('renders avatar content slots', () => {
    const { container } = render(
      <Modal
        title="Test"
        avatarPrimaryContent={<span data-testid="avatar-primary">A</span>}
        avatarSecondaryContent={<span data-testid="avatar-secondary">S</span>}
        avatarBadgeContent={<span data-testid="avatar-badge">B</span>}
      />,
    );

    expect(container.querySelector('[class*="avatarContainer"]')).not.toBeNull();
    expect(screen.getByTestId('avatar-primary')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-secondary')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-badge')).toBeInTheDocument();
  });

  it('removes icon when icon is cleared', () => {
    const { container, rerender } = render(
      <Modal title="Test" icon={TEST_ICON_SRC} />
    );
    expect(container.querySelector('[style*="mask-image"]')).not.toBeNull();

    rerender(<Modal title="Test" />);
    expect(container.querySelector('[class*="iconContainer"]')).toBeNull();
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();
  });

  it('centers the icon slot', () => {
    expect(CSS_SOURCE).toMatch(/\.iconContainer\s*\{[^}]*margin-left:\s*auto;/s);
    expect(CSS_SOURCE).toMatch(/\.iconContainer\s*\{[^}]*margin-right:\s*auto;/s);
  });

  it('renders banner', () => {
    const { container } = render(
      <Modal title="Test" bannerSrc="/banner.jpg" />
    );
    const banner = container.querySelector('[class*="bannerContainer"]');
    expect(banner).not.toBeNull();
  });

  it('clips banner through a StaticContainer smooth corner path', () => {
    const { container } = render(
      <Modal title="Test" bannerSrc="/banner.jpg" />
    );
    const banner = container.querySelector('[class*="bannerContainer"]');
    const bannerBlock = CSS_SOURCE.match(/\.bannerContainer\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(banner?.className).toMatch(/\bcontainer\b/);
    expect(banner?.querySelector('[class*="contentWrapper"] img')).not.toBeNull();
    expect(bannerBlock).not.toContain('border-radius');
  });

  it('uses centered cover image scaling for banners', () => {
    expect(CSS_SOURCE).toMatch(/\.bannerImageFallback\s*\{[^}]*object-fit:\s*cover;/s);
    expect(CSS_SOURCE).toMatch(
      /\.bannerImageFallback\s*\{[^}]*object-position:\s*center center;/s
    );
    expect(MODAL_BANNER_IMAGE_SOURCE).toContain('preserveAspectRatio="xMidYMid slice"');
  });

  it('renders avatar', () => {
    const { container } = render(
      <Modal title="Test" avatarSrc="/avatar.webp" />
    );
    const avatar = container.querySelector('[class*="avatarContainer"]');
    expect(avatar).not.toBeNull();
  });

  it('forwards statusIndicatorIcon to the inner avatar glyph when statusIndicator is set', () => {
    const { container } = render(
      <Modal
        title="Test"
        avatarSrc="/avatar.webp"
        statusIndicator={StatusIndicatorType.ACTIVE}
        statusIndicatorIcon="/icons/check.svg"
      />
    );
    expect(
      container.querySelector('[class*="statusIndicatorGlyph"]'),
    ).not.toBeNull();
  });

  it('banner takes priority over icon (banner > avatar > icon)', () => {
    const { container } = render(
      <Modal title="Test" icon={TEST_ICON_SRC} bannerSrc="/banner.jpg" />
    );
    expect(container.querySelector('[class*="bannerContainer"]')).not.toBeNull();
    expect(container.querySelector('[class*="iconContainer"]')).toBeNull();
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();
  });

  it('banner tag renders on banner', () => {
    const { container } = render(
      <Modal
        title="Test"
        bannerSrc="/banner.jpg"
        bannerTag={ModalBannerTag.BETA}
      />
    );
    expect(container.textContent).toContain('Beta');
  });
});

describe('Modal list items', () => {
  it('renders list items', () => {
    const items = [
      { icon: TEST_ICON_SRC, description: 'Feature 1' },
      { icon: TEST_ICON_SRC, description: 'Feature 2' },
    ];
    const { container } = render(<Modal title="Features" listItems={items} />);
    expect(container.textContent).toContain('Feature 1');
    expect(container.textContent).toContain('Feature 2');
  });

  it('list items hide subtitle', () => {
    const items = [{ icon: TEST_ICON_SRC, description: 'Item' }];
    const { container } = render(
      <Modal title="Test" subtitle="Should hide" listItems={items} />
    );
    expect(container.textContent).not.toContain('Should hide');
  });
});

describe('Modal buttons', () => {
  it('renders buttons section', () => {
    render(
      <Modal
        title="Confirm"
        buttons={<button data-testid="action-btn">OK</button>}
      />
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });
});

describe('Modal keyboard handling', () => {
  it('leaves Escape unhandled', () => {
    const { container } = render(<Modal title="Test" />);
    const handleKeyDown = vi.fn();
    document.addEventListener('keydown', handleKeyDown);
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });

    try {
      container.firstElementChild!.dispatchEvent(event);

      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(false);
    } finally {
      document.removeEventListener('keydown', handleKeyDown);
    }
  });

  it('lets App assign initial focus to its first action', async () => {
    const boundsSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => ({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: 100,
        bottom: 40,
        width: 100,
        height: 40,
        toJSON: () => {},
      }));
    try {
      render(
        <App>
          <Modal title="Test" buttons={<Button title="Action" />} />
        </App>,
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(
          screen.getByRole('button', { name: 'Action' }),
        );
      });
    } finally {
      boundsSpy.mockRestore();
    }
  });
});

describe('Modal accessibility', () => {
  it('aria-label includes title', () => {
    const { container } = render(<Modal title="Welcome" />);
    const label = container.firstElementChild?.getAttribute('aria-label') ?? '';
    expect(label).toContain('Welcome');
  });

  it('aria-label includes title and subtitle', () => {
    const { container } = render(<Modal title="Hello" subtitle="World" />);
    const label = container.firstElementChild?.getAttribute('aria-label') ?? '';
    expect(label).toContain('Hello');
    expect(label).toContain('World');
  });
});

describe('Modal custom props', () => {
  it('accepts className', () => {
    const { container } = render(<Modal title="Test" className="my-modal" />);
    // className is applied to the Panel inside the animation wrapper
    const allElements = container.querySelectorAll('*');
    const found = Array.from(allElements).some(el => el.className.includes('my-modal'));
    expect(found).toBe(true);
  });
});
