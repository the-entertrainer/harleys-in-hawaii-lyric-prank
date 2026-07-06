# Attribution

## Song

**"Let Me Call You Sweetheart"** — words & music by Beth Slater Whitson and
Leo Friedman, published 1910. Both composition and lyrics are in the public
domain in the US.

**Recording used:** *The Jubileers* (vocal quartet & piano), from the series
"Let's All Howl," catalog 1801-A. Digitized 78rpm transfer, hosted on the
Internet Archive:
https://archive.org/details/78_let-me-call-you-sweetheart_the-jubileers-friedman-whitson_gbia0062289a

`public/audio/let-me-call-you-sweetheart.mp3` is that file, unmodified.

## Lyric timing

Every timestamp in the `LYRICS` array in `src/lyrics-data.mjs` — both each
line's `start`/`end` and every individual word's `s`/`e` inside its `words`
array — was produced by running
[faster-whisper](https://github.com/SYSTRAN/faster-whisper) with word-level
timestamps directly on the recording above:

```python
from faster_whisper import WhisperModel
model = WhisperModel("small", device="cpu", compute_type="int8")
segments, info = model.transcribe(
    "let-me-call-you-sweetheart.mp3", word_timestamps=True, language="en"
)
for seg in segments:
    for w in seg.words:
        print(w.start, w.end, w.word)
```

then checked against the printed 1910 lyric sheet for spelling (Whisper's
transcription is used for **timing**, not wording). One exception: the final
tag line (the last ~1.4s of the recording, a soft fade-out) came back from
Whisper with all ten words collapsed onto the same timestamp — those ten
words were evenly re-interpolated across the segment's real start/end
instead of using the (degenerate) per-word output; every other line's word
timings are Whisper's actual output, unmodified.

## Motion / choreography

Everything on the page is driven directly from the word timestamps above by
`src/main.js` — a word's ink-fill is scrubbed to `audio.currentTime` every
frame, and the running ink drips (`src/ink.js`) are scheduled in song time
when a word turns wet. There is no separate keyframe file: the earlier
builds' Theatre.js sequence (and the tool that generated it) was removed in
the love-letter rebuild because nothing tweened remained that wasn't a pure
function of the audio clock.

## Photographic cutouts

Every section's cameo image in `SECTIONS` (`src/lyrics-data.mjs`) is a
**real photograph**, not clip art or an illustration: licensed from Adobe
Stock's free tier, then background-removed with the Adobe Photoshop API
(`image_remove_background`) into a genuine transparent-alpha PNG. Each is
shown inside that page's oval "cameo" medallion, sepia-graded by CSS filter
so all eight read as one photogravure palette. Imagery is chosen for
romantic register, never literal word-matching (no telephones for
"call you" — a rose, a candle, a key, a dove, pearls, a bouquet, a pocket
watch, a ring).

| File | Adobe Stock ID | Search term | Used for |
|---|---|---|---|
| `rose.png` | 301702947 | red rose isolated | salutation + first chorus |
| `candle.png` | 76945172 | retro candlestick with candle isolated | "keep the love light glowing" (both) |
| `key.png` | 373681935 | old key isolated, clipping path | second chorus |
| `dove.png` | 132973260 | white dove flying symbol of love | "I am dreaming" verse |
| `pearl-necklace.png` | 130138331 | white pearl necklace | "silvery moonlight" verse |
| `rose-bouquet.png` | 449968571 | bunch of rosy roses isolated | "in a land of love" |
| `watch.png` | 315464404 | vintage pocket watch isolated on white | chorus reprise |
| `ring.png` | 174404055 | diamond engagement wedding ring isolated | finale |

Previously-licensed cutouts that don't fit the letter's romantic register
(`gramophone.png`, `vinyl.png`, `rotary-phone.png`, `typewriter.png`,
`camera.png`) were removed from the repo rather than left dangling. One
additionally-licensed cutout (`love-letter.png`, Adobe Stock 611879443) was
removed in an earlier build: its background removal kept the whole
rectangular flat-lay rather than isolating the envelope.

## Fonts

- **Cormorant Garamond** (Christian Thalmann) — the letter's body: an
  old-style garalde with true italics, set at display sizes for the sung
  lines and small italic for the whispered postscript.
- **Great Vibes** (TypeSETit / Robert E. Leuschke) — the connected
  copperplate script for each section's emotional keyword, the "my
  sweetheart," salutation, and the "yours, always" sign-off. Because it's
  a connected script it is never split per letter; it reveals by a
  left-to-right ink fill of the intact word.

Both SIL Open Font License, self-hosted as latin-subset woff2 files in
`public/fonts/` (downloaded from Google Fonts) — no external font request
at runtime.

## Earlier builds

This page went through several full visual directions before the current
one (glass 3D objects on plum; Canva-reference photo posters; a 3D vintage
TV broadcasting the lyrics from its CRT screen — that build's Sketchfab TV
model, CC BY-NC 4.0 by fan7774, has been removed from the repo along with
its required credit, since the asset no longer ships). See `DESIGN-DOC.md`
and git history; none of those assets remain in the build.
