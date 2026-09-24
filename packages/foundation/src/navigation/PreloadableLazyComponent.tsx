/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  createElement,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';

export interface PreloadableLazyComponent<Props extends object = object> {
  Component: ComponentType<Props>;
  preload: () => Promise<void>;
}

/** Creates a React.lazy component whose module can be warmed before rendering. */
export function createPreloadableLazyComponent<
  TModule,
  Props extends object = object,
>(
  loadModule: () => Promise<TModule>,
  getComponent: (module: TModule) => ComponentType<Props>,
): PreloadableLazyComponent<Props> {
  let loadPromise: Promise<{ default: ComponentType<Props> }> | null = null;
  let LazyComponent: LazyExoticComponent<ComponentType<Props>>;

  const load = () => {
    if (loadPromise == null) {
      loadPromise = Promise.resolve()
        .then(loadModule)
        .then(module => ({ default: getComponent(module) }))
        .catch(error => {
          loadPromise = null;
          LazyComponent = lazy(load);
          throw error;
        });
    }

    return loadPromise;
  };

  LazyComponent = lazy(load);

  const Component = (props: Props) => createElement(LazyComponent, props);

  return {
    Component,
    preload: () => load().then(() => undefined),
  };
}
