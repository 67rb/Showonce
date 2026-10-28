// @vitest-environment jsdom
import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {PublicNavbar} from '@/components/PublicNavbar';
import {HeroVenomCta} from '@/components/HeroVenomCta';
import {HeroParticleHeadline} from '@/components/HeroParticleHeadline';
import {HorizontalGallery} from '@/components/HorizontalGallery';
beforeEach(()=>{
 vi.stubGlobal('matchMedia',vi.fn(query=>({matches:false,media:query,addEventListener:vi.fn(),removeEventListener:vi.fn(),addListener:vi.fn(),removeListener:vi.fn()})));
 vi.stubGlobal('ResizeObserver',class {observe(){} disconnect(){}});
 vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1));vi.stubGlobal('cancelAnimationFrame',vi.fn());
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('Steady, accessible product controls',()=>{
 it('mobile menu opens, exposes working destinations, and closes with Escape',()=>{
  render(<PublicNavbar/>);const toggle=screen.getByRole('button',{name:'Open menu'});
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(toggle);expect(toggle.getAttribute('aria-expanded')).toBe('true');
  const menu=document.getElementById('mobile-navigation')!;
  expect(Array.from(menu.querySelectorAll('a')).map(a=>a.getAttribute('href'))).toEqual(['/create/','/lessons/','/privacy/','/create/']);
  fireEvent.keyDown(document,{key:'Escape'});expect(toggle.getAttribute('aria-expanded')).toBe('false');expect(document.activeElement).toBe(toggle);
 });
 it('choosing a mobile destination closes the menu',()=>{
  render(<PublicNavbar/>);fireEvent.click(screen.getByRole('button',{name:'Open menu'}));
  fireEvent.click(document.querySelector('#mobile-navigation a')!);expect(document.getElementById('mobile-navigation')).toBeNull();
 });
 it('animated primary action stays a real button and the heading remains readable without canvas support',()=>{
  const {container}=render(<><HeroParticleHeadline/><HeroVenomCta/></>);
  expect(screen.getByRole('heading',{level:1}).textContent).toBe('Show Once');
  expect(screen.getByRole('button',{name:/Start learning/}).getAttribute('type')).toBe('button');
  expect(container.querySelectorAll('canvas').length).toBe(3);
 });
 it('animated capability links stay keyboard reachable and decorative duplicates are inert',()=>{
  render(<HorizontalGallery/>);expect(screen.getAllByRole('link')).toHaveLength(4);
  expect(document.querySelector('[inert][aria-hidden="true"]')).not.toBeNull();
 });
});
