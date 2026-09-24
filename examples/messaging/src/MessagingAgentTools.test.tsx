/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {
  executeWebMcpTestTool,
  installWebMcpTestHost,
} from '../../shared/webmcpTestHost';
import {MessagingExampleApp} from './App';
import {conversations} from './domain';

const ORIGINAL_RESIZE_OBSERVER = globalThis.ResizeObserver;
const OUTBOUND_COLOR_TOKENS = [
  '--uit-color-background-message-outbound',
  '--uit-color-container-message-outbound-target-step1',
  '--uit-color-container-message-outbound-target-step2',
  '--uit-color-container-message-outbound-target-step3',
  '--uit-color-container-message-outbound-target-step4',
  '--uit-color-container-message-outbound-glow',
];

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  for (const token of OUTBOUND_COLOR_TOKENS) {
    document.documentElement.style.setProperty(token, 'rgb(255 255 255)');
  }
});

afterAll(() => {
  globalThis.ResizeObserver = ORIGINAL_RESIZE_OBSERVER;
  for (const token of OUTBOUND_COLOR_TOKENS) {
    document.documentElement.style.removeProperty(token);
  }
});

let host: ReturnType<typeof installWebMcpTestHost>;

beforeEach(() => {
  host = installWebMcpTestHost();
});

afterEach(() => {
  cleanup();
  host.remove();
  window.history.replaceState(null, '', '/');
  delete (document as Document & {modelContext?: unknown}).modelContext;
});

async function renderMessagingApp(): Promise<void> {
  render(<MessagingExampleApp />);
  await waitFor(async () => {
    expect(await host.context.getTools()).toHaveLength(2);
  });
}

describe('MessagingAgentTools', () => {
  it.each([
    ['Alex', 'Alex Lee', '/thread/alex'],
    ['Maya Johnson', 'Maya Johnson', '/thread/maya'],
    ['Rivera', 'Sam Rivera', '/thread/sam'],
  ])('opens a thread by the contact name %s', async (person, name, route) => {
    await renderMessagingApp();

    let result: unknown;
    await act(async () => {
      result = await executeWebMcpTestTool(
        host.context,
        'open_message_thread',
        {person},
      );
    });

    expect(result).toMatchObject({opened: true, person: name, route});
    expect(window.location.hash).toBe(`#${route}`);
    expect(await screen.findByText(name)).toBeInTheDocument();
  });

  it('creates a visible draft that requires on-screen confirmation', async () => {
    await renderMessagingApp();

    let result: unknown;
    await act(async () => {
      result = await executeWebMcpTestTool(
        host.context,
        'draft_message',
        {recipient: 'Alex', text: 'I am almost there.'},
      );
    });

    expect(result).toMatchObject({
      drafted: true,
      recipient: 'Alex Lee',
      requiresConfirmation: true,
    });
    const input = await screen.findByRole('textbox', {
      name: 'Message to Alex Lee',
    });
    expect(input).toHaveValue('I am almost there.');
    expect(screen.getByRole('button', {name: 'Send message'})).toBeInTheDocument();

    fireEvent.change(input, {target: {value: 'I am almost there now.'}});
    expect(input).toHaveValue('I am almost there now.');
    fireEvent.click(screen.getByRole('button', {name: 'Send message'}));
    await waitFor(() => {
      expect(screen.queryByRole('textbox', {
        name: 'Message to Alex Lee',
      })).not.toBeInTheDocument();
    });
    expect(Array.from(
      document.querySelectorAll<HTMLElement>('.message-row--outgoing'),
    ).some(row => row.textContent?.includes('I am almost there now.'))).toBe(true);
  });

  it('opens Reply in the message input and Back dismisses it without sending', async () => {
    await renderMessagingApp();
    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Alex',
      });
    });
    const outgoingCount = document.querySelectorAll('.message-row--outgoing').length;
    const reply = await screen.findByRole('button', {name: 'Reply'});
    expect(reply).not.toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', {name: 'Photos'})).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    fireEvent.click(reply);

    const input = await screen.findByRole('textbox', {
      name: 'Message to Alex Lee',
    });
    expect(input).toHaveValue('');
    expect(screen.getByRole('button', {name: 'Send message'})).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    // The web-app host parks focus on the document root when it opens its own
    // text entry; the composer reclaims that handoff.
    const hostRoot = input.closest('[data-app-root="true"]');
    expect(hostRoot).toBeInstanceOf(HTMLElement);
    await act(async () => {
      (hostRoot as HTMLElement).focus();
      await new Promise(resolve => window.requestAnimationFrame(resolve));
    });
    expect(input).toHaveFocus();

    // Focus moving to a real control is left alone rather than trapped.
    const sendAction = screen.getByRole('button', {name: 'Send message'});
    await act(async () => {
      sendAction.focus();
      await new Promise(resolve => window.requestAnimationFrame(resolve));
    });
    expect(input).not.toHaveFocus();

    fireEvent.keyDown(document, {key: 'Escape'});

    await waitFor(() => {
      expect(screen.queryByRole('textbox', {
        name: 'Message to Alex Lee',
      })).not.toBeInTheDocument();
    });
    expect(window.location.hash).toBe('#/thread/alex');
    expect(document.querySelectorAll('.message-row--outgoing')).toHaveLength(
      outgoingCount,
    );
    expect(screen.getByRole('button', {name: 'Reply'})).toHaveFocus();
  });

  it('does not add history when opening the current thread again', async () => {
    await renderMessagingApp();

    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Alex',
      });
    });
    await screen.findByText('Alex Lee');
    const historyLength = window.history.length;

    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Alex',
      });
    });

    expect(window.history.length).toBe(historyLength);
  });

  it.each([
    ['Maya Johnson', 'maya', 'Alex', 'Alex Lee'],
    ['Alex', 'alex', 'Maya Johnson', 'Maya Johnson'],
  ])(
    'lets the in-flight thread (%s) win over a later request',
    async (inFlightPerson, inFlightId, laterPerson, laterName) => {
      await renderMessagingApp();
      // Start from a thread so the later request names the *committed* route,
      // which is exactly the case the committed-only guard short-circuited.
      await act(async () => {
        await executeWebMcpTestTool(host.context, 'open_message_thread', {
          person: laterPerson,
        });
      });
      expect(window.location.hash).toBe(
        `#/thread/${laterName === 'Alex Lee' ? 'alex' : 'maya'}`,
      );

      let results: unknown[] = [];
      await act(async () => {
        results = await Promise.all([
          executeWebMcpTestTool(host.context, 'open_message_thread', {
            person: inFlightPerson,
          }),
          executeWebMcpTestTool(host.context, 'open_message_thread', {
            person: laterPerson,
          }),
        ]);
      });

      // The in-flight navigation is the one that lands.
      expect(window.location.hash).toBe(`#/thread/${inFlightId}`);
      // Its own caller is told so.
      expect(results[0]).toMatchObject({
        opened: true,
        route: `/thread/${inFlightId}`,
      });
      // The later caller is told what is actually opening, not its own route.
      expect(results[1]).toMatchObject({
        error: 'navigation_in_progress',
        openingRoute: `/thread/${inFlightId}`,
        openingPerson: inFlightPerson === 'Alex' ? 'Alex Lee' : inFlightPerson,
      });
      expect(results[1]).not.toMatchObject({opened: true});
    },
  );

  it('still reports a draft it saved while another thread is opening', async () => {
    await renderMessagingApp();
    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Alex',
      });
    });

    let results: unknown[] = [];
    await act(async () => {
      results = await Promise.all([
        executeWebMcpTestTool(host.context, 'open_message_thread', {
          person: 'Maya Johnson',
        }),
        executeWebMcpTestTool(host.context, 'draft_message', {
          recipient: 'Alex',
          text: 'Saved even though Maya is opening.',
        }),
      ]);
    });

    expect(window.location.hash).toBe('#/thread/maya');
    // The draft really was stored, so saying otherwise would be the lie here.
    expect(results[1]).toMatchObject({
      drafted: true,
      recipient: 'Alex Lee',
      showingRoute: '/thread/maya',
    });

    // And it is waiting on its own thread.
    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Alex',
      });
    });
    expect(await screen.findByRole('textbox', {
      name: 'Message to Alex Lee',
    })).toHaveValue('Saved even though Maya is opening.');
  });

  it('coalesces concurrent requests for the same thread', async () => {    await renderMessagingApp();
    const historyLength = window.history.length;

    await act(async () => {
      await Promise.all([
        executeWebMcpTestTool(host.context, 'open_message_thread', {
          person: 'Alex',
        }),
        executeWebMcpTestTool(host.context, 'open_message_thread', {
          person: 'Alex',
        }),
      ]);
    });

    expect(window.location.hash).toBe('#/thread/alex');
    expect(window.history.length).toBe(historyLength + 1);
  });

  it('renders the complete long draft in the message input', async () => {
    await renderMessagingApp();
    const text = 'A'.repeat(240);

    await act(async () => {
      await executeWebMcpTestTool(host.context, 'draft_message', {
        recipient: 'Alex',
        text,
      });
    });

    expect(await screen.findByRole('textbox', {
      name: 'Message to Alex Lee',
    })).toHaveValue(text);
    expect(screen.getByRole('button', {name: 'Send message'})).toBeInTheDocument();
  });

  it.each([
    ['a zero-width space', '\u200B'],
    ['a variation selector', '\uFE0F'],
    ['a combining mark', '\u0301'],
  ])('rejects a draft made only of %s', async (_label, text) => {
    await renderMessagingApp();

    expect(await executeWebMcpTestTool(host.context, 'draft_message', {
      recipient: 'Alex',
      text,
    })).toMatchObject({error: 'invalid_message'});
  });

  it('counts emoji as one grapheme each, so the field holds the whole draft', async () => {
    await renderMessagingApp();
    const emojiDraft = '👍'.repeat(121);

    await act(async () => {
      expect(await executeWebMcpTestTool(host.context, 'draft_message', {
        recipient: 'Alex',
        text: emojiDraft,
      })).toMatchObject({drafted: true});
    });

    const input = await screen.findByRole('textbox', {
      name: 'Message to Alex Lee',
    });
    // 121 emoji are 242 UTF-16 code units: a code-unit ceiling on the field
    // would have truncated a draft the tool accepted.
    expect(input).toHaveValue(emojiDraft);
    expect(input).not.toHaveAttribute('maxLength');
  });

  it('keeps accepting typed emoji up to the shared grapheme limit', async () => {
    await renderMessagingApp();
    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Alex',
      });
    });
    fireEvent.click(await screen.findByRole('button', {name: 'Reply'}));
    const input = await screen.findByRole('textbox', {
      name: 'Message to Alex Lee',
    });

    const atLimit = '👍'.repeat(240);
    fireEvent.change(input, {target: {value: atLimit}});
    expect(input).toHaveValue(atLimit);

    fireEvent.change(input, {target: {value: `${atLimit}👍`}});
    expect(input).toHaveValue(atLimit);
  });

  it('never opens an input that would drop typing for another thread', async () => {
    await renderMessagingApp();
    // Reachable before this fix: park a reply entry for one thread in history,
    // walk back to a thread whose draft can be created without navigating (so
    // the forward entries survive), then return to the parked entry.
    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Alex',
      });
    });
    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Maya Johnson',
      });
    });
    fireEvent.click(await screen.findByRole('button', {name: 'Reply'}));
    await screen.findByRole('textbox', {name: 'Message to Maya Johnson'});

    // Each step waits for the router to commit rather than for a fixed delay.
    // The wait sits outside `act` because React does not commit the popstate
    // update until the surrounding `act` scope exits. Two of these do not
    // change the hash, so they wait on what actually changes: the composer
    // closing, and the reply entry's own history state.
    const goBack = async (settled: () => void) => {
      await act(async () => {
        window.history.back();
      });
      await waitFor(settled);
    };
    const goForward = async (settled: () => void) => {
      await act(async () => {
        window.history.forward();
      });
      await waitFor(settled);
    };

    // Leaves the reply entry; same hash, so the closing composer is the signal.
    await goBack(() => {
      expect(screen.queryByRole('textbox', {
        name: 'Message to Maya Johnson',
      })).not.toBeInTheDocument();
    });
    await goBack(() => {
      expect(window.location.hash).toBe('#/thread/alex');
      expect(screen.getByRole('main', {name: 'Alex Lee'})).toBeInTheDocument();
    });

    // Already on Alex, so this stores a draft without pushing a new entry and
    // the Maya reply entry stays reachable by going forward.
    await act(async () => {
      await executeWebMcpTestTool(host.context, 'draft_message', {
        recipient: 'Alex',
        text: 'Pending draft for Alex.',
      });
    });
    await goForward(() => {
      expect(window.location.hash).toBe('#/thread/maya');
    });
    // Returns to the reply entry itself; the hash already matches, so wait on
    // the router state that entry carries.
    await goForward(() => {
      expect(
        (window.history.state as {usr?: {replyComposer?: boolean}} | null)
          ?.usr?.replyComposer,
      ).toBe(true);
    });

    expect(window.location.hash).toBe('#/thread/maya');
    // The composer stays shut rather than rendering empty and eating keystrokes.
    expect(screen.queryByRole('textbox', {
      name: 'Message to Maya Johnson',
    })).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Reply'})).toBeInTheDocument();

    // Reply leads back to the draft that is actually pending.
    fireEvent.click(screen.getByRole('button', {name: 'Reply'}));
    await waitFor(() => {
      expect(window.location.hash).toBe('#/thread/alex');
    });
    expect(await screen.findByRole('textbox', {
      name: 'Message to Alex Lee',
    })).toHaveValue('Pending draft for Alex.');
  });

  it('preserves an existing unsent draft', async () => {
    await renderMessagingApp();

    await act(async () => {
      await executeWebMcpTestTool(host.context, 'draft_message', {
        recipient: 'Alex',
        text: 'First draft',
      });
    });
    expect(await screen.findByRole('textbox', {
      name: 'Message to Alex Lee',
    })).toHaveValue('First draft');

    let result: unknown;
    await act(async () => {
      result = await executeWebMcpTestTool(host.context, 'draft_message', {
        recipient: 'Maya',
        text: 'Replacement draft',
      });
    });

    expect(result).toMatchObject({error: 'unsent_draft_exists'});
    expect(window.location.hash).toBe('#/thread/alex');
    expect(screen.getByRole('textbox', {
      name: 'Message to Alex Lee',
    })).toHaveValue('First draft');
    expect(screen.queryByDisplayValue('Replacement draft')).toBeNull();
  });

  it('atomically preserves the first of concurrent drafts', async () => {
    await renderMessagingApp();

    let results: unknown[] = [];
    await act(async () => {
      results = await Promise.all([
        executeWebMcpTestTool(host.context, 'draft_message', {
          recipient: 'Alex',
          text: 'First draft',
        }),
        executeWebMcpTestTool(host.context, 'draft_message', {
          recipient: 'Maya',
          text: 'Replacement draft',
        }),
      ]);
    });

    expect(results[0]).toMatchObject({drafted: true, recipient: 'Alex Lee'});
    expect(results[1]).toMatchObject({error: 'unsent_draft_exists'});
    expect(window.location.hash).toBe('#/thread/alex');
    expect(await screen.findByRole('textbox', {
      name: 'Message to Alex Lee',
    })).toHaveValue('First draft');
    expect(screen.queryByDisplayValue('Replacement draft')).toBeNull();
  });

  it('keeps a whitespace-only draft instead of discarding it on Send', async () => {
    await renderMessagingApp();
    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Alex',
      });
    });
    fireEvent.click(await screen.findByRole('button', {name: 'Reply'}));
    const input = await screen.findByRole('textbox', {
      name: 'Message to Alex Lee',
    });
    const outgoingBefore = document.querySelectorAll('.message-row--outgoing').length;

    fireEvent.change(input, {target: {value: '   '}});
    fireEvent.click(screen.getByRole('button', {name: 'Send message'}));

    // Nothing was sent, so the text the user typed is still there to finish.
    expect(screen.getByRole('textbox', {
      name: 'Message to Alex Lee',
    })).toHaveValue('   ');
    expect(document.querySelectorAll('.message-row--outgoing')).toHaveLength(
      outgoingBefore,
    );
    expect(window.location.hash).toBe('#/thread/alex');

    // It still sends once there is real text, and the surrounding spaces go.
    fireEvent.change(input, {target: {value: '  Ready now.  '}});
    fireEvent.click(screen.getByRole('button', {name: 'Send message'}));
    await waitFor(() => {
      expect(screen.queryByRole('textbox', {
        name: 'Message to Alex Lee',
      })).not.toBeInTheDocument();
    });
    expect(Array.from(
      document.querySelectorAll<HTMLElement>('.message-row--outgoing'),
    ).some(row => row.textContent?.includes('Ready now.'))).toBe(true);
  });

  it('clears the draft when the message input is emptied', async () => {
    await renderMessagingApp();

    await act(async () => {
      await executeWebMcpTestTool(host.context, 'draft_message', {
        recipient: 'Alex',
        text: 'Discard this draft',
      });
    });
    const input = await screen.findByRole('textbox', {
      name: 'Message to Alex Lee',
    });

    fireEvent.change(input, {target: {value: ''}});

    await waitFor(() => {
      expect(screen.queryByRole('textbox', {
        name: 'Message to Alex Lee',
      })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', {name: 'Reply'})).toBeInTheDocument();
  });

  it('lets a tool draft after Reply opened an empty composer', async () => {
    await renderMessagingApp();
    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Alex',
      });
    });
    fireEvent.click(await screen.findByRole('button', {name: 'Reply'}));
    expect(await screen.findByRole('textbox', {
      name: 'Message to Alex Lee',
    })).toHaveValue('');

    let result: unknown;
    await act(async () => {
      result = await executeWebMcpTestTool(host.context, 'draft_message', {
        recipient: 'Alex',
        text: 'Sending this instead.',
      });
    });

    expect(result).toMatchObject({drafted: true, recipient: 'Alex Lee'});
    expect(screen.getByRole('textbox', {
      name: 'Message to Alex Lee',
    })).toHaveValue('Sending this instead.');
  });

  it('leaves no draft behind when Reply is open and another thread opens', async () => {
    await renderMessagingApp();
    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Alex',
      });
    });
    fireEvent.click(await screen.findByRole('button', {name: 'Reply'}));
    await screen.findByRole('textbox', {name: 'Message to Alex Lee'});

    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Maya Johnson',
      });
    });

    expect(window.location.hash).toBe('#/thread/maya');
    expect(screen.queryByRole('textbox', {
      name: 'Message to Alex Lee',
    })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', {
      name: 'Message to Maya Johnson',
    })).not.toBeInTheDocument();

    let result: unknown;
    await act(async () => {
      result = await executeWebMcpTestTool(host.context, 'draft_message', {
        recipient: 'Maya Johnson',
        text: 'No stale draft blocks this.',
      });
    });

    expect(result).toMatchObject({drafted: true, recipient: 'Maya Johnson'});
    expect(await screen.findByRole('textbox', {
      name: 'Message to Maya Johnson',
    })).toHaveValue('No stale draft blocks this.');
  });

  it('keeps reply text that was typed before another thread opened', async () => {
    await renderMessagingApp();
    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Alex',
      });
    });
    fireEvent.click(await screen.findByRole('button', {name: 'Reply'}));
    fireEvent.change(
      await screen.findByRole('textbox', {name: 'Message to Alex Lee'}),
      {target: {value: 'Still writing this.'}},
    );

    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Maya Johnson',
      });
    });
    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Alex',
      });
    });

    expect(await screen.findByRole('textbox', {
      name: 'Message to Alex Lee',
    })).toHaveValue('Still writing this.');
  });

  it('rejects a blank recipient before searching the inbox', async () => {
    await renderMessagingApp();

    const result = await executeWebMcpTestTool(
      host.context,
      'draft_message',
      {recipient: '   ', text: 'Hello'},
    );

    expect(result).toMatchObject({error: 'invalid_recipient'});
  });

  it('rejects an unknown recipient without leaving the inbox', async () => {
    await renderMessagingApp();

    const result = await executeWebMcpTestTool(
      host.context,
      'draft_message',
      {recipient: 'Unknown', text: 'Hello'},
    );

    expect(result).toMatchObject({
      error: 'unknown_recipient',
      availableRecipients: ['Alex Lee', 'Maya Johnson', 'Sam Rivera'],
    });
    expect(window.location.hash === '' || window.location.hash === '#/').toBe(true);
  });

  it.each([
    ['a blank person', '   '],
    ['a missing person', ''],
  ])('rejects %s before searching the inbox', async (_label, person) => {
    await renderMessagingApp();

    const result = await executeWebMcpTestTool(
      host.context,
      'open_message_thread',
      {person},
    );

    expect(result).toMatchObject({
      error: 'invalid_person',
      availableContacts: ['Alex Lee', 'Maya Johnson', 'Sam Rivera'],
    });
    expect(window.location.hash === '' || window.location.hash === '#/').toBe(true);
  });

  it('rejects an unknown person without leaving the inbox', async () => {
    await renderMessagingApp();

    const result = await executeWebMcpTestTool(
      host.context,
      'open_message_thread',
      {person: 'Unknown'},
    );

    expect(result).toMatchObject({
      error: 'unknown_person',
      availableContacts: ['Alex Lee', 'Maya Johnson', 'Sam Rivera'],
    });
    expect(window.location.hash === '' || window.location.hash === '#/').toBe(true);
  });

  it('reports an ambiguous person instead of opening a guess', async () => {
    // The real matcher reads the `conversations` its own module closes over, so
    // a collision can only be staged by giving the app a private instance of
    // the module — the same technique `domain.test.ts` uses. The shipped inbox
    // the UI renders keeps its unambiguous names.
    vi.resetModules();
    const isolatedDomain = await import('./domain');
    expect(isolatedDomain.conversations).not.toBe(conversations);
    isolatedDomain.conversations.push({
      id: 'alex-rivera',
      name: 'Alex Rivera',
      avatarSrc: isolatedDomain.conversations[0].avatarSrc,
      unread: false,
      messages: [
        {
          id: 'colliding-1',
          sender: 'contact',
          text: 'Shares a first name with Alex Lee.',
          timestamp: '2026-08-19T09:20:00-07:00',
        },
      ],
    });
    const {MessagingExampleApp: IsolatedApp} = await import('./App');

    render(<IsolatedApp />);
    await waitFor(async () => {
      expect(await host.context.getTools()).toHaveLength(2);
    });

    const result = await executeWebMcpTestTool(
      host.context,
      'open_message_thread',
      {person: 'Alex'},
    );

    expect(result).toMatchObject({
      error: 'ambiguous_person',
      matchingContacts: ['Alex Lee', 'Alex Rivera'],
    });
    // It declined to guess, so no thread opened.
    expect(window.location.hash === '' || window.location.hash === '#/').toBe(true);
    // The full name is still unambiguous and still opens.
    await act(async () => {
      await executeWebMcpTestTool(host.context, 'open_message_thread', {
        person: 'Alex Rivera',
      });
    });
    expect(window.location.hash).toBe('#/thread/alex-rivera');
    // The shared inbox every other test and the UI read never saw the fixture.
    expect(conversations.map(conversation => conversation.id)).toEqual([
      'alex',
      'maya',
      'sam',
    ]);
  });
});
