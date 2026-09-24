/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo, useMemo, type ReactNode } from 'react';
import {
  Container,
  MaterialLibrary,
  TextColor,
  TextStyle,
  TextView,
} from '@wearables-ui-toolkit/mrbd';
import { classNames } from './launcherUtils';

export const LauncherSmallButton = memo(function LauncherSmallButton({
  className,
  icon,
  onClick,
  title,
}: {
  className?: string;
  icon?: ReactNode;
  onClick: () => void;
  title: string;
}) {
  const material = useMemo(() => MaterialLibrary.button(), []);
  return (
    <Container
      className={classNames('launcherSmallButton', className)}
      height="var(--launcher-small-button-height)"
      material={material}
      onClick={onClick}
      role="button"
      aria-label={title}
    >
      <div className="launcherSmallButtonContent">
        {icon != null && (
          <span className="launcherSmallButtonIconSlot">{icon}</span>
        )}
        <TextView
          as="span"
          className="launcherSmallButtonTitle"
          textStyle={TextStyle.META2}
          textColor={TextColor.PRIMARY}
        >
          {title}
        </TextView>
      </div>
    </Container>
  );
});
