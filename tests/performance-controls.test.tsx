// @vitest-environment jsdom
import {afterEach,describe,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {PublicNavbar} from '@/components/PublicNavbar';
import {HeroVenomCta} from '@/components/HeroVenomCta';
import {HeroParticleHeadline} from '@/components/HeroParticleHeadline';
import {SatinBackdrop} from '@/components/create/SatinBackdrop';
import {HorizontalGallery} from '@/components/HorizontalGallery';
afterEach(cleanup);
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
 it('primary action is a native destination and the heading remains readable text without canvases',()=>{
  const {container}=render(<><HeroParticleHeadline/><HeroVenomCta/><SatinBackdrop/></>);
  expect(screen.getByRole('heading',{level:1}).textContent).toBe('Show Once');
  expect(screen.getByRole('link',{name:/Start learning/}).getAttribute('href')).toBe('/create/');
  expect(container.querySelectorAll('canvas').length).toBe(0);
 });
 it('capability links occur once each and remain keyboard reachable',()=>{
  render(<HorizontalGallery/>);expect(screen.getAllByRole('link')).toHaveLength(4);
  expect(screen.getByLabelText('Skills you can practice').getAttribute('tabindex')).toBe('0');
 });
});
