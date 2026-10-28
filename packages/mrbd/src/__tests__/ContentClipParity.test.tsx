/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Container, StaticContainer } from '@wearables-ui-toolkit/foundation';

describe.each([['interactive', Container], ['static', StaticContainer]] as const)('%s content clip parity', (_name, Component) => {
  it('refreshes same-size ancestor CSS and preserves input identity through clipping toggles', async () => {
    const sheet = document.createElement('style');
    sheet.textContent = '.shared-content{padding:4px 12px}.shared-alt .shared-content{padding:4px 4px 4px 20px}';
    document.head.append(sheet);
    const view = (clipping: boolean) => <div data-testid="ancestor"><Component className="shared-root" contentClassName="shared-content" width={120} height={48} contentClip={clipping ? 'shape' : 'none'}><input aria-label="Content" defaultValue="initial" /></Component></div>;
    try {
      const {container,getByRole,getByTestId,rerender} = render(view(true));
      const root=container.querySelector('.shared-root') as HTMLElement;
      const input=getByRole('textbox');
      const clip=root.querySelector('[data-uit-content-clip]') as HTMLElement;
      fireEvent.change(input,{target:{value:'retained'}});
      act(()=>input.focus());
      getByTestId('ancestor').classList.add('shared-alt');
      rerender(view(true));
      await waitFor(()=>expect(clip).toHaveStyle({paddingLeft:'20px',paddingRight:'4px',marginLeft:'0px'}));
      for(const clipping of [false,true]) {
        rerender(view(clipping));
        expect(getByRole('textbox')).toBe(input);
        expect(input).toHaveValue('retained');
        expect(input).toHaveFocus();
      }
      expect(root.style.overflow).toBe('visible');
    } finally {sheet.remove();}
  });

  it('does not snapshot computed root insets on public updates', async () => {
    const view=(revision:number)=><Component data-testid="root" width={120} height={48} contentStyle={{padding:'4px 12px'}}><span>{revision%2?'Same':'Same'}</span></Component>;
    const {getByTestId,rerender}=render(view(0));
    await act(async()=>{});
    const root=getByTestId('root');
    const spy=vi.spyOn(window,'getComputedStyle');
    try {
      for(let i=1;i<=10;i++)rerender(view(i));
      await act(async()=>{});
      expect(spy.mock.calls.filter(([element])=>element===root)).toHaveLength(0);
    } finally {spy.mockRestore();}
  });
});
