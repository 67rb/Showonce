import s from "@/lib/strings";
import { sampleLesson } from "@/design/fixtures";

import { KeyframeVisual } from "@/components/KeyframeVisual";
import { Button } from "@/components/Button";
import Link from "next/link";

export default function CameraPage() {
  const current = sampleLesson.steps[1]; // the "current" step 2 scene

  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-6">
      <div className="relative overflow-hidden rounded-2xl bg-[#101013] ring-1 ring-[#101013]">
        <KeyframeVisual spec={current.keyframe} label={current.caption} dim />
        {/* top-down guide outline */}
        <div className="pointer-events-none absolute inset-[12%] rounded-md border-2 border-dashed border-accent/60" />
        {/* amber corner brackets */}
        <span aria-hidden className="pointer-events-none absolute left-2 top-2 h-6 w-6 border-l-2 border-t-2 border-accent/70" />
        <span aria-hidden className="pointer-events-none absolute right-2 top-2 h-6 w-6 border-r-2 border-t-2 border-accent/70" />
        <span aria-hidden className="pointer-events-none absolute bottom-2 left-2 h-6 w-6 border-b-2 border-l-2 border-accent/70" />
        <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 h-6 w-6 border-b-2 border-r-2 border-accent/70" />
      </div>

      <p className="font-display-ui mt-4 text-center text-[1.5rem] font-bold leading-heading text-site-ink">
        {s.guideHandsAway}
      </p>

      <div className="mt-6 flex flex-col items-center gap-4">
        <Link
          href="/lesson/sample/play?state=checking"
          aria-label={s.takePhoto}
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-accent/70 transition-colors duration-[150ms] hover:border-accent"
        >
          <span aria-hidden className="h-[70%] w-[70%] rounded-full bg-accent" />
        </Link>
        <Button href="/lesson/sample/play?state=checking" variant="secondary" className="w-full">
          {s.usePhotoInstead}
        </Button>
      </div>
    </div>
  );
}