import s from "@/lib/strings";
import { sampleLesson } from "@/design/fixtures";

import Link from "next/link";
import { KeyframeVisual } from "@/components/KeyframeVisual";

export default function CameraPage() {
  const current = sampleLesson.steps[1]; // the "current" step 2 scene

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-between gap-8 bg-[#101013] px-4 py-8">
      {/* step-reminder chip — dark glass, white text */}
      <div className="max-w-[430px]">
        <span className="block w-full rounded-full bg-white/10 px-4 py-1.5 text-center font-body-ui text-small font-medium text-white">
          {current.caption}
        </span>
      </div>

      {/* centred viewfinder — photo variant (white corner brackets) on a
          hairline white-at-20% border, at the step's 4/3 aspect */}
      <div className="relative w-full max-w-[430px] overflow-hidden rounded-2xl border border-white/20">
        <div className="aspect-[4/3] w-full">
          <KeyframeVisual
            spec={current.keyframe}
            label={current.caption}
            variant="photo"
            fit
            className="h-full"
          />
        </div>
      </div>

      <p className="font-body-ui text-small text-white/70">
        {s.guideHandsAway}
      </p>

      {/* bottom controls — circular capture + quiet back */}
      <div className="flex flex-col items-center gap-5">
        <Link
          href="/lesson/sample/play?state=checking"
          aria-label={s.takePhoto}
          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white transition-transform duration-[150ms] hover:scale-105"
        >
          <span aria-hidden className="h-12 w-12 rounded-full bg-[#121212]" />
        </Link>
        <Link
          href="/lesson/sample/play"
          className="font-body-ui text-small font-medium text-white/70 underline-offset-4 transition-colors duration-[150ms] hover:text-white hover:underline"
        >
          {s.exitLesson}
        </Link>
      </div>
    </div>
  );
}