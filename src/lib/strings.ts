/**
 * SHOW ONCE — all user-visible strings.
 *
 * Everything rendered to the user lives here so that adding Arabic later is a
 * matter of adding one strings object and selecting it, without touching
 * components or pages. Components never hard-code user-visible copy.
 */

export const strings = {
  /* Brand */
  wordmarkShow: "SHOW",
  wordmarkOnce: "ONCE",
  privacyClaim: "checks your work, saves your progress.",

  /* Shared chrome */
  yourLessonsLink: "Your lessons",
  navCreate: "Create",
  navPrivacy: "Privacy",
  footerLine: "YouTube shows. Show Once watches.",
  designLink: "Design",
  exitLesson: "Exit",

  /* Landing */
  // v2.1 Task A: the hero headline is the brand on a single line. The stored
  // line value ("SHOW ONCE", uppercase) feeds the particle instance and the
  // static Anton headline verbatim; landingHeadline is the readable
  // case-matched value for the accessible h1 text.
  landingHeadline: "Show Once",
  landingHeadlineLines: ["SHOW ONCE"],
  landingTaglinePrefix: "Paste a video link. Learn it step by step, checked as you",
  landingTaglineLoopWords: ["build.", "fold.", "stack.", "pack.", "solve."],
  eyebrowHero: "Show once",
  eyebrowHowItWorks: "How it works",
  eyebrowTheCheck: "The check",
  eyebrowScope: "Scope",
  eyebrowPrivacy: "Privacy",
  eyebrowYourLessons: "Your lessons",
  importLinkPlaceholder: "Paste a YouTube or Instagram link",
  importFieldLabel: "YouTube or Instagram link",
  importStart: "Start",
  importUpload: "Upload a video file",

  sectionHowItWorks: "How it works",
  howStep1Title: "Paste the link",
  howStep1Line:
    "Bring a supported tutorial link, paste instructions, or start with free numbered steps.",
  howStep2Title: "Get the steps",
  howStep2Line:
    "Follow a clear target for each step. Saved illustrations load automatically; creating new AI images uses the shared allowance.",
  howStep3Title: "Do it, checked",
  howStep3Line:
    "Practice with the free camera preview and self-review, or choose an AI photo check for visible details.",

  proofStepLabel: "The step",
  proofPhotoLabel: "Your photo",
  proofDifference: "The middle block is blue. In the step it is red.",
  // v2.20 Task D — the check-demo verdict strip sentence.
  checkDemoDifference: "The top-right brick is blue. In the step, it is red.",
  proofCaptionLabel: "How a check works.",

  canHeading: "It can teach",
  cantHeading: "It can't teach",
  canItems: [
    "Coloured block and brick builds",
    "Snap-together STEM kits",
    "Bead and mosaic patterns",
    "Board game setup",
    "Simple kit packing",
    "Geometry constructions",
  ],
  cantItems: [
    "Knots and tightness",
    "Fold and crease quality",
    "Cooking doneness",
    "Anything a photo from above cannot show",
  ],
  canCantClosing:
    "If a photo of the finished step shows whether it is right, Show Once can coach it.",
  /* It-can-teach line for the scope hover card (Task B) */
  audienceCanLine: "Hands-on skills a photo from above can judge.",

  /* Scope — two audience cards (Task A) */
  audienceHobbyTitle: "Hobby",
  audienceHobbyLine:
    "For learning by doing at home — your pace, your table, a check on every step.",
  audienceHobbyItems: [
    "Builds and models at home",
    "Crafts, beads and mosaics",
    "Board games, set up right",
    "New kits, learned step by step",
  ],
  audienceProfessionalTitle: "Professional",
  audienceProfessionalLine:
    "For teaching hands-on work — every trainee's step checked the same way, every time.",
  audienceProfessionalItems: [
    "Workshop and vocational training",
    "Assembly and packing checks",
    "Classroom practicals",
    "Hands-on team onboarding",
  ],

  privacyHeading: "checks your work, saves your progress.",
  privacyBody:
    "Photo checks run through Meta. Submitted photos are saved privately with your practice and can be deleted from history. Live camera frames are not saved.",
  privacyLink: "Read the privacy page",

  lessonsSectionTitle: "What SHOW ONCE can check.",
  seeAll: "See all",
  lessonsEmptyLine: "No lessons yet. Paste a link above to make your first one.",

  /* Gallery capability showcase (v2.20 Task C) */
  galleryLineTower:
    "Layer-by-layer block builds, checked from a single photo. Hobby builds at home, model work in the studio — a wrong brick is flagged the moment it lands.",
  galleryLineMosaic:
    "Bead and tile patterns, checked colour by colour. Craft projects and professional mosaic work alike — every row is verified before you move to the next.",
  galleryLineWall:
    "Staggered brickwork, checked row by row. Practice walls and site training alike — each course is lined up against the step, so the finished wall matches the plan.",
  galleryTitleTower: "Block builds",
  galleryTitleMosaic: "Bead & tile patterns",
  galleryTitleWall: "Brickwork",
  galleryMoreTitle: "And more it can check",
  galleryMoreLine:
    "Board setups. Packed kits. Geometry constructions. For kitchen-table hobbies and professional training alike — if a photo from above can judge it, SHOW ONCE can check it.",
  /* v2.28 — bottom-anchored examples line per capability card (Task B) */
  galleryExamplesTower: "Bricks · blocks · STEM kits",
  galleryExamplesMosaic: "Bead boards · mosaics · tile art",
  galleryExamplesWall: "Walls · paving · stacked rows",
  galleryExamplesMore: "Chess setup · tool kits · geometry",
  eyebrowCapabilities: "Capabilities",

  finalCtaHeadline: "Show it once. Learn it right.",
  finalCtaButton: "Start learning",

  /* Create — import */
  createHeading: "Learn something new",
  uploadPrompt: "or upload a video file",
  uploadButton: "Choose a video file",
  createScopeNote:
    "Bring a skill you want to practice. Use a tutorial, your own instructions, or a free example.",
  createGetSteps: "Get the steps",
  importErrorInvalid: "That link does not look like a YouTube or Instagram link.",
  importErrorFailed:
    "We could not fetch that video. Upload the file instead.",
  importErrorNotConfigured:
    "Link import is not set up yet. Upload a video file instead.",

  /* Create — processing */
  processingHeading: "Breaking your video into steps",
  procStageFetch: "Fetching the video",
  procStageSample: "Sampling frames",
  procStageDerive: "Deriving steps",
  procStageDone: "Done",
  processingNote: "This usually takes under a minute.",
  seeReviewScreen: "See the review screen",

  /* Create — review */
  reviewHeading: "Check the steps",
  reviewTitleFieldLabel: "Lesson title",
  reviewCaptionPlaceholder: "Step caption",
  deleteStepTitle: "Delete this step?",
  deleteStepBody:
    "This step will be removed from the lesson. Nothing is saved in this design review.",
  cancel: "Cancel",
  deleteStepConfirm: "Delete step",
  backToImport: "Back",
  startLesson: "Start lesson",
  reorderUpLabel: "Move step up",
  reorderDownLabel: "Move step down",
  deleteStepLabel: "Delete step",
  savedBanner: "Design preview — nothing is saved.",

  /* Library */
  lessonsHeading: "Your lessons",
  newLesson: "New lesson",
  lessonsEmptyButton: "Paste a link",
  stepsSuffix: "steps",

  /* Lesson overview */
  modeHeading: "How do you want to learn?",
  modeStepByStep: "Step by step",
  modeStepByStepDesc: "One step, one photo, one check. Best for accuracy.",
  modeLive: "Live",
  modeLiveDesc: "Free camera preview while you work. Optional AI checks use one frame at a time.",
  modeLiveChip: "Free camera preview",
  startLessonShort: "Start",
  reviewSteps: "Review steps",

  /* Player */
  speakerLabel: "Play caption",
  doneStep: "Done",
  checkingLine: "Checking your photo",
  verdictRightLabel: "Right",
  verdictRightLine: "That matches the step.",
  nextStep: "Next step",
  verdictWrongLabel: "Wrong",
  verdictWrongLine: "The middle block is blue. In the step it is red.",
  fixIt: "Fix it",
  mineIsRight: "Mine is right",
  verdictCantTellLabel: "Can't tell",
  cantTellLine: "That photo cannot be judged. Too dark.",
  retakePhoto: "Retake photo",

  /* Camera */
  guideHandsAway: "Hands away, hold still",
  takePhoto: "Take photo",
  usePhotoInstead: "Use a photo instead",

  /* Live */
  liveChip: "Live",
  liveOnTrackLine: "On track. Keep going.",
  liveCheckLine: "Check this step",
  liveTooBlurry: "The last frame was too blurry to judge.",
  liveWrongLine: "One thing differs",
  endSession: "End session",
  endSessionTitle: "End this session?",
  endSessionBody: "This ends the live session and shows your summary.",
  endSessionConfirm: "End session",

  /* Completion */
  completeHeading: "Done.",
  completeTotalTimeLabel: "Total time",
  completeStepsCompletedLabel: "Steps completed",
  completeNeededMoreLabel: "Needed more than one check",
  backToYourLessons: "Back to your lessons",
  learnAnother: "Learn another",

  /* Privacy */
  privacyPageHeading: "Privacy",
  privacySections: [
    {
      heading: "What gets checked",
      body: "An AI photo check sends the image you select to Meta to assess visible details against the current step. A photo cannot establish hidden qualities or certify safety. Free camera preview and comparison stills stay in your browser unless you explicitly choose an AI frame check.",
    },
    {
      heading: "What gets saved",
      body: "Uploaded check photos are saved privately with your practice. You can delete individual photos from practice history. Progress and feedback are also saved. Live camera preview is not recorded; its temporary stills clear when you stop, leave the step or background the page. Show Once does not save camera frames sent for a one-frame AI check, but retains the feedback privately.",
    },
    {
      heading: "Where AI runs",
      body: "AI lessons, illustrations and checks use the Meta Model API in the cloud. Supported video imports can also use Supadata. Free examples, numbered-step creation and local camera practice do not call either provider. Provider credentials stay on the server and are never needed from you in the browser.",
    },
    {
      heading: "Your practice access",
      body: "Signed-in practices are linked to your account so you can resume on another device. Browser-only practices keep their access in this browser. Signing out stops the camera and hides the account workspace; it does not delete saved practice. Use the history controls to delete saved photos.",
    },
  ],

  /* Error pages */
  notFoundHeading: "That page is not here.",
  notFoundBody: "The link you followed does not point to a page.",
  backHome: "Back home",
  errorHeading: "Something went wrong.",
  errorBody: "An unexpected error stopped this page from rendering.",
  errorRetry: "Try again",

  /* Task D fixture copy — the three scaffold lessons (titles + step captions) */
  fixtureTowerTitle: "Build the stepped tower",
  fixtureTowerMeta: "4 steps · source: YouTube link",
  fixtureTowerStep0: "Place three bricks for the base row.",
  fixtureTowerStep1: "Set two bricks offset above the base.",
  fixtureTowerStep2: "Balance a contrasting brick up top.",
  fixtureTowerStep3: "Finish the stepped silhouette.",
  fixtureMosaicTitle: "Lay a two-row mosaic strip",
  fixtureMosaicMeta: "3 steps · source: Instagram link",
  fixtureMosaicStep0: "Lay the first row of flat tiles.",
  fixtureMosaicStep1: "Start the second row with an offset tone.",
  fixtureMosaicStep2: "Complete the two-row pattern.",
  fixtureWallTitle: "Stack a two-course brick wall",
  fixtureWallMeta: "3 steps · source: YouTube link",
  fixtureWallStep0: "Lay the first course of bricks.",
  fixtureWallStep1: "Add the second course, staggered.",
  fixtureWallStep2: "Fill in the last bricks.",
} as const;

export type Strings = typeof strings;
export default strings;