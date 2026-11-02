/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import {usePathname} from 'next/navigation';
import {PublicNavbar} from '@/components/PublicNavbar';
import {InteriorHeader} from '@/components/InteriorHeader';
import {PublicFooter} from '@/components/PublicFooter';
import type {ReactNode} from 'react';
export function ProfessionalChrome({children}:{children:ReactNode}){
  const path=usePathname();
  const player=/^\/professional\/lesson\/[^/]+\/(play|live|complete)(\/|$)/.test(path||'');
  // P1 — only the landing (/) keeps the floating pill; interior routes render
  // the docked InteriorHeader, so the fixed-pill compensation padding (pt-24)
  // is removed there. The runtime player keeps its own chrome (no site header).
  const landing=path==='/professional'||path==='/professional/'||path==='';
  return (
    <div className="professional-face flex min-h-dvh flex-col">
      {!player&&landing&&<PublicNavbar/>}
      {!player&&!landing&&<InteriorHeader/>}
      <main id="main-content" tabIndex={-1} className={'flex-1 '+(landing?'pt-24':'')}>{children}</main>
      {/* P2 — every Pro interior page ends with the compact footer (PublicFooter
          self-switches to the compact variant off the landing routes). The
          landing and the runtime player keep their existing treatment. */}
      {!player&&!landing&&<PublicFooter/>}
    </div>
  );
}
