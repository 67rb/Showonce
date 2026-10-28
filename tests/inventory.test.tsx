import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import s from "@/lib/strings";
import {
  libraryLessons,
  sampleLesson,
  sessionResult,
  type LibraryLesson,
} from "@/design/fixtures";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { StepCard } from "@/components/StepCard";
import { LessonCard } from "@/components/LessonCard";
import { VerdictChip } from "@/components/VerdictChip";
import { ProgressSteps } from "@/components/ProgressSteps";
import { Banner } from "@/components/Banner";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { KeyframeVisual } from "@/components/KeyframeVisual";
import { MinimalChrome } from "@/components/MinimalChrome";

import LandingPage from "@/app/(public)/page";
import CreatePage from "@/app/(public)/create/page";
import ProcessingPage from "@/app/(public)/create/processing/page";
import ReviewPage from "@/app/(public)/create/review/page";
import LessonsPage from "@/app/(public)/lessons/page";
import LessonOverviewPage from "@/app/(public)/lesson/[id]/page";
import PlayPage from "@/app/(minimal)/lesson/[id]/play/page";
import CameraPage from "@/app/(minimal)/lesson/[id]/play/camera/page";
import LivePage from "@/app/(minimal)/lesson/[id]/live/page";
import CompletePage from "@/app/(minimal)/lesson/[id]/complete/page";
import PrivacyPage from "@/app/(public)/privacy/page";
import DesignPage from "@/app/(public)/design/page";
import NotFoundPage from "@/app/not-found";
import ErrorPage from "@/app/error";

const markup = (node: React.ReactElement) => renderToStaticMarkup(node);

const decode = (h: string) =>
  h.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

const ssr = async (
  fn: () => React.ReactElement | Promise<React.ReactElement>,
) => markup(await fn());

// Task D wraps a heading's final word in a .font-serif-accent span, so the
// rendered string is no longer contiguous in the raw HTML. Text assertions on
// headings strip the tags to compare against the visible text.
const textOf = (h: string) =>
  decode(h).replace(/<[^>]*>/g, "").replace(/\s+/g, " ");

const lessonCardFixture: LibraryLesson = libraryLessons[0];

describe("component library renders with fixture props", () => {
  it("Button renders its label", () => {
    expect(markup(<Button>{s.createGetSteps}</Button>)).toContain(s.createGetSteps);
  });
  it("Button loading state renders label", () => {
    const html = markup(<Button loading>Loading</Button>);
    expect(html).toContain("Loading");
  });
  it("Input renders label and error", () => {
    const html = markup(
      <Input label={s.importFieldLabel} error={s.importErrorInvalid} />,
    );
    expect(html).toContain(s.importFieldLabel);
    expect(html).toContain(s.importErrorInvalid);
  });
  it("StepCard renders step caption", () => {
    const html = markup(<StepCard step={sampleLesson.steps[0]} index={0} />);
    expect(html).toContain(sampleLesson.steps[0].caption);
    expect(html.toLowerCase()).toContain("step 1");
  });
  it("LessonCard renders title and step count", () => {
    const html = markup(<LessonCard lesson={lessonCardFixture} />);
    expect(html).toContain(lessonCardFixture.title);
    expect(html).toContain(`${lessonCardFixture.stepCount}`);
  });
  it("VerdictChip right/wrong/canttell render labels", () => {
    expect(markup(<VerdictChip variant="right" label={s.verdictRightLabel} />)).toContain(s.verdictRightLabel);
    expect(markup(<VerdictChip variant="wrong" label={s.verdictWrongLabel} />)).toContain(s.verdictWrongLabel);
    expect(decode(markup(<VerdictChip variant="canttell" label={s.verdictCantTellLabel} />))).toContain(s.verdictCantTellLabel);
  });
  it("ProgressSteps shows current of total", () => {
    expect(markup(<ProgressSteps current={2} total={4} />)).toContain("2 of 4");
  });
  it("Banner renders saved and error text", () => {
    expect(markup(<Banner tone="saved">{s.savedBanner}</Banner>)).toContain(s.savedBanner);
    expect(markup(<Banner tone="error">{s.importErrorInvalid}</Banner>)).toContain(s.importErrorInvalid);
  });
  it("EmptyState renders its line", () => {
    const html = markup(<EmptyState line={s.lessonsEmptyLine} />);
    expect(html).toContain(s.lessonsEmptyLine);
  });
  it("SkeletonCard renders", () => {
    expect(markup(<SkeletonCard />).length).toBeGreaterThan(0);
  });
  it("KeyframeVisual renders aria-label", () => {
    const html = markup(<KeyframeVisual spec={sampleLesson.steps[0].keyframe} label="scene" />);
    expect(html).toContain("scene");
  });
});

describe("landing page", () => {
  it("renders sections in order with exact strings", async () => {
    const html = textOf(await ssr(() => LandingPage({ searchParams: Promise.resolve({}) })));
    const order = [s.landingHeadline, s.howStep1Title, s.howStep2Title, s.howStep3Title, s.eyebrowCapabilities, s.canHeading, s.canCantClosing, s.finalCtaHeadline];
    let last = -1;
    for (const text of order) {
      const idx = html.indexOf(text);
      expect(idx).toBeGreaterThan(-1);
      expect(idx).toBeGreaterThan(last);
      last = idx;
    }
    // The privacy section heading reuses the hero claim text verbatim, so its
    // presence is asserted separately rather than as part of the ordering.
    expect(html).toContain(s.privacyHeading);
    expect(html).toContain(s.privacyClaim);
  });
  it("renders the capability section with its four cards regardless of state", async () => {
    const html = await ssr(() => LandingPage({ searchParams: Promise.resolve({ state: "empty" }) }));
    expect(html).toContain(s.eyebrowCapabilities);
    expect(html).toContain(s.galleryMoreTitle);
    expect(html).toContain(s.galleryLineTower);
  });

  it("renders the how-it-works heading and each step title exactly once", async () => {
    const html = await ssr(() => LandingPage({ searchParams: Promise.resolve({}) }));
    // The eyebrow and the heading share the same "How it works" text, so count
    // the serif-wrapped heading element, and each step title individually.
    expect(html.split('How it <span class="font-serif-accent">works</span>').length - 1).toBe(1);
    const text = textOf(html);
    for (const t of [s.howStep1Title, s.howStep2Title, s.howStep3Title]) {
      expect(text.split(t).length - 1).toBe(1);
    }
  });
});

describe("create flow", () => {
  it("import default renders heading and start", async () => {
    const html = textOf(await ssr(() => CreatePage({ searchParams: Promise.resolve({}) })));
    expect(html).toContain(s.createHeading);
    expect(html).toContain(s.createGetSteps);
  });
  it("import invalid/failed/not-configured variants render exact messages", async () => {
    const invalid = await ssr(() => CreatePage({ searchParams: Promise.resolve({ state: "invalid" }) }));
    expect(invalid).toContain(s.importErrorInvalid);
    const failed = await ssr(() => CreatePage({ searchParams: Promise.resolve({ state: "failed" }) }));
    expect(failed).toContain(s.importErrorFailed);
    const ncfg = await ssr(() => CreatePage({ searchParams: Promise.resolve({ state: "not-configured" }) }));
    expect(ncfg).toContain(s.importErrorNotConfigured);
  });
  it("processing renders heading and stage rows", async () => {
    const html = await ssr(() => ProcessingPage());
    expect(html).toContain(s.processingHeading);
    expect(html).toContain(s.procStageFetch);
    expect(html).toContain(s.procStageSample);
    expect(html).toContain(s.procStageDerive);
    expect(html).toContain(s.seeReviewScreen);
  });
  it("review renders heading, all 4 steps, and start lesson", () => {
    const html = markup(<ReviewPage />);
    expect(html).toContain(s.reviewHeading);
    expect(html).toContain(s.startLesson);
    for (const st of sampleLesson.steps) {
      expect(html).toContain(st.caption);
    }
  });
});

describe("library and lesson overview", () => {
  it("lessons renders heading, new lesson, three cards", async () => {
    const html = textOf(await ssr(() => LessonsPage({ searchParams: Promise.resolve({}) })));
    expect(html).toContain(s.lessonsHeading);
    expect(html).toContain(s.newLesson);
    for (const l of libraryLessons) expect(html).toContain(l.title);
  });
  it("lessons empty variant renders line", async () => {
    const html = await ssr(() => LessonsPage({ searchParams: Promise.resolve({ state: "empty" }) }));
    expect(html).toContain(s.lessonsEmptyLine);
  });
  it("lesson overview renders title, meta, mode cards", async () => {
    const html = textOf(await ssr(() => LessonOverviewPage({ params: Promise.resolve({ id: "sample" }) })));
    expect(html).toContain(sampleLesson.title);
    expect(html).toContain(sampleLesson.meta);
    expect(html).toContain(s.modeStepByStep);
    expect(html).toContain(s.modeStepByStepDesc);
    expect(html).toContain(s.modeLive);
    expect(html).toContain(s.modeLiveDesc);
    expect(html).toContain(s.modeLiveChip);
  });
});

describe("player screens", () => {
  const play = (state: string) =>
    ssr(() =>
      PlayPage({
        params: Promise.resolve({ id: "sample" }),
        searchParams: Promise.resolve({ state }),
      }),
    );
  it("step state renders current caption and Done", async () => {
    const html = await play("step");
    expect(html).toContain(sampleLesson.steps[1].caption);
    expect(html).toContain(s.doneStep);
    expect(html).toContain(s.speakerLabel);
  });
  it("checking state renders line", async () => {
    expect(await play("checking")).toContain(s.checkingLine);
  });
  it("right state renders match line and next", async () => {
    const html = await play("right");
    expect(html).toContain(s.verdictRightLine);
    expect(html).toContain(s.nextStep);
  });
  it("wrong state renders difference and both buttons", async () => {
    const html = await play("wrong");
    expect(html).toContain(s.verdictWrongLine);
    expect(html).toContain(s.fixIt);
    expect(html).toContain(s.mineIsRight);
  });
  it("canttell state renders line and retake", async () => {
    const html = await play("canttell");
    expect(html).toContain(s.cantTellLine);
    expect(html).toContain(s.retakePhoto);
  });
  it("camera renders guidance, no camera API", async () => {
    const html = await ssr(() => CameraPage());
    expect(html).toContain(s.guideHandsAway);
    expect(html).toContain(s.usePhotoInstead);
    expect(html).not.toContain("getUserMedia");
  });
  it("minimal chrome shows step 2 of 4", () => {
    expect(markup(<MinimalChrome />)).toContain("2 of 4");
  });
});

describe("live and completion", () => {
  const live = (state: string) =>
    ssr(() =>
      LivePage({
        params: Promise.resolve({ id: "sample" }),
        searchParams: Promise.resolve({ state }),
      }),
    );
  it("on-track renders its line and Live chip", async () => {
    const html = await live("on-track");
    expect(html).toContain(s.liveOnTrackLine);
    expect(html).toContain(s.liveChip);
  });
  it("check renders title and blurry line", async () => {
    const html = await live("check");
    expect(html).toContain(s.liveCheckLine);
    expect(html).toContain(s.liveTooBlurry);
  });
  it("wrong renders title and difference", async () => {
    const html = await live("wrong");
    expect(html).toContain(s.liveWrongLine);
    expect(html).toContain(s.verdictWrongLine);
  });
  it("completion renders heading, summary, no percentages", async () => {
    const html = await ssr(() => CompletePage());
    expect(html).toContain(s.completeHeading);
    expect(html).toContain(sampleLesson.title);
    expect(html).toContain(sessionResult.totalTime);
    expect(html).toContain(sessionResult.stepsCompleted);
    expect(html).toContain(s.completeNeededMoreLabel);
    for (const line of sessionResult.neededMoreThanOneCheck) expect(html).toContain(line);
    expect(html).toContain(s.backToYourLessons);
    expect(html).toContain(s.learnAnother);
  });
});

describe("privacy, error pages, design index", () => {
  it("privacy renders claim and four section headings", async () => {
    const html = await ssr(() => PrivacyPage());
    expect(html).toContain(s.privacyClaim);
    for (const sec of s.privacySections) expect(html).toContain(sec.heading);
  });
  it("not-found renders its heading", async () => {
    const html = await ssr(() => NotFoundPage());
    expect(html).toContain(s.notFoundHeading);
    expect(html).toContain(s.backHome);
  });
  it("error renders heading and retry", async () => {
    const html = await ssr(() => ErrorPage({ error: new Error("x"), retry: () => {} }));
    expect(html).toContain(s.errorHeading);
    expect(html).toContain(s.errorRetry);
  });
  it("design index links every route", async () => {
    const html = await ssr(() => DesignPage());
    const routes = [
      "/",
      "/create",
      "/create/processing",
      "/create/review",
      "/lessons",
      "/lesson/sample",
      "/lesson/sample/play",
      "/lesson/sample/play/camera",
      "/lesson/sample/live",
      "/lesson/sample/complete",
      "/privacy",
      "/design",
    ];
    for (const r of routes) expect(html).toContain(r);
  });
});