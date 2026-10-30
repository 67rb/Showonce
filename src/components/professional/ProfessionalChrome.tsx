/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import {usePathname} from 'next/navigation';
import {PublicNavbar} from '@/components/PublicNavbar';
import type {ReactNode} from 'react';
export function ProfessionalChrome({children}:{children:ReactNode}){
 const path=usePathname();const player=/^\/professional\/lesson\/[^/]+\/(play|live|complete)(\/|$)/.test(path||'');
 return <div className="professional-face flex min-h-dvh flex-col">{!player&&<PublicNavbar/>}<main id="main-content" tabIndex={-1} className={'flex-1 '+(player?'':'pt-24')}>{children}</main></div>;
}
