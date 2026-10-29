"use client";
import s from "@/lib/strings";
import {Button} from "@/components/Button";
import {useRouter} from "next/navigation";
export function StartLearningButton(){const router=useRouter();return <Button size="large" onClick={()=>router.push("/create/")}>{s.finalCtaButton}</Button>;}
