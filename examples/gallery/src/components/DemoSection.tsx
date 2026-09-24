/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ReactNode } from 'react';

interface DemoSectionProps {
  title: string;
  description: string;
  children: ReactNode;
  fullBleedStage?: boolean;
}

export function DemoSection({
  title,
  description,
  children,
  fullBleedStage = false,
}: DemoSectionProps) {
  const stageClassName = fullBleedStage
    ? 'gallery-demo-stage gallery-demo-stage-full-bleed'
    : 'gallery-demo-stage';

  return (
    <section className="gallery-demo-section">
      <div className="gallery-demo-heading">
        <h2 className="uit-text-heading2">{title}</h2>
        <p className="uit-text-body2">{description}</p>
      </div>
      <div className={stageClassName}>
        {children}
      </div>
    </section>
  );
}
