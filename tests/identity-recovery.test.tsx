// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AccountBar, IdentityProvider } from '@/components/learning/Identity';

afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
it('offers one usable retry after a timed-out connection and recovers sign-in controls',async()=>{
 vi.useFakeTimers();let offline=true;
 vi.stubGlobal('fetch',async(path:string)=>{
  if(offline)throw new Error('offline');
  return Response.json(path==='/api/account'?{authenticated:false,user:null,is_admin:false,identity_provider:'github',sign_in_url:'https://test.example/api/auth/signin'}:{examples:[],ai_available:false});
 });
 render(<IdentityProvider><AccountBar/></IdentityProvider>);
 await act(async()=>{await vi.advanceTimersByTimeAsync(8100);});
 const retry=screen.getByRole('button',{name:'Retry'});
 offline=false;await act(async()=>{fireEvent.click(retry);await vi.advanceTimersByTimeAsync(1);});
 expect(screen.queryByRole('button',{name:'Retry'})).toBeNull();
 expect(screen.getByRole('link',{name:'Sign in with GitHub'}).getAttribute('href')).toContain('callbackUrl=');
 cleanup();expect(vi.getTimerCount()).toBe(0);
});
