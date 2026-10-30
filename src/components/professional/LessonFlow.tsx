"use client";
import {LearningWorkspace} from '@/components/learning/Workspace';
import {ProfessionalStudio} from './ProfessionalStudio';
export function LessonFlow({screen}:{screen:'library'|'overview'|'play'|'camera'|'live'|'complete'}){
 if(screen==='library')return <ProfessionalStudio view="library"/>;
 return <div className="professional-runtime"><LearningWorkspace professional screen={screen==='camera'?'live':screen}/></div>;
}
