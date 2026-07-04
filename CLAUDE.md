# CLAUDE.md — My Sweetheart

Project-specific knowledge for working in this repo. Also written as a
general skills reference — most of this applies to any Theatre.js /
Three.js / Vite project, not just this one.

## What this project is

A single-page, one-button lyric video for a public-domain 1910 song.
Everything is real: real word-level audio timestamps (faster-whisper), a
real Theatre.js keyframe sequence for all motion, real (procedurally
authored) Three.js glass geometry. See `README.md` for the architecture and
`ATTRIBUTION.md` for every asset's source. Read `src/lyrics-data.mjs` first
— it's the single source of truth that both the runtime page and the
Theatre-state build script import from.

## Theatre.js — advanced patterns learned this session

- **There is no public API for authoring sequenced (tweened) keyframes from
  code** as of `@theatre/core`/`@theatre/studio` 0.7.x —
  `studio.transaction().set()` only writes *static* overrides unless a prop
  has already been flagged "sequenced" via Studio's own right-click UI (see
  [theatre-js/theatre#411](https://github.com/theatre-js/theatre/issues/411),
  still open). If you need to generate a sequence programmatically (e.g.
  from real timing data instead of hand-drawn keyframes), **write the
  on-disk project-state JSON directly** — Theatre.js documents this shape
  as `__UNSTABLE_Project_OnDiskState` and its own source comments say it
  "could also be useful for users who manually edit the project state."
  `tools/build-theatre-state.mjs` in this repo is a complete working
  example: `BasicKeyframedTrack` with bezier keyframes, `trackIdByPropPath`
  keyed by `JSON.stringify([propName])`, one `sheet.object()` call per
  logical thing you want to animate. `@theatre/core` loads and interpolates
  a hand-built state file exactly like a Studio-authored one.
- **One RAF loop for everything.** Theatre.js's own advanced docs are
  explicit: when Theatre.js runs alongside other animation systems (Three.js
  render loop, GSAP, Lenis), put them all in a single `requestAnimationFrame`
  callback so they can't drift or double-schedule. This project sets
  `sheet.sequence.position = audio.currentTime` and calls the Three.js
  `renderer.render()` in the same `frame()` callback in `src/main.js` — do
  not give Three.js its own independent RAF loop.
- **Scrubbing vs. discrete state**: don't force everything through Theatre.
  Continuously-tweened values (position, opacity, camera, hue) belong in
  Theatre tracks. A value that's fundamentally a discrete state change at a
  known timestamp (this word is "sung" now, this word has "entered" now) is
  cheaper and just as accurate as a plain per-frame `t >= word.start`
  comparison toggling a CSS class — don't build hundreds of tiny Theatre
  objects for that; it's more code for no visual benefit. This project
  keeps ~40 Theatre objects (lines, camera, mood, hero objects, curated
  accents) and handles ~130 words' entrance/highlight with one small
  per-frame loop instead.
- **Variable fonts are a legitimate Theatre.js track.** A `weight` prop
  animated 560→720→560 and applied via
  `el.style.fontVariationSettings = "'wght' " + v.weight` gives you a real
  "breathing" emphasis effect for free if your font (Fraunces here) is a
  variable font. Cheap, and reads as far more considered than a bigger
  font-size.

## Three.js — what actually mattered for a "flawless" mobile-friendly scene

- **Free 3D model catalogs are a trap for anything stylized.** Poly Pizza,
  Quaternius, and Kenney (all CC0) were investigated for a heart/flower/
  ribbon model. Poly Pizza/Quaternius's actual download links only resolve
  from their JS-rendered SPA, not a plain HTTP fetch — not reliably
  scriptable. Kenney's zips **are** plain direct-download static files (no
  auth, confirmed working with a bare `curl`), but the content is uniformly
  flat-shaded low-poly game props, which will fight a painterly/glass
  aesthetic. **Lesson: for anything with a specific, considered visual
  target, authoring the geometry procedurally (`THREE.Shape` +
  `ExtrudeGeometry`, including `extrudePath` along a curve for
  ribbon/banner shapes) is often faster and more reliable than sourcing,
  and is fully license-free.** See `src/scene/heroObjects.js`.
- **`MeshPhysicalMaterial` transmission + a `RoomEnvironment` PMREM map**
  (`three/addons/environments/RoomEnvironment.js`, generated once via
  `THREE.PMREMGenerator`) gives a convincing glass look with zero external
  HDRI download. But **tune `envMapIntensity`/`clearcoat`/`roughness`
  down** (this project shipped `envMapIntensity: 1.35, clearcoat: 1,
  roughness: 0.12` first and it blew out to a solid white highlight that
  made pale text sitting in front of it unreadable — dropped to
  `envMapIntensity: 0.8, clearcoat: 0.55, roughness: 0.22`). Glass objects
  sharing the screen with text need to be dimmer than they look "correct"
  in isolation.
- **A hero/decorative 3D object's on-screen size is about the *frustum*,
  not the geometry.** A geometry that looks reasonably sized on a 1400px
  desktop viewport can be either enormous (portrait phone: narrower
  horizontal frustum at the same world-space size reads bigger relative to
  the screen) or **entirely invisible** (if positioned via a fixed
  world-unit x-offset that's outside the frustum on a narrow aspect ratio).
  Fix: store position as a **fraction of the camera's live visible
  half-width** (`Math.tan(fov/2 * Math.PI/180) * distance * aspect`,
  recomputed every frame from the live `camera.aspect`/`fov`/`z`), not a
  raw world-space number. See the `hero-${type}` handling in `src/main.js`
  and the comment in `tools/build-theatre-state.mjs`.
- **Mobile perf checklist actually applied here**: cap
  `devicePixelRatio` (≤1.6 mobile / ≤2 desktop), disable `antialias` on
  small screens, halve the particle count via `matchMedia('(max-width:
  640px)')`, skip continuous rotation/drift updates entirely under
  `prefers-reduced-motion`, keep draw calls low (3 hero objects + 1 Points
  system, nothing per-word in WebGL).
- Canvas-generated soft circular sprite textures (`CanvasRenderingContext2D`
  radial gradient) are a fine, license-free way to get bokeh-style
  particles — no asset download needed at all.

## Vite gotcha that will silently break a production build

**Only files reachable via static analysis (import statements, or literal
`src`/`href` attributes in HTML) get copied into `dist/` by `vite build`.**
Anything referenced only through a runtime-constructed string (this
project's `` `assets/png/${name}` `` in `assetPath()`, or a bare `fetch()`
call to a JSON file) is invisible to the bundler and will work fine in `vite
dev` (which serves the whole project root as a static fallback) but then
silently 404 in `vite build` + `vite preview`/production. **Fix: put
anything referenced by a dynamic/runtime path in the `public/` directory**
(Vite's default `publicDir`) — it's copied to `dist/` root verbatim,
unprocessed, and referenced by the same root-absolute path in dev and prod.
This repo's `public/assets/` (png + `theatre-state.json`) and `public/audio/`
exist for exactly this reason — don't move them back under a
bundler-processed `src/`-adjacent `assets/` without re-checking this.

Also: if a `tools/*.html` file (or anything else with placeholder-syntax
JS like `/* __STATE_INLINE__ */`) sits anywhere under the project root,
Vite's dependency scanner will try to parse it as a real entry and fail the
whole dev server with a cryptic `PARSE_ERROR`. Fix: set
`optimizeDeps.entries: ['index.html']` in `vite.config.js` to scope the
scan.

## Environment-specific tooling notes (this sandbox)

- Chromium is pre-installed but Playwright's default `chromium.launch()`
  looks for a different bundled revision and fails with "Executable doesn't
  exist." Always launch with
  `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`.
- Long-running dev servers (`npm run dev`, `vite preview`) **must** be
  started via the Bash tool's `run_in_background: true` param, not a
  manually-backgrounded (`&`/`disown`/`nohup`) shell command — background
  shell jobs get torn down with the parent command in this sandbox even
  when disowned.
- This sandbox's outbound network (via the configured proxy) does not
  appear reachable from a Playwright-launched browser process specifically
  (works fine from `curl`/`WebFetch`/the main shell). Expect
  `ERR_CONNECTION_RESET` on `fonts.googleapis.com` (or any other live
  external host) in Playwright-driven smoke tests — that's a sandbox
  limitation, not a real bug, as long as every same-origin app asset
  responds 200/206.
- `WebFetch` on a client-rendered SPA (Poly Pizza, most model marketplaces)
  returns the markdown-ified static HTML shell, not what a real browser
  would show after JS runs — it will not surface download URLs that a
  React/Vue app fetches client-side. Don't conclude a resource "has no
  download link" from `WebFetch` alone; try a direct `curl` if the site
  might be a plain static host (Kenney is; Poly Pizza is not).

## Self-critique checklist for this kind of "typography + decorative motion"
page (apply after every visual change, not just once)

1. **Screenshot at several real timestamps** (not just t=0) via
   `tools/smoke-test-page.mjs` (`SMOKE_URL=... [SMOKE_MOBILE=1] node
   tools/smoke-test-page.mjs`) — most clutter/contrast bugs in this project
   only showed up once a hero window or specific line was active, never at
   the idle first frame.
2. **Any bright/light-colored 3D or image element sharing the screen with
   pale text**: check contrast at the exact overlap point, not just "does
   the object look good alone." A specular highlight or a light PNG behind
   near-white text is invisible contrast failure, not a subtle one.
3. **Decorative object position**: is it defined in a way that's actually
   responsive to aspect ratio (fraction of frustum/viewport), or a magic
   constant that only happens to work at the one viewport you tested?
4. **Mixed asset styles**: if imagery comes from more than one source
   (or even one flat-icon source next to painterly/3D elements), apply one
   shared color-grade filter (e.g. `sepia() saturate() hue-rotate()`) across
   all of it so it reads as one palette — don't rely on the source assets
   being pre-coordinated.
5. **Any procedurally-generated color** (hue math, gradient offsets):
   actually walk every value it will hit across the real data (every mood
   hue, every variant index), not just the first one — a `hue + 34` offset
   that looks fine at hue 280 silently produced sickly yellow-green at
   hue 38 in this project.
6. **Unused sourced assets**: if you downloaded more clipart/icons than you
   ended up using, decide explicitly (and note in ATTRIBUTION) whether each
   leftover fits the piece's tone — don't leave them referenced nowhere, and
   don't force them in just because they were downloaded.
