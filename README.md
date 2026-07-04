# Let Me Call You Sweetheart — An Interactive Lyric Sync

A single-page, mobile-first interactive lyric video staged like a 1930s
silent-film title card, built around a genuinely public-domain 1910 love
song. Tap **Begin the Reel**, then scroll to try to keep the lyrics in
sync with the waltz yourself. It's genuinely hard to nail by hand — after
a bit of struggling, the page calls it out and offers to take over:

> "Hey — you can't really enjoy the song if you keep trying to figure out
> the perfect sync. Lemme just do that for you."
>
> **Can you "sync" for me? ☺️** · **I want to do it myself 😎**

## What's actually in this build

- **Real audio, real timing.** `audio/let-me-call-you-sweetheart.mp3` is a
  1924 Jubileers vocal-quartet recording of the fully public-domain 1910
  song "Let Me Call You Sweetheart" (Leo Friedman / Beth Slater Whitson),
  digitized and hosted by the Internet Archive. Every lyric timestamp in
  `index.html`'s `LYRICS` array came from running
  [faster-whisper](https://github.com/SYSTRAN/faster-whisper) directly on
  that recording — it's transcription-grounded to the actual waveform,
  not guessed.
- **Real clip art, properly matted.** Every illustration in
  `assets/clipart/` is a CC0 vintage engraving sourced via
  [Openverse](https://openverse.org). The as-served files had a
  checkerboard baked into the pixels as a fake "transparency" preview; a
  local script reconstructed genuine alpha (luminance threshold +
  border-connected flood fill) before they were saved into the repo. See
  `ATTRIBUTION.md` for full sourcing.
- **A visual system built around the theme, not against it.** Bodoni
  Moda / Cormorant Garamond / Courier Prime typography, procedural film
  grain + vignette, an iris-wipe open, and a literal ticking clock in the
  player bar — because a song about time, staged like *Modern Times*,
  should look like it.

## The math (the part that actually matters)

- The whole lyrics section is one continuous scroll — no inner scroll
  boxes, no fake "jump to element" auto-scroll.
- A `buildTimeline()` pass walks the real lyric timestamps and
  auto-inserts filler blocks for every instrumental gap greater than
  0.6s, so the DOM's total height always maps to the *exact* song
  duration with zero unaccounted time — including the ~15s orchestral
  coda near the end, which becomes a dedicated clip-art moment instead of
  dead scroll space.
- Each block's height is `(end − start) × 70px/sec`, so a constant
  scroll speed maps to a constant playback speed.
- **Manual mode:** scroll position → fraction of the lyrics section →
  multiplied by total duration → written straight to `audio.currentTime`.
  Scroll unevenly and the song audibly stutters; that's the built-in
  difficulty, not a fake timer.
- **Auto mode:** the exact inverse — a `requestAnimationFrame` loop reads
  `audio.currentTime` every frame and eases `window.scrollTo` toward the
  matching position.
- **Floating clip art** is choreographed with GSAP + ScrollTrigger,
  anchored to the same DOM blocks the lyric timing already built — so
  every peek-in/slide-out is driven by scroll position and works
  identically whether a human or auto-mode is doing the scrolling.

GSAP and ScrollTrigger are vendored locally in `assets/vendor/` rather
than pulled from a CDN at runtime — the core scroll↔time sync also has a
plain-CSS fallback path if, for whatever reason, GSAP fails to load, so a
choreography hiccup can never take the whole page down with it.

## Run locally

No build step — it's one HTML file. You do need a server that honors
HTTP Range requests (audio seeking depends on it) — Python's
`http.server` does **not** support these, so seeking silently breaks
against it. Use something that does:

```bash
npx http-server -p 8080 -c-1
# then open http://localhost:8080
```

## Swap in a different song

1. Drop your MP3 at `audio/<name>.mp3` and update the `<audio src>` in
   `index.html`.
2. Get real timestamps fast: run `faster-whisper` on it (see the snippet
   in `ATTRIBUTION.md`'s method notes) or open the page with `?tag=1` in
   the URL and tap along to the track — it logs `audio.currentTime` to an
   on-screen panel you can copy straight into the `LYRICS` array.
3. Swap `assets/clipart/*.png` for art matching the new song's mood —
   each `LYRICS`/`GAP_CLIPS` entry just references a filename.

## Deploy

**Vercel:** import this GitHub repo at vercel.com/new — zero config,
static site, done.

**GitHub Pages:** Settings → Pages → deploy from the branch root.

## Credits

Song, recording, clip art, and font sourcing all documented in
`ATTRIBUTION.md`. Built by Naveen (the-entertrainer). Original design
spec for the concept (then built around a different, copyrighted song)
is kept in `DESIGN-DOC.md` for reference.
