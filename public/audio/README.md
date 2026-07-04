# Audio

`let-me-call-you-sweetheart.mp3` is a 1924 Jubileers vocal-quartet recording
of the public-domain 1910 song "Let Me Call You Sweetheart," digitized and
hosted by the Internet Archive. It's committed to this repo (not gitignored)
— see `ATTRIBUTION.md` for the exact source and rights status.

`index.html`'s `<audio>` element points straight at this file, so nothing
else needs to change if you keep the same song.

## Swapping in a different song

1. Drop your MP3 here (`public/audio/`) and update the `<audio src>` in `index.html`.
2. Get real word-level timestamps (`faster-whisper` with `word_timestamps=True`
   is what produced the ones in `src/lyrics-data.mjs` — see `ATTRIBUTION.md` for
   the exact snippet) and update the `LYRICS` array in `src/lyrics-data.mjs`.
3. Re-run `npm run build:theatre` to regenerate `public/assets/theatre-state.json`
   from the new timing data.
