# SHOW ONCE — Design

This file is the design source of truth. Every page, component, token and state
variant in the scaffold is listed here so later prompts can add tooling to each
page without changing the design.

## Visual direction v1.1: Amber Grain Cinema

More than a token palette — a distinct visual language. Warm, rich, filmic:
near-black base `#16161A`, an animated amber film-grain layer in the landing
hero, warm amber glows, bold poster typography, and surfaces with gradients
and depth instead of flat grey boxes.

### Animated Grain (Lightswind)

- Component `src/components/lightswind/animated-grain.tsx` (installed via
  `lightswind add animated-grain`; code lives in the project, no `lightswind`
  npm import at runtime). Runtime deps: `next-themes` + `@/lib/utils` (`cn`,
  from `clsx`/`tailwind-merge`).
- `src/components/GrainGate.tsx` is a client component mounted **in the landing
  hero only** (no page layout mounts it). Its wrapper is `absolute inset-0`
  inside the hero; it mounts the grain canvas only while the hero intersects
  the viewport (IntersectionObserver) and unmounts it off-screen. It renders
  nothing on the server / before mount (avoids hydration mismatch) and nothing
  under `prefers-reduced-motion`. Grain props: `variant="solar"`,
  `speed={0.65}`, `intensity={0.7}`, `grainAmount={0.15}`, `contrast={1.05}`,
  `vignetteStrength={0.35}`, `opacity={0.6}`, `interactive={true}`.
- Grain makes no network calls at runtime; `useTheme` (next-themes) returns a
  safe default outside a provider, so no `ThemeProvider` is required.

### Fonts

| Variable        | Family   | Role                                            |
| --------------- | -------- | ----------------------------------------------- |
| `--font-display` | Anton    | wordmark, hero + section headings, ghost numbers, verdict headlines |
| `--font-sans`    | Archivo  | body copy (400–700)                             |

Type rules: wordmark in Anton, uppercase, tight tracking, SHOW white + ONCE
amber. Hero headline in Anton at display size, uppercase, `line-height 0.95`.
Section headings in Anton uppercase. Eyebrows in Archivo 600, uppercase,
`letter-spacing 0.18em`, amber, size small. Body stays Archivo at existing
sizes. Verdict chips: Archivo 600 uppercase. No reliance on the default font
stack. Fonts load via `next/font/google` in the root layout and are exposed as
CSS variables wired through `@theme`.

### Brick colour mapping (KeyframeVisual)

Incoming fixture colour → premium muted tone (mapped inside the component; no
saturated primary red/blue anywhere in the app):

| Fixture      | Base      | Light     |
| ------------ | --------- | --------- |
| red          | `#B44336` | `#CE5A4A` |
| blue         | `#46617E` | `#5B7B9D` |
| amber        | `#D99A26` | `#EDB54A` |
| bone         | `#D8CFB8` | `#EAE2CE` |
| green (sage) | `#5F7161` | `#768A79` |

Bricks render with a vertical light→base gradient face, two top studs (radial
highlight + drop shadow), a drop shadow onto the mat, and a darker bottom edge.
The mat has a radial vignette (lighter centre `#26262B` → edges `#17171A`), a
faint grid texture, rounded corners, and a white 6% inner border.

### Surfaces & glow

- Cards/panels: `linear-gradient(180deg, #242429, #1B1B1F)`, 1px border white
  8%, top inset highlight white 5%, radius from the token scale. Interactive
  cards hover to an amber 40% border + warm glow (`#F59E0B` 12%, large blur) at
  the fast timing token, with no layout shift.
- Primary button: amber fill + warm glow (`#F59E0B` 25%) and a `motion-safe`
  1px hover lift with strengthened glow. Secondary/ghost: white 14% border,
  gradient surface on hover.
- Landing hero: radial amber glow behind the headline/import panel
  (`#F59E0B` fading to transparent) plus a bottom fade into `--bg`. Minimal
  chrome screens: faint top glow at 8%.
- Verdict states: headline in Anton; WRONG gets a soft red radial glow (10%)
  behind the chip; RIGHT gets the amber glow (12%); CANT_TELL stays neutral.

### Section rhythm (landing only)

Each section carries an eyebrow label (hero "SHOW ONCE", how-it-works
"HOW IT WORKS", check "THE CHECK", scope "SCOPE", privacy "PRIVACY", your
lessons "YOUR LESSONS"; final CTA none). How-it-works steps sit in three
distinct panels with Anton ghost numbers (amber 14%) behind them. Sections are
separated by an amber 12% hairline with generous spacing from the spacing
scale. The can/can't columns are two contrasting panels — can: gradient
surface + amber 20% border; can't: transparent with a white 12% dashed border.
The privacy section sits on a full-width darker band `#101013` spanning the
container.

## Visual direction v1.2: structural redesign (below the hero + app screens)

Supersedes the below-hero layout rules above and scopes the grain to the hero.

### Grain scope (corrected)

- The Animated Grain exists **only inside the landing hero**. The root layout
  and every page layout are grain-free. Nothing else imports or mounts the
  grain component.
- Two props changed vs v1.1: `speed` `0.35 → 0.65`, `interactive` `false → true`.
- GrainGate pauses via an IntersectionObserver: unmounts the grain canvas when
  the hero leaves the viewport, remounts it on return. Under
  `prefers-reduced-motion` it renders nothing at all.

### Static noise texture

- `.noise` in `globals.css`: inline SVG `feTurbulence` data URI, repeated at
  200px, `opacity: 0.05`, `pointer-events: none`. Applied as an absolute layer
  on band sections (proof, privacy) and on the `/create` and `/lessons` page
  backgrounds. Static CSS only — never a second canvas.

### Below-hero layout rules (landing)

- Section heading size: `clamp(2.25rem, 6vw, 3.5rem)` via `.section-title`
  (Anton, uppercase, `line-height: 1`), applied to every landing section
  heading. Section vertical padding: `py-12 md:py-16`.
- HOW IT WORKS: three full-width rows, not cards — each a grid with the ghost
  number (Anton `clamp(6rem, 12vw, 8rem)`, amber 16%) left and the step title
  (Anton 1.5rem) + line right; rows separated by white 8% hairlines.
- PROOF: a full-bleed dark band (`#101013` + `.noise`) with larger
  KeyframeVisuals (stacked on mobile, `lg:grid-cols-2`), the WRONG chip at
  large size, and the difference sentence in Anton at 1.25rem.
- CAN / CAN'T: two typographic lists (stacked on mobile); items Archivo 600 at
  1.125rem with a hairline under each; can prefixed by a small amber square,
  can't by a muted dash. Closing line in Anton at 1.25rem, centred, amber glow
  behind at 10%.
- PRIVACY: full-width band `#101013`; heading a poster statement at the section
  size (Anton uppercase via CSS, string unchanged); two-column on desktop
  (heading left, body right), stacked on mobile.
- YOUR LESSONS: lesson rows — `KeyframeVisual` thumbnail fixed 112px left,
  title Anton 1.25rem, meta under, amber arrow right; card surface + hover glow
  retained. Empty state centred, no box.
- FINAL CTA: headline at display size, centred, amber radial glow behind the
  whole block.
- FOOTER: a giant outline wordmark (`clamp(4rem, 17vw, 11rem)`, transparent
  fill, 1px `-webkit-text-stroke` amber 25%, `nowrap`, centred, `aria-hidden`)
  above the existing footer line and Design link; clipped rather than
  overflowing at narrow widths.

### App-screen treatments

- `/create`, `/lessons`, `/privacy`, `/design` headings render at the section
  size (`.section-title`); `/create` and `/lessons` carry the `.noise` texture
  on their backgrounds.
- Player: step caption in Anton at 1.75rem. Verdict states get full-screen page
  tints — right: amber 18% radial over `#1A1408 → #16161A`; wrong: red 12%
  radial over `#1D0B0B → #16161A`; canttell: plain `#141416`. Chips, sentences
  and buttons unchanged.
- Camera & Live viewfinders: four amber corner brackets (24px arms, 70%).
  Camera capture becomes a ring button (72px, 3px amber border, inner amber dot
  at 70%) — same label and navigation.
- Overview, review, processing, completion: headings in Anton where they are
  headings; processing stage titles in Anton; completion "Done." at display
  size with amber glow behind at 12%.

- Stack: Next.js (App Router) · React · TypeScript (strict) · Tailwind v4.
- Deployment target: Appwrite Sites (Next.js, SSR, `output: "standalone"`).
- Mobile web, PWA shell (manifest + installable). No Vercel-specific APIs.
- Logo is parked: a plain text wordmark only — **SHOW** in white + **ONCE** in
  amber. No logo artwork is generated or drawn.

## Visual direction v1.3: effect budgets (final)

Subtraction pass. The three budgets below are hard rules for the whole site;
layouts, section order and copy do not change.

- GLOW: exactly two radial glow layers on the landing page — the hero glow and
  one behind the final CTA block. Verdict screens keep only their flat tint
  backgrounds (the gradients between the two tint hexes; no glow layer). No
  other section, card, band or screen carries a radial glow.
- NOISE: the static `.noise` texture appears only on the proof band and the
  privacy band; nowhere else.
- ANTON: the Anton display font is used only for the hero headline, landing
  section headings, how-it-works ghost numbers, the player step caption,
  verdict headlines and the footer outline wordmark (page headings on
  `/create`, `/lessons`, `/privacy`, `/design` keep Anton at heading size).
  Everything else that passes over-set in display type — eyebrows, buttons,
  chips, card titles, page headings on other routes, and the landing proof /
  closing sentences — renders in Archivo 600. This supersedes the v1.1/v1.2
  lines that set the proof difference sentence, the can/can't closing line,
  the how-it-works step titles and card titles in Anton.

### Grain scope (corrected again)

The Animated Grain exists only inside the landing hero, mounted once through
`GrainGate` in `src/app/(public)/page.tsx` — the root layout references no
grain component at all. Props: `variant="solar"`, `speed={0.65}`,
`intensity={0.7}`, `grainAmount={0.15}`, `contrast={1.05}`,
`vignetteStrength={0.35}`, `opacity={0.6}`, `interactive={true}`. Viewport
pausing unmounts the canvas whenever the hero leaves the viewport
(IntersectionObserver) and remounts it on return; nothing renders at all under
`prefers-reduced-motion`. Correction: any earlier statement in this file that
describes the grain layer as site-wide, or mounted on a page layout, is struck
— grain is hero-only.

Accepted exceptions (v1.3.1): the fixtures RED/BLUE input hexes (`#EF4444`,
`#3B82F6`) are mapping inputs converted by KeyframeVisual before display, and
the KeyframeVisual mat midpoint `#1D1D21` is an internal gradient stop.
Future audits must not flag these two again.

### Hero grain reference configuration (owner-approved, v1.3.2)

The hero grain's approved reference is the owner's Knell configuration:
`variant="solar"`, `speed={1.2}`, `intensity={0.7}`, `grainAmount={0.25}`,
`contrast={1.05}`, `vignetteStrength={0.35}`, `opacity={0.85}`,
`interactive={true}`. Owner variations from the Knell reference: speed 1.2
(faster) and interactive true, with pointer tracking driven at window level
(window `mousemove` + document `mouseleave` recentring) so hover works even
though the canvas wrapper is pointer-events-none behind the hero content.

### v1.6 — hero copy, hero stack, calmer grain, below-hero colour (owner pass)

- Headline: the stored `landingHeadline` is now the owner's pick "Watch once.
  Nail every step." (sentence case; Anton uppercases it on render).
- The in-hero wordmark is removed — the hero stack starts at the headline; the
  header wordmark is a different file and unchanged.
- Grain calmed: `intensity={0.5}`, `opacity={0.75}`; all other v1.3.2 hero
  grain props and behaviours unchanged.
- Below-hero colour (landing only, token palette): HOW IT WORKS ghost numbers
  amber 26% (`.ghost-number`), row hairlines amber 12%; PROOF band gains a
  48px amber bar centred above the difference sentence; CAN list panel =
  amber 6% bg + amber 20% border; CAN'T list panel = red 5% bg + red 15%
  dashed border (radius `--radius-md`, padding `p-5` per the panel surface);
  PRIVACY band background = `#1A1408 → #101013` gradient. Section eyebrows
  are stated as found: `.eyebrow` already sets `color: var(--accent)` (amber,
  full strength) — no assertable change from markup. The YOUR LESSONS arrow
  treatment is blocked (arrow lives inside the shared LessonCard component).

### v1.6.1 — hero readability scrim

Hero text sits on a readability scrim (radial, black 58% centre, above grain
and glow, below content) — typography over unshielded grain is prohibited
anywhere on the site.

### v1.9 — hero headline & tagline (Lightswind)

- Hero headline: Lightswind Text Particle Animation — two stacked lines
  ("WATCH ONCE." / "NAIL EVERY STEP."), Anton 400, dark theme; the
  particle canvases mount only after the Fonts API loads Anton and the
  document is ready; under prefers-reduced-motion the static Anton
  headline stays permanently. A real h1 keeps the full sentence,
  visually hidden (sr-only) once the particle lines carry the visual.
- Tagline: Archivo 500 prefix + Lightswind Looping Words
  (build / fold / stack / pack / solve) inline at the end of the
  sentence, at sentence text size, with the loop container height
  clamped to one line.
- Grain (all eight props), scrim, hero glow and bottom fade, the panel
  and everything below the hero are unchanged.

### v2.1 — particle text is the brand; Looping Words as a centred block

- Particle main text is the brand **"SHOW ONCE"** on a single line (the
  stored uppercase headline line `landingHeadlineLines[0]`). The earlier
  "WATCH ONCE. / NAIL EVERY STEP." copy remains the picked tagline sentence
  and is **not** the particle text. One particle instance; fontSize stages
  64 / 104 / 148 (under 640, under 1024, above).
- Looping Words sits as a centred block **under** the tagline sentence (two
  centred lines: sentence, then the loop block) — demo-style integration,
  no wrapper sizing, clamping or overflow from our markup; the component
  receives only its words array and a font-styling className.

### v2.3 — public header is Aceternity's Resizable Navbar

- The public header is **Aceternity's Resizable Navbar** installed from the
  registry (`src/components/ui/resizable-navbar.tsx`), animation values as
  shipped (scroll threshold, width 40%/100%, y 20/0, blur 10px, spring
  stiffness 200 / damping 50 — untouched). It supersedes the hand-rolled
  pill/morph header attempts (`PublicHeader.tsx` is removed).
- Composed in `PublicNavbar.tsx` with the SHOW ONCE wordmark (plain anchor to
  `/`), page links `/create` `/lessons` `/privacy`, and the amber
  (#F59E0B, black text, rounded-full) Start CTA to `/create`. Navbar is
  forced `fixed` overlay via its className prop; the `dark` class on the
  public layout activates its `dark:` variants (dark-only site).

### v2.4 — navbar glass, hero CTA, tagline loop fix, softer spring

- The navbar overlays the hero from y=0 with **glassmorphism in BOTH states**
  (backdrop-blur-xl + saturate-150 + neutral-950/45 surface + white/10 border;
  the condensed state keeps the soft shadow). The layout keeps its pt-24
  offset for non-landing pages; the landing hero pulls itself to the top with
  `-mt-24` so its grain begins at the viewport top behind the navbar, while its
  content keeps enough top padding to clear the bar.
- The hero link-input panel is **removed**; a single amber CTA ("Start
  learning") links to `/create`. The privacy line stays under it.
- Looping Words is constrained to tagline size via the `.tagline-loop` rule
  (1.125rem / 1.2 / height 1.35em), and the empty-loop defect (the index
  advancing/snapping without matching the visible line) is fixed by wrapping
  the advance modulo the duplicated list (bounded edit in the component).
- The navbar spring is softened: stiffness 200→120, damping 50→26, mass 0.9
  (NavBody and MobileNav); threshold (>100), widths (40%/100%, 90%/100%) and
  y offsets unchanged.

### v2.5 — hero stack budget & loop size enforced from globals.css

- The hero content is ONE centred column (`max-w-[680px] mx-auto flex flex-col
  items-center pt-26`) with a strict vertical budget: 104px top padding, gap
  scale 20 / 10 / 28 / 14px (particle→tagline, tagline→loop, loop→CTA,
  CTA→privacy), total ≈ 640px max so the CTA sits above the fold at an 800px
  viewport. Particle fontSize stages drop to 56 / 96 / 132.
- The Looping Words tagline size is enforced from `globals.css` as **unlayered**
  author CSS (`.tagline-loop` and `.tagline-loop *` + the inner window
  `.tagline-loop > div`) with `!important` on font-size/line-height, because
  className merging could not win the word elements' own large text classes;
  the window height is pinned to 1.35em so one word shows in the bracket frame.

### v2.6 — hero background is Satin Flow; CTA is Venom Button

- Hero background is Lightswind **Satin Flow** (champagne-gold silk over deep
  bronze: `#1A0E02` / `#D97706` / `#FFF1CF` — deep bronze-black base, brand
  amber body, warm cream crests; the ruby direction is superseded. This explicit
  colours array is the whole palette — the component defines no preset.
  speed 2.6, scale 1.5 (folds smaller/more numerous for visible motion),
  noiseIntensity 0.35, interactive, backdropBlurAmount none; installed from its
  registry source). Idle motion is guaranteed by three levers: shader speed 2.6,
  higher fold frequency (scale 1.5), and a 26s breathing `.satin-drift` drift on
  the gate's wrapper (transform only, off under prefers-reduced-motion).
  `SatinGate` mounts it in the hero (same contract as the retired `GrainGate`:
  none under reduced motion, pauses off-screen via IntersectionObserver,
  absolute inset-0, pointer-events-none wrapper, content stays `relative z-10`).
  `GrainGate.tsx` is deleted; `animated-grain.tsx` stays on disk unused. The
  separate amber hero glow div is removed (satin provides the light); the
  `.hero-scrim` and bottom fade stay.
- Hero CTA is Nexus UI's **Venom Button** (installed from the Nexus registry;
  `HeroVenomCta` wrapper, `cursor="native"`, **transparent stage** (scoped
  `.venom-cta > div` transparent override so only the glossy black pill reads),
  stage height 170 and width `min(92vw, 520px)`, autoplay off, navigates to
  `/create`). The stage sits in the CTA slot; the privacy line stays directly
  under it.
- Particle resolution is 2 (finer sampling grid — Anton's N diagonal survives);
  pixelSize 3 and all other props/steps unchanged.
- The `.tagline-loop` rule is now 1.625rem / weight 600 / line-height 1.15 /
  height 1.3em, with the inner window pinned to 1.3em. Smoothness is by
  geometry: root and descendants share one font-size and line-height, so each
  step (one word height = 1.625rem × 1.15) is exact; the component's tween
  (duration 1.2) is already smooth and unchanged.
- The v1.3 GLOW/NOISE budgets are superseded for the hero background (the satin
  replaces the hero grain/glow; the final-CTA glow and the band `.noise`
  layers are unaffected).

### v2.12 — light sky hero (Cloud Sky); satin superseded

- The landing hero has flipped from dark to a **light sky hero**. OUT goes
  Lightswind **Satin Flow** (rejected — `SatinGate.tsx` deleted; the
  `.satin-drift` rule, keyframes and reduced-motion block removed). IN comes
  OriginKit's **Cloud Sky** at its base preset: `background #0075FF`,
  `baseColor #B4D2F0`, `accentColor #FFFFFF`, `density 100`, `size 130`,
  `speed 100` (and `clouds`/`sun`/`pointer` at their defaults), mounted by
  `SkyGate` (absolute inset-0, pointer-events-none, off-screen pause via
  IntersectionObserver; pointer tracking adapted to window level so the gate
  doesn't starve it). Reduced motion still renders the sky but with
  `speed 0` (a frozen still image). No Floating Lines work was ever installed.
- The hero foreground flips to **dark ink**: particle theme is `light`
  (grey `#52525B` sampling in the installed component's light-theme fill), the
  static Anton fallback matches at `#52525B`, the tagline sentence is `#121212`,
  the privacy line is `#27272A`, and the `.tagline-loop` word renders in ink
  `#121212` (set directly on the unlayered `.tagline-loop *` descendant rule,
  which beats the word's own `text-foreground` utility). The `.hero-scrim`
  becomes a **light veil** (white stops `0.42 / 0.18 / 0`) softening the sky
  behind the text. The hero's bottom fade to the page's dark base is unchanged
  — it is the seam between the light hero and the dark sections below.
- The navbar is **light only on `/`** (read via `usePathname`): light glass
  (white 40% background, black 10% border), nav links `#121212`, wordmark SHOW
  `#121212` / ONCE `#D97706`, matching mobile menu. Every other route keeps the
  dark navbar byte-for-byte.
- The Nexus **Venom Button stays black** (its white-inversion plan is
  cancelled); wrapper and component untouched.
- Superseded: the **Satin Flow** entries above (v2.6–v2.9) no longer describe
  the hero background; no **Floating Lines** component exists or is installed.

### v2.14 — navbar first-paint flash

- On first load the navbar briefly painted as a full-width bar (items pushed
  to the extremes) before settling into its floating glass form. Mechanism:
  the NavBody/MobileNav motion elements carried `animate` but no `initial`, so
  framer-motion animated them on mount from the default full-width state
  toward their at-top `animate` values instead of rendering straight at them,
  compounding with the first scroll measurement. Fix: `initial={false}` on both
  motion elements so first paint equals the settled at-top state and only the
  scroll morph animates. No colour, geometry, spring (120/26/0.9), or scroll
  threshold changed.

### Site language v3 — below-the-hero re-skin (Structure from Automark)

Everything beyond the landing hero is re-skinned in ONE design-system pass to
the shapes and rhythm of ThemeWagon's **Automark** reference, rendered in SHOW
ONCE's own colours (black / white / amber). The reference is looked at, never
transplanted — no template code/CSS/image/icon asset is copied in; the look
is re-implemented with this project's own components and Tailwind tokens. The
template's violet accent (`#937AFF`, `#4D36D0`) is explicitly **not adopted**.

**Token table ("Site language")** — added alongside the existing dark tokens
(which the frozen hero still uses); all in `globals.css` `@theme inline`:

| Token            | Value      | Role                                    |
| ---------------- | ---------- | --------------------------------------- |
| `--font-display-ui` | `var(--font-inter-tight)` | Display type, below hero + routes |
| `--font-body-ui`    | `var(--font-urbanist)`    | Body type, below hero + routes    |
| `--color-site-surface` | `#FFFFFF` | white cards                        |
| `--color-site-page`    | `#F7F7F8` | soft off-white page ground         |
| `--color-site-ink`     | `#16161A` | primary text                       |
| `--color-site-ink-2`   | `#242429` | secondary ink                      |
| `--color-site-muted`   | `#71717A` | muted text                         |
| `--color-site-border`  | `#E5E5E5` | hairline borders                   |
| `--color-site-border-2`| `#D4D4D8` | strong borders                     |
| `--color-accent-deep`  | `#D97706` | eyebrow + primary buttons (amber)  |
| `--color-danger`       | `#E5484D` | wrong / danger (semantic)          |
| `--color-success`      | `#00C758` | right / success (semantic, never a brand accent) |
| `--radius-card`        | `24px`    | card radius                        |
| `--font-display`/`--font-sans` | Anton / Archivo | HERO + footer wordmark only |

Shape/elevation: buttons are pills (rounded-full); cards are white `24px`
radius with a soft low shadow (`site-card`); section rhythm is generous (large
vertical padding, centred narrow heading column, then full-width content).
Fonts are loaded in `src/app/layout.tsx` (Inter Tight 500/600/700/800, Urbanist
400/500/600/700) exactly like the existing Anton/Archivo loaders.

**Superseded notes:** the v1.3 dark below-hero section treatments (dark bands,
Anton ghost numbers, dark can/can't, dark privacy band) and the Anton-below-hero
budget are superseded — Anton now lives in the hero and the footer wordmark only.
The v1.6 eyebrow treatment (accent) is replaced with accent-deep. The landing
navbar pathname condition (v2.12) is superseded by the all-routes light
treatment (v3): the navbar is white-glass/ink on every route.

### Site language v3 — Adorn (supersedes the Automark v3 re-skin above)

The owner re-oriented the below-the-hero system to the **Adorn** reference — a
light, minimal, editorial SaaS look rendered in SHOW ONCE's black / white /
amber. The reference is looked at, never transplanted. This block supersedes
the Automark v3 block above (its tokens, fonts and treatments).

**Token table (all in `globals.css` `@theme inline`; hero tokens unchanged):**

| Token            | Value      | Role                                    |
| ---------------- | ---------- | --------------------------------------- |
| `--font-display-ui` | `var(--font-inter-tight)` | Display type, below hero + routes |
| `--font-body-ui`    | `var(--font-inter)`       | Body type, below hero + routes    |
| `--color-site-surface` | `#FFFFFF` | ground (white cards/sections)      |
| `--color-site-page`    | `#F7F7F8` | soft off-white page ground        |
| `--color-site-ink`     | `#16161A` | primary text                       |
| `--color-site-ink-2`   | `#242429` | secondary ink                      |
| `--color-site-muted`   | `#71717A` | muted text                         |
| `--color-site-border`  | `#E5E5E5` | hairline borders                   |
| `--color-accent`       | `#F59E0B` | amber — eyebrows, highlights, active states, privacy band only |
| `--color-accent-deep`  | `#D97706` | amber deep — can markers, footer ONCE |
| `--color-danger`       | `#E5484D` | wrong / danger (semantic)          |
| `--color-success`      | `#00C758` | right / success (semantic, never a brand accent) |
| `--radius-card`        | `24px`    | card radius                        |
| `--font-display`/`--font-sans` | Anton / Archivo | HERO + footer wordmark only |

Buttons: **primary is an ink pill** (ink background, white text, full radius);
secondary is a white pill with a hairline border. Amber is **never** a primary
button — it is reserved for eyebrows, highlights, active states and the privacy
band. Cards use `site-card` (white, 24px radius, hairline border, no heavy
shadow). Headings are Inter Tight, tight tracking, large. Fonts load in
`src/app/layout.tsx` (Inter Tight 500/600/700/800 + Inter 400/500/600/700)
exactly like the Anton/Archivo loaders.

**Landing below-hero treatment map:**
- HOW IT WORKS — white ground; **numbered list rows** separated by hairline
  dividers; big Inter Tight step number in ink with the title + line; the
  Anton ghost numbers are retired.
- PROOF — ink band (`#16161A`), white text, the difference sentence highlighted
  in accent `#F59E0B`; step visual rendered as `variant="step"`, photo as
  `variant="photo"`.
- CAN / CAN'T — soft ground, two minimal white panels (hairline border, 24px
  radius); can markers accent-deep, can't markers danger.
- PRIVACY — full amber block (accent background, ink text); its link is an ink
  pill.
- YOUR LESSONS — **large list rows** (big KeyframeVisual thumbnail, Inter Tight
  title, muted meta, ink arrow) separated by hairlines; hover lifts the row
  background to soft.
- FOOTER — ink band (`#16161A`), light text, solid Anton wordmark (SHOW in
  white, ONCE in `#D97706`); the v1.2 outline wordmark is retired.
- HERO SEAM — the hero's bottom-fade target is now `#FFFFFF` (the first
  section's ground). Everything else in the hero is frozen.

**Route treatments:**
- `/create`, `/create/processing`, `/create/review` — light ground, one centred
  narrow column, large Inter Tight headings, big inputs (white, hairline
  border, accent focus ring), ink pill submit; processing uses accent progress
  on a soft track.
- `/lessons` — the list-row treatment at page scale.
- `/lesson/[id]` — large header with the Task D visual rendered big, step list
  as numbered rows with hairlines, ink pill start button.
- `/lesson/[id]/play` (+ step/checking/right/wrong/canttell), `/play/camera`,
  `/live` (+ on-track/check/wrong) — light page ground; step/photo panels are
  white with a hairline border and 24px radius; the step side renders
  `variant="step"`, the photo side `variant="photo"`; the camera/live stage
  itself stays near-black `#101013`. Verdict word is Inter Tight ink with a
  semantic colour chip (right `#00C758`, wrong `#E5484D`, can't-tell muted);
  progress and buttons use the Task A language (ink pill primary).
- `/complete` — minimal celebratory: big Inter Tight heading, amber check mark,
  ink pill home button.
- `/privacy`, `not-found`, `error` — prose / minimal pages in the same language.
- NAVBAR — the light treatment is unconditional on every route (no pathname
  condition), keeping the amber Start CTA, wordmark colours, the scroll morph,
  and the v2.14 first-paint fix (`initial={false}`).

**KeyframeVisual spec (Task D):** a flat top-down schematic. Bricks are matte
flat fills from the muted brick palette (no gradients, no radial gloss
anywhere), 10px rounded corners, studs drawn as perfect circles flat-shaded
12% darker than the brick fill, one soft shadow per brick
(`0 10px 20px rgba(0,0,0,0.35)`), the scene scaled to ~74% of the stage width,
centred both axes; the mat keeps its dark tone and faint grid. A brick flagged
`tile` renders thinner with no studs (mosaic scenes). Variants `step`
(clean schematic) and `photo` (identical geometry plus `brightness(0.94)`, a
soft vignette, and white viewfinder corner brackets inset 12px inside the
stage) share geometry so a step/photo comparison is geometrically true.

**Fixture inventory (Task D):** the single former filler lesson is replaced by
three fixture lessons inside the locked scope (flat, visible, object skills) —
1) a two-layer block build ("Build the stepped tower"), 2) a mosaic strip of
flat tiles, 3) a two-course staggered brick wall — with the WRONG state
(differs by exactly one brick's colour) and the CAN'T TELL state (exactly one
brick partly out of frame) encoded in the data. Library rows reuse these three
visuals.

**Superseded:** the Automark below-the-hero re-skin (v3 tokens above), the v1.3
dark section treatments (dark bands, Anton ghost numbers, dark can/can't, dark
privacy band), and the Anton-below-hero budget. Anton now lives in the hero and
the footer wordmark only. The Automark body font (Urbanist) is replaced by
Inter.

## Tokens

Declared as CSS custom properties in `src/app/globals.css` (`:root` for colours,
spacing and motion; `@theme` emits the type scale, radii and colour utilities so
Tailwind can reference them).

### Colour

| Token          | Value     | Used for                                    |
| -------------- | --------- | ------------------------------------------- |
| `--bg`         | `#16161A` | page background                             |
| `--surface`    | `#1F1F23` | cards, panels, inputs                       |
| `--fg`         | `#FFFFFF` | primary text                                |
| `--muted`      | `#A1A1AA` | secondary text                              |
| `--accent`     | `#F59E0B` | primary actions, RIGHT verdict, highlights  |
| `--accent-strong` | `#D97706` | accent hover/active                      |
| `--wrong`      | `#E5484D` | WRONG verdict only                          |
| `--line`       | `#2E2E33` | borders, dividers, progress track           |

### Type scale

| Name    | Size    | Utility       |
| ------- | ------- | ------------- |
| display | 2.75rem | `text-display`|
| h1      | 2rem    | `text-h1`     |
| h2      | 1.5rem  | `text-h2`     |
| body    | 1rem    | `text-body`   |
| small   | 0.875rem| `text-small`  |
| caption | 0.75rem | `text-caption`|

### Spacing scale

`--space-1 … --space-16` (0.25rem → 4rem). Used through Tailwind spacing
utilities. **Token trap:** never use spacing-named `max-w-*` utilities
(`max-w-xs`, `max-w-sm` resolve to tiny values in a token theme). Use bracket
values (`max-w-[430px]`) or container sizes (`max-w-3xl`, `max-w-6xl`).

### Radii

`--radius-sm: 6px`, `--radius-md: 10px`, `--radius-lg: 14px`, `--radius-full`.

### Motion

`--motion-fast: 150ms`, `--motion-base: 250ms`, `--ease-out: cubic-bezier(0.16,1,0.3,1)`.
All transitions use these. Scroll reveal and processing indicators are disabled
under `prefers-reduced-motion`.

## Component inventory

All live in `src/components/`, each used by at least one real page.

| Component       | Notes                                                              |
| --------------- | ------------------------------------------------------------------ |
| `Button`        | primary/secondary/ghost/destructive; default & large; disabled + loading |
| `Input`         | text input with label, hint, and error visual states               |
| `StepCard`      | keyframe, step number, caption, visibleState line, optional action row |
| `LessonCard`    | title, step count, meta line                                        |
| `VerdictChip`   | RIGHT (amber) / WRONG (red) / CANT_TELL (muted); label, never colour alone |
| `ProgressSteps` | current-of-total as segments                                        |
| `ConfirmDialog` | Radix dialog: title, body, cancel, destructive confirm              |
| `Banner`        | inline saved / error banners (visual states)                        |
| `EmptyState`    | CSS-shaped visual area, line, action button                          |
| `SkeletonCard`  | loading placeholder                                                  |
| `KeyframeVisual`| pure-CSS div illustration of blocks on a dark mat from a data prop  |

Supporting layout components (not in the 1.2 inventory but used by layouts):
`Wordmark`, `PublicHeader`, `PublicFooter`, `MinimalChrome`, `ImportPanel`,
`ModeChoice`, `Reveal` (scroll motion), `StartLearningButton`,
`EndSessionButton`.

## Page inventory

Pages read fixture content from `src/design/fixtures.ts` (design-only content)
and copy from `src/lib/strings.ts`. Pages with state variants read `?state=` and
render that fixture state; this is a review mechanism only, no logic.

| Route (group)                          | Page                                          | State variants                              |
| -------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| `/` (public)                           | Landing                                       | `?state=empty` (your-lessons empty)         |
| `/create` (public)                     | Create — import                               | default · `invalid` · `failed` · `not-configured` |
| `/create/processing` (public)          | Create — processing                           | —                                           |
| `/create/review` (public)              | Create — review                               | — (error boundary only)                     |
| `/lessons` (public)                    | Library                                       | `?state=empty`                              |
| `/lesson/[id]` (public)                | Lesson overview                               | — (renders fixture lesson for any id)       |
| `/lesson/[id]/play` (minimal)          | Player                                        | step · `checking` · `right` · `wrong` · `canttell` |
| `/lesson/[id]/play/camera` (minimal)   | Camera (no camera access)                     | —                                           |
| `/lesson/[id]/live` (minimal)          | Live mode (no camera access)                  | on-track · `check` · `wrong`                |
| `/lesson/[id]/complete` (minimal)      | Completion (counts + time only, no grades)    | —                                           |
| `/privacy` (public)                    | Privacy                                       | —                                           |
| `/professional` (root)                 | Professional landing (hero-69 + mirrored sections, green accent) | —                                  |
| `/professional/create` (root)          | Professional create — import         | default · `invalid` · `failed` · `not-configured` |
| `/professional/create/processing` (root) | Professional create — processing   | —                                   |
| `/professional/create/review` (root)   | Professional create — review (breadboard sample) | —                    |
| `/professional/lessons` (root)         | Professional library — list + empty | `?state=empty`                       |
| `/professional/lesson/[id]` (root)     | Professional lesson overview (breadboard sample for any id) | —    |
| `/professional/lesson/[id]/play` (root)| Professional player                  | step · `checking` · `right` · `wrong` · `canttell` |
| `/professional/lesson/[id]/play/camera` (root) | Professional camera (no camera access) | —            |
| `/professional/lesson/[id]/live` (root)| Professional live                     | on-track · `check` · `wrong`          |
| `/professional/lesson/[id]/complete` (root) | Professional completion (counts + time only, no grades) | — |
| `/professional/privacy` (root)         | Professional privacy                   | —                                   |
| `/design` (public)                     | Design index / review page                    | —                                           |
| `not-found`, `error` (root)            | 404 and error boundaries                      | —                                           |

Player and camera/live/complete use the **minimal chrome** layout (small
wordmark, step progress, exit link). All other public pages use the shared
header/footer chrome.

## Two-face model — Hobby / Professional (face switch)

The product ships as TWO presentation faces switched like a language toggle:

- **Hobby** is the default face at the existing routes (`, /create, /lessons,
  /lesson/*, /privacy`).
- **Professional** is a new face living under **`/professional`** — its landing
  is the installed OriginKit **hero-69** (owner-picked `?preset=…variant-2`
  ember-husk hero; colours **as installed**: white paper, ink `#0d0d0d` mono
  chrome, green `#04E762` husk core; content slots branded to SHOW ONCE —
  wordmark + green ONCE, `ModeToggle` in the nav, pro* headline/CTA slots)
  above sections that mirror the Hobby landing
  (how it works → capabilities → scope → privacy → final CTA → footer) with the
  two 4.1 transformations: **accent green `#16A34A` / hover `#15803D`** in place
  of amber, and **Professional copy** (trades, trainees, workshops) under `pro*`
  keys. The footer mirrors the Hobby footer with ONCE in Professional green.
- **Route parity is COMPLETE (4.3):** the Professional face mirrors every Hobby
  route — create flow, lessons, lesson overview, play + camera, live, complete,
  privacy. No forward links remain on the Professional face; every navbar, hero
  and in-flow link resolves to a real route.
- **Per-screen mirror choices (live source vs canonical design, 4.3):** the live
  Hobby lessons/lesson/play/camera/live/complete routes render the divergent dark
  `learning/Workspace` (your teammates' functional build). Following the 4.2
  create-flow precedent, every Professional counterpart mirrors the **canonical
  design** recorded here (v3.1/v3.3): `/professional/lessons` (canonical v3.3
  library), `/professional/lesson/[id]` overview (canonical v3.1 learning path +
  mode choice), `/professional/lesson/[id]/play` (canonical v3.1 player, all five
  states), `/play/camera` (canonical v3.1 camera), `/live` (canonical v3.3 live,
  three states), `/complete` (canonical v3.3 completion), `/professional/privacy`
  (canonical v3.3 privacy). Content is `proBreadboardLesson`; the check pattern
  (verdict bands, dashed difference ring on `wireGreen`, scan) is functional and
  identical to Hobby; only chrome accents are green. The 4.2 `create` flow was
  likewise canonical-design. None of these used the live `Workspace` directly.
- **Shared, face-aware navbar (4.2):** `PublicNavbar` is ONE shared component;
  it reads the face from the pathname (any path starting `/professional` =
  Professional, like `ModeToggle`). On Professional its nav links point at the
  Professional routes (`/professional/create`, `/professional/lessons`,
  `/professional/privacy`), the ONCE wordmark is Professional green `#16A34A`,
  and the Start CTA is the green pill (`#16A34A` bg / white text / `#15803D`
  hover) to `/professional/create`. Hobby renders byte-identically (same glass,
  scroll morph, layout; amber Start pill). It is provided to Professional pages
  by `src/app/professional/layout.tsx` (mirroring the public segment's chrome;
  no footer is mounted there — the landing owns its footer, the create-flow
  screens are light tool screens). `ModeToggle`'s focus ring follows the face
  (amber Hobby / green Professional). The landing's duplicate top row (hero-69's
  internal wordmark+toggle header) was removed so the landing has exactly one
  header.
- **Professional create flow (4.2):** `/professional/create` + `processing` +
  `review` mirror the Hobby create flow's canonical structure (DESIGN v3.2) —
  import (link field + upload + privacy line, with the same state variants),
  processing (source card + stages + progress), review (title, reorderable rows
  of KeyframeVisual thumbs + reorder/remove with the ConfirmDialog, ink-pill
  "Start lesson" → `/professional/lesson/sample`, "Back" → `/professional/create`).
  Accent green in place of amber; trades copy under `pro*` keys; face-neutral
  mechanism labels (import errors, processing stages, review labels, the
  `privacyClaim` "checks photos, keeps nothing.") reuse the shared strings.
- **Professional sample (4.2):** `proBreadboardLesson` in `src/design/fixtures.ts`
  — a breadboard build (long board, two power rails, red/green/black jumper
  wires, a microcontroller block, small components) rendered in the existing
  KeyframeVisual language; its step-2 photo is the single wrong-variant (exactly
  one wire — the green jumper — in the wrong rail). Only Professional screens
  read this sample; every Hobby screen keeps its existing fixtures.
- The **`/design` index is SHARED** by both faces: it keeps the Hobby route group
  and adds a clearly labelled **Professional** group; later Professional routes
  join that group.
- The shared switch is **`ModeToggle`** (`src/components/ModeToggle.tsx`), built
  on the installed Lightswind **ToggleTheme** (`src/components/lightswind/
  toggle-theme.tsx`) and its **circle-spread** View Transition animation
  (duration 600) — its theme/dark-class toggling is stripped. The face is read
  from the pathname (any path starting `/professional` = Professional), not from
  a theme class. `showonce-mode` is persisted to `localStorage`.
- Engine and lesson data are fully shared between faces; the faces are
  **presentation only**.
- **Face sealing (4.4):** the faces are sealed so the ModeToggle is the only way
  between them. The **wordmark goes to that face's home** on every route within a
  face (Professional → `/professional`, Hobby → `/`), and every link that
  renders inside a face resolves inside that face's routes (/professional/* on
  Professional, the default routes on Hobby). The only sanctioned escapes from a
  face are the **ModeToggle** (the cross-face switch), the shared **`/design`**
  index, and the shared not-found/error pages (face-neutral territory).
- **Professional studio background (4.4, revised):** `ProfessionalBackground`
  (`src/components/professional/ProfessionalBackground.tsx`) is a light "green
  studio" backdrop mounted on exactly two pages — `/professional/create` and
  `/professional/lessons` (list and empty state). It layers a near-white
  cool-green ground gradient, two soft radial green glows (`#16A34A` at ~10–13%,
  `#15803D` lower-right), a faint dot grid, and a feather into the navbar seam —
  all `aria-hidden`/`pointer-events-none`, behind the content, spanning the full
  scrollable page. No Hobby page, and no other Professional page, carries it.
  (The Lightswind `InteractiveGridBackground` installed for 4.4 was removed per
  owner direction.)

## Copy & content rules (enforced by the scaffold)

- The privacy claim appears verbatim: **"checks photos, keeps nothing."**
- No on-device processing is ever claimed; checks run on the Meta Model API.
- No scores, percentages, grades, streaks or gamification anywhere.
- No testimonials, user counts, ratings, or invented statistics.
- No camera access (`getUserMedia`), no speech synthesis, no localStorage.
- No `window.confirm` / `window.alert`; confirmation uses the Radix dialog.
- All user-visible copy lives in `src/lib/strings.ts` (Arabic later = one file).

### v2.19 — the feel stack (Prompt 2.19; supersedes Prompts 2.16 and 2.18)

Below-the-hero "feel" layer in the manner of the Adorn reference. The navbar
(`PublicNavbar` + the installed `resizable-navbar`) is owner-approved and
**frozen** — nothing here touches it.

- **Lenis** (`src/components/SmoothScroll.tsx`, installed v1.3.27): `lerp 0.09`,
  `smoothWheel` on, smooth touch off (the installed API's toggle is
  `syncTouch`, kept false), `anchors` on, driven by ONE shared
  `requestAnimationFrame` loop (`autoRaf` false). Not created under
  `prefers-reduced-motion`; destroyed on unmount. Pathname changes start at
  the top via the instance; back/forward (`popstate`) is left to native scroll
  restoration. Lenis animates the real window scroll, so the navbar's scroll
  morph and the SkyGate's IntersectionObserver are untouched and keep working.
  The Task E fallback scroller is the only `data-lenis-prevent` element (no
  other overflow utilities exist).
- **Parallax depth** (`src/components/Parallax.tsx`): driven by the same shared
  loop (Task B architecture — exactly one loop). `data-parallax="<speed>"`
  (speed in −0.15…0.15) translates the element by
  `(elementCentreDistanceFromViewportCentre) × speed`, transform only, gated by
  an IntersectionObserver (120px overscan). Media containers clip
  (`overflow-hidden`) with the inner media scaled 1.15 (`.parallax-media`) so no
  edge or gap shows. Applied at: the landing gallery cards' inner KeyframeVisual
  (`speed 0.06`) and the lesson detail page's header visual (`speed 0.08`). The
  PROOF band has no background media, so it gets no parallax. Fully off under
  reduced motion; vertical transform only (no horizontal overflow).
- **Reveal choreography v2** (`src/components/Reveal.tsx`): `RevealGroup` shakes
  its Reveal children with opacity 0→1, `translateY(32px)→0`, `blur(6px)→0`,
  900ms at `cubic-bezier(0.22, 1, 0.36, 1)`, 90ms stagger per child (up to 5),
  firing once on entry. Hidden state is applied only by JS after mount; reduced
  motion shows everything fully visible; a 1.5s fallback forces visibility if
  the observer never fires. Plain `<Reveal>` keeps the legacy subtle entrance
  for the frozen hero only (never the blur). Applied to every below-hero landing
  section heading/content block (the gallery's pinned stage excluded) and the
  route header blocks of `/create`, `/lessons`, `/lesson/[id]`, `/complete`,
  `/privacy`. Never inside the hero or the play/live/camera flows.
- **Mixed-type headings (Task D)**: Instrument Serif italic 400 is loaded in
  `src/app/layout.tsx` as `--font-instrument-serif` and used only inside the
  `.font-serif-accent` span (italic, weight 400, letter-spacing normal,
  1.04em). The rule: outside the hero, every section/page heading renders its
  LAST word inside that span (`SerifAccent` helper in `Reveal.tsx`); strings and
  the heading's sans font/size/colour are unchanged; single-word headings and
  the footer wordmark are exempt. Wrapped: landing HOW IT WORKS (`works`),
  PROOF (`works.`), CAN (`teach`), CAN'T (`teach`), PRIVACY (`nothing.`), YOUR
  LESSONS (`lessons`, its heading), FINAL CTA (`right.`); `/create` (`new`),
  `/lessons` (`lessons`), `/lesson/[id]` (`tower`). `/complete` (`Done.`) and
  `/privacy` (`Privacy`) are single-word and exempt.
- **Horizontal lessons gallery (Task E)** (`src/components/HorizontalGallery.tsx`
  and `src/components/CursorBadge.tsx`): replaces the landing lessons section's
  content (its heading stays, wrapped). Desktop (fine pointer + viewport ≥ 1024px
  + no reduced motion): a tall wrapper `height = 100vh + travel` holds a sticky
  `100vh` stage (`overflow-hidden`) around a horizontal card track; the shared
  loop maps wrapper scroll progress (0 at top-to-viewport-top, 1 at
  bottom-leaves) to the track's `translateX` `0 → −(track width − viewport
  width)`, transform only. Cards: `width min(76vw, 920px)`, `height min(68vh,
  640px)`, 24px radius, clipped; body is the lesson's KeyframeVisual stage; a
  top-left glass chip (backdrop blur, white 14% bg, white text) names the
  lesson's skill family, and a bottom-left Inter Tight title (`font-display-ui`;
  the re-skin has landed) sits above a white/70 step-count meta; the whole card
  is the lesson link. The cursor badge (96px, ink, white text,
  `pointer-events-none`) follows the cursor with lerped smoothing in the shared
  loop, scaling in/out on card hover; it is fine-pointer-only (absent on touch)
  and absent under reduced motion; its label is `strings.startLessonShort`
  ("Start" — the lesson card's call-to-action string). Fallbacks (SSR/no-JS,
  touch, narrow viewport, reduced motion): a normal horizontally scrollable row
  (`overflow-x auto`, scroll-snap, `data-lenis-prevent`) with the same cards,
  no pinning, no transforms, no badge. `/lessons` keeps its list layout.

### v2.20 — landing re-order + capability gallery + check demo (Prompt 2.20)

Three owner orders applied to the landing page. Navbar and hero stay frozen; the
feel layer (Lenis / Parallax / Reveal) and the gallery's scroll mechanics are
untouched.

- **Section order (Task A):** the gallery section now renders DIRECTLY AFTER
  How It Works and before every other below-hero section (Proof/check, Can/Can't,
  Privacy, Final CTA). Reveal wrappers moved with their sections.
- **Bricks (Task B):** studs are now ~17% of the brick width (previously
  oversized); each brick gains a 1px flat top-edge bevel line in its fill
  lightened 10% (a flat line — no gradient or return of gloss). KeyframeVisual
  gains a `fit` mode (`fit`, `fitPadding` default 0.08): the whole scene scales
  to fit the stage with ~padding on all sides, aspect preserved and centred, so
  no brick is ever clipped whatever the stage's aspect (scale =
  `min(availW/contentW, availH/contentH)` from the bricks' scene bounds and the
  measured stage box). The stepped tower's scene recolours: base bone/steel/bone,
  middle sage/(gap)/steel, top steel/RED — RED is the single accent; the WRONG
  photo flips exactly that top-right accent brick red→steel (id `accent`),
  every other brick identical. Mosaic and wall fixtures unchanged.
- **Gallery = capability showcase (Task C):** heading changed (owner-ordered) to
  "What SHOW ONCE can check." (the serif-accent rule then accents "check."
  automatically). The section sits on the ink ground with two soft amber radial
  glows (to keep the landing radial-glow budget unchanged at exactly two, the
  final-CTA glow moved here — the gallery now carries both; the hero's radial
  glow had already retired at v2.12) behind the glass. Cards are glass (white 8% /
  backdrop blur / 16% border, 24px radius): a fixed 16/10 stage holds the lesson's
  KeyframeVisual IN FIT MODE (whole scene visible, never cropped; the dark mat
  fills the stage and the scene floats centred), and an info block underneath
  carries the family pill, title, ONE capability line, step-count meta and an ink
  arrow disc. A fourth text-only glass card ("And more it can check") sits in the
  same track. Fallback/mobile row uses the same cards without pinning.
- **Check demo, professional (Task D):** the "How a check works" panels are dark
  glass (white 6% / blur / 14% border) with a proper white-semibold header row;
  each stage keeps its dark mat and shows the scene at ~86% of stage width (fit
  mode, `fitPadding` 0.07). On the photo panel the differing brick (Task B's
  `accent`) is ringed with a 2px dashed amber ring offset 6px outside it (bricks
  carry fixture ids; the photo variant takes a `highlightId`). A full-width glass
  verdict strip under the pair holds the WRONG chip and the difference sentence
  (new string `checkDemoDifference`: "The top-right brick is blue. In the step,
  it is red.").
- **Strings added (verbatim):** `galleryLineTower` "Layer-by-layer block builds,
  checked from a single photo."; `galleryLineMosaic` "Bead and tile patterns,
  checked colour by colour."; `galleryLineWall` "Staggered brickwork, checked row
  by row."; `galleryMoreTitle` "And more it can check"; `galleryMoreLine` "Board
  setups. Packed kits. Geometry constructions. If a photo from above can judge
  it, SHOW ONCE can check it."; `checkDemoDifference` as above; and the gallery
  heading `lessonsSectionTitle` changed to "What SHOW ONCE can check.". No other
  string changed.

### v2.21 — gallery cards are the real Lightswind LiquidGlassCard (Prompt 2.21)

The gallery's four capability cards (the three lesson cards + "And more it can
check") now use the **Lightswind LiquidGlassCard** component
(`src/components/lightswind/liquid-glass-card.tsx`, installed from the Lightswind
registry, used as shipped — its internals are never edited). It replaces the
hand-rolled CSS glass from v2.20 Task C; the project's `.glass-surface` utility is
no longer applied to gallery cards (only the component's true liquid glass renders
over the ink ground + two amber glows). `variant="glass"`, `glow` enabled,
`hoverEffect` enabled, on all four cards; the horizontal gallery mechanics, card
widths, gaps, pinned scroll and fallback row are unchanged.

**Structure mapping (per lesson card):** `LiquidGlassCardHeader` (skill-family
`family-pill` chip + `LiquidGlassCardTitle` with the lesson title),
`LiquidGlassCardDescription` (the card's one verbatim capability line),
`LiquidGlassCardContent` (the KeyframeVisual stage **in fit mode**, fixed 16/10,
whole scene visible, never cropped), `LiquidGlassCardFooter` (step-count meta +
the ink arrow disc). The fourth text-only card uses `Header` (its title) +
`Content` (its verbatim line as body text), no stage, visually centred. Each card
remains the lesson's real link (an accessible `<Link>` — with visible keyboard
focus — wraps the card) and keeps its destination. Text inside the cards uses the
project's tokens via `className` (display/body fonts); the component ships its own
neutral text colours that read fine over the dark backdrop — no blocker. The
component needs no extra dependency beyond `framer-motion` + `cn` (already in the
project); the installer was told not to add `class-variance-authority` /
`lucide-react` / `lightswind`, and it did not.

### v2.23 — capability section light re-skin + 3D scroll-trigger row (Prompt 2.23)

Three owner orders. Navbar and hero stay frozen; the liquid-glass-card,
KeyframeVisual, fixtures and strings (apart from the one eyebrow) are untouched.

- **Check demo removed (Task A):** the "How a check works" section (the dark
  glass step/photo pair, its verdict strip and section wrapper) is removed from
  the landing entirely, reveal/parallax wrappers included. The strings and
  fixtures it used remain in their files (they serve the play/lesson screens);
  nothing was deleted from strings.ts or fixtures.ts.
- **Capability row = 3D Scroll Trigger (Task B):** the four LiquidGlassCard
  capability cards (three lesson cards + "And more it can check", unchanged in
  structure/copy/fitted 16/10 stages/links) now ride in Lightswind's
  **ThreeDScrollTriggerContainer → ThreeDScrollTriggerRow** (`baseVelocity 4`,
  `direction -1` — a slow leftward drift). The component repeats its children
  itself for the infinite velocity-based marquee (no hand-duplicated loop).
  Card width is now `min(78vw, 560px)`; the row gap is 24px from the card
  markup (`mr-6`; the component adds none). Vertical headroom for the 3D tilt
  comes from the container's vertical padding. The pinned HorizontalGallery
  mechanics (tall wrapper, sticky stage, progress translateX) and the cursor
  badge are RETIRED from this section. Reduced motion: the installed component
  has no reduced-motion path, so under `prefers-reduced-motion` the same four
  cards render in a static horizontally scrollable row (`overflow-x auto`,
  `data-lenis-prevent`) with no auto-scroll.
- **Light ground + header repair (Task C):** the section ground is
  `--color-site-page` (`#F7F7F8`); the ink ground and dark glows are gone. Two
  soft colour washes (`#F59E0B` amber at 22%, `#FFB86B` peach at 18%, ~90px blur)
  sit behind the row, clipped to the section. Eyebrow is the new
  `eyebrowCapabilities` string ("Capabilities" → uppercase CAPABILITIES,
  accent-deep). The heading "What SHOW ONCE can check." is composed on two
  deliberate lines ("What SHOW ONCE" / "can check.") via a bracket `max-w` on
  the heading; the serif-accent span covers the final two words ("can check.")
  — composed inline in the section (the wrapping helper in Reveal.tsx, which
  only does the last word, is read-only in this prompt). The "See all" link is a
  proper ink pill (`#16161A`, white, nowrap, 20px/10px padding, shrink-0,
  vertically centred against the heading; below the small breakpoint it sits
  under the heading).

### v2.24 — capability cards are text-only ink glass; gap + how-it-works fix (Prompt 2.24)

Four defects from the owner's recording. Navbar/hero, the 3D Scroll Trigger row
props, the header composition, and the light ground/washes all stay.

- **Card text ink (Task A):** inside the four capability cards only, the title
  renders in ink `#16161A` and the capability line in muted ink `#52525B`,
  applied via the `!text-[…]` utilities passed to the LiquidGlassCard Title /
  Description subcomponents (the installed component is not edited; important
  utilities beat its `dark:text-white`/`dark:text-slate-300` defaults). No other
  text on the landing changes colour.
- **Blank gap (Task B):** the excess height came from the marquee container's tall
  vertical padding (`py-10` on `ThreeDScrollTriggerContainer`,
  `src/components/HorizontalGallery.tsx`) stacking with the section's `py-20` and
  the row's `mt-14`. The padding was reduced to a small `py-2` tilt allowance, so
  the capability section's rhythm matches the other sections (heading→content
  `mt-14` only). No leftover pinned-gallery height remains (no `100vh`/tall
  wrapper/`gallery-stage`).
- **Text-only cards (Task C):** the KeyframeVisual stage, the skill-family chip
  and the step-count meta are REMOVED from all four cards. Each card is a
  LiquidGlassCard (`variant="glass"`, glow, hoverEffect) containing a capability
  title (`LiquidGlassCardTitle`) and one capability line
  (`LiquidGlassCardDescription`), with 28px internal padding (`p-7`) and the line
  at 17px. The cards no longer read fixtures — they are static strings: the three
  new titles `galleryTitleTower` "Block builds", `galleryTitleMosaic` "Bead & tile
  patterns", `galleryTitleWall` "Brickwork" (the lines reuse the existing
  `galleryLineTower`/`galleryLineMosaic`/`galleryLineWall` keys; the fourth card
  keeps `galleryMoreTitle`/`galleryMoreLine`). Card width `min(80vw, 480px)`;
  every card `h-full` so the row stretches the four to one even height; each child
  keeps 12px horizontal padding (`px-3`). Cards stay links to their destinations.
- **How-it-works duplication (Task D):** diagnosed from source — the section is
  mounted once in `src/app/(public)/page.tsx`, its rows come from a single
  `howItWorks.map(...)`, and the `RevealGroup` only re-clones children (it never
  duplicates). None of the three suspected causes (double mount, duplicating
  wrapper, duplicated row markup) exists. Per the task, no structural change was
  made; a verification test asserts the how-it-works heading and each step title
  appear exactly once in the landing markup.

### v2.25 — taller cards, one standard gap, no marquee ghosting (Prompt 2.25)

Three bounded adjustments to the capabilities section. Navbar/hero, the marquee
props, the header, the ground/washes and all other copy stay.

- **Taller cards (Task A):** all four capability cards are a fixed height of
  320px on md+ (`md:h-[320px]`, `min-h-[260px]` below), so the row stretches them
  to one even height. Inside: title at the top with 32px padding (`p-8`), the
  capability line directly under it; the remaining lower space is empty glass.
- **The gap (Task B):** the capabilities section sits directly below How-it-works
  with NO inter-section padding — How's bottom is `pb-0` and Capabilities' top is
  `pt-0`, so the CAPABILITIES eyebrow begins essentially right under How's last
  row (only the row's own `py-8` remains as a small breathing gap). The old
  `py-20 md:py-28` stack (160/224px blank) is gone. (Other adjacent pairs keep
  their `py-20 md:py-28` rhythm.) No empty section-level shell exists between the
  two sections, and no min-height/vh sizing remains on the section or its
  wrappers. The header→row gap is **40px** (`mt-10`) and the marquee container's
  vertical padding is only the ~24px the row's 3D tilt needs (`py-3`).
- **Marquee ghosting (Task C):** the installed ThreeDScrollTrigger repeats its
  children by rendering them FOUR times as sibling inline-flex sets in one track
  (1 reference + 3 aria-hidden clones) and translating the track via
  `translate3d` + modulo-wrap — the copies are coplanar siblings, not stacked
  behind. Because the glass cards are translucent, content behind a card could
  read through its face, so each card gets an OPAQUE `#FFFFFF` backing (absolute,
  same 24px radius) behind the glass; the front glare/refraction/glow survive.
  Each marquee child wrapper's horizontal padding is now 16px (`px-4`); nothing
  in the installed component was edited.

### v2.26 — unified light zone ground + one shared container (Prompt 2.26)

The landing light zone uses ONE continuous soft ground and ONE shared content
container across sections — no per-section background slabs, aligned left
edges — applied to How-it-works + Capabilities.

- **One ground (Task A):** the How-it-works section drops its pure-white
  ground (`bg-white`) and now sits on the same soft light surface
  `--color-site-page` (`#F7F7F8`) as the Capabilities section and every other
  light-zone section. No background edge, band or notch remains at the junction;
  the surface runs continuously from How-it-works' first row to the end of the
  Capabilities section. The colour washes behind the capability row and the
  how-it-works rows' internal hairline dividers are unchanged.
- **One container (Task B):** both sections' content reference the same content
  container as the rows — `max-w-4xl mx-auto` (with the shared enclosing
  container's `px-4` side padding). The Capabilities header was the outlier at
  `max-w-3xl px-4` and now uses `mx-auto max-w-4xl`, so the how-it-works rows'
  left edge, the Capabilities eyebrow's left edge, the See-all pill's right edge
  and the rows' right edge all align.
- **Seam spacing (Task C):** the standard adjacent-section gap (`py-20 md:py-28`
  per section = 160px mobile / 224px md from How's last row to the CAPABILITIES
  eyebrow) is restored; both sections carry `py-20 md:py-28`. No border or divider
  is drawn at the junction itself.

### v2.27 — single-owner How-it-works -> Capabilities gap (Prompt 2.27)

Two sections share one ground and one container (v2.26, frozen). This prompt pins
the exact vertical distance from How-it-works' step-3 row bottom hairline to the
CAPABILITIES eyebrow as a single-owner gap carried entirely by Capabilities' top
padding:

- **How-it-works' section padding-bottom is 0** (`pt-20 pb-0 md:pt-28 md:pb-0`);
  the step rows keep their own internal padding and hairlines exactly as before.
- **Capabilities' padding-top carries the whole gap**: 56px default
  (`pt-14`) and 72px at desktop widths >= 1024px (`lg:pt-[72px]`); its bottom
  padding stays `pb-20 md:pb-28`. The header block's own top margin is 0 (the
  eyebrow is the first child of the `max-w-4xl` container; the `mt-4` sits on the
  heading row below the eyebrow, so it does not add to the seam).
- Totals from the seam: **0 + 56 + 0 = 56px** below 1024px; **0 + 72 + 0 = 72px**
  at >= 1024px. Nothing else on the page changes.

### v2.28 — capability cards wrap + fuller copy + bottom examples line (Prompt 2.28)

Three bounded changes to the four capability cards in the capabilities section.
Navbar/hero, the marquee props/mechanics, the header, grounds, containers and all
other copy stay.

- **Text wraps (Task A):** the descriptions clipped on one line because the
  installed `ThreeDScrollTriggerRow` sets `whitespace-nowrap` on its row
  container, which inherits into every card's text while the card's
  `overflow-hidden` then cuts the overflow. Fix is at our level only: the
  in-card text elements (title, description, examples) carry `whitespace-normal`,
  so text wraps inside the card padding at every width and never clips. The
  marquee's own `whitespace-nowrap`/motion/repetition are untouched.
- **Two-sentence descriptions (Task B):** the four capability-line string values
  are replaced with fuller two-sentence descriptions (keys unchanged) and four
  new examples strings are added under the gallery keys
  (`galleryExamplesTower` / `galleryExamplesMosaic` / `galleryExamplesWall` /
  `galleryExamplesMore`). Each card renders title at top, the 17px wrapping
  description under it, and a 13px muted, letterspaced examples line anchored to
  the card bottom via `mt-auto` inside the card's column layout. Card height
  (320px), width, padding, colours and link behaviour are unchanged.

### v2.30 — two-audience scope cards + both-audience capability lines (Prompt 2.30)

The landing tells the product's story for two audiences (hobby and professional).

- **Audience cards (Task A):** the SCOPE section gains two audience cards —
  "Hobby" and "Professional" — via the adapted `seasonal-hover-cards` component
  (`src/components/lightswind/seasonal-hover-cards.tsx`). The adaptation kept the
  expanding-hover row mechanics (flex row, resting `md:w-1/3` -> `hover:w-2/3`,
  `duration-500`) while replacing the image-driven interior with text-only cards
  in the project's tokens (white surface, ink title, muted line, amber item
  markers matching the scope panels' list style). The file never contained
  seasonal content — the "seasonal" name is marketing only. `SeasonCardProps` is
  now `{ title, line, items, className }`. The pair renders once, after the
  can/can't panels and before the closing line, in the section's shared
  container; on touch/mobile the row wraps (`flex-wrap`, each card `w-full`), so
  the cards stack full-width.
- **Installer cleanup (Task A):** the two orphaned hook files the installer
  dropped (`src/hooks/use-mobile.tsx`, `src/hooks/use-toast.tsx`, imported
  nowhere) were removed.
- **Capability lines (Task B):** the four capability-card description lines now
  speak to both audiences (mentions of hobby use at home and professional /
  training work). Card titles, examples lines, sizes and wrapping are unchanged.

### v2.31 — scope three-card hover row + single-owner gap (Prompt 2.31)

The SCOPE section is restructured and the gap above it is pinned.

- **Three hover cards (Task B):** the scope section's content is now ONE row of
  three expanding hover cards — "It can teach" / "Hobby" / "Professional" — built
  from the adapted `seasonal-hover-cards` component
  (`src/components/lightswind/seasonal-hover-cards.tsx`). The component keeps its
  row container/export/location and transition timing (`duration-500`) and is
  retuned for three cards: resting = three equal shares (flex-grow `md:flex-1`),
  the hovered card expands to ~50% of the row width (`hover:md:flex-[2]`) while
  the other two narrow, and on touch/mobile (`flex-wrap`, `w-full`) the cards
  stack full-width. The interior is text-only in the project's tokens (white
  surface, ink title with the last-word serif-italic accent the scope headings
  use, muted-ink line, amber item markers). The two static can/can't panels are
  REMOVED from the markup (their strings stay in strings.ts — nothing deleted).
  Card 1 reuses the existing can-teach keys (title + six items) + a new line
  (`audienceCanLine`); cards 2–3 are Hobby / Professional. The row renders once,
  in order: eyebrow/heading, hover row, closing line; the three cards share one
  height via the row's stretch.
- **Capability lines (Task C):** the four capability-card description lines
  mention both hobby and professional use (verified equal to the v2.30 wording —
  no further edit required).
- **The gap (Task A):** the capabilities → scope distance is single-owner:
  Capabilities' bottom padding is **0** (`pb-0 md:pb-0`; up to ~24px clearance
  lives inside the marquee container's own `py-3`), and the Scope section's top
  padding carries the whole gap — **56px** (`pt-14`) below 1024px and **72px**
  (`lg:pt-[72px]`) at `>= 1024px`. Scope's header block top margin is 0.
  Totals: 0 + 56 + 0 = 56px; 0 + 72 + 0 = 72px.
- **Cleanup (Task D):** the orphaned `src/hooks/use-mobile.tsx` and
  `src/hooks/use-toast.tsx` from the installer were confirmed already removed
  and imported nowhere.

### v3.1 — play-flow design system (Prompt 3.1)

The play flow (lesson overview, player + its four states, camera) is re-dressed
in the landing's locked design language. No route, state variant, logic, string
or fixture changed. (Live and completion screens remain as previously scoped —
not part of this pass.)

- **Grounds/surfaces:** light soft ground `--color-site-page` (#F7F7F8), white
  24px-radius cards with hairline `--color-site-border` borders, ink text
  (#16161A), muted-ink secondary, Inter Tight display + Inter body, serif-italic
  accent on the last word of page headings (existing helper; NOT applied inside
  the player — state headings only). Functional verdict colours are used only
  for verdicts: success #00C758, danger #E5484D, can't-tell amber
  (accent-deep #D97706). Photo/camera stages stay near-black (#101013) with the
  KeyframeVisual in FIT mode (whole scene visible, never cropped).
- **Lesson overview = learning path (`/lesson/[id]`):** header with back link to
  `/lessons`, the lesson title (serif last word), muted source meta, and a
  progress line (steps done / total). THE PATH is a vertical connecting line with
  one node per step: DONE = ink-filled node + white check, CURRENT = amber ring
  with ink centre, UPCOMING = hollow node with muted border; the segment is ink
  up to the current node and hairline beyond; the current step's row sits lifted
  on a white card. Desktop (>=1024px) widens to a two-area layout (lesson summary
  left, path right) inside the shared container; mobile-first single column
  `max-w-[430px]`. MODE CHOICE: primary ink pill "Step by step" (-> play) and
  secondary outline pill "Live" (-> live), each with its muted description line.
- **Player anatomy (`/lesson/[id]/play`):** compact header (back to the lesson,
  a step-caption meta, and a slim progress bar — amber fill on a hairline
  track), then a white step card holding the step title, instruction line and the
  KeyframeVisual in FIT mode at a 4/3 aspect. Base actions: full-width ink pill
  "Take a photo" (-> camera), a quiet "Use a photo instead" action, and the muted
  privacy claim. No reveals, parallax, or marquee motion inside the player.
- **Checking:** the photo variant (white viewfinder brackets) stage with a slow
  horizontal amber sweeping line (CSS only, `play-checking-scan`, disabled under
  prefers-reduced-motion); state line in muted ink; actions render disabled
  (no active links).
- **Verdict bands (each keeps the player header/stage; state region swapped):**
  - RIGHT — success band (`#00C758` at 12% tint), success "Right" + check glyph,
    muted line, full-width ink pill "Next step".
  - WRONG — danger band (`#E5484D` at 10% tint), danger "Wrong" + cross glyph,
    the fixture difference sentence in ink, and the photo stage rings the
    differing brick (the landing demo's dashed-amber `highlightId` mechanism on
    the photo variant); actions: ink pill "Retake photo" + ghost "Mine is right".
  - CAN'T TELL — amber band (`#F59E0B` at 12% tint), amber-deep "Can't tell",
    its explanatory line, and the same two actions as WRONG.
- **Camera (`/lesson/[id]/play/camera`):** functional dark screen — near-black
  ground, a centred viewfinder at the step's aspect (white corner brackets via
  the photo variant, hairline white-at-20% border), a top dark-glass step chip,
  and a bottom circular white-ring capture control (ink centre) with a quiet
  back text action; no light surfaces and no animation on this screen.

### v3.2 — create-flow design system (Prompt 3.2)

The create flow (/create + its three variants, /create/processing, /create/review)
is re-dressed in the app design language. No route, variant, logic, string or
fixture changed. Mobile-first `max-w-[430px]` column, centred (kept narrow on
desktop — these are tool screens).

- **Entry (`/create`):** heading with the serif accent + one muted line
  (`createScopeNote`). The LINK FIELD is the hero: a white 20px-radius hairline
  surface holding the URL input (placeholder `importLinkPlaceholder`) with a
  muted supported-sources line (`importFieldLabel`) beneath. Full-width ink pill
  primary (`createGetSteps`). A hairline divider, then the dashed-border UPLOAD
  surface (`border-dashed border-site-border-2`) with its muted "or upload a
  video file" line (`uploadPrompt`) + label (`uploadButton`), centred. Privacy
  line (`privacyClaim`) under the actions.
  - Variants (state region swapped): INVALID — the field's border becomes danger
    and a danger error line (`importErrorInvalid`) appears under the field; the
    primary action remains. FAILED — danger-tint band (`#E5484D` at 10%) at the
    top with `importErrorFailed` + a quiet retry action. NOT-CONFIGURED — amber
    band (`#F59E0B` at 12%) with `importErrorNotConfigured`, informational, no
    danger anywhere.
- **Processing (`/create/processing`):** source summary card (white surface) with
  a muted mono source meta line and soft `#ECECEF` skeleton bars (`.create-skeleton`,
  subtle pulse, disabled under prefers-reduced-motion) for the emerging title.
  THE STAGES reuses the play flow's path language — a vertical connecting line,
  one node per stage (labels `procStageFetch`/`procStageSample`/`procStageDerive`):
  DONE = ink node + check, CURRENT = amber ring + lifted white row, PENDING =
  hollow muted node; segment ink up to the current stage, hairline beyond. A slim
  progress bar (amber on a hairline track) under the list is the signal (no
  spinners). One quiet leave action (`backToImport`) plus the scaffolded review
  link (`seeReviewScreen`).
- **Review (`/create/review`):** the derived lesson title as the page heading
  (serif accent) with a muted meta line (`sampleLesson.meta`); the existing
  title-edit affordance styled as a quiet underline field. REVIEW ROWS on white
  20px-radius hairline surfaces, separated by 12px gaps (a list, not a table):
  a ~72px KeyframeVisual thumb (FIT, 4/3), the step number + caption, the muted
  instruction line (the fixture caption), and the scaffold's row affordances
  (reorder up/down + remove, styled muted, wired to reorder/delete with the
  existing ConfirmDialog). No add-step affordance exists in the scaffold, so none
  is added. FOOTER: primary full-width ink pill "Start lesson" (`startLesson` →
  /lesson/sample) + quiet "Back" (`backToImport` → /create); sticky at the
  column's bottom on mobile, static on desktop.

### v3.3 — library, live, completion, privacy & error screens (Prompt 3.3)

The final inventory set is re-dressed in the app design language. No route,
variant, logic, string or fixture changed.

- **Library (`/lessons`, + empty):** public container on the light ground; page
  heading (serif accent) + a primary ink pill to /create (`newLesson`). LESSON
  ROWS on white 20px-radius hairline surfaces, 12px apart: an ~88px KeyframeVisual
  thumb (FIT, 4/3), Inter Tight title, muted meta (step count + source), and a
  progress state derived from the fixture lessons' step statuses — the data
  carries **in-progress** (tower, 3/4 with the slim amber-on-hairline progress
  bar) and **completed** (mosaic, wall — success check + "Done"). Each row links
  to its own lesson route. The EMPTY variant is a centred muted dashed surface
  (no imagery) with `lessonsEmptyLine` and an ink pill to /create.
- **Live (`/lesson/[id]/live`, on-track/check/wrong):** functional dark screen —
  near-black ground, a video/stage area filling the column at the **scaffold's 3/4
  portrait aspect** (like the camera; `variant="photo"`, dim, FIT), a compact top
  bar (back, step meta, amber-dot LIVE chip `liveChip`), and light text (white,
  white/60) under the stage. Status variants swap the region below the stage:
  ON-TRACK — success-tinted band (`#00C758` 12%) with `liveOnTrackLine` (calm);
  CHECK — amber band (`#F59E0B` 12%), `liveCheckLine` + `liveTooBlurry`, a pulsing
  amber dot (`animate-progress`, reduced-motion safe); WRONG — danger band
  (`#E5484D` 10%), "Wrong" + `liveWrongLine` + the difference sentence
  (`verdictWrongLine`) + a quiet continue/override (`mineIsRight` — live never
  hard-blocks). Primary live action stays `EndSessionButton`.
- **Completion (`/lesson/[id]/complete`) + header fix:** NO element on the
  complete screen presents a partial/in-progress step count. The stale counter
  lived in the shared `MinimalChrome` (hard-wired `ProgressSteps current={2}` +
  an Exit link); that component is now route-aware (client `usePathname`) — on
  `/complete` it shows **fully-complete** progress (`current = total = 4`, the
  same completed total the summary card uses) and hides the mid-lesson Exit
  (leaving is the bottom action's job). Elsewhere (play/camera/live) it is
  unchanged. The screen: app column on the light ground, an amber completion
  medallion (ring + soft amber tint + amber check) above "Done." and the lesson
  title, a white summary card (total time, steps completed, the needed-more-than-
  one-check recap), and an ink pill back to /lessons (`backToYourLessons`) +
  secondary to /create (`learnAnother`).
- **Privacy (`/privacy`):** public container on the existing light ground
  (`--color-site-page`, the body ground — the landing's amber privacy *section*
  is a separate block, so the route uses the light ground), heading (`Privacy`,
  serif accent), and the checks-photos-keeps-nothing claim given poster emphasis
  as a **soft amber tint band** (`#F59E0B` 12%), followed by the existing headed
  sections separated by hairline dividers. No copy/section changes.
- **Not-found / error:** both use the app column on the light ground with a large
  muted display glyph ("404" / "!"), the existing heading and line, and one ink
  pill — back home to `/` (`backHome`) for not-found, and the existing retry
  (`errorRetry`) for the error boundary (its job is to retry; providing a home
  link would change behaviour).

With this pass, the design system now covers every route in the page inventory.