# The Sweetheart Edition

A single-page experience for a genuinely public-domain 1910 love song —
staged as a **fine-press love letter that typesets itself live**. The
viewport is a sheet of paper with a printed grid: masthead, hairline trim,
crop marks, folio. The song divides into ten *plates*; each plate's display
headline rises word-by-word out of masked slots at the words' real sung
timestamps, the emotional keyword inks itself on in fountain-pen blue
italic (a clip-path wipe, then a swash underline drawing itself), and one
licensed photographic cutout is printed into the paper as an ink-plate
figure. There is exactly one control: a red wax-seal play button — the
only red on the page.

## What's actually in this build

- **Real audio, real timing, down to the word.**
  `public/audio/let-me-call-you-sweetheart.mp3` is a 1924 Jubileers
  vocal-quartet recording of the fully public-domain 1910 song "Let Me Call
  You Sweetheart" (Leo Friedman / Beth Slater Whitson). Every lyric and
  every word in `src/lyrics-data.mjs`'s `LYRICS` array carries its own
  start/end timestamp, produced by running
  [faster-whisper](https://github.com/SYSTRAN/faster-whisper) with
  word-level timestamps directly on that recording. See `ATTRIBUTION.md`.
- **An edition, not a lyric scroller.** `PLATES` in `src/lyrics-data.mjs`
  divides the song at its section boundaries. Each plate is one editorial
  spread — kicker (`PLATE Nº II · THE CHORUS`), display headline, keyword,
  deck, figure with caption (`FIG. II — GRAMOPHONE`) — that composes in
  once and **holds** like a printed page until the next plate is pulled.
  Nothing ever flies through the frame.
- **Cinematic type, three reveals.** Display words rise out of
  overflow-hidden slots at their sung timestamp (a masked title-sequence
  entrance); deck words wait as ghosts and ink themselves when sung; the
  keyword arrives as an ink wipe plus a hand-drawn swash underline
  animated by `stroke-dashoffset`. All three are pure CSS transitions
  toggled by one per-frame timestamp comparison.
- **Figures that mean the line.** Each plate's figure is a public-domain
  ink illustration chosen for the lyric being sung — the hand-bell for
  "let me *call* you," a lit sconce for "the love light," a lyre for the
  chorus reprise, cumulus skies for "blue… gray," a stippled full moon
  for "silvery moonlight," a turtledove for "a land of love," a man
  writing for "hear you whisper," a carried lantern, a single engraved
  rose. All nine come from one archive (Pearson Scott Foresman, Wikimedia
  Commons) so the set reads as one hand, processed to
  letterpress-ink-on-transparent and multiply-blended into the paper.
  Paper grain is an inline SVG `feTurbulence` data URI; trim, crop marks
  and rules are CSS borders.
- **Typography is the design.** Instrument Serif (display roman + the
  blue italic "written" voice), Schibsted Grotesk (labels, small caps),
  Fragment Mono (timecode, folios, figure captions) — self-hosted latin
  woff2 subsets in `public/fonts/`, no external font request at runtime.
- **No runtime dependencies.** The whole page is DOM + CSS driven by one
  `requestAnimationFrame` loop scrubbed to `audio.currentTime` (~25 KB of
  JS+CSS before gzip). Three.js and Theatre.js from earlier iterations are
  gone; word reveal is discrete state at a known timestamp, so plain
  class toggles are exactly as accurate as keyframes and far smaller.
- **A real ending.** When the recording ends, the edition closes with a
  colophon — fleuron, "I'm in love with you.", "Made with love by Naveen,"
  and the printer's notes — plus a replay seal.
- **Mobile-first by construction:** portrait flips each spread to a single
  column (text above, figure below, height-capped so they can't collide),
  `dvh`-based vertical rhythm, safe-area insets, and
  `prefers-reduced-motion` swaps every rise/wipe for plain fades.

## Repo layout

```
index.html                     the sheet: grain/trim/mast/footer chrome + static cover & colophon
src/
  main.js                       builds plates from data, timed-cue engine, RAF loop, seals
  style.css                     the whole design system (tokens, plates, reveals, responsive)
  lyrics-data.mjs                word timing + PLATES editorial mapping (single source of truth)
public/
  assets/figures/                public-domain ink illustrations, one per plate (see ATTRIBUTION.md)
  fonts/                         self-hosted Instrument Serif / Schibsted Grotesk / Fragment Mono
  audio/                         the mp3 + its own README
tools/
  smoke-test-page.mjs            headless screenshot pass across real timestamps
```

## Run locally

```bash
npm install
npm run dev        # http://127.0.0.1:5183
```

Or the production build:

```bash
npm run build
npm run preview    # serves dist/ at http://localhost:8080
```

## Changing the edition, timing, or imagery

1. Edit `src/lyrics-data.mjs` — `PLATES` controls each plate's boundary,
   section label, figure (image / size / tone / caption), and which word
   ranges land in the headline / keyword / deck / spoken roles.
2. Edit `src/style.css` for the design system itself (tokens at the top),
   or `src/main.js` for the reveal/cue engine.
3. `npm run smoke:page` (with `npm run dev` running; `SMOKE_MOBILE=1` for
   a phone viewport) screenshots every plate at a real timestamp.

## Deploy

**Vercel:** auto-detected Vite (`npm run build`, output `dist/`) — zero
config. **GitHub Pages:** publish `dist/`.

## Credits

Song and recording sourcing, and every asset's source and license, are
documented in `ATTRIBUTION.md`. Built by Naveen (the-entertrainer).
Earlier design directions are preserved in `DESIGN-DOC.md` and git
history.
