/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import cloudSunFilled from '@wearables-ui-toolkit/icons/svg/cloudsun__filled.svg';
import {
  executeWebMcpTestTool,
  installWebMcpTestHost,
} from '../../shared/webmcpTestHost';
import { AlphaLauncherApp } from './App';

describe('AlphaLauncherApp', () => {
  afterEach(() => {
    window.history.replaceState(null, '', window.location.pathname);
    window.sessionStorage.clear();
    delete (document as Document & { modelContext?: unknown }).modelContext;
  });

  it('renders the anchored launcher rail and its sample applications', () => {
    render(<AlphaLauncherApp />);

    const brightness = screen.getByRole('button', { name: 'Brightness' });
    expect(brightness).toBeInTheDocument();
    const notifications = screen.getByRole('button', { name: 'Notifications' });
    expect(notifications).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Messages' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Games' })).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(17);
    expect(buttons[0]).toHaveAccessibleName('Settings');
    expect(buttons[4]).toHaveAccessibleName('Notifications');
  });

  it('toggles Do Not Disturb and its icon', () => {
    render(<AlphaLauncherApp />);

    const button = screen.getByRole('button', { name: 'Do Not Disturb' });
    const iconBefore = button.querySelector<HTMLElement>(
      '[style*="mask-image"]',
    )?.style.maskImage;
    expect(button).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(button);

    const iconAfter = button.querySelector<HTMLElement>(
      '[style*="mask-image"]',
    )?.style.maskImage;
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(iconAfter).not.toBe(iconBefore);
  });

  it('updates display preferences through WebMCP when available', async () => {
    const host = installWebMcpTestHost();
    render(<AlphaLauncherApp />);

    await waitFor(async () => {
      expect(await host.context.getTools()).toHaveLength(1);
    });
    let result: unknown;
    await act(async () => {
      result = await executeWebMcpTestTool(
        host.context,
        'set_display_preferences',
        {
          brightnessPercent: 40,
          doNotDisturb: true,
        },
      );
    });

    expect(result).toMatchObject({
      brightnessPercent: 40,
      volumePercent: 60,
      doNotDisturb: true,
    });
    expect(window.sessionStorage.getItem('alpha-launcher-brightness')).toBe('0.4');
    expect(screen.getByRole('button', { name: 'Do Not Disturb' }))
      .toHaveAttribute('aria-pressed', 'true');
    host.remove();
  });

  it('merges back-to-back partial WebMCP updates', async () => {
    const host = installWebMcpTestHost();
    render(<AlphaLauncherApp />);

    await waitFor(async () => {
      expect(await host.context.getTools()).toHaveLength(1);
    });
    await act(async () => {
      await Promise.all([
        executeWebMcpTestTool(host.context, 'set_display_preferences', {
          brightnessPercent: 40,
        }),
        executeWebMcpTestTool(host.context, 'set_display_preferences', {
          volumePercent: 20,
        }),
      ]);
    });

    expect(window.sessionStorage.getItem('alpha-launcher-brightness')).toBe('0.4');
    expect(window.sessionStorage.getItem('alpha-launcher-volume')).toBe('0.2');
    host.remove();
  });

  it('loads an adjustment page from its URL and restores its stored value', () => {
    window.sessionStorage.setItem('alpha-launcher-volume', '0.8');
    window.history.replaceState(null, '', '?page=volume');

    render(<AlphaLauncherApp />);

    expect(screen.getByRole('slider', {
      name: 'Volume, 80%',
    })).toHaveAttribute('aria-valuenow', '0.8');
    expect(screen.queryByRole('button', { name: 'Notifications' })).toBeNull();
  });

  it('fades the rail before navigating to an adjustment page', () => {
    const { container } = render(<AlphaLauncherApp />);

    fireEvent.click(screen.getByRole('button', { name: 'Brightness' }));

    expect(container.querySelector('.launcher-page')).toHaveClass('is-leaving');
    expect(window.sessionStorage.getItem(
      'alpha-launcher-last-rail-focus',
    )).toBe('brightness');
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.getByRole('button', { name: 'Notifications' }))
      .toBeInTheDocument();
  });

  it('keeps the brightness value between page loads', () => {
    window.history.replaceState(null, '', '?page=brightness');
    const { unmount } = render(<AlphaLauncherApp />);

    const brightnessControl = screen.getByRole('slider', {
      name: 'Brightness, 70%',
    });

    fireEvent.keyUp(brightnessControl, { key: 'ArrowLeft' });

    expect(screen.getByRole('slider', {
      name: 'Brightness, 60%',
    })).toHaveAttribute('aria-valuenow', '0.6');

    unmount();
    render(<AlphaLauncherApp />);

    expect(screen.getByRole('slider', {
      name: 'Brightness, 60%',
    })).toBeInTheDocument();
  });

  it('updates the volume control and reuses its value in the rail', () => {
    const initialRender = render(<AlphaLauncherApp />);
    const iconBefore = screen.getByRole('button', { name: 'Volume' })
      .querySelector<HTMLElement>('[style*="mask-image"]')?.style.maskImage;
    initialRender.unmount();
    window.history.replaceState(null, '', '?page=volume');
    const { unmount } = render(<AlphaLauncherApp />);
    const volumeControl = screen.getByRole('slider', { name: 'Volume, 60%' });

    fireEvent.keyUp(volumeControl, { key: 'ArrowRight' });
    expect(screen.getByRole('slider', {
      name: 'Volume, 70%',
    })).toHaveAttribute('aria-valuenow', '0.7');

    unmount();
    window.history.replaceState(null, '', window.location.pathname);
    render(<AlphaLauncherApp />);
    const restoredVolumeButton = screen.getByRole('button', { name: 'Volume' });
    const icon = restoredVolumeButton.querySelector<HTMLElement>(
      '[style*="mask-image"]',
    );
    expect(icon?.style.maskImage).not.toBe(iconBefore);
  });

  it('shows a header-inset notification list from the Notifications page', async () => {
    window.history.replaceState(null, '', '?page=notifications');

    const { container } = render(<AlphaLauncherApp />);

    expect(screen.getByRole('main', { name: 'Notifications' }))
      .toBeInTheDocument();
    expect(screen.getByText('Maya Johnson')).toBeInTheDocument();
    expect(screen.getByText('Are we still on for coffee after work?'))
      .toBeInTheDocument();
    expect(screen.getByText('Trail Weather')).toBeInTheDocument();
    expect(container.querySelector('[data-alpha-list-page="notifications"]'))
      .toBeInTheDocument();
    expect(screen.getByAltText('Maya Johnson')).toHaveAttribute(
      'src',
      '/avatars/maya-johnson.webp',
    );
    expect(screen.getByAltText('Alex Lee')).toHaveAttribute(
      'src',
      '/avatars/alex-lee.webp',
    );
    expect(screen.getByAltText('Sam Rivera')).toHaveAttribute(
      'src',
      '/avatars/sam-rivera.webp',
    );
    const firstSubtitle = screen.getByText(
      'Are we still on for coffee after work?',
    );
    expect(firstSubtitle.className).toContain('subtitleText');
    expect(firstSubtitle.closest('[class*="contentView"]'))
      .not.toHaveClass(/multiline/);
    for (const timestamp of ['Now', '4m', '12m', '1h']) {
      expect(screen.getByText(timestamp).parentElement?.className)
        .toContain('topAligned');
    }
    const weatherItem = screen.getByText('Trail Weather')
      .closest('[data-uit-interactable]');
    expect(weatherItem?.querySelector<HTMLElement>('[style*="mask-image"]')
      ?.style.maskImage).toBe(`url("${cloudSunFilled}")`);

    await waitFor(() => {
      expect(screen.getByText('Maya Johnson').closest('[data-uit-interactable]'))
        .toHaveFocus();
    });
  });

  it('fades the rail before navigating to Notifications', () => {
    const { container } = render(<AlphaLauncherApp />);

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(container.querySelector('.launcher-page')).toHaveClass('is-leaving');
    expect(window.sessionStorage.getItem(
      'alpha-launcher-last-rail-focus',
    )).toBe('notifications');
  });

  it('renders the Settings list with public toolkit controls', () => {
    window.history.replaceState(null, '', '?page=settings');

    render(<AlphaLauncherApp />);

    expect(screen.getByRole('main', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Assistant shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Widgets')).toBeInTheDocument();
    expect(screen.getByText('Message notifications')).toBeInTheDocument();
    expect(screen.getByText('Always wake the display')).toBeInTheDocument();
    expect(screen.getByText('Phone notifications')).toBeInTheDocument();
    expect(screen.getByText('Display alignment')).toBeInTheDocument();
    expect(screen.getByText('Reset sample')).toBeInTheDocument();
  });

});
