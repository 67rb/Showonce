"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";
import s from "@/lib/strings";

const navItems = [
  {name:s.navCreate,link:"/create/"},
  {name:s.yourLessonsLink,link:"/lessons/"},
  {name:s.navPrivacy,link:"/privacy/"},
];
export function PublicNavbar(){
  const [open,setOpen]=useState(false);
  const pathname=usePathname();
  const toggle=useRef<HTMLButtonElement>(null);
  useEffect(()=>{setOpen(false);},[pathname]);
  useEffect(()=>{if(!open)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);toggle.current?.focus();}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[open]);
  return <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6">
    <nav aria-label="Main navigation" className="mx-auto max-w-6xl rounded-3xl border border-black/10 bg-white/95 px-4 shadow-sm backdrop-blur-md">
      <div className="flex min-h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Show Once — home" onClick={()=>setOpen(false)} className="wordmark inline-flex min-h-11 items-center text-xl text-[#121212]"><span>{s.wordmarkShow}</span><span className="text-[#D97706]">{s.wordmarkOnce}</span></Link>
        <div className="hidden items-center gap-2 md:flex">{navItems.map(item=><Link key={item.link} href={item.link} aria-current={pathname===item.link||pathname===item.link.slice(0,-1)?'page':undefined} className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-[#121212] hover:bg-black/5 aria-[current=page]:bg-black/5">{item.name}</Link>)}<Link href="/create/" className="inline-flex min-h-11 items-center rounded-full bg-[#F59E0B] px-5 text-sm font-semibold text-black">{s.importStart}</Link></div>
        <button ref={toggle} type="button" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(value=>!value)} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[#121212] hover:bg-black/5 md:hidden"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{open?<path d="m6 6 12 12M18 6 6 18"/>:<path d="M4 7h16M4 12h16M4 17h16"/>}</svg></button>
      </div>
      {open&&<div id="mobile-navigation" className="flex flex-col gap-1 border-t border-black/10 py-3 md:hidden">{navItems.map(item=><Link key={item.link} href={item.link} onClick={()=>setOpen(false)} className="flex min-h-11 items-center rounded-xl px-3 text-[#121212] hover:bg-black/5">{item.name}</Link>)}<Link href="/create/" onClick={()=>setOpen(false)} className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full bg-[#F59E0B] px-5 font-semibold text-black">{s.importStart}</Link></div>}
    </nav>
  </header>;
}
