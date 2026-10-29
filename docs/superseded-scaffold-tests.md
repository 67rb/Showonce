# Superseded design-only screen tests

These assertions exercised fake outcomes, fixed fixture progress and simulated error states. The integration replaces those screens with real API state. Original component/landing tests remain active; live behavior has its own regression tests.

## interactions.test.tsx

```tsx
it("delete button opens the dialog with its exact title", () => {
    render(<ReviewPage />);

    const deleteLabels = screen.getAllByText(s.deleteStepLabel);
    expect(deleteLabels.length).toBeGreaterThan(0);
    const button = deleteLabels[0].closest("button");
    expect(button).not.toBeNull();
    fireEvent.click(button!);

    expect(screen.getByText(s.deleteStepTitle)).toBeTruthy();
    expect(screen.getByText(s.deleteStepBody)).toBeTruthy();
    expect(screen.getByText(s.cancel)).toBeTruthy();
    expect(screen.getAllByText(s.deleteStepConfirm).length).toBeGreaterThan(0);
  });
```

## inventory.test.tsx

```tsx
it("import default renders heading and start", async () => {
    const html = textOf(await ssr(() => CreatePage({ searchParams: Promise.resolve({}) })));
    expect(html).toContain(s.createHeading);
    expect(html).toContain(s.createGetSteps);
  });
```

## inventory.test.tsx

```tsx
it("import invalid/failed/not-configured variants render exact messages", async () => {
    const invalid = await ssr(() => CreatePage({ searchParams: Promise.resolve({ state: "invalid" }) }));
    expect(invalid).toContain(s.importErrorInvalid);
    const failed = await ssr(() => CreatePage({ searchParams: Promise.resolve({ state: "failed" }) }));
    expect(failed).toContain(s.importErrorFailed);
    const ncfg = await ssr(() => CreatePage({ searchParams: Promise.resolve({ state: "not-configured" }) }));
    expect(ncfg).toContain(s.importErrorNotConfigured);
  });
```

## inventory.test.tsx

```tsx
it("processing renders heading and stage rows", async () => {
    const html = await ssr(() => ProcessingPage());
    expect(html).toContain(s.processingHeading);
    expect(html).toContain(s.procStageFetch);
    expect(html).toContain(s.procStageSample);
    expect(html).toContain(s.procStageDerive);
    expect(html).toContain(s.seeReviewScreen);
  });
```

## inventory.test.tsx

```tsx
it("review renders the derived lesson title, all 4 steps, and start lesson", () => {
    const html = markup(<ReviewPage />);
    expect(textOf(html)).toContain(sampleLesson.title);
    expect(html).toContain(s.startLesson);
    for (const st of sampleLesson.steps) {
      expect(html).toContain(st.caption);
    }
  });
```

## inventory.test.tsx

```tsx
it("lessons renders heading, new lesson, three cards", async () => {
    const html = textOf(await ssr(() => LessonsPage({ searchParams: Promise.resolve({}) })));
    expect(html).toContain(s.lessonsHeading);
    expect(html).toContain(s.newLesson);
    for (const l of libraryLessons) expect(html).toContain(l.title);
  });
```

## inventory.test.tsx

```tsx
it("lessons empty variant renders line", async () => {
    const html = await ssr(() => LessonsPage({ searchParams: Promise.resolve({ state: "empty" }) }));
    expect(html).toContain(s.lessonsEmptyLine);
  });
```

## inventory.test.tsx

```tsx
it("camera renders the dark viewfinder, guidance, and capture; no camera API", async () => {
    const html = await ssr(() => CameraPage());
    expect(html).toContain("bg-[#101013]");
    expect(html).toContain("border-white/20");
    expect(html).toContain(s.guideHandsAway);
    expect(html).toContain("border-4 border-white");
    expect(html).not.toContain("getUserMedia");
  });
```

## inventory.test.tsx

```tsx
it("minimal chrome shows step 2 of 4", () => {
    expect(markup(<MinimalChrome />)).toContain("2 of 4");
  });
```

## inventory.test.tsx

```tsx
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
```

## visual.test.tsx

```tsx
it("lessons rows render a KeyframeVisual thumbnail per fixture lesson", async () => {
    const html = markup(await LessonsPage({ searchParams: Promise.resolve({}) }));
    expect((html.match(/role="img"/g) || []).length).toBe(3);
    for (const lesson of libraryLessons) expect(html).toContain(lesson.title);
  });
```

## visual.test.tsx

```tsx
it("site-language routes use the Inter Tight display font; /design keeps its section-title", async () => {
    const create = markup(await CreatePage({ searchParams: Promise.resolve({}) }));
    const lessons = markup(await LessonsPage({ searchParams: Promise.resolve({}) }));
    const privacy = markup(PrivacyPage());
    const design = markup(DesignPage());
    for (const html of [create, lessons, privacy]) {
      expect(html).toContain("font-display-ui");
    }
    // /design is not part of the re-skin allowlist; keeps its existing heading
    expect(design).toContain("section-title");
  });
```

## visual.test.tsx

```tsx
it("verdict state wrappers use the light screen ground with semantic verdict headings", async () => {
    const right = markup(await PlayPage({ params: Promise.resolve({ id: "sample" }), searchParams: Promise.resolve({ state: "right" }) }));
    const wrong = markup(await PlayPage({ params: Promise.resolve({ id: "sample" }), searchParams: Promise.resolve({ state: "wrong" }) }));
    const canttell = markup(await PlayPage({ params: Promise.resolve({ id: "sample" }), searchParams: Promise.resolve({ state: "canttell" }) }));
    const step = markup(await PlayPage({ params: Promise.resolve({ id: "sample" }), searchParams: Promise.resolve({ state: "step" }) }));
    // semantic verdict headline colours
    expect(right).toContain("text-success");
    expect(wrong).toContain("text-danger");
    expect(canttell).toContain("text-accent-deep");
    // the dark play-verdict full-page tints are gone
    expect(right).not.toContain("play-verdict-right");
    expect(step).not.toContain("play-verdict-right");
  });
```

## visual.test.tsx

```tsx
it("camera page renders white viewfinder brackets and a ring capture button", () => {
    const html = markup(<CameraPage />);
    expect(html).toContain("border-l-2 border-t-2 border-white/90");
    expect(html).toContain("border-r-2 border-t-2 border-white/90");
    expect(html).toContain("border-b-2 border-l-2 border-white/90");
    expect(html).toContain("border-b-2 border-r-2 border-white/90");
    expect(html).toContain("border-4 border-white");
    expect(html).toContain("h-20 w-20");
  });
```

```tsx
describe("create flow", () => {
});
```

```tsx
describe("library and lesson overview", () => {
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
```

```tsx
describe("player screens", () => {
  const play = (state: string) =>
    ssr(() =>
      PlayPage({
        params: Promise.resolve({ id: "sample" }),
        searchParams: Promise.resolve({ state }),
      }),
    );
  it("step state renders current caption, take-photo action, and privacy line", async () => {
    const html = await play("step");
    expect(html).toContain(sampleLesson.steps[1].caption);
    expect(html).toContain(s.takePhoto);
    expect(html).toContain(s.privacyClaim);
  });
  it("checking state renders line", async () => {
    expect(await play("checking")).toContain(s.checkingLine);
  });
  it("right state renders match line and next", async () => {
    const html = await play("right");
    expect(html).toContain(s.verdictRightLine);
    expect(html).toContain(s.nextStep);
  });
  it("wrong state renders the difference sentence and both actions", async () => {
    const html = await play("wrong");
    expect(html).toContain(s.checkDemoDifference);
    expect(html).toContain(s.retakePhoto);
    expect(html).toContain(s.mineIsRight);
  });
  it("canttell state renders line and retake", async () => {
    const html = await play("canttell");
    expect(html).toContain(s.cantTellLine);
    expect(html).toContain(s.retakePhoto);
  });
});
```

```tsx
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
});
```
