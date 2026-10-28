import { LearningWorkspace } from "@/components/learning/Workspace";
export function generateStaticParams(){ return [{id:"runtime"}]; }
export default function Page(){ return <LearningWorkspace screen="complete"/>; }
