/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// @vitest-environment jsdom
import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IdentityProvider, useIdentity } from '@/components/learning/Identity';
import { HomePractice } from '@/components/learning/HomePractice';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.localStorage.clear(); });
const profile = (id: string) => ({ authenticated: true, user: { id, display_name: id, email: id + '@example.test' }, is_admin: false });

function Probe({ image = false }: { image?: boolean }) {
  const identity = useIdentity(), [result, setResult] = useState('');
  return <><p>Account: {identity.ready ? identity.account?.user?.id : 'checking'}</p><button disabled={!identity.ready} onClick={() => {
    void identity.request('/private-fixture', undefined, { image }).then(() => setResult('Private result displayed')).catch(error => setResult(error.code));
  }}>Read private result</button><output>{result}</output></>;
}

it.each([false, true])('rejects a previous account response whose %s body finishes after switching accounts', async image => {
  let actor = 'alice', finish!: (value: unknown) => void;
  const readBody = vi.fn(() => new Promise(resolve => { finish = resolve; }));
  vi.stubGlobal('fetch', vi.fn(async (path: string) => {
    if (path === '/api/account') return Response.json(profile(actor));
    if (path === '/api/config') return Response.json({ examples: [], ai_available: false });
    const response = Response.json({ private: 'alice' });
    Object.defineProperty(response, image ? 'blob' : 'json', { value: readBody });
    return response;
  }));
  render(<IdentityProvider><Probe image={image} /></IdentityProvider>);
  await screen.findByText('Account: alice');
  fireEvent.click(screen.getByRole('button', { name: 'Read private result' }));
  await waitFor(() => expect(readBody).toHaveBeenCalledOnce());
  actor = 'bob'; fireEvent(window, new Event('showonce-account-changed'));
  await screen.findByText('Account: bob');
  await act(async () => { finish(image ? new Blob(['alice photo']) : { private: 'alice' }); });
  expect(await screen.findByText('account_changed')).toBeTruthy();
  expect(screen.queryByText('Private result displayed')).toBeNull();
});

it('hides the previous account Continue card immediately while the new account library is loading', async () => {
  let actor = 'alice', finishBob!: (value: Response) => void;
  const entry = { id: 'session_alice', lesson_id: 'lesson_alice', title: 'Alice private practice', category: 'drawing', total_steps: 2, completed_steps: 0, status: 'active', updated_at: '2026-11-03T00:00:00Z' };
  vi.stubGlobal('fetch', vi.fn(async (path: string) => {
    if (path === '/api/account') return Response.json(profile(actor));
    if (path === '/api/config') return Response.json({ examples: [], ai_available: false });
    if (path.startsWith('/v1/library')) return actor === 'alice' ? Response.json({ entries: [entry] }) : new Promise<Response>(resolve => { finishBob = resolve; });
    if (path.startsWith('/v1/sessions')) return Response.json({ completed_step_ids: [], current_step_id: 'step_1' });
    return Response.json({ steps: [{ id: 'step_1', title: 'Make a mark' }] });
  }));
  render(<IdentityProvider><Probe /><HomePractice /></IdentityProvider>);
  await screen.findByRole('link', { name: /Alice private practice/ });
  actor = 'bob'; fireEvent(window, new Event('showonce-account-changed'));
  expect(screen.queryByRole('link', { name: /Alice private practice/ })).toBeNull();
  await screen.findByText('Account: bob');
  expect(screen.queryByRole('link', { name: /Alice private practice/ })).toBeNull();
  await act(async () => { finishBob(Response.json({ entries: [] })); });
});
