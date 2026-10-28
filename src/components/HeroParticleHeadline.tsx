"use client";
import {useEffect,useRef,useState} from "react";
import {TextParticleAnimation} from "@/components/lightswind/text-particle-animation";
import s from "@/lib/strings";
export function HeroParticleHeadline(){
 const heading=useRef<HTMLHeadingElement>(null),[font,setFont]=useState<{size:number;family:string}|null>(null);
 useEffect(()=>{
  const el=heading.current;if(!el||typeof matchMedia!=="function")return;
  const motion=matchMedia("(prefers-reduced-motion: reduce)");let alive=true;
  const measure=async()=>{if(motion.matches){setFont(null);return;}const style=getComputedStyle(el),size=parseFloat(style.fontSize),family=style.fontFamily;
   try{if(!document.fonts?.load)return;await document.fonts.load(`400 ${size}px ${family}`,s.landingHeadline);if(alive)setFont({size,family});}catch{/* Keep readable text if the font cannot load. */}};
  void measure();const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(()=>void measure()):null;observer?.observe(el);motion.addEventListener("change",measure);
  return()=>{alive=false;observer?.disconnect();motion.removeEventListener("change",measure);};
 },[]);
 return <div className="relative flex w-full items-center justify-center" style={{height:"clamp(104px, calc(12vw + 48px), 160px)"}}>
  <h1 ref={heading} className="font-display uppercase leading-none tracking-tight text-[#27272A] text-[clamp(3.5rem,12vw,7rem)]" style={{opacity:font?0:1}}>{s.landingHeadline}</h1>
  {font&&<div aria-hidden="true" className="absolute inset-0 flex items-center justify-center"><TextParticleAnimation text={s.landingHeadline.toUpperCase()} fontFamily={font.family} fontWeight={400} fontSize={font.size} theme="light" resolution={3} pixelSize={3} hoverRadius={90} repelForce={14} clickRadius={240} clickForce={50} springForce={0.085} friction={0.86} padding={24}/></div>}
 </div>;
}
