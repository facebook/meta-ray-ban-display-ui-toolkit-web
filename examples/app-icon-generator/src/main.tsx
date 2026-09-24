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
import type { UITIconAssetPath, UITIconManifestEntry } from '@wearables-ui-toolkit/icons';
import { VisualState } from '@wearables-ui-toolkit/foundation';
import { WebAppIcon } from '@wearables-ui-toolkit/mrbd/WebAppIcon';
import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { parseAndValidateManifest, type AppIconManifest, type ManifestIssue } from './manifest';
import { createZip } from './zip';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
import '@wearables-ui-toolkit/mrbd/styles.css';
import './styles.css';

const icons = iconManifest as UITIconManifestEntry[];
const encoder = new TextEncoder();
const MAX_ICON_BYTES = 2 * 1024 * 1024;
const MAX_SVG_BYTES = 512 * 1024;
type AppearanceMode = 'theme' | 'gradient' | 'combined';
type ColorMode = 'light' | 'dark';
type GradientStop = { color: string; stop: number };
type EditorValues = {
  name: string;
  description: string;
  appearanceMode: AppearanceMode;
  themeColor: string;
  gradient: GradientStop[];
  innerGlowColor: string;
  iconSrc: string;
};
type IconSource =
  | { kind: 'library'; entry: UITIconManifestEntry; path: UITIconAssetPath; url: string | null }
  | { kind: 'upload'; file: File; url: string }
  | { kind: 'url'; url: string };

const defaultIcon = icons.find(icon => icon.name === 'camera') ?? icons[0];
const defaultIconPath = defaultIcon.filled ?? defaultIcon.default;
const initialValues: EditorValues = {
  name: 'Trail guide',
  description: 'Find routes and keep your bearings on the move.',
  appearanceMode: 'theme',
  themeColor: '#8DE35F',
  gradient: [
    { color: '#BFF35E', stop: 0 },
    { color: '#4FD27B', stop: 0.33 },
    { color: '#257F70', stop: 0.68 },
    { color: '#163B44', stop: 1 },
  ],
  innerGlowColor: '',
  iconSrc: '../icons/app-icon.svg',
};

function manifestFromValues(values: EditorValues): AppIconManifest {
  const appearance: AppIconManifest['appearance'] = {
    icon: { src: values.iconSrc, type: 'monochrome' },
  };
  if (values.appearanceMode !== 'gradient') {
    appearance.theme_color = values.themeColor;
  }
  if (values.appearanceMode !== 'theme') {
    appearance.icon_background = {
      colors: values.gradient.map(stop => stop.color),
      stops: values.gradient.map(stop => stop.stop),
      ...(values.innerGlowColor.length > 0
        ? { inner_glow_color: values.innerGlowColor }
        : {}),
    };
  } else if (values.innerGlowColor.length > 0) {
    appearance.icon_background = { inner_glow_color: values.innerGlowColor };
  }
  return {
    version: 1,
    name: values.name,
    ...(values.description.trim().length > 0 ? { description: values.description } : {}),
    appearance,
  };
}

function valuesFromManifest(manifest: AppIconManifest): EditorValues {
  const colors = manifest.appearance.icon_background?.colors;
  const suppliedStops = manifest.appearance.icon_background?.stops;
  const gradient = colors?.map((color, index) => ({
    color,
    stop: suppliedStops?.[index] ?? (colors.length === 1 ? 0 : index / (colors.length - 1)),
  })) ?? initialValues.gradient;
  const hasTheme = manifest.appearance.theme_color != null;
  const hasGradient = colors != null && colors.length > 0;
  return {
    name: manifest.name,
    description: manifest.description ?? '',
    appearanceMode: hasTheme && hasGradient ? 'combined' : hasGradient ? 'gradient' : 'theme',
    themeColor: manifest.appearance.theme_color ?? initialValues.themeColor,
    gradient,
    innerGlowColor: manifest.appearance.icon_background?.inner_glow_color ?? '',
    iconSrc: manifest.appearance.icon.src,
  };
}

function canPreviewManifestSource(source: string): boolean {
  try {
    return ['https:', 'http:', 'data:', 'blob:'].includes(new URL(source).protocol);
  } catch {
    return false;
  }
}

type IconExtension = 'png' | 'webp' | 'svg';

function extensionFromMime(type: string): IconExtension | null {
  if (type === 'image/png') {
    return 'png';
  }
  if (type === 'image/webp') {
    return 'webp';
  }
  if (type === 'image/svg+xml') {
    return 'svg';
  }
  return null;
}

function extensionFor(
  file: File | null,
  sourceUrl: string,
  responseType = '',
): IconExtension | null {
  const candidate = file?.name ?? sourceUrl.split(/[?#]/, 1)[0];
  const match = candidate.match(/\.(png|webp|svg)$/i);
  if (match != null) {
    return match[1].toLowerCase() as IconExtension;
  }
  return extensionFromMime(file?.type ?? responseType);
}

async function iconFileError(file: File): Promise<string | null> {
  const extension = extensionFor(file, file.name);
  if (extension == null) {
    return 'Choose a PNG, WebP, or SVG file.';
  }
  if (file.size > MAX_ICON_BYTES) {
    return 'Icon files must be 2 MiB or smaller.';
  }
  if (extension === 'svg') {
    if (file.size > MAX_SVG_BYTES) {
      return 'SVG files must be 512 KiB or smaller.';
    }
    const source = await file.text();
    if (
      /<!DOCTYPE|<!ENTITY|<script\b|\son[a-z]+\s*=/i.test(source) ||
      /(?:href|xlink:href)\s*=\s*["'](?!#|data:)/i.test(source)
    ) {
      return 'SVG artwork cannot contain scripts, event handlers, external entities, or files.';
    }
    return null;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const isOversized = bitmap.width > 4096 || bitmap.height > 4096;
    bitmap.close();
    return isOversized ? 'Raster artwork cannot exceed 4,096 pixels in either dimension.' : null;
  } catch {
    return 'The raster artwork could not be decoded.';
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function AppIconGenerator() {
  const [values, setValues] = useState(initialValues);
  const valuesRef = useRef(initialValues);
  const iconSrcRef = useRef(initialValues.iconSrc);
  const [manifestText, setManifestText] = useState(() =>
    JSON.stringify(manifestFromValues(initialValues), null, 2),
  );
  const [lastValidManifest, setLastValidManifest] = useState(() => manifestFromValues(initialValues));
  const [issues, setIssues] = useState<ManifestIssue[]>([]);
  const [source, setSource] = useState<IconSource>({
    kind: 'library',
    entry: defaultIcon,
    path: defaultIconPath,
    url: null,
  });
  const [iconQuery, setIconQuery] = useState('');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [focusedPreview, setFocusedPreview] = useState(false);
  const [mode, setMode] = useState<ColorMode>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );

  const applyValues = (next: EditorValues) => {
    const nextManifest = manifestFromValues(next);
    valuesRef.current = next;
    iconSrcRef.current = next.iconSrc;
    setValues(next);
    setManifestText(JSON.stringify(nextManifest, null, 2));
    setLastValidManifest(nextManifest);
    setIssues(parseAndValidateManifest(JSON.stringify(nextManifest)).issues);
  };

  useEffect(() => {
    if (source.kind !== 'library' || source.url != null) {
      return;
    }
    let active = true;
    void loadUITIconAssetUrl(source.path)?.then(url => {
      if (active) {
        setSource(current => current.kind === 'library' && current.path === source.path
          ? { ...current, url }
          : current);
      }
    });
    return () => {
      active = false;
    };
  }, [source]);

  useEffect(() => () => {
    if (source.kind === 'upload') {
      URL.revokeObjectURL(source.url);
    }
  }, [source]);

  const matchingIcons = useMemo(() => {
    const query = iconQuery.trim().toLowerCase();
    return icons.filter(icon => query.length === 0 ||
      [icon.name, icon.category, ...icon.keywords].join(' ').toLowerCase().includes(query),
    ).slice(0, 18);
  }, [iconQuery]);
  const previewSource = source.url;
  const previewAppearance = lastValidManifest.appearance;
  const previewColors = previewAppearance.icon_background?.colors;
  const previewStops = previewAppearance.icon_background?.stops;
  const errors = issues.filter(issue => issue.severity === 'error');

  const selectLibraryIcon = (entry: UITIconManifestEntry) => {
    const path = entry.filled ?? entry.default;
    setSource({ kind: 'library', entry, path, url: null });
    applyValues({ ...values, iconSrc: '../icons/app-icon.svg' });
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (file == null) {
      return;
    }
    const error = await iconFileError(file);
    if (error != null) {
      setDownloadError(error);
      return;
    }
    const extension = extensionFor(file, file.name);
    if (extension == null) {
      setDownloadError('Choose a PNG, WebP, or SVG file.');
      return;
    }
    const url = URL.createObjectURL(file);
    setSource({ kind: 'upload', file, url });
    setDownloadError(null);
    applyValues({ ...valuesRef.current, iconSrc: `../icons/app-icon.${extension}` });
  };

  const handleManifestTextChange = (text: string) => {
    setManifestText(text);
    const result = parseAndValidateManifest(text);
    const nextSource = result.manifest?.appearance.icon.src;
    const previousSource = iconSrcRef.current;
    const keepsLocalPreview = nextSource != null &&
      nextSource !== previousSource &&
      !canPreviewManifestSource(nextSource);
    setIssues(keepsLocalPreview
      ? [
          ...result.issues,
          {
            path: '$.appearance.icon.src',
            severity: 'warning',
            message: 'Relative artwork paths cannot load in this browser preview. The selected artwork remains visible.',
          },
        ]
      : result.issues);
    if (result.manifest != null) {
      setLastValidManifest(result.manifest);
      const nextValues = valuesFromManifest(result.manifest);
      valuesRef.current = nextValues;
      iconSrcRef.current = nextValues.iconSrc;
      setValues(nextValues);
      if (
        result.manifest.appearance.icon.src !== previousSource &&
        canPreviewManifestSource(result.manifest.appearance.icon.src)
      ) {
        setSource({ kind: 'url', url: result.manifest.appearance.icon.src });
      }
    }
  };

  const downloadBundle = async () => {
    if (errors.length > 0 || previewSource == null) {
      setDownloadError('Fix manifest errors and choose icon artwork before downloading.');
      return;
    }
    try {
      const iconBlob = source.kind === 'upload'
        ? source.file
        : await fetch(previewSource).then(response => {
            if (!response.ok) {
              throw new Error(`Icon request failed with ${response.status}.`);
            }
            return response.blob();
          });
      const extension = extensionFor(
        source.kind === 'upload' ? source.file : null,
        source.kind === 'library' ? source.path : previewSource,
        iconBlob.type,
      );
      if (extension == null) {
        throw new Error('Icon artwork must be a PNG, WebP, or SVG file.');
      }
      if (iconBlob.size > MAX_ICON_BYTES || (extension === 'svg' && iconBlob.size > MAX_SVG_BYTES)) {
        throw new Error(extension === 'svg'
          ? 'SVG artwork must be 512 KiB or smaller.'
          : 'Icon artwork must be 2 MiB or smaller.');
      }
      const packagedManifest: AppIconManifest = {
        ...lastValidManifest,
        appearance: {
          ...lastValidManifest.appearance,
          icon: {
            ...lastValidManifest.appearance.icon,
            src: `../icons/app-icon.${extension}`,
          },
        },
      };
      const packagedManifestText = `${JSON.stringify(packagedManifest, null, 2)}\n`;
      if (encoder.encode(packagedManifestText).length > 64 * 1024) {
        throw new Error('Manifest JSON must be 64 KiB or smaller.');
      }
      const readme = `# ${packagedManifest.name} app icon\n\n` +
        'Move `meta-wearables-manifest.json` into a `.well-known` directory in the web app launch directory.\n' +
        `Keep \`icons/app-icon.${extension}\` beside the \`.well-known\` directory.\n\n` +
        'Serve both files over HTTPS in production. The manifest URL is resolved from the launch URL directory.\n';
      const zip = createZip([
        {
          path: 'meta-wearables-manifest.json',
          data: encoder.encode(packagedManifestText),
        },
        {
          path: `icons/app-icon.${extension}`,
          data: new Uint8Array(await iconBlob.arrayBuffer()),
        },
        { path: 'README.md', data: encoder.encode(readme) },
      ]);
      downloadBlob(zip, `${packagedManifest.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'web-app'}-icon.zip`);
      setDownloadError(null);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Could not create the download.');
    }
  };

  return (
    <Theme mode={mode} theme={neutralTheme}>
      <div className="app" data-color-mode={mode}>
        <header className="topbar">
          <a href="../../">← Utilities</a>
          <span>UI Toolkit for Meta Ray-Ban Display</span>
          <button type="button" onClick={() => setMode(current => current === 'light' ? 'dark' : 'light')} aria-label={`Use ${mode === 'light' ? 'dark' : 'light'} mode`}>
            {mode === 'light' ? '◐' : '☀'}
          </button>
        </header>

        <main>
          <section className="hero">
            <Stack gap={3} maxWidth={760}>
              <span className="eyebrow">App icon utility</span>
              <h1>Shape the first impression.</h1>
              <p>Compose a manifest, preview the real toolkit rendering, and download a deployment-ready bundle.</p>
            </Stack>
          </section>

          <div className="workspace">
            <div className="editor-column">
              <section className="panel" aria-labelledby="identity-heading">
                <div className="section-heading"><span>01</span><Heading level={2} id="identity-heading">App identity</Heading></div>
                <div className="field-grid">
                  <label className="field"><span>Name</span><input value={values.name} maxLength={100} onChange={event => applyValues({ ...values, name: event.target.value })} /></label>
                  <label className="field field-wide"><span>Description <small>Optional</small></span><textarea value={values.description} maxLength={500} rows={2} onChange={event => applyValues({ ...values, description: event.target.value })} /></label>
                </div>
              </section>

              <section className="panel" aria-labelledby="artwork-heading">
                <div className="section-heading"><span>02</span><Heading level={2} id="artwork-heading">Monochrome artwork</Heading></div>
                <div className="source-tabs" aria-label="Icon source">
                  <button type="button" aria-pressed={source.kind === 'library'} onClick={() => {
                    if (source.kind !== 'library') {
                      selectLibraryIcon(defaultIcon);
                    }
                  }}>Built-in icon</button>
                  <label className="upload-tab">Upload file<input type="file" accept="image/png,image/webp,image/svg+xml,.svg" onChange={event => void handleUpload(event)} /></label>
                </div>
                {source.kind === 'upload' ? (
                  <div className="upload-summary"><strong>{source.file.name}</strong><span>{Math.ceil(source.file.size / 1024).toLocaleString()} KiB · transparent mask preview</span></div>
                ) : (
                  <>
                    <label className="field"><span>Search library</span><input type="search" value={iconQuery} onChange={event => setIconQuery(event.target.value)} placeholder="Camera, map, music…" /></label>
                    <div className="library-grid">
                      {matchingIcons.map(entry => {
                        const path = entry.filled ?? entry.default;
                        return (
                          <button key={entry.slug} type="button" title={entry.name} aria-pressed={source.kind === 'library' && source.entry.slug === entry.slug} onClick={() => selectLibraryIcon(entry)}>
                            <LibraryIcon path={path} />
                            <span>{entry.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                <p className="guidance">Use transparent, single-color PNG, WebP, or SVG artwork designed for a 64 × 64 area. The source color becomes a mask.</p>
              </section>

              <section className="panel" aria-labelledby="appearance-heading">
                <div className="section-heading"><span>03</span><Heading level={2} id="appearance-heading">Appearance</Heading></div>
                <div className="mode-picker" aria-label="Background mode">
                  {([
                    ['theme', 'Theme color'],
                    ['gradient', 'Custom gradient'],
                    ['combined', 'Gradient + tint'],
                  ] as const).map(([value, label]) => (
                    <button key={value} type="button" aria-pressed={values.appearanceMode === value} onClick={() => applyValues({ ...values, appearanceMode: value })}>{label}</button>
                  ))}
                </div>
                {values.appearanceMode !== 'gradient' && (
                  <ColorField label="Theme / artwork tint" value={values.themeColor} onChange={themeColor => applyValues({ ...values, themeColor })} />
                )}
                {values.appearanceMode !== 'theme' && (
                  <div className="gradient-editor">
                    <div className="field-label"><span>Radial gradient</span><small>Stops: 0–1, lowest to highest</small></div>
                    {values.gradient.map((stop, index) => (
                      <div className="gradient-row" key={index}>
                        <input type="color" value={stop.color.slice(0, 7)} aria-label={`Gradient color ${index + 1}`} onChange={event => {
                          const gradient = values.gradient.map((item, itemIndex) => itemIndex === index ? { ...item, color: event.target.value.toUpperCase() } : item);
                          applyValues({ ...values, gradient });
                        }} />
                        <input value={stop.color} aria-label={`Gradient color ${index + 1} value`} onChange={event => {
                          const gradient = values.gradient.map((item, itemIndex) => itemIndex === index ? { ...item, color: event.target.value } : item);
                          applyValues({ ...values, gradient });
                        }} />
                        <input
                          type="number"
                          min={index === 0 ? 0 : values.gradient[index - 1].stop}
                          max={index === values.gradient.length - 1 ? 1 : values.gradient[index + 1].stop}
                          step="0.01"
                          value={stop.stop}
                          aria-label={`Gradient stop ${index + 1}`}
                          onChange={event => {
                            const lowerBound = index === 0 ? 0 : values.gradient[index - 1].stop;
                            const upperBound = index === values.gradient.length - 1 ? 1 : values.gradient[index + 1].stop;
                            const requestedStop = Number(event.target.value);
                            const nextStop = Number.isFinite(requestedStop)
                              ? Math.min(upperBound, Math.max(lowerBound, requestedStop))
                              : lowerBound;
                            const gradient = values.gradient.map((item, itemIndex) => itemIndex === index ? { ...item, stop: nextStop } : item);
                            applyValues({ ...values, gradient });
                          }}
                        />
                        <button type="button" disabled={values.gradient.length <= 2} aria-label={`Remove gradient stop ${index + 1}`} onClick={() => applyValues({ ...values, gradient: values.gradient.filter((_item, itemIndex) => itemIndex !== index) })}>×</button>
                      </div>
                    ))}
                    {values.gradient.length < 6 && <button className="add-stop" type="button" onClick={() => applyValues({ ...values, gradient: [...values.gradient, { color: '#111B55', stop: 1 }] })}>+ Add stop</button>}
                  </div>
                )}
                <div className="focused-glow-field">
                  <ColorField label="Focused inner glow" value={values.innerGlowColor} optional onChange={innerGlowColor => applyValues({ ...values, innerGlowColor })} />
                  <div className="focused-glow-note">
                    <span>Only shown when focused</span>
                    <span className="info-tooltip">
                      <button type="button" aria-label="About the focused inner glow" aria-describedby="focused-glow-tooltip">?</button>
                      <span id="focused-glow-tooltip" role="tooltip">Use Default and Focused in the Live preview to compare both states.</span>
                    </span>
                  </div>
                </div>
              </section>

              <section className="panel json-panel" aria-labelledby="manifest-heading">
                <div className="section-heading"><span>04</span><Heading level={2} id="manifest-heading">Manifest JSON</Heading></div>
                <textarea className="json-editor" spellCheck={false} value={manifestText} onChange={event => handleManifestTextChange(event.target.value)} aria-label="Manifest JSON" />
                <ValidationSummary issues={issues} />
              </section>
            </div>

            <aside className="preview-column">
              <div className="preview-card">
                <div className="preview-heading">
                  <span>Live preview</span>
                  <div className="preview-state-picker" aria-label="Preview state">
                    <button type="button" aria-pressed={!focusedPreview} onClick={() => setFocusedPreview(false)}>Default</button>
                    <button type="button" aria-pressed={focusedPreview} onClick={() => setFocusedPreview(true)}>Focused</button>
                  </div>
                </div>
                <div className="preview-surface">
                  <div className="ambient-glow" />
                  <WebAppIcon
                    aria-label={`${lastValidManifest.name} app icon preview`}
                    iconSrc={previewSource}
                    themeColor={previewAppearance.theme_color}
                    radialColors={previewColors}
                    radialStops={previewStops}
                    innerGlowColor={previewAppearance.icon_background?.inner_glow_color}
                    visualState={focusedPreview ? VisualState.FOCUSED : VisualState.DEFAULT}
                    width={184}
                    height={184}
                  />
                  <strong>{lastValidManifest.name}</strong>
                </div>
                <div className="size-previews">
                  {[64, 88, 112].map(size => (
                    <div key={size}><WebAppIcon iconSrc={previewSource} themeColor={previewAppearance.theme_color} radialColors={previewColors} radialStops={previewStops} innerGlowColor={previewAppearance.icon_background?.inner_glow_color} visualState={focusedPreview ? VisualState.FOCUSED : VisualState.DEFAULT} width={size} height={size} /><span>{size}px</span></div>
                  ))}
                </div>
                <div className="spec-strip"><span>64 × 64 artwork</span><span>2 MiB max</span><span>PNG · WebP · SVG</span></div>
                <button className="download-button" type="button" disabled={errors.length > 0 || previewSource == null} onClick={() => void downloadBundle()}>
                  Download manifest + icon
                </button>
                <p className="download-caption">ZIP includes the manifest, artwork, and placement README.</p>
                {downloadError != null && <p className="download-error" role="alert">{downloadError}</p>}
              </div>
            </aside>
          </div>
        </main>
      </div>
    </Theme>
  );
}

function ColorField({ label, value, optional = false, onChange }: { label: string; value: string; optional?: boolean; onChange: (value: string) => void }) {
  return (
    <label className="field color-field">
      <span>{label} {optional && <small>Optional</small>}</span>
      <div><input type="color" value={/^#[\da-f]{6}$/i.test(value) ? value : '#6A9FAB'} onChange={event => onChange(event.target.value.toUpperCase())} /><input value={value} placeholder={optional ? 'Leave blank to derive' : '#3867D6'} onChange={event => onChange(event.target.value)} /></div>
    </label>
  );
}

function LibraryIcon({ path }: { path: UITIconAssetPath }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void loadUITIconAssetUrl(path)?.then(value => {
      if (active) {
        setUrl(value);
      }
    });
    return () => {
      active = false;
    };
  }, [path]);
  return url == null ? <span className="icon-loader" /> : <img src={url} alt="" />;
}

function ValidationSummary({ issues }: { issues: ManifestIssue[] }) {
  if (issues.length === 0) {
    return <div className="validation valid"><span>✓</span><p><strong>Valid Version 1 manifest</strong><small>Ready to publish.</small></p></div>;
  }
  return (
    <div className="validation-list" aria-live="polite">
      {issues.map((issue, index) => (
        <div className={`validation ${issue.severity}`} key={`${issue.path}-${index}`}>
          <span>{issue.severity === 'error' ? '!' : 'i'}</span>
          <p><strong>{issue.path}</strong><small>{issue.message}</small></p>
        </div>
      ))}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement == null) {
  throw new Error('Missing application mount element');
}
createRoot(rootElement).render(<AppIconGenerator />);
