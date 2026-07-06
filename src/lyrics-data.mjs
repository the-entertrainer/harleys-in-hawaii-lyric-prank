/**
 * Shared timing + content data for "My Sweetheart".
 *
 * Every start/end timestamp here — both each line's and every individual
 * word's — comes from running faster-whisper (word-level timestamps)
 * directly on audio/let-me-call-you-sweetheart.mp3, a 1924 Jubileers
 * vocal-quartet recording of the public-domain 1910 song "Let Me Call You
 * Sweetheart". See ATTRIBUTION.md for the full method. src/main.js builds
 * the whole edition (word cues, plates, figures) from this module alone.
 *
 * Visual model — "The Sweetheart Edition": the song is typeset live as a
 * fine-press love letter. The viewport is a sheet of paper with a printed
 * grid (masthead, hairline trim, folio). The song divides into PLATES at
 * its section boundaries; each plate is one editorial spread whose display
 * headline rises word-by-word out of masked slots at the words' real sung
 * timestamps, whose emotional keyword inks itself on in italic (clip-path
 * wipe + a hand-drawn swash underline), and whose public-domain ink
 * illustration is printed into the paper as a captioned figure. A finished
 * spread HOLDS like a printed page until the next plate is pulled.
 */

export const TOTAL_DURATION = 179.4; // ffprobe-measured file duration

export const LYRICS = [
  { start: 3.10, end: 7.60, type:'spoken', words:[{w:"How",s:3.10,e:3.70}, {w:"about",s:3.70,e:3.96}, {w:"some",s:3.96,e:4.16}, {w:"close",s:4.16,e:4.46}, {w:"harmony",s:4.46,e:4.84}, {w:"on",s:4.84,e:5.12}, {w:"that",s:5.12,e:5.28}, {w:"old",s:5.28,e:5.48}, {w:"love",s:5.48,e:5.80}, {w:"song",s:5.80,e:6.12}, {w:"Let",s:6.12,e:6.40}, {w:"Me",s:6.40,e:6.58}, {w:"Call",s:6.58,e:6.88}, {w:"You",s:6.88,e:7.06}, {w:"Sweetheart?",s:7.06,e:7.60}] },
  { start: 7.80, end: 9.00, type:'spoken', words:[{w:"Where's",s:7.80,e:8.12}, {w:"our",s:8.12,e:8.24}, {w:"pitch",s:8.24,e:8.40}, {w:"on",s:8.40,e:8.66}, {w:"that,",s:8.66,e:8.82}, {w:"Russ?",s:8.84,e:9.00}] },
  { start: 14.70, end: 22.90, section:'Chorus', words:[{w:"Oh,",s:14.70,e:15.30}, {w:"let",s:15.30,e:15.90}, {w:"me",s:15.90,e:16.62}, {w:"call",s:16.62,e:17.22}, {w:"you",s:17.22,e:17.68}, {w:"sweetheart",s:17.68,e:18.32}, {w:"I'm",s:18.32,e:19.70}, {w:"in",s:19.70,e:19.88}, {w:"love",s:19.88,e:20.64}, {w:"with",s:20.64,e:21.74}, {w:"you",s:21.74,e:22.90}] },
  { start: 22.90, end: 31.16, words:[{w:"Let",s:22.90,e:24.78}, {w:"me",s:24.78,e:25.18}, {w:"hear",s:25.18,e:25.86}, {w:"you",s:25.86,e:26.18}, {w:"whisper",s:26.18,e:26.72}, {w:"that",s:26.72,e:28.00}, {w:"you",s:28.00,e:28.32}, {w:"love",s:28.32,e:29.22}, {w:"me",s:29.22,e:30.10}, {w:"too",s:30.10,e:31.16}] },
  { start: 35.52, end: 43.72, words:[{w:"Keep",s:35.52,e:36.92}, {w:"the",s:36.92,e:37.24}, {w:"love",s:37.24,e:37.80}, {w:"light",s:37.80,e:38.28}, {w:"glowing",s:38.28,e:38.92}, {w:"in",s:38.92,e:40.08}, {w:"your",s:40.08,e:40.44}, {w:"eyes",s:40.44,e:41.58}, {w:"so",s:41.58,e:42.34}, {w:"true",s:42.34,e:43.72}] },
  { start: 43.72, end: 58.42, words:[{w:"Let",s:43.72,e:45.94}, {w:"me",s:45.94,e:46.48}, {w:"call",s:46.48,e:47.42}, {w:"you",s:47.42,e:47.86}, {w:"sweetheart",s:47.86,e:48.92}, {w:"I'm",s:48.92,e:53.06}, {w:"in",s:53.06,e:53.42}, {w:"love",s:53.42,e:54.76}, {w:"with",s:54.76,e:56.36}, {w:"you",s:56.36,e:58.42}] },
  { start: 61.36, end: 70.60, section:'Verse', words:[{w:"I",s:61.36,e:62.76}, {w:"am",s:62.76,e:63.38}, {w:"dreaming",s:63.38,e:64.24}, {w:"dear",s:64.24,e:65.22}, {w:"of",s:65.22,e:65.82}, {w:"you",s:65.82,e:66.46}, {w:"day",s:66.46,e:67.78}, {w:"by",s:67.78,e:68.54}, {w:"day",s:68.54,e:70.60}] },
  { start: 70.60, end: 80.34, words:[{w:"Dreaming",s:70.60,e:73.18}, {w:"when",s:73.18,e:73.66}, {w:"the",s:73.66,e:74.28}, {w:"skies",s:74.28,e:74.70}, {w:"are",s:74.70,e:75.60}, {w:"blue,",s:75.60,e:76.26}, {w:"when",s:76.86,e:77.70}, {w:"they're",s:77.70,e:79.38}, {w:"gray",s:79.38,e:80.34}] },
  { start: 80.34, end: 93.38, words:[{w:"When",s:80.34,e:82.46}, {w:"the",s:82.46,e:83.20}, {w:"silvery",s:83.20,e:84.38}, {w:"moonlight",s:84.38,e:85.30}, {w:"gleams,",s:85.30,e:87.64}, {w:"still",s:87.80,e:88.82}, {w:"I",s:88.82,e:89.54}, {w:"wander",s:89.54,e:90.54}, {w:"on",s:90.54,e:91.74}, {w:"in",s:91.74,e:92.40}, {w:"dreams",s:92.40,e:93.38}] },
  { start: 95.70, end: 101.72, words:[{w:"In",s:95.70,e:97.10}, {w:"a",s:97.10,e:97.42}, {w:"land",s:97.42,e:98.20}, {w:"of",s:98.20,e:98.60}, {w:"love",s:98.60,e:99.60}, {w:"it",s:99.60,e:99.98}, {w:"seems",s:99.98,e:101.72}] },
  { start: 101.72, end: 110.88, words:[{w:"Just",s:101.72,e:103.58}, {w:"with",s:103.58,e:105.02}, {w:"you,",s:105.02,e:106.74}, {w:"just",s:106.74,e:108.02}, {w:"with",s:108.02,e:109.38}, {w:"you",s:109.38,e:110.88}] },
  { start: 113.32, end: 121.24, section:'Chorus (reprise)', words:[{w:"Let",s:113.32,e:114.72}, {w:"me",s:114.72,e:115.30}, {w:"call",s:115.30,e:115.92}, {w:"you",s:115.92,e:116.32}, {w:"sweetheart",s:116.32,e:116.92}, {w:"I'm",s:116.92,e:118.34}, {w:"in",s:118.34,e:118.48}, {w:"love",s:118.48,e:119.24}, {w:"with",s:119.24,e:120.38}, {w:"you",s:120.38,e:121.24}] },
  { start: 121.24, end: 130.34, words:[{w:"Let",s:121.24,e:123.30}, {w:"me",s:123.30,e:123.72}, {w:"hear",s:123.72,e:124.34}, {w:"you",s:124.34,e:124.70}, {w:"whisper",s:124.70,e:125.36}, {w:"that",s:125.36,e:126.52}, {w:"you",s:126.52,e:126.88}, {w:"love",s:126.88,e:127.72}, {w:"me",s:127.72,e:128.72}, {w:"too",s:128.72,e:130.34}] },
  { start: 134.42, end: 142.44, words:[{w:"Keep",s:134.42,e:135.82}, {w:"the",s:135.82,e:136.16}, {w:"love",s:136.16,e:136.62}, {w:"light",s:136.62,e:137.14}, {w:"glowing",s:137.14,e:137.80}, {w:"in",s:137.80,e:138.94}, {w:"your",s:138.94,e:139.36}, {w:"eyes",s:139.36,e:140.52}, {w:"so",s:140.52,e:141.30}, {w:"true",s:141.30,e:142.44}] },
  { start: 144.62, end: 163.08, fx:'fx-finale', words:[{w:"Let",s:144.62,e:146.02}, {w:"me",s:146.02,e:146.66}, {w:"call",s:146.66,e:147.64}, {w:"you",s:147.64,e:148.44}, {w:"sweetheart",s:148.44,e:150.52}, {w:"I'm",s:150.52,e:155.38}, {w:"in",s:155.38,e:155.94}, {w:"love",s:155.94,e:157.52}, {w:"with",s:157.52,e:159.98}, {w:"you",s:159.98,e:163.08}] },
  { start: 177.98, end: 179.38, section:'Outro', fx:'fx-finale', words:[{w:"Let",s:177.98,e:178.12}, {w:"me",s:178.12,e:178.26}, {w:"hear",s:178.26,e:178.40}, {w:"you",s:178.40,e:178.54}, {w:"whisper",s:178.54,e:178.68}, {w:"that",s:178.68,e:178.82}, {w:"you",s:178.82,e:178.96}, {w:"love",s:178.96,e:179.10}, {w:"me",s:179.10,e:179.24}, {w:"too",s:179.24,e:179.38}] },
];

// Every plate figure is a public-domain ink illustration (the Pearson
// Scott Foresman archive on Wikimedia Commons — single-subject line
// drawings, one consistent hand across the whole set), processed into
// letterpress-ink-on-transparent WebP by tools noted in ATTRIBUTION.md.
export function assetPath(name){
  return `assets/figures/${name}`;
}

// The sender's own aside — the standfirst printed under the cover title,
// and the running line in the masthead while the plates are up.
export const CAPTION = {
  text: "(sending you this as I don't know how to flirt)",
  start: 0.6,
  end: 2.6,
};

/**
 * The plates of the edition. `enter` is when the plate turn begins —
 * computed as max(previous line's end - 0.4, own first word - 1.3) so a
 * still-being-sung word is never cut off, but the new spread is standing
 * before its first word arrives. A plate holds until the next plate's
 * `enter` (the last until TOTAL_DURATION); the colophon replaces the last
 * plate when the recording ends.
 *
 * Each plate maps word ranges of LYRICS lines onto the spread's fixed
 * text roles:
 *  - `headline`: display serif, rises word-by-word out of masked slots
 *  - `kw`: the emotional keyword — italic, fountain-pen blue, revealed by
 *    an ink wipe, then a swash underline draws itself. `kwAfter:true`
 *    keeps it on the same visual line as the headline's tail.
 *  - `deck`: the smaller serif deck. Unsung words wait as ghosts and ink
 *    themselves at their sung timestamp.
 *  - `spoken`: mono small-caps apparatus lines (intro banter, the
 *    whispered outro tag).
 * Words accumulate as sung; nothing is removed until the plate turns.
 *
 * `fig` is the plate's one ink illustration — chosen for the *meaning* of
 * the plate's line (the call, the love light, the serenade, the skies,
 * the silvery moon, the turtle dove, the whisper written, the lantern, a
 * single rose) — printed into the paper via multiply blend (style.css).
 * `size` picks a bounded width tier — the figure lives in its own grid
 * column (portrait: its own row), so it geometrically cannot collide
 * with the text on any viewport.
 */
export const PLATES = [
  { id:'prologue', enter:0, roman:'I', section:'Prologue', cover:true,
    spoken:[ { line:0 }, { line:1 } ] },
  { id:'chorus', enter:13.4, roman:'II', section:'The Chorus',
    fig:{ img:'bell.webp', size:'md', caption:'The Call' },
    headline:{ line:2, from:0, to:4 },            // Oh, let me call you
    kw:{ line:2, at:5 },                          // sweetheart
    deck:[ { line:2, from:6, to:10 }, { line:3, from:0, to:9 } ] },
  { id:'love-light', enter:34.22, roman:'III', section:'The Love Light',
    fig:{ img:'sconce.webp', size:'sm', caption:'The Love Light' },
    headline:{ line:4, from:0, to:3 },            // Keep the love light
    kw:{ line:4, at:4 },                          // glowing
    deck:[ { line:4, from:5, to:9 } ] },
  { id:'chorus-b', enter:43.32, roman:'IV', section:'Chorus, again',
    fig:{ img:'lyre.webp', size:'md', caption:'The Serenade' },
    headline:{ line:5, from:0, to:3 },            // Let me call you
    kw:{ line:5, at:4 },                          // sweetheart
    deck:[ { line:5, from:5, to:9 } ] },
  { id:'dreaming', enter:60.06, roman:'V', section:'The Verse · Dreaming',
    fig:{ img:'clouds.webp', size:'lg', caption:'Skies, Blue or Gray' },
    headline:{ line:6, from:0, to:2 },            // I am dreaming
    kw:{ line:6, at:3, kwAfter:true },            // dear
    deck:[ { line:6, from:4, to:8 }, { line:7, from:0, to:8 } ] },
  { id:'moonlight', enter:79.94, roman:'VI', section:'The Verse · Moonlight',
    fig:{ img:'moon.webp', size:'md', caption:'The Silvery Moon' },
    headline:{ line:8, from:0, to:2 },            // When the silvery
    kw:{ line:8, at:3 },                          // moonlight
    deck:[ { line:8, from:4, to:10 } ] },
  { id:'land-of-love', enter:94.4, roman:'VII', section:'A Land of Love',
    fig:{ img:'turtle-dove.webp', size:'lg', caption:'The Turtle Dove' },
    headline:{ line:9, from:0, to:3 },            // In a land of
    kw:{ line:9, at:4, kwAfter:true },            // love
    deck:[ { line:9, from:5, to:6 }, { line:10, from:0, to:5 } ] },
  { id:'reprise', enter:112.02, roman:'VIII', section:'The Reprise',
    fig:{ img:'quill.webp', size:'md', caption:'The Whisper, Written' },
    headline:{ line:11, from:0, to:3 },           // Let me call you
    kw:{ line:11, at:4 },                         // sweetheart
    deck:[ { line:11, from:5, to:9 }, { line:12, from:0, to:9 } ] },
  { id:'love-light-2', enter:133.12, roman:'IX', section:'The Love Light, again',
    fig:{ img:'lantern.webp', size:'sm', caption:'The Lantern' },
    headline:{ line:13, from:0, to:3 },           // Keep the love light
    kw:{ line:13, at:4 },                         // glowing
    deck:[ { line:13, from:5, to:9 } ] },
  { id:'finale', enter:143.32, roman:'X', section:'The Finale',
    fig:{ img:'rose.webp', size:'md', caption:'A Single Rose' },
    headline:{ line:14, from:0, to:3 },           // Let me call you
    kw:{ line:14, at:4 },                         // sweetheart
    deck:[ { line:14, from:5, to:9 } ],
    spoken:[ { line:15 } ] },                     // the whispered outro tag
];

/** End of a plate's hold = the next plate's enter (last runs to song end). */
export function plateEnd(idx){
  return idx + 1 < PLATES.length ? PLATES[idx + 1].enter : TOTAL_DURATION;
}
