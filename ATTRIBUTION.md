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

Every timestamp in the `LYRICS` array in `index.html` was produced by running
[faster-whisper](https://github.com/SYSTRAN/faster-whisper) (word-level
timestamps) directly on the recording above, then checked against the
printed 1910 lyric sheet. It's transcription-grounded to the actual
waveform, not hand-guessed.

## Clip art

All illustrations in `assets/clipart/` are CC0-licensed, sourced via the
[Openverse](https://openverse.org) aggregator (mostly rawpixel.com's public
domain vintage-illustration collection, several of which are themselves
digitized from 19th/early-20th-century engravings on openclipart.org).
The as-served files had a checkerboard baked into the raster as a "this is
transparent" preview indicator rather than real alpha; a small local script
(luminance-threshold + border-connected flood fill) reconstructed genuine
transparency before these were saved into the repo. No illustration here
was hand-drawn or AI-generated — all are sourced, public-domain source
material, only background-matted programmatically.

## Texture

`assets/tex/grain.png` is a procedurally generated noise tile (random
per-pixel luminance + alpha), not sourced or hand-drawn — standard
film-grain-overlay technique, not illustrative content.

## Fonts

Bodoni Moda, Cormorant Garamond, and Courier Prime — all via Google Fonts
(Open Font License).
