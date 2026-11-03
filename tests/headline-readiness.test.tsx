/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { HeroParticleHeadline } from '@/components/HeroParticleHeadline';

const originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts');
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  Object.defineProperty(document, 'fonts', { configurable: true, value: { load: vi.fn(async () => []), ready: Promise.resolve() } });
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  if (originalFonts) Object.defineProperty(document, 'fonts', originalFonts);
  else Reflect.deleteProperty(document, 'fonts');
});

it('keeps the real headline visible when fonts load but canvas is unavailable', async () => {
  const context = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  render(<HeroParticleHeadline />);
  await waitFor(() => expect(context).toHaveBeenCalled());
  expect(screen.getByRole('heading', { level: 1 }).classList.contains('sr-only')).toBe(false);
});

it('paints the particle headline before hiding the readable fallback', async () => {
  const fillRect = vi.fn();
  const context = { measureText: () => ({ width: 2, actualBoundingBoxAscent: 2, actualBoundingBoxDescent: 0 }), fillText: vi.fn(), clearRect: vi.fn(), fillRect, getImageData: () => ({ data: new Uint8ClampedArray([80, 80, 90, 255]) }) };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  render(<HeroParticleHeadline />);
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).classList.contains('sr-only')).toBe(true));
  expect(fillRect).toHaveBeenCalled();
});
