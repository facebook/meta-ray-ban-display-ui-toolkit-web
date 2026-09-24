/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ReactNode } from 'react';
import { Panel } from '@wearables-ui-toolkit/mrbd';

interface GuidancePanelProps {
  summary: string;
  useWhen: ReactNode;
  capabilities: ReactNode;
  avoid: ReactNode;
}

export function GuidancePanel({
  summary,
  useWhen,
  capabilities,
  avoid,
}: GuidancePanelProps) {
  return (
    <Panel className="gallery-guidance" aria-label="Usage guidance">
      <div className="gallery-guidance-content">
        <p className="uit-text-body2 gallery-guidance-summary">{summary}</p>
        <div className="gallery-guidance-columns">
          <section>
            <h2 className="uit-text-label-emphasized">Use when</h2>
            {useWhen}
          </section>
          <section>
            <h2 className="uit-text-label-emphasized">Capabilities</h2>
            {capabilities}
          </section>
          <section>
            <h2 className="uit-text-label-emphasized">Avoid</h2>
            {avoid}
          </section>
        </div>
      </div>
    </Panel>
  );
}
