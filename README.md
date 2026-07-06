# A letter, sung in ink

A single-page, one-button lyric experience: a public-domain 1910 love song
plays while a handwritten letter writes itself — every word filling with
sepia ink at the exact moment it is sung, wet words shedding little running
ink drips that dry into the paper. It opens like a gift: a wax seal, a
quiet "open me," and no other chrome. The page itself never names the song
or anyone involved — it's a letter, not a liner note.

## What's actually in this build

- **Real audio, real timing, down to the word.**
  `public/audio/let-me-call-you-sweetheart.mp3` is a 1924 vocal-quartet
  recording of a fully public-domain 1910 song. Every word in
  `src/lyrics-data.mjs`'s `LYRICS` array carries its own start/end
  timestamp, produced by running
  [faster-whisper](https://github.com/SYSTRAN/faster-whisper) with
  word-level timestamps directly on that recording. See `ATTRIBUTION.md`.
- **Ink, behaving like ink.** A sung word starts as a faint ghost pressed
  into the paper and fills with ink top-to-bottom across its real sung
  duration (`background-clip: text` driven per-frame from the audio
  clock). Each section's emotional keyword is set in connected script and
  writes itself left-to-right instead — cursive joins are never broken
  into per-letter spans. Wet words shed drips (`src/ink.js`): a bead
  swells at the baseline, runs down the paper leaving a tapering trail,
  and soaks in — drawn with multiply compositing on one full-page canvas,
  never free-falling, because ink on upright paper doesn't.
- **A letter, page by page.** `SECTIONS` in `src/lyrics-data.mjs` divides
  the song at its natural boundaries; each section is one "page": an oval
  cameo medallion holding a licensed photographic cutout (rose, candle,
  key, dove, pearls, bouquet, pocket watch, ring — romantic register, no
  literal word-matching), the section's lines, and its script keyword.
  Pages crossfade; nothing ever flies through the frame. The letter opens
  "my sweetheart," and signs off "yours, always ❤", with the recording's
  whispered outro as a tiny postscript.
- **Period materials throughout**: aged cream paper (CSS gradients + an
  SVG-noise grain, two faint fold creases), a thin double stationery rule
  with fleuron corners, iron-gall sepia ink with one oxblood accent, and
  an SVG turbulence filter roughening every written edge. Typography is
  Cormorant Garamond + Great Vibes, self-hosted woff2, no external
  requests at runtime.
- **One control.** A crimson wax seal starts the song (and returns, small,
  to offer "once more?" at the end). Tapping the paper pauses/resumes. A
  thin quill stroke along the foot of the page is the only progress
  indication.
- **Mobile-first, light, and calm**: DOM + one 2D canvas — no WebGL, no
  animation library; ~13 KB of JS. `dvh` vertical rhythm, safe-area
  insets, and `prefers-reduced-motion` disables the drips, sway, and page
  drift while keeping every word's ink timing.

## Repo layout

```
index.html                Vite entry (paper, frame, seal, ink filter defs)
src/
  main.js                  builds the letter from data; the audio-scrubbed loop
  ink.js                   the drip particle system (canvas, multiply-composited)
  style.css                paper, typography, cameo, seal — the whole look
  lyrics-data.mjs          word timing + SECTIONS letter structure (source of truth)
public/
  assets/photo/            licensed, background-removed photo cutouts (ATTRIBUTION.md)
  fonts/                   self-hosted Cormorant Garamond / Great Vibes (woff2)
  audio/                   the mp3 + its own README
tools/
  smoke-test-page.mjs      deterministic per-page screenshots in headless Chromium
```

## Run locally

```bash
npm install
npm run dev       # Vite dev server with HMR
```

Or the production build:

```bash
npm run build
npm run preview   # serves dist/ at http://localhost:8080
```

## Changing the letter, timing, or imagery

1. Edit `src/lyrics-data.mjs` — `SECTIONS` controls each page's boundary,
   cameo image, line grouping, script keyword, salutation/sign-off.
2. Edit `src/style.css` for the look; `src/ink.js` for drip behavior.
3. `npm run smoke:page` (with a server running; `SMOKE_URL=...`,
   `SMOKE_MOBILE=1` for a phone viewport, `SMOKE_DRIPS=1` to let each shot
   play in real time so drips appear) screenshots every page to
   `tools/screens/`.

## Deploy

**Vercel:** auto-detected Vite (`npm run build`, output `dist/`) — zero
config. **GitHub Pages:** publish `dist/`.

## Credits

Song and recording sourcing, and every asset's source and license, are
documented in `ATTRIBUTION.md`. Earlier design directions (glass 3D
objects, photo-poster scenes, a 3D vintage TV broadcast) are preserved in
`DESIGN-DOC.md` and git history.
