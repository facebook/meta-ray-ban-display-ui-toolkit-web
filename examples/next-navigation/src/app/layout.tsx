/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NavigationShell } from '../NavigationShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Next.js navigation',
};

// Next.js resolves `children` from the current route, so a page that is
// animating out cannot keep showing them. `NavigationShell` renders every
// screen from the pathname instead, and the route files only declare the URLs.
export default function RootLayout({ children }: { children: ReactNode }) {
  void children;
  return (
    <html lang="en">
      <body>
        <div id="root">
          <NavigationShell />
        </div>
      </body>
    </html>
  );
}
