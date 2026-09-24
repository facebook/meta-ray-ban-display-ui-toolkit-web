/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  memo,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { FloatingPortalRootProvider } from '../portal/FloatingPortalRoot';
import { FocusNavigationProvider } from '../navigation/FocusNavigationProvider';
import { PlatformProvider } from './PlatformContext';
import '../theme/theme.css';

const ROOT_STYLE: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
};

const CONTENT_STYLE: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
};

const PORTAL_ROOT_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 10000,
  pointerEvents: 'none',
};

// The shared application foundation uses Noto Sans in the design-system weights
// (400 regular / 500 medium / 700 bold).
//
// We prefer an installed Noto Sans and only fall back to downloading from the
// Google Fonts CDN when it is unavailable. A plain Google Fonts <link> cannot
// do this: Google strips local() from its served @font-face, and a loaded web
// font shadows a same-named installed font. Registering a local()-only aliased
// family ('Noto Sans Local') before 'Noto Sans' in the theme.css font stack lets
// an installed font satisfy the request without downloading the CDN woff2. If
// the alias is unavailable, the stack falls through to downloadable 'Noto Sans'.
const NOTO_SANS_LOCAL_STYLE_ID = 'uit-noto-sans-local-faces';
// Each face lists ONLY weight-specific local names (full name + PostScript name).
// We deliberately do NOT include a generic local('Noto Sans') in the 500/700
// faces: on a system that has only the static Regular installed, that would match
// Regular and the browser would synthesize a faux medium/bold. Correctness first
// — if the exact weight isn't installed locally, the face is unavailable and the
// stack falls through to the CDN, which serves the correctly-weighted file. (400
// keeps local('Noto Sans') because the default instance is weight 400, so there
// is no synthesis risk.)
const NOTO_SANS_LOCAL_FONT_FACE_CSS = `
@font-face {
  font-family: 'Noto Sans Local';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('Noto Sans'), local('Noto Sans Regular'), local('NotoSans-Regular');
}
@font-face {
  font-family: 'Noto Sans Local';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: local('Noto Sans Medium'), local('NotoSans-Medium');
}
@font-face {
  font-family: 'Noto Sans Local';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: local('Noto Sans Bold'), local('NotoSans-Bold');
}
`;
const NOTO_SANS_LINK_ID = 'uit-noto-sans-font';
const NOTO_SANS_PRECONNECT_GOOGLEAPIS = 'https://fonts.googleapis.com';
const NOTO_SANS_PRECONNECT_GSTATIC = 'https://fonts.gstatic.com';
const NOTO_SANS_STYLESHEET_HREF =
  'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&display=swap';

export interface AppProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const App = memo(function App({
  children,
  className,
  style,
}: AppProps) {
  useAppFontFaces();
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null);
  const contentRootRef = useRef<HTMLDivElement>(null);
  const rootStyle = useMemo(
    () => style == null ? ROOT_STYLE : { ...ROOT_STYLE, ...style },
    [style],
  );

  useLayoutEffect(() => {
    const contentRoot = contentRootRef.current;
    const activeElement = document.activeElement;
    if (
      contentRoot != null &&
      (activeElement == null ||
        activeElement === document.body ||
        activeElement === document.documentElement)
    ) {
      contentRoot.focus({ preventScroll: true });
    }
  }, []);

  return (
    <PlatformProvider platform="mrbd">
      <FocusNavigationProvider
        autoFocusFirst
        containerRef={contentRootRef}
      >
        <FloatingPortalRootProvider root={portalRoot}>
          <div
            className={className}
            style={rootStyle}
            data-app-root
          >
            <div
              ref={contentRootRef}
              data-app-content-root
              data-uit-tooltip-boundary
              style={CONTENT_STYLE}
              tabIndex={-1}
            >
              {children}
              <div
                ref={setPortalRoot}
                data-app-floating-portal-root
                style={PORTAL_ROOT_STYLE}
              />
            </div>
          </div>
        </FloatingPortalRootProvider>
      </FocusNavigationProvider>
    </PlatformProvider>
  );
});

function useAppFontFaces(): void {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    // Idempotent: the stylesheet link is the marker. If it already exists, the
    // local @font-face style + preconnect hints were added alongside it on the
    // first mount.
    if (document.getElementById(NOTO_SANS_LINK_ID) != null) {
      return;
    }

    // Local-first: register the local()-only 'Noto Sans Local' faces so an
    // installed Noto Sans is used without any network request.
    const localFontStyle = document.createElement('style');
    localFontStyle.id = NOTO_SANS_LOCAL_STYLE_ID;
    localFontStyle.textContent = NOTO_SANS_LOCAL_FONT_FACE_CSS;
    document.head.appendChild(localFontStyle);

    const preconnectGoogleApis = document.createElement('link');
    preconnectGoogleApis.rel = 'preconnect';
    preconnectGoogleApis.href = NOTO_SANS_PRECONNECT_GOOGLEAPIS;

    const preconnectGstatic = document.createElement('link');
    preconnectGstatic.rel = 'preconnect';
    preconnectGstatic.href = NOTO_SANS_PRECONNECT_GSTATIC;
    preconnectGstatic.crossOrigin = 'anonymous';

    const stylesheet = document.createElement('link');
    stylesheet.id = NOTO_SANS_LINK_ID;
    stylesheet.rel = 'stylesheet';
    stylesheet.href = NOTO_SANS_STYLESHEET_HREF;

    document.head.appendChild(preconnectGoogleApis);
    document.head.appendChild(preconnectGstatic);
    document.head.appendChild(stylesheet);
  }, []);
}
