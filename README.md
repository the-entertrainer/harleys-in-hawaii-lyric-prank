# Let Me Call You Sweetheart — An Ink-Doodle Lyric Page

A single-page lyric experience for a genuinely public-domain 1910 love
song. There is exactly one control: a liquid ink-blob play button. Press
it. Every word lights up in ink, one at a time, at the exact instant it's
actually sung — huge bold handwritten type on a plain paper background,
the next line already rising into view below before it arrives, the
previous one fading away above. No intro screen, no instructions, no mode
toggle, no progress bar. Nothing to configure or get right.

## What's actually in this build

- **Real audio, real timing, down to the word.** `audio/let-me-call-you-sweetheart.mp3`
  is a 1924 Jubileers vocal-quartet recording of the fully public-domain
  1910 song "Let Me Call You Sweetheart" (Leo Friedman / Beth Slater
  Whitson), digitized and hosted by the Internet Archive. Every lyric
  *and every word* in `index.html`'s `LYRICS` array carries its own
  start/end timestamp, produced by running
  [faster-whisper](https://github.com/SYSTRAN/faster-whisper) with
  word-level timestamps directly on that recording — it's
  transcription-grounded to the actual waveform, not guessed, and not
  just line-level: each word underlines itself in ink at the moment it's
  sung, using its own real timestamp, not an evenly-spaced guess.
- **A continuous "teleprompter" stage, not a long scroll.** Every line
  lives at a fixed position on screen the whole song; each frame,
  `renderFrame()` places it by how far `audio.currentTime` is from that
  line's own `[start, end]` window — 0 while you're inside it (however
  long that line lasts), counting down while it's upcoming, counting away
  once it's passed. That's what makes the next line visibly rise into
  place before it arrives (the anticipation) and the previous one recede
  instead of just vanishing.
- **Every flower doodle is procedurally generated, not sourced.** There
  are no image assets at all beyond the audio and a tiny paper-grain
  texture. Instead, `index.html` embeds ~18 hand-crafted SVG line-doodle
  symbols (daisy, rose, fern, tulip, wildflower, berry branch, tendril…),
  built from parametric bezier curves with organic per-point jitter so
  they read as sketched, not vector-perfect. Each one is anchored to, and
  moves/fades with, its own line rather than sitting in a static corner.
  Real, native transparency; zero licensing question. See `ATTRIBUTION.md`
  for the full method and for why an earlier stock-photo reference handed
  to this project was deliberately *not* used (visible Dreamstime
  watermark = not rights-clear).
- **One control, designed with intent.** The play/pause button is an
  organic ink-blob shape (its own generated bezier path, not a plain
  circle) with a gentle idle "breathing" animation, a squash-and-twist
  press response, an ink-ripple burst on tap, and a rotating icon
  cross-fade between play and pause.
- **Doodles draw themselves in, in step with the countdown.** Each doodle
  is cloned into the page as real `<path>`/`<circle>` elements (not
  `<use>`, so each stroke's actual length is measurable), given a
  `stroke-dasharray` equal to its own length, and revealed via
  `stroke-dashoffset` a couple of seconds before its line arrives — the
  drawing-in *is* part of the anticipation, not a separate effect.
- **Nothing sits frozen.** A slow breathing ambient glow, a thin ink-fill
  edge that tracks overall progress, a subtle continuous scale-breathe on
  whichever line is current, and a gentle sine-wave bob on every doodle
  mean the page never reads as a static screenshot, even mid-line, even
  during the ~15s instrumental coda.

## The math (still the soul of it)

- `buildTimeline()` walks the real lyric timestamps and auto-inserts
  filler "gap" entries for every instrumental stretch greater than 0.6s,
  so the timeline always accounts for the *exact* song duration with zero
  unaccounted time — including the ~15s orchestral coda near the end,
  which becomes a dedicated doodle moment instead of dead air.
- Position is `(line.start − t)` while upcoming, `0` for the whole time
  `t` is inside `[start, end]`, `-(t − line.end)` once it's passed —
  multiplied by a constant px/sec to get a translateY. Opacity and scale
  are the same distance, clamped. That's the entire visual engine: one
  function, run every frame, for every line, driven only by
  `audio.currentTime`.
- There is only one direction now: `audio.currentTime` drives everything.
  The earlier manual scroll-to-seek "prank" mode has been removed
  entirely — this build has no mode to choose, so there's nothing for it
  to conflict with.

## A note on the design process

Part of this design was informed by Google Stitch (a real, authenticated
`stitch.googleapis.com` MCP endpoint) as a design-reference tool — a
generated mockup and its accompanying design-system spec directly
informed the final ink-blob button technique (an SVG mask/shape rather
than a plain circle), the "doodles sit behind text, faint, textural"
layering rule, and the paper/ink monochrome palette. Nothing from Stitch
was copied verbatim into the shipped code; it was used the way a mood
board or reference render is used, then hand-implemented here.

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
2. Get real word-level timestamps: run `faster-whisper` with
   `word_timestamps=True` on it (see `ATTRIBUTION.md` for the exact
   snippet used here) and convert each segment's word list into a
   `words:[{w,s,e}, …]` array — that's what each `LYRICS` entry expects.
   For quick line-level-only prototyping instead, open the page with
   `?tag=1` in the URL and tap along to the track; it logs
   `audio.currentTime` to an on-screen panel you can copy from.
3. The doodle symbols are plain inline SVG in the `<defs>` block at the
   top of `<body>` — swap `LYRICS`/`GAP_DOODLES` entries to reference
   different `doodle-*` ids, or add new symbols following the same
   pattern (see the parametric generation notes in `ATTRIBUTION.md`).

## Deploy

**Vercel:** import this GitHub repo at vercel.com/new — zero config,
static site, done.

**GitHub Pages:** Settings → Pages → deploy from the branch root.

## Credits

Song and recording sourcing documented in `ATTRIBUTION.md`. Built by
Naveen (the-entertrainer). Earlier design directions (a Katy Perry
concept, then a maximalist floral rebuild) are kept in `DESIGN-DOC.md`
for reference; this ink-doodle build superseded both.
