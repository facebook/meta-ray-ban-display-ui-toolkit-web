/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { IsolatedControl } from '@wearables-ui-toolkit/mrbd';
import { useAppMaterial } from './AppMaterialTheme';
import type { AdjustableSetting } from './launcherTypes';
import { getBrightnessIcon, getVolumeIcon } from './settingIcons';

interface AdjustmentPageProps {
  setting: AdjustableSetting;
  value: number;
  onValueChanged: (value: number) => void;
  onClose: () => void;
}

export function AdjustmentPage({
  setting,
  value,
  onValueChanged,
  onClose,
}: AdjustmentPageProps) {
  // One-off controls can consume the app material directly. Repeated controls
  // use the small ThemedButton and ThemedListItem adapters instead.
  const material = useAppMaterial();
  const title = setting === 'volume' ? 'Volume' : 'Brightness';
  const icon = setting === 'volume'
    ? getVolumeIcon(value)
    : getBrightnessIcon(value);

  return (
    <div className="launcher-adjustment-layer is-visible">
      <IsolatedControl
        material={material}
        icon={icon}
        value={value}
        onValueChanged={onValueChanged}
        onClick={onClose}
        aria-label={`${title}, ${Math.round(value * 100)}%`}
      />
    </div>
  );
}
