import s from "@/lib/strings";
import { Wordmark } from "@/components/Wordmark";
export function MinimalChrome(){return <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4"><Wordmark href="/" size="sm"/><a className="text-small underline" href="/lessons/">{s.yourLessonsLink}</a></header>;}
