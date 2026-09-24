/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';

describe('IconImage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a bundled vector token inline as an svg with its paths', () => {
    const { container } = render(
      <IconImage source={{ viewBox: '0 0 24 24', paths: [{ d: 'M0 0h24v24H0z' }] }} />,
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.querySelectorAll('path')).toHaveLength(1);
  });

  it('renders a uri source as a currentColor mask span', () => {
    const { container } = render(<IconImage source={{ uri: '/icons/gear.svg' }} />);

    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    const style = span?.getAttribute('style') ?? '';
    expect(style).toContain('url("/icons/gear.svg")');
    expect(style).toContain('background-color: currentcolor');
  });

  it('renders a bare string source as a tinted mask (shorthand for { uri })', () => {
    const { container } = render(<IconImage source="/icons/gear.svg" />);
    expect(container.querySelector('span')?.getAttribute('style')).toContain(
      'url("/icons/gear.svg")',
    );
  });

  it('renders an untinted uri source as a full-color img', () => {
    const { container } = render(
      <IconImage source={{ uri: '/brand/logo.webp', tinted: false }} />,
    );
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/brand/logo.webp');
  });

  it('renders nothing (no url("undefined")) when the source has no resolvable uri', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // A source that slipped past the types with an empty uri must not paint a
    // blank masked box via `mask-image: url("undefined")`.
    const { container } = render(<IconImage source={{ uri: '' }} />);

    expect(container.querySelector('span')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
    expect(container.innerHTML).not.toContain('undefined');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('renders nothing without throwing when the source is null', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // `source` is null-safe via optional chaining: a null source resolves to no
    // uri and renders nothing instead of dereferencing null.
    const render_ = () =>
      render(
        // @ts-expect-error -- exercise the runtime null-safety guard.
        <IconImage source={null} />,
      );
    expect(render_).not.toThrow();

    const { container } = render_();
    expect(container.querySelector('span')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
    expect(container.innerHTML).not.toContain('undefined');
    expect(warn).toHaveBeenCalled();
  });
});
