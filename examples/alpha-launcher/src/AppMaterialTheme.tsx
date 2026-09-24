/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  Button,
  type ButtonHandle,
  type ButtonProps,
} from '@wearables-ui-toolkit/mrbd/Button';
import {
  ListItem,
  type ContainerMaterial,
  type ListItemProps,
} from '@wearables-ui-toolkit/mrbd';
import { createNeonMaterial } from './NeonMaterial';

export type AppMaterialFactory = () => ContainerMaterial;

const AppMaterialContext = createContext<AppMaterialFactory>(
  createNeonMaterial,
);

interface AppMaterialProviderProps {
  children: ReactNode;
  createMaterial?: AppMaterialFactory;
}

/**
 * Sets the material factory used by the sample's interactive controls.
 * Replacing this one factory re-themes every themed control in the app.
 */
export function AppMaterialProvider({
  children,
  createMaterial = createNeonMaterial,
}: AppMaterialProviderProps) {
  return (
    <AppMaterialContext.Provider value={createMaterial}>
      {children}
    </AppMaterialContext.Provider>
  );
}

/**
 * Creates one material instance for one control.
 *
 * Container materials track animated interaction state, so controls should
 * not share an instance. The factory stays stable through context while this
 * hook gives each caller an independent material.
 */
export function useAppMaterial(): ContainerMaterial {
  const createMaterial = useContext(AppMaterialContext);
  return useMemo(createMaterial, [createMaterial]);
}

type ThemedButtonProps = Omit<ButtonProps, 'material'>;

/** A small adapter that applies the app material to the public `Button`. */
export const ThemedButton = forwardRef<ButtonHandle, ThemedButtonProps>(
  function ThemedButton(props, ref) {
    const material = useAppMaterial();
    return <Button {...props} ref={ref} material={material} />;
  },
);

/** A small adapter that applies the app material to the public `ListItem`. */
export const ThemedListItem = forwardRef<HTMLDivElement, ListItemProps>(
  function ThemedListItem(props, ref) {
    const material = useAppMaterial();
    return <ListItem {...props} ref={ref} material={material} />;
  },
);
