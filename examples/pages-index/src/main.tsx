/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Heading } from '@astryxdesign/core/Heading';
import { Link } from '@astryxdesign/core/Link';
import { Stack } from '@astryxdesign/core/Stack';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import qrcode from 'qrcode-generator';
import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import alphaLauncherArtwork from './assets/alpha-launcher.png';
import componentGalleryArtwork from './assets/component-gallery.png';
import launcherArtwork from './assets/launcher.png';
import messagingArtwork from './assets/messaging.png';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
import './styles.css';

// An empty VITE_PAGES_BASE_URL is treated as unset: `??` would accept `''` and
// resolve to the current page URL, query and fragment included. The trailing
// slash is normalized because the deploy workflow appends one, which doubles it
// when the configured value already ends in a slash.
const PAGES_BASE_URL = new URL(
  (import.meta.env.VITE_PAGES_BASE_URL || './').replace(/\/*$/, '/'),
  window.location.href,
).href;
const WEBMCP_DOCS_URL =
  'https://wearables.developer.meta.com/docs/develop/webapps/agent-tools/';

type Artwork = 'gallery' | 'launcher' | 'alpha' | 'messaging';
type UtilityArtwork = 'icons' | 'app-icon';
type IconName = 'arrow' | 'code' | 'external' | 'qr' | 'sparkles';

type WebMcpCommand = {
  signature: string;
  description: string;
};

type SiteEntry = {
  title: string;
  description: string;
  background: string;
  href: string;
  sourceHref: string;
  installHref: string;
  artwork: Artwork;
  webMcpCommands: WebMcpCommand[];
};

type UtilityEntry = {
  title: string;
  description: string;
  href: string;
  artwork: UtilityArtwork;
};

function createInstallHref(appName: string, appUrl: string): string {
  return `fb-viewapp://web_app_deep_link?appName=${encodeURIComponent(appName)}&appUrl=${encodeURIComponent(appUrl)}`;
}

const samples: SiteEntry[] = [
  {
    title: 'Component gallery',
    description:
      'Explore public components, interaction states, materials, and usage guidance.',
    background:
      'A browsable catalog of the public toolkit, showcasing components one at a time across their visual, interaction, and focus states.',
    href: './component-gallery/',
    sourceHref:
      'https://github.com/facebook/meta-ray-ban-display-ui-toolkit-web/tree/main/examples/gallery',
    installHref: createInstallHref('Component gallery', new URL('component-gallery/', PAGES_BASE_URL).href),
    artwork: 'gallery',
    webMcpCommands: [
      {
        signature: 'open_component_demo({ component })',
        description: 'Open a named component or category, such as ButtonRail.',
      },
    ],
  },
  {
    title: 'Launcher',
    description:
      'Try pagers, quick settings, app grids, pin management, and responsive layouts.',
    background:
      'A recreation of a complete system launcher, showcasing paged navigation, quick settings, home content, app-grid layouts, and pin management.',
    href: './launcher/',
    sourceHref:
      'https://github.com/facebook/meta-ray-ban-display-ui-toolkit-web/tree/main/examples/launcher',
    installHref: createInstallHref('Launcher', new URL('launcher/', PAGES_BASE_URL).href),
    artwork: 'launcher',
    webMcpCommands: [
      {
        signature: 'set_launcher_layout({ layout })',
        description: 'Switch between the two-column and three-column grid layouts.',
      },
      {
        signature: 'set_app_pinned({ app, pinned })',
        description: 'Pin or unpin a named app tile without opening it.',
      },
    ],
  },
  {
    title: 'Alpha launcher',
    description:
      'See URL-backed pages, focus restoration, and a custom application material.',
    background:
      'An alternate system launcher recreation, showcasing a bottom action rail, URL-backed pages, focus restoration, and custom materials.',
    href: './alpha-launcher/',
    sourceHref:
      'https://github.com/facebook/meta-ray-ban-display-ui-toolkit-web/tree/main/examples/alpha-launcher',
    installHref: createInstallHref('Alpha launcher', new URL('alpha-launcher/', PAGES_BASE_URL).href),
    artwork: 'alpha',
    webMcpCommands: [
      {
        signature: 'set_display_preferences({ brightnessPercent?, volumePercent?, doNotDisturb? })',
        description: 'Update one or more display preferences; percentages accept values from 0–100.',
      },
    ],
  },
  {
    title: 'Messaging',
    description:
      'Browse an inbox and routed conversations with grouped message bubbles.',
    background:
      'A complete messaging app example, showcasing an avatar-led inbox, routed threads, grouped message bubbles, and bottom-anchored actions.',
    href: './messaging/',
    sourceHref:
      'https://github.com/facebook/meta-ray-ban-display-ui-toolkit-web/tree/main/examples/messaging',
    installHref: createInstallHref('Messaging', new URL('messaging/', PAGES_BASE_URL).href),
    artwork: 'messaging',
    webMcpCommands: [
      {
        signature: 'open_message_thread({ person })',
        description: 'Open a conversation by a contact’s first, full, or last name.',
      },
      {
        signature: 'draft_message({ recipient, text })',
        description: 'Create a visible draft for the wearer to review and send.',
      },
    ],
  },
];

const utilities: UtilityEntry[] = [
  {
    title: 'Icon browser',
    description:
      'Search the complete monochrome icon catalog, preview every glyph, and copy package imports.',
    href: './utilities/icons/',
    artwork: 'icons',
  },
  {
    title: 'App icon generator',
    description:
      'Compose, validate, preview, and download a complete web-app icon manifest and artwork bundle.',
    href: './utilities/app-icons/',
    artwork: 'app-icon',
  },
];

const artworkSources: Record<Artwork, string> = {
  gallery: componentGalleryArtwork,
  launcher: launcherArtwork,
  alpha: alphaLauncherArtwork,
  messaging: messagingArtwork,
};

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    code: (
      <>
        <path d="m8 9-4 3 4 3" />
        <path d="m16 9 4 3-4 3" />
        <path d="m14 5-4 14" />
      </>
    ),
    external: (
      <>
        <path d="M15 4h5v5" />
        <path d="m20 4-9 9" />
        <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 .9 2.4L15 6.5l-2.1 1.1L12 10l-.9-2.4L9 6.5l2.1-1.1z" />
        <path d="m18 12 .7 1.8 1.8.7-1.8.7L18 17l-.7-1.8-1.8-.7 1.8-.7z" />
        <path d="m7 13 1.1 3L11 17.1l-2.9 1.1L7 21l-1.1-2.8L3 17.1 5.9 16z" />
      </>
    ),
    qr: (
      <>
        <path d="M4 4h6v6H4z" />
        <path d="M14 4h6v6h-6z" />
        <path d="M4 14h6v6H4z" />
        <path d="M15 14h2v2h-2z" />
        <path d="M18 14h2v2h-2z" />
        <path d="M14 18h2v2h-2z" />
        <path d="M18 18h2v2h-2z" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  );
}

function SampleArtwork({ type }: { type: Artwork }) {
  const source = artworkSources[type];

  return (
    <div className={`sample-art sample-art-${type}`} aria-hidden="true">
      <img className="sample-art-backdrop" src={source} alt="" />
      <img className="sample-art-screen" src={source} alt="" />
    </div>
  );
}

function QRCode({ value }: { value: string }) {
  const { moduleCount, path } = useMemo(() => {
    const code = qrcode(0, 'M');
    code.addData(value);
    code.make();

    const count = code.getModuleCount();
    let modules = '';
    for (let row = 0; row < count; row += 1) {
      for (let column = 0; column < count; column += 1) {
        if (code.isDark(row, column)) {
          modules += `M${column} ${row}h1v1h-1z`;
        }
      }
    }
    return { moduleCount: count, path: modules };
  }, [value]);

  return (
    <svg
      aria-label={`QR code for ${value}`}
      className="qr-code"
      role="img"
      shapeRendering="crispEdges"
      viewBox={`-4 -4 ${moduleCount + 8} ${moduleCount + 8}`}
    >
      <rect x="-4" y="-4" width={moduleCount + 8} height={moduleCount + 8} fill="white" />
      <path d={path} fill="#111820" />
    </svg>
  );
}

function InstallDialog({ sample, onClose }: { sample: SiteEntry | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog == null) {
      return;
    }
    if (sample != null && !dialog.open) {
      dialog.showModal();
    }
  }, [sample]);

  if (sample == null) {
    return null;
  }

  // Dismissing through close() rather than unmounting lets the browser return
  // focus to the control that opened the dialog.
  const requestClose = () => dialogRef.current?.close();

  return (
    <dialog
      aria-labelledby="install-dialog-title"
      className="install-dialog"
      onClick={event => {
        if (event.currentTarget === event.target) {
          requestClose();
        }
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="install-dialog-panel">
        <button className="dialog-close" type="button" onClick={requestClose} aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
        <div className="dialog-copy">
          <span className="dialog-kicker">Install on glasses</span>
          <h2 id="install-dialog-title">{sample.title}</h2>
          <p>
            Enable developer mode on your glasses, then scan this code to open the sample.
          </p>
        </div>
        <div className="qr-shell">
          <QRCode value={sample.installHref} />
        </div>
        <a className="dialog-url" href={sample.installHref} target="_blank" rel="noreferrer">
          <span>{sample.installHref}</span>
          <Icon name="external" />
        </a>
      </div>
    </dialog>
  );
}

function WebMcpDialog({ sample, onClose }: { sample: SiteEntry | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (sample != null && dialog != null && !dialog.open) {
      dialog.showModal();
    }
  }, [sample]);

  if (sample == null) {
    return null;
  }

  // Dismissing through close() rather than unmounting lets the browser return
  // focus to the control that opened the dialog.
  const requestClose = () => dialogRef.current?.close();

  return (
    <dialog
      aria-labelledby="webmcp-dialog-title"
      className="webmcp-dialog"
      onClick={event => {
        if (event.currentTarget === event.target) {
          requestClose();
        }
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="webmcp-dialog-panel">
        <button className="dialog-close" type="button" onClick={requestClose} aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
        <div className="webmcp-dialog-heading">
          <span className="webmcp-dialog-icon" aria-hidden="true">
            <Icon name="sparkles" />
          </span>
          <div>
            <span className="dialog-kicker">Supports WebMCP</span>
            <h2 id="webmcp-dialog-title">{sample.title} commands</h2>
          </div>
        </div>
        <p className="webmcp-dialog-intro">
          These tools let the on-glasses assistant operate this sample on the wearer’s behalf.
        </p>
        <p className="webmcp-dialog-availability">
          <strong>Requires v129+.</strong> WebMCP tools are unavailable on earlier system versions.
        </p>
        <div className="command-list">
          {sample.webMcpCommands.map(command => (
            <div className="command-item" key={command.signature}>
              <code>{command.signature}</code>
              <p>{command.description}</p>
            </div>
          ))}
        </div>
        <a className="webmcp-docs-link" href={WEBMCP_DOCS_URL} target="_blank" rel="noreferrer">
          <span>Read the WebMCP documentation</span>
          <Icon name="external" />
        </a>
      </div>
    </dialog>
  );
}

function UtilityArtwork({ type }: { type: UtilityArtwork }) {
  return type === 'icons' ? (
    <div className="utility-art utility-art-icons" aria-hidden="true">
      {['✦', '⌁', '◎', '↗', '◫', '⌖', '◇', '≋', '◉'].map((glyph, index) => (
        <span key={index}>{glyph}</span>
      ))}
    </div>
  ) : (
    <div className="utility-art utility-art-app-icon" aria-hidden="true">
      <div className="app-icon-orbit"><span>✦</span></div>
      <code>{'{ }'}</code>
    </div>
  );
}

function UtilityCard({ utility }: { utility: UtilityEntry }) {
  return (
    <article className="utility-card">
      <a className="utility-preview-link" href={utility.href} aria-label={`Open ${utility.title}`}>
        <UtilityArtwork type={utility.artwork} />
      </a>
      <div className="utility-card-copy">
        <span className="sample-label">Utility</span>
        <Heading level={3}>{utility.title}</Heading>
        <p>{utility.description}</p>
        <div className="utility-actions">
          <a className="primary-action" href={utility.href}>
            <span>Open utility</span>
            <Icon name="arrow" />
          </a>
        </div>
      </div>
    </article>
  );
}

function SampleCard({
  sample,
  onShowQRCode,
  onShowWebMcp,
}: {
  sample: SiteEntry;
  onShowQRCode: () => void;
  onShowWebMcp: () => void;
}) {
  return (
    <article className="sample-card">
      <a className="sample-preview-link" href={sample.href} aria-label={`Open ${sample.title}`}>
        <SampleArtwork type={sample.artwork} />
      </a>
      <div className="sample-card-copy">
        <div className="sample-card-heading">
          <div className="sample-card-meta">
            <span className="sample-label">Sample app</span>
            {sample.webMcpCommands.length > 0 && (
              <button
                className="webmcp-tag"
                type="button"
                onClick={onShowWebMcp}
                aria-label={`${sample.title} supports WebMCP: view commands`}
              >
                <Icon name="sparkles" />
                <span>Supports WebMCP</span>
              </button>
            )}
          </div>
          <Heading level={3}>{sample.title}</Heading>
        </div>
        <p className="sample-card-description">{sample.description}</p>
        <p className="sample-card-background">{sample.background}</p>
        <div className="sample-card-actions">
          <a
            className="primary-action"
            href={sample.href}
            aria-label={`Open sample: ${sample.title}`}
          >
            <span>Open sample</span>
            <Icon name="arrow" />
          </a>
          <div className="secondary-actions">
            <a
              href={sample.sourceHref}
              target="_blank"
              rel="noreferrer"
              aria-label={`View code: ${sample.title} on GitHub`}
            >
              <Icon name="code" />
              <span>View code</span>
            </a>
            <span className="action-divider" aria-hidden="true" />
            <button
              type="button"
              onClick={onShowQRCode}
              aria-label={`Show QR code to install ${sample.title}`}
            >
              <Icon name="qr" />
              <span>QR code</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function PagesIndex() {
  const [selectedSample, setSelectedSample] = useState<SiteEntry | null>(null);
  const [webMcpSample, setWebMcpSample] = useState<SiteEntry | null>(null);

  return (
    <Theme mode="light" theme={neutralTheme}>
      <div className="page">
        <header className="topbar">
          <div className="topbar-inner">
            <a className="brand" href="./">
              UI Toolkit for Meta Ray-Ban Display
            </a>
            <nav className="topbar-links" aria-label="Primary navigation">
              <a href="#utilities">Utilities</a>
              <a href="#samples">Samples</a>
              <a
                href="https://wearables.developer.meta.com/docs/develop/webapps/design/overview/"
                target="_blank"
                rel="noreferrer"
              >
                Documentation
              </a>
              <a
                href="https://github.com/facebook/meta-ray-ban-display-ui-toolkit-web"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>

        <main>
          <section className="hero" aria-labelledby="page-title">
            <div className="hero-inner">
              <Stack className="hero-copy" gap={4} maxWidth={700}>
                <p className="hero-eyebrow">Samples & utilities</p>
                <h1 className="hero-title" id="page-title">
                  Explore what you can build
                </h1>
                <p className="hero-description">
                  Explore sample apps, find production-ready icons, and create polished
                  app artwork for Meta Ray-Ban Display.
                </p>
                <a className="hero-link" href="#utilities">
                  <span>Explore</span>
                  <Icon name="arrow" />
                </a>
              </Stack>
            </div>
          </section>

          <section className="catalog utility-catalog" id="utilities" aria-labelledby="utilities-heading">
            <div className="catalog-heading">
              <Heading level={2} id="utilities-heading">
                Tools for the details
              </Heading>
            </div>
            <div className="utility-grid">
              {utilities.map(utility => <UtilityCard key={utility.href} utility={utility} />)}
            </div>
          </section>

          <section className="catalog sample-catalog" id="samples" aria-labelledby="samples-heading">
            <div className="catalog-heading">
              <Heading level={2} id="samples-heading">
                Start with a working interface
              </Heading>
              <p className="catalog-summary">
                <Link
                  href="https://wearables.developer.meta.com/docs/develop/webapps/design/overview/"
                  isExternalLink
                >
                  UI Toolkit documentation
                </Link>
              </p>
            </div>

            <div className="sample-grid">
              {samples.map(sample => (
                <SampleCard
                  key={sample.href}
                  sample={sample}
                  onShowQRCode={() => setSelectedSample(sample)}
                  onShowWebMcp={() => setWebMcpSample(sample)}
                />
              ))}
            </div>
          </section>
        </main>

        <InstallDialog sample={selectedSample} onClose={() => setSelectedSample(null)} />
        <WebMcpDialog sample={webMcpSample} onClose={() => setWebMcpSample(null)} />
      </div>
    </Theme>
  );
}

const rootElement = document.getElementById('root');
if (rootElement == null) {
  throw new Error('Missing application mount element');
}

createRoot(rootElement).render(<PagesIndex />);
