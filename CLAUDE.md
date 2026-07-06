# CLAUDE.md — My Sweetheart

Project-specific knowledge for working in this repo. Also written as a
general skills reference — most of this applies to any Theatre.js /
Three.js / Vite project, not just this one.

## What this project is

A single-page, one-button lyric page for a public-domain 1910 song,
currently built as **"The Sweetheart Edition"** — an ink-on-paper
editorial system where the song typesets itself live as a fine-press love
letter (see Update 4 at the bottom — read it before touching the visual
design). Everything is real: real word-level audio timestamps
(faster-whisper), real licensed photographic cutouts printed as ink
plates. See `README.md` for the architecture and `ATTRIBUTION.md` for
every asset's source. Read `src/lyrics-data.mjs` first — it's the single
source of truth (word timing + the `PLATES` editorial mapping). The
current build is DOM + CSS only with **zero runtime dependencies** — the
Theatre.js and Three.js sections below describe earlier iterations that
no longer ship, kept because the lessons are real.

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

## Update: pivoting a whole visual direction from a user-provided reference

The design above (plum/blush palette, abstract glass 3D objects, flat
OpenMoji icons) was later **fully replaced** after the user shared a Canva
animation showing the look they actually wanted: warm vintage sunset
gradient, real photographic objects, a rounded-display + brush-script type
pairing, thin line-art doodles. Lessons from that pivot, worth knowing
before starting a similar rebuild:

- **A short video is a far better design reference than a description.**
  When a user says "I designed this in Canva, here's the idea," don't
  settle for a text description or a single static frame — extract multiple
  frames across the clip's duration (`ffmpeg -i clip.mp4 -vf fps=2.5
  frame-%02d.png`, then view several) so you actually see the animation
  arc: what's static from frame 1, what builds in, what holds, what exits.
  A single frame (e.g. an auto-generated video thumbnail) will miss most of
  the intent. `ffmpeg`/`ffprobe` are not preinstalled in this sandbox but
  install cleanly via `apt-get install -y --no-install-recommends ffmpeg`
  (an `apt-get update` first fixes stale-mirror 404s on some packages).
- **The sandbox's Playwright-launched Chromium cannot reach *any* external
  HTTPS host through the configured proxy** — confirmed by testing
  `https://example.com` directly, not just the target site. Explicit
  `chromium.launch({ proxy: { server: 'http://127.0.0.1:<port>' },
  args:['--ignore-certificate-errors'] })` and various flag combinations
  (`--disable-quic`, `--proxy-bypass-list`) did not fix it. This is a
  browser-level limitation distinct from `curl`/`WebFetch`, which *do* work
  fine through the same proxy. Don't burn time debugging this further —
  fall back to `curl`/`WebFetch` for fetching reference content, and note
  the limitation rather than fighting it.
- **Adobe Stock (`asset_search` + `asset_license_and_download_stock` +
  `image_remove_background`) is a far more reliable source of real
  photographic cutouts than scraping small clip-art gallery sites.** Filter
  `pricing: "free"`, prefer `isGenTech: false` results (real photos, not
  AI-generated) if the user wants genuinely real photography, license with
  `asset_license_and_download_stock` (free-tier assets cost nothing),
  then `image_remove_background` gives a clean alpha cutout in one call.
  This licensed 14 real vintage-object photos (gramophone, rotary phone,
  pocket watch, rose, ring, etc.) in a handful of parallel tool-call
  batches — much faster and more reliable than hunting individual
  gallery/stock sites with `curl` (many small sites mislabel vector clip
  art as "photo," or the actual subject doesn't match the search term).
- **A hue offset applied to a CSS gradient stop needs re-checking every
  time the base hue range changes.** The exact "sickly yellow-green" bug
  from the first build (a fixed `+N` hue offset that only becomes a
  problem at certain base hues) recurred in the second build's rewritten
  gradient CSS, because the fix wasn't re-derived for the new palette's hue
  range — it was a *different* line of CSS with the *same* class of bug.
  When you change a palette's hue range, re-walk every value the range will
  hit through any hue-math, don't just carry over "a small offset is fine"
  as a memorized constant.
- **Parallax/decorative layers need a "lane," not a symmetric ± range,
  to reliably avoid a centered text column.** An initial design gave every
  depth tier a symmetric drift range (`-driftX` to `+driftX`), which means
  every layer's path *crosses the center* where the text lives — background
  ("far") tiers with a narrower range are paradoxically *more* likely to
  linger in the center than wide-sweeping foreground tiers. Fix: assign
  each layer to one lateral lane (left-of-center or right-of-center) via
  `laneInner`/`laneOuter` bounds that never cross into the text column's
  half-width, and let only the *outer* bound vary by depth tier (near =
  wide dramatic sweep near the edge, far = narrower band still outside the
  column). Screenshot-test at a timestamp when the relevant layer is
  mid-animation, not just at its start/end pose — the clutter/overlap only
  showed up mid-drift, not in the entrance or exit frames.
- **A sprite's photo shouldn't be forced into a fixed world-unit size.**
  Bake a target *fraction of the camera's on-screen frustum* per depth tier
  (`screenFrac`) and compute the actual world-space width/height from the
  live camera fov/aspect/distance at render time (same technique as the
  frustum-relative x/y positioning above) — this keeps every photo cutout
  correctly sized on any viewport, and keeps near/far depth tiers reading
  as "bigger/closer" vs "smaller/farther" regardless of screen size.
- **`THREE.Sprite` is the right primitive for 2D photo cutouts drifting in
  3D depth** (a classic multiplane-camera parallax technique) — it always
  faces the camera, needs no lighting/environment map (unlike the glass
  `MeshPhysicalMaterial` objects from the first build), and is much cheaper
  to render. If a redesign moves from lit 3D geometry to flat photo
  cutouts, also remove the now-unnecessary `RoomEnvironment`/PMREM/physical
  lights from the Three.js scene setup — don't leave lighting rigged for
  materials that no longer exist.
- **A variable font's actual registered axes matter for
  `font-variation-settings`.** Fraunces has real `opsz`/`wght`/`SOFT` axes;
  Baloo 2 and Caveat (the fonts used in the pivot) only expose `wght`.
  Setting an axis a font doesn't register is harmless (browsers ignore it),
  but don't carry over a multi-axis `font-variation-settings` string from
  one font to a different one without checking which axes the new font
  actually has — it's dead weight at best and confusing to read at worst.

## Update 2: the poster-scene rebuild (what the reference actually meant)

The parallax-photo-layers build above was still rejected — "nothing like
the sample." The miss wasn't palette or assets; it was the **animation
model**. Dense frame extraction of the reference (30 frames at 6fps, plus
full-res crops of each type block) showed a *fixed poster* that builds in
once and holds: caption pinned top, fat display type accumulating
word-by-word (typewriter), ONE anchor object rising into place and
staying, a script keyword inking itself across the lower third. Nothing
ever flies through the frame. Lessons:

- **Identify the animation model before the aesthetics.** Palette, fonts
  and imagery can all be right and the design still reads as wrong if
  content *moves through* the screen when the reference *composes onto* a
  still poster. Extract enough frames to answer: what builds in, what
  holds, what never moves — and pick the DOM/animation architecture from
  that, not from the previous build's structure.
- **A karaoke page maps onto a poster reference by accumulation**: each
  song section is one poster; its words type on (per-letter timestamps
  derived from each word's real sung start/duration) and *stay*; the next
  section crossfades to the next poster. ~10 posters ≈ 10 anchors across a
  3-minute song without any single screen being busy.
- **Connected script fonts can't be revealed per-letter.** Splitting
  Cookie/Pacifico-style scripts into letter spans breaks the cursive
  joins/ligatures. Reveal the intact word with an animated `clip-path:
  inset(...)` wipe instead — reads as handwriting and preserves shaping.
  (Chunky display + caption faces don't connect, so per-letter
  `visibility` toggles are fine there — and instant visibility pops read
  more "typewriter" than opacity fades.)
- **Match fonts from letterform evidence, not vibes**: full-res crops of
  the reference type made it obvious the headline was a Titan One-class
  fat blob display (tiny counters) and the script a Cookie-class bouncy
  monoline — the Baloo 2 / Caveat pairing from the previous pass was a
  category error (soft-rounded vs fat-retro; brush italic vs connected
  upright script).
- **Self-host fonts when smoke-testing headlessly.** This sandbox's
  Playwright browser can't reach any external host, so Google-Fonts-linked
  typography silently renders as fallback in every screenshot — you cannot
  visually verify type you didn't self-host. Downloading the latin woff2
  subsets (curl the css2 URL with a browser UA, grep the urls) into
  `public/fonts/` fixed verification *and* removed a production runtime
  dependency.
- **`margin-top` percentages resolve against container WIDTH.** A
  width-relative top margin that looks fine on a desktop column collides
  with a pinned header on a tall-narrow phone. Use `dvh` units for
  vertical rhythm in a portrait-first layout.
- **Check every background-removal result against its alpha channel**
  (`ffmpeg -vf alphaextract`): one Stock photo (a flat-lay of envelopes)
  came back as a full rectangle because "the subject" filled the frame —
  it read as a pasted photo. Swapping the asset beat fighting the mask.
- **Pointer parallax via two CSS variables** (`--px`/`--py` lerped in the
  RAF loop; each layer multiplies them at its own rate inside its
  `transform`) gives believable depth with zero WebGL — Three.js was
  removed entirely in this build (bundle 680 KB → 118 KB) because the
  reference had no 3D and DOM text/images composite better than canvas
  sprites layered under text.

## Update 3: the vintage-TV pivot — patching a glTF's texture atlas at runtime, and a nasty headless-Chromium screenshot trap

The DOM/CSS poster build above was pivoted again: the whole experience now
plays out as a broadcast on a centered 3D vintage TV's CRT screen (a
user-supplied Sketchfab glTF), with lyric content drawn live onto a canvas
and composited into the model's own baseColor texture every frame — see
`src/scene/tvScene.js` + `src/scene/tvScreen.js`. Three.js came back into
the project for this (it had been removed in the prior pivot). Lessons:

- **A single-mesh/single-material glTF has no "screen" object to swap a
  material on — the screen is just baked into one shared UV atlas.** This
  Sketchfab TV (like a lot of low-poly game-asset exports) is one mesh, one
  material, one 2048×2048 baseColor/metallicRoughness/normal atlas covering
  the whole model (bezel, knobs, decals, screen glass, all in one image).
  To find the screen's rectangle in that atlas: sample one pixel known to
  be inside the screen face (from a downscaled preview), then flood-fill
  (BFS over similar-colored pixels) to get its bounding box — this is
  reliable even with a JPEG-artifact-y flat-color region, and works from a
  plain Python/PIL script with no browser involved. **Cross-check the
  candidate rectangle against the metallicRoughness map at the same pixel
  region** — a screen face will have conspicuously lower roughness / higher
  metalness than a matte bezel; if that separation isn't visually obvious,
  you probably flood-filled the wrong region.
- **Patch only the baseColor image, at runtime, in a canvas — never touch
  metallicRoughness/normalMap.** Draw the atlas PNG onto an offscreen
  canvas once at load, wrap it in one `THREE.CanvasTexture`, assign it to
  `material.map` (dispose the old one), and leave
  `material.metalnessMap`/`.roughnessMap`/`.normalMap` completely alone —
  they're separate `Texture` instances from separate source images, so
  they're structurally impossible to disturb by only ever calling
  `atlasCtx.drawImage()` into a sub-rectangle of the atlas canvas and
  setting `atlasTexture.needsUpdate = true`. This is *why* the model's real
  specular highlight keeps rendering correctly on top of whatever content
  gets drawn into that rectangle — the PBR roughness/metalness response
  was never touched, only the color under it changed.
- **`CanvasTexture.flipY` must match how GLTFLoader treats the model's own
  textures, or your patched rectangle lands in the wrong place entirely.**
  glTF's spec defines UV (0,0) as the image's top-left corner (same
  convention as a decoded PNG/canvas pixel grid) — GLTFLoader sets
  `flipY = false` on its own textures for exactly that reason. A
  replacement `CanvasTexture` sampled by the *same* UV attribute needs
  `flipY = false` too. Getting this backwards doesn't just flip the
  content — because the whole atlas shares one UV set, it can also make
  your rectangle's fraction-of-height math land on completely the wrong
  band of the image (confirmed here: `flipY = true` put the patched content
  almost entirely off the visible screen face, not just upside-down).
- **A UV island can still be arbitrarily rotated/mirrored relative to the
  source image even once its *position* is confirmed correct — a bounding
  box or a symmetric checkerboard test cannot catch this, only an
  asymmetric test glyph can.** This model's screen UV turned out to need a
  90°-rotation-plus-mirror correction that a checkerboard-with-corner-labels
  test left genuinely ambiguous to read (small sans-serif "TL"/"TR" corner
  labels under an unknown rotation are surprisingly hard to eyeball
  correctly). Switching to one giant asymmetric glyph (a capital "F" —
  no rotational or mirror symmetry at all) filling the whole rectangle,
  and generating reference renders of all 8 dihedral transforms
  (identity/90°/180°/270° × mirrored) with plain PIL to compare against,
  made the correct transform unambiguous in one comparison instead of
  several rounds of misreading mirrored corner labels. The fix ends up
  baked into one small helper (`applyScreenContentTransform` in
  `tvScene.js`) that every future content draw goes through, so this
  never needs re-solving.
- **Fitting a single centered 3D object to an arbitrary aspect ratio is
  just "distance so the bounding sphere fits inside the *tighter* of the
  vertical/horizontal FOV," not the multi-object frustum-fraction technique
  from the prior Three.js build** (that technique existed to place several
  independent objects at specific lateral offsets across aspect ratios —
  overkill for one static, centered hero object). Compute
  `vHalf = verticalFovRadians/2`, `hHalf = atan(tan(vHalf) * aspect)`, then
  `distance = sphere.radius * padding / sin(min(vHalf, hHalf))` — taking the
  *smaller* angle always picks the actually-binding constraint (vertical on
  a wide screen, horizontal on a narrow one), recomputed on resize. Get the
  bounding sphere from `new THREE.Box3().setFromObject(model)` — never
  hand-derive it from a glTF's raw accessor min/max, since a real export's
  node hierarchy (axis-convention conversion, unit-scale nodes, per-node
  transforms) makes manual matrix math error-prone where `Box3` just works.
- **This sandbox's headless Chromium can silently return a blank
  screenshot of real, correctly-rendering WebGL canvas content if the
  Playwright script only does `page.goto()` then a bare `page.waitForTimeout()`
  before `page.screenshot()` — with no error, no console warning, nothing.**
  Confirmed step by step: the WebGL context creates fine, `renderer.render()`
  runs every frame (verified via injected per-frame console logs), a plain
  `THREE.Mesh` cube screenshots correctly, and even the real failing scene
  screenshots correctly image the model *whenever the wait before the
  screenshot involved any CDP polling* (`page.waitForFunction(...)`) —
  but reproducibly returns the flat CSS background color instead of any
  canvas content when the exact same scene is given a bare
  `waitForTimeout(1500)` instead. The fix: **never gate a WebGL screenshot
  behind a bare timeout in this sandbox** — wait for a real readiness
  signal via `page.waitForFunction(() => window.__someReadyFlag !== undefined)`,
  or at minimum interleave a throwaway poll
  (`page.waitForFunction(() => false, { timeout: 800, polling: 50 }).catch(() => {})`)
  during/after any timeout-based wait. This cost far more debugging time
  than anything else in this pivot — bisect aggressively (a minimal inline
  `<script type="module">` test page with no framework, testing one
  variable at a time) before suspecting your own Three.js code when a
  canvas screenshots blank but the same JS logs prove it rendered.

## Update 4: the ink-editorial redesign ("The Sweetheart Edition")

The vintage-TV build was fully replaced on an explicit request to
reimagine everything — approach, palette, fonts, graphics, theme,
animations — toward a light/paper, modern-ink editorial direction with
typography as the lead. What ships now: a paper sheet with a printed grid
(masthead, hairline trim, crop marks, folio), ten editorial PLATES that
compose in word-by-word at real sung timestamps and hold, a fountain-pen
blue italic keyword with a self-drawing swash underline, licensed photo
cutouts printed as grayscale multiply-blended "ink plates," and a single
red wax-seal play button. Lessons:

- **When a photo prints as an "ink plate" (grayscale + multiply onto
  paper), subject brightness is a per-asset editorial decision, not one
  shared filter.** White subjects (pearls, dove, diamond ring) multiply
  toward invisible; near-black ones (a deep-red rose goes ~0.2 luminance
  in grayscale) print as solid silhouettes. Fix: small per-figure tone
  classes (`deep` = darken light subjects, `lift` = brighten dark ones,
  here `brightness(2.1)` for the rose) declared per-asset in the data.
  Screenshot every figure — the failures are individually obvious and
  collectively invisible if you only check one plate.
- **An SVG stroke armed for a dashoffset draw-on is not invisible before
  it runs**: with `stroke-linecap: round` and `stroke-dasharray/offset: 1`,
  browsers render the path's start as a lone dot. Keep the whole SVG at
  `opacity: 0` until the reveal class lands, then let the dashoffset
  transition draw it.
- **`loading="lazy"` never fires for images inside `visibility: hidden`
  ancestors** (Chromium defers lazy images that aren't intersecting-and
  -renderable), so lazy figures in pre-built hidden plates would pop in
  blank at plate-turn. Eager-load small per-section imagery that is
  guaranteed to be shown; `decoding="async"` is enough.
- **A timed-cue engine for class toggles beats per-element timeouts**: one
  sorted array of {t, el}, a pointer walked forward each frame, and an
  O(n) full re-sync only on backward seeks. Idempotent in both
  directions, trivially testable by setting `audio.currentTime` from a
  headless page.
- **Masked word-rise slots clip descenders** if the slot is exactly the
  line box: give each `overflow: hidden` slot `padding-bottom: .14em;
  margin-bottom: -.14em` so g/y/p survive while the mask still hides the
  pre-rise word.
- **The DOM smoke-test needs a real readiness signal, not a timeout**:
  `src/main.js` sets `window.__editionReady` after `document.fonts.ready`;
  `tools/smoke-test-page.mjs` waits on that flag. Self-hosted fonts are
  what make headless screenshots typographically truthful in this sandbox
  (its Playwright Chromium cannot reach external hosts at all).

- **Figure-sourcing addendum (the engraving pass):** the grayscale photo
  cutouts were replaced on request with public-domain ink illustrations
  matched to each plate's lyric. What worked: **Wikimedia Commons' Pearson
  Scott Foresman archive** (search `<subject> PSF` via the plain
  `api.php` generator=search JSON API — fully curl-able) is a large,
  single-style, genuinely-PD set of single-subject line drawings, which
  solves both the "matches the ink aesthetic" and the "nine figures read
  as one hand" problems at once. What didn't: Adobe Stock's free tier has
  essentially no vintage engravings (54–79 total hits of noise per
  query), and Old Book Illustrations' search is JS-rendered (invisible to
  curl, unreachable by this sandbox's Playwright). Verify picks visually
  via a PIL contact sheet before wiring in — several "obvious" titles
  were wrong (PSF's `Candle` is a birthday cake; its `Phonograph` is a
  1950s record player; `Crescent 1` has text labels baked in).
