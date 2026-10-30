/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {AiAllowance} from '@/components/learning/AiAllowance';
import type {Config} from '@/lib/learning';
afterEach(cleanup);
const config=(remaining=4.5,limit=5):Config=>({examples:[],ai_available:true,budget:{remaining_usd:remaining,limit_usd:limit,paused:false}});
it('displays server-provided shared dollars and an accessible progress value',()=>{render(<AiAllowance config={config()}/>);expect(screen.getByText(/\$4.50 of \$5.00 remaining/)).toBeTruthy();const bar=screen.getByRole('progressbar') as HTMLProgressElement;expect(bar.value).toBe(4.5);expect(bar.max).toBe(5);});
it('does not invent a balance when the server configuration is missing',()=>{render(<AiAllowance config={null}/>);expect(screen.getByText(/AI checks are unavailable/)).toBeTruthy();expect(screen.queryByRole('progressbar')).toBeNull();expect(screen.queryByText(/\$0/)).toBeNull();});
it('shows exhausted and paused states without implying an available paid balance',()=>{const view=render(<AiAllowance config={config(0)}/>);expect(screen.getByText(/allowance exhausted/)).toBeTruthy();view.rerender(<AiAllowance config={{...config(),budget:{...config().budget!,paused:true}}}/>);expect(screen.getByText(/allowance is paused/)).toBeTruthy();expect(screen.queryByRole('progressbar')).toBeNull();});
it('rejects invalid numeric balances and keeps free practice visible',()=>{render(<AiAllowance config={config(Number.NaN)}/>);expect(screen.getByText(/allowance unavailable/)).toBeTruthy();expect(screen.getByText(/Free practice remains available/)).toBeTruthy();expect(screen.queryByText(/NaN/)).toBeNull();});
it('clamps a mismatched remaining balance to the supplied total consistently',()=>{render(<AiAllowance config={config(8,5)}/>);expect(screen.getByText(/\$5.00 of \$5.00 remaining/)).toBeTruthy();expect((screen.getByRole('progressbar') as HTMLProgressElement).value).toBe(5);});
