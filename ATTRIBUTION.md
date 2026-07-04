# Attribution

## Song

**"Let Me Call You Sweetheart"** — words & music by Beth Slater Whitson and
Leo Friedman, published 1910. Both composition and lyrics are in the public
domain in the US.

**Recording used:** *The Jubileers* (vocal quartet & piano), from the series
"Let's All Howl," catalog 1801-A. Digitized 78rpm transfer, hosted on the
Internet Archive:
https://archive.org/details/78_let-me-call-you-sweetheart_the-jubileers-friedman-whitson_gbia0062289a

`audio/let-me-call-you-sweetheart.mp3` is that file, unmodified.

## Lyric timing

Every timestamp in the `LYRICS` array in `index.html` — both each line's
`start`/`end` and every individual word's `s`/`e` inside its `words`
array — was produced by running
[faster-whisper](https://github.com/SYSTRAN/faster-whisper) with
word-level timestamps directly on the recording above:

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
transcription is used for **timing**, not wording — the displayed text is
the real published lyric). It's transcription-grounded to the actual
waveform, not hand-guessed, which is what lets each word underline itself
in ink at the exact moment it's sung rather than at an evenly-interpolated
guess.

One exception: the final tag line (the last ~1.4s of the recording, a
soft fade-out) came back from Whisper with all ten words collapsed onto
the same timestamp — the model couldn't resolve individual words in that
fade. Those ten words were evenly re-interpolated across the segment's
real start/end instead of using the (degenerate) per-word output
directly; every other line's word timings are Whisper's actual output,
unmodified.

## Ink-doodle flowers (current build)

Every flower/leaf/berry doodle inlined into `index.html`'s `<defs>` block
is **procedurally generated**, not sourced from any stock library —
there are no PNG/JPG image assets in this repo at all besides the paper
texture. Each doodle (daisy, rose, fern, tulip, wildflower, berry branch,
tendril, bud, dot-branch, star-flower…) is built from parametric cubic
bezier curves — petals as radially-arranged almond shapes, a rose as a
wobbled Archimedean spiral, a fern as alternating tick-marks off a central
stem — with small random jitter applied to control points per instance,
so repeated uses of "the same" doodle aren't pixel-identical and read as
sketched rather than computer-perfect. This was written as a one-off
Python generator producing raw SVG path data, visually verified via
headless-browser screenshots, then hand-tuned (three recipes — bell, bud,
tulip — were reworked after the first render didn't read clearly as their
intended shape) before being inlined as SVG `<symbol>` markup. Because
they're vector paths, transparency is native — nothing needed matting.

**A note on what was deliberately *not* used:** an earlier direction for
this project referenced a Dreamstime stock-photo composite of vintage
flower illustrations. It was never used as an asset source at any point
— the preview carried a visible "dreamstime" watermark, meaning it's a
paid-license image, not public domain. An earlier build (superseded by
this one) sourced CC0 rawpixel/Openverse botanical illustrations matching
that same species mix instead; this build replaced those raster images
entirely with the procedural vector doodles described above.

## Design-reference tool used

A Google Stitch MCP endpoint (`stitch.googleapis.com`) was used, at the
user's explicit direction and with a user-supplied API key, purely as a
design-reference generator — it produced a mockup screen and an
accompanying design-system spec ("Botanical Ink & Parchment": paper/ink
color tokens, an SVG-mask "liquid ink blob" button technique, layering
rules for background illustrations). That output informed this build's
button implementation and doodle-opacity/z-index rules; no code or asset
from Stitch's output was copied verbatim into the shipped page — it was
used as a mood board, then hand-implemented in `index.html`. The supplied
API key is not stored anywhere in this repository.

## Texture

`assets/tex/grain.png` is a procedurally generated noise tile (random
per-pixel luminance + alpha), not sourced or hand-drawn — a standard
paper-grain-overlay technique, not illustrative content.

## Fonts

Caveat — via Google Fonts (Open Font License).
