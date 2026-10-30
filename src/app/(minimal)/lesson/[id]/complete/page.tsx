/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import { LearningWorkspace } from "@/components/learning/Workspace";
export function generateStaticParams(){ return [{id:"runtime"}]; }
export default function Page(){ return <LearningWorkspace screen="complete"/>; }
