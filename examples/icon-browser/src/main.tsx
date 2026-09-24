/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Heading } from '@astryxdesign/core/Heading';
import { Stack } from '@astryxdesign/core/Stack';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { loadUITIconAssetUrl } from '@wearables-ui-toolkit/icons/browser';
import iconManifest from '@wearables-ui-toolkit/icons/manifest.json';
import type {
  UITIconAssetPath,
  UITIconManifestEntry,
  UITIconVariant,
} from '@wearables-ui-toolkit/icons';
import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
import './styles.css';

const icons = iconManifest as UITIconManifestEntry[];
const PAGE_SIZE = 120;
const MAX_CONCURRENT_ICON_LOADS = 12;
const iconUrlCache = new Map<UITIconAssetPath, string>();
const pendingIconLoads = new Map<UITIconAssetPath, Promise<string>>();
const iconLoadQueue: Array<() => void> = [];
let activeIconLoads = 0;

type VariantFilter = 'all' | UITIconVariant;
type ColorMode = 'light' | 'dark';
type SelectedIcon = {
  entry: UITIconManifestEntry;
  variant: UITIconVariant;
  path: UITIconAssetPath;
};

function resolveVariant(
  entry: UITIconManifestEntry,
  preference: VariantFilter,
): SelectedIcon | null {
  if (preference === 'filled' && entry.filled != null) {
    return { entry, variant: 'filled', path: entry.filled };
  }
  if (preference === 'outline' && entry.outline != null) {
    return { entry, variant: 'outline', path: entry.outline };
  }
  if (preference !== 'all') {
    return null;
  }
  if (entry.default === entry.outline) {
    return { entry, variant: 'outline', path: entry.default };
  }
  return { entry, variant: 'filled', path: entry.default };
}

function exportName(icon: SelectedIcon): string {
  const suffix = icon.variant === 'filled' ? 'Filled' : 'Outline';
  return `${icon.entry.name}${suffix}`;
}

function importCode(icon: SelectedIcon): string {
  return `import { ${exportName(icon)} } from '@wearables-ui-toolkit/icons';`;
}

function runNextIconLoads(): void {
  while (activeIconLoads < MAX_CONCURRENT_ICON_LOADS) {
    const next = iconLoadQueue.shift();
    if (next == null) {
      return;
    }
    activeIconLoads += 1;
    next();
  }
}

function loadIconUrl(path: UITIconAssetPath): Promise<string> {
  const cached = iconUrlCache.get(path);
  if (cached != null) {
    return Promise.resolve(cached);
  }
  const pending = pendingIconLoads.get(path);
  if (pending != null) {
    return pending;
  }
  const promise = new Promise<string>((resolve, reject) => {
    iconLoadQueue.push(() => {
      const load = loadUITIconAssetUrl(path);
      if (load == null) {
        reject(new Error(`No icon asset loader for ${path}`));
        activeIconLoads -= 1;
        pendingIconLoads.delete(path);
        runNextIconLoads();
        return;
      }
      void load.then(url => {
        iconUrlCache.set(path, url);
        resolve(url);
      }, reject).finally(() => {
        activeIconLoads -= 1;
        pendingIconLoads.delete(path);
        runNextIconLoads();
      });
    });
  });
  pendingIconLoads.set(path, promise);
  runNextIconLoads();
  return promise;
}

function AsyncIcon({ path, alt = '' }: { path: UITIconAssetPath; alt?: string }) {
  const [source, setSource] = useState<string | null>(() => iconUrlCache.get(path) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setSource(iconUrlCache.get(path) ?? null);
    setFailed(false);
    void loadIconUrl(path).then(url => {
      if (active) {
        setSource(url);
      }
    }, () => {
      if (active) {
        setFailed(true);
      }
    });
    return () => {
      active = false;
    };
  }, [path]);

  if (source != null) {
    return <img src={source} alt={alt} />;
  }
  return failed
    ? <span className="icon-unavailable" aria-label="Icon preview unavailable">×</span>
    : <span className="icon-loading" aria-hidden="true" />;
}

function IconDetails({
  selected,
  onClose,
}: {
  selected: SelectedIcon | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selected != null && dialog != null && !dialog.open) {
      dialog.showModal();
    }
    setCopyStatus('idle');
  }, [selected]);

  const closeDialog = () => dialogRef.current?.close();

  if (selected == null) {
    return null;
  }
  const code = importCode(selected);
  const variants = (['filled', 'outline'] as const).filter(variant =>
    variant === 'filled'
      ? selected.entry.filled != null
      : selected.entry.outline != null,
  );

  return (
    <dialog
      className="icon-dialog"
      aria-labelledby="icon-dialog-title"
      ref={dialogRef}
      onClick={event => {
        if (event.currentTarget === event.target) {
          closeDialog();
        }
      }}
      onClose={onClose}
    >
      <div className="icon-dialog-panel">
        <button className="dialog-close" type="button" onClick={closeDialog} aria-label="Close">×</button>
        <div className="detail-preview">
          <AsyncIcon path={selected.path} alt="" />
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{selected.entry.category}</span>
          <h2 id="icon-dialog-title">{exportName(selected)}</h2>
          <p>{selected.entry.keywords.slice(0, 8).join(' · ')}</p>
          {variants.length > 1 && (
            <div className="variant-note">Available in filled and outline variants.</div>
          )}
          <div className="code-block">
            <code>{code}</code>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  try {
                    await navigator.clipboard.writeText(code);
                    setCopyStatus('copied');
                  } catch {
                    setCopyStatus('failed');
                  }
                })();
              }}
            >
              {copyStatus === 'copied'
                ? 'Copied'
                : copyStatus === 'failed'
                  ? 'Copy failed'
                  : 'Copy import'}
            </button>
          </div>
          <code className="asset-path">{selected.path.replace('./svg/', '@wearables-ui-toolkit/icons/svg/')}</code>
        </div>
      </div>
    </dialog>
  );
}

function IconBrowser() {
  const [query, setQuery] = useState('');
  const [variant, setVariant] = useState<VariantFilter>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<SelectedIcon | null>(null);
  const [mode, setMode] = useState<ColorMode>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );

  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => icons.flatMap(entry => {
    const resolved = resolveVariant(entry, variant);
    if (resolved == null) {
      return [];
    }
    if (normalizedQuery.length === 0) {
      return [resolved];
    }
    const searchable = [entry.name, entry.slug, entry.category, ...entry.keywords]
      .join(' ')
      .toLowerCase();
    return searchable.includes(normalizedQuery) ? [resolved] : [];
  }), [normalizedQuery, variant]);
  const visibleResults = results.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [normalizedQuery, variant]);

  return (
    <Theme mode={mode} theme={neutralTheme}>
      <div className="app" data-color-mode={mode}>
        <header className="topbar">
          <a className="back-link" href="../../">← Utilities</a>
          <span className="brand">UI Toolkit for Meta Ray-Ban Display</span>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setMode(current => current === 'light' ? 'dark' : 'light')}
            aria-label={`Use ${mode === 'light' ? 'dark' : 'light'} mode`}
          >
            {mode === 'light' ? '◐' : '☀'}
          </button>
        </header>

        <main>
          <section className="hero">
            <Stack gap={3} maxWidth={720}>
              <span className="eyebrow">Icon utility</span>
              <h1>Find the right glyph.</h1>
              <p>Search the complete monochrome icon package by name, category, or keyword. Select an icon to copy its import.</p>
            </Stack>
          </section>

          <section className="browser" aria-labelledby="browser-title">
            <div className="browser-heading">
              <div>
                <Heading id="browser-title" level={2}>Icon library</Heading>
                <p>{results.length.toLocaleString()} icons match</p>
              </div>
              <div className="controls">
                <label className="search-field">
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="Search camera, weather, arrow…"
                    aria-label="Search icons"
                  />
                  {query.length > 0 && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
                </label>
                <div className="segmented" aria-label="Icon variant">
                  {(['all', 'filled', 'outline'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={variant === option}
                      onClick={() => setVariant(option)}
                    >
                      {option[0].toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="variant-guidance"><span aria-hidden="true">●</span> Filled icons are preferred for Meta Ray-Ban Display.</p>

            {visibleResults.length === 0 ? (
              <div className="empty-state">
                <strong>No icons found</strong>
                <span>Try a broader name or keyword.</span>
              </div>
            ) : (
              <div className="icon-grid">
                {visibleResults.map(icon => (
                  <button
                    className="icon-card"
                    key={`${icon.entry.slug}-${icon.variant}`}
                    type="button"
                    onClick={() => setSelected(icon)}
                  >
                    <span className="icon-preview"><AsyncIcon path={icon.path} alt="" /></span>
                    <span className="icon-name">{icon.entry.name}</span>
                    <span className="icon-variant">{icon.variant}</span>
                  </button>
                ))}
              </div>
            )}

            {visibleCount < results.length && (
              <button className="load-more" type="button" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>
                Show {Math.min(PAGE_SIZE, results.length - visibleCount)} more
              </button>
            )}
          </section>
        </main>
        <footer className="site-footer">
          <p>
            Icons are provided under the{' '}
            <a href="https://wearables.developer.meta.com/terms/" target="_blank" rel="noreferrer">
              Meta Wearables Developer Terms
            </a>
            .
          </p>
        </footer>
        <IconDetails selected={selected} onClose={() => setSelected(null)} />
      </div>
    </Theme>
  );
}

const rootElement = document.getElementById('root');
if (rootElement == null) {
  throw new Error('Missing application mount element');
}
createRoot(rootElement).render(<IconBrowser />);
