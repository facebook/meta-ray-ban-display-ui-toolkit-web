/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties, ReactElement } from 'react';
import styles from './IconImage.module.css';

/**
 * A single path of a bundled toolkit vector icon. Carries the fields the
 * curated icon components set so the inline render reproduces them exactly
 * (fill rule, strokes, etc.).
 */
export interface IconVectorPath {
  readonly d: string;
  readonly fill?: string;
  readonly fillRule?: 'evenodd' | 'nonzero';
  readonly clipRule?: 'evenodd' | 'nonzero';
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly strokeLinecap?: 'round' | 'butt' | 'square';
  readonly strokeLinejoin?: 'round' | 'miter' | 'bevel';
  readonly opacity?: number;
}

/**
 * Plain vector data the component renders inline. Passing one lets the
 * component own sizing/layout/tint through `currentColor` with full fidelity.
 * It is data, not JSX, so callers cannot inject arbitrary rendering.
 */
export interface IconVectorSource {
  readonly viewBox: string;
  readonly paths: ReadonlyArray<IconVectorPath>;
}

/** A caller-supplied icon asset addressed by URL (or data URI). */
export interface IconUriSource {
  readonly uri: string;
  /**
   * Tint the asset by treating it as an alpha mask filled with `currentColor`
   * (monochrome glyph). When `false` the asset renders as a full-color `<img>`
   * (e.g. app icons). Defaults to `true`.
   */
  readonly tinted?: boolean;
}

/**
 * The source for any toolkit icon slot: an inline vector (`IconVectorSource`,
 * `{ viewBox, paths }`), a caller asset (`IconUriSource`, `{ uri, tinted? }`),
 * or a bare URL string (shorthand for `{ uri, tinted: true }`). The component
 * renders it and owns size/layout/tint — callers pass a handle, never a
 * component.
 */
export type IconSource = IconVectorSource | IconUriSource | string;

export interface IconImageProps {
  source: IconSource;
  className?: string;
  style?: CSSProperties;
}

function isVectorSource(source: IconSource): source is IconVectorSource {
  return source !== null && typeof source === 'object' && 'paths' in source;
}

function joinClassNames(...names: Array<string | undefined>): string {
  return names.filter(Boolean).join(' ');
}

/**
 * The single internal renderer behind every toolkit icon slot. The host component
 * owns sizing/layout/tint; callers only supply an {@link IconSource}.
 *
 * - Inline vector sources render as `<svg>` with `fill="currentColor"`,
 *   so the container's `color` tints the glyph at full fidelity.
 * - URL sources render tinted via a `currentColor` CSS mask, or as a plain
 *   full-color `<img>` when `tinted` is `false`.
 *
 * Icons are decorative (`alt=""` / `aria-hidden`); labeling comes from the host
 * component's text or accessible name.
 */
export function IconImage({
  source,
  className,
  style,
}: IconImageProps): ReactElement | null {
  if (isVectorSource(source)) {
    return (
      <svg
        aria-hidden="true"
        className={joinClassNames(styles.fill, className)}
        viewBox={source.viewBox}
        fill="currentColor"
        style={style}
      >
        {source.paths.map((path, index) => (
          <path
            key={index}
            d={path.d}
            fill={path.fill}
            fillRule={path.fillRule}
            clipRule={path.clipRule}
            stroke={path.stroke}
            strokeWidth={path.strokeWidth}
            strokeLinecap={path.strokeLinecap}
            strokeLinejoin={path.strokeLinejoin}
            opacity={path.opacity}
          />
        ))}
      </svg>
    );
  }

  const uri = typeof source === 'string' ? source : source?.uri;
  const tinted = typeof source === 'string' ? true : source?.tinted ?? true;

  // Guard against a source with no resolvable URL (e.g. an empty string, or a
  // non-IconSource value like a React element that slipped past the types).
  // Rendering nothing is safer than emitting `mask-image: url("undefined")`,
  // which silently paints a blank box.
  if (uri == null || uri === '') {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        'IconImage: icon source has no `uri`. Pass an IconSource with inline ' +
          'vector data, `{ uri }`, or a URL string — not a React element. Received: %o',
        source,
      );
    }
    return null;
  }

  if (tinted) {
    return (
      <span
        aria-hidden="true"
        className={joinClassNames(styles.fill, className)}
        style={{
          backgroundColor: 'currentColor',
          WebkitMaskImage: `url("${uri}")`,
          maskImage: `url("${uri}")`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          ...style,
        }}
      />
    );
  }

  return (
    <img
      aria-hidden="true"
      className={joinClassNames(styles.fill, styles.contain, className)}
      src={uri}
      alt=""
      style={style}
    />
  );
}
