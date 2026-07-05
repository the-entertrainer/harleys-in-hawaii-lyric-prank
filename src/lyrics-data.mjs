/**
 * Shared timing + content data for "My Sweetheart".
 *
 * Every start/end timestamp here — both each line's and every individual
 * word's — comes from running faster-whisper (word-level timestamps)
 * directly on audio/let-me-call-you-sweetheart.mp3, a 1924 Jubileers
 * vocal-quartet recording of the public-domain 1910 song "Let Me Call You
 * Sweetheart". See ATTRIBUTION.md for the full method. This module is
 * imported by both tools/build-theatre-state.mjs (which authors the
 * Theatre.js keyframes from it) and src/main.js (which plays it back), so
 * the two never drift apart.
 *
 * Visual model — the song plays out as a broadcast on a 3D vintage TV's CRT
 * screen (src/scene/tvScene.js + src/scene/tvScreen.js): the song divides
 * into SCENES at section boundaries, each a fixed lower-third title card
 * that BUILDS IN ONCE and HOLDS — chunky display type accumulating
 * word-by-word as the words are actually sung (typewriter-style, nothing
 * ever flies through), one large photographic anchor object behind it, and
 * the word "sweetheart" (or the scene's emotional keyword) drawing itself
 * in script. At the next section the screen crossfades to the next card.
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

// Every decorative image is a real, licensed, transparent-background PNG —
// a genuine photograph with its background removed (Adobe Stock + Photoshop
// API cutout), not an illustration. See ATTRIBUTION.md for each source.
export function assetPath(name){
  return `assets/photo/${name}`;
}

// The permanent caption pinned at the top of every poster — the sender's
// own aside, taken verbatim from their reference design. It types on at
// the very start and never leaves.
export const CAPTION = {
  text: "(SENDING YOU THIS AS I DON'T KNOW HOW TO FLIRT)",
  start: 0.6,
  end: 2.6,
};

/**
 * The poster scenes. `enter` is when the scene's crossfade begins —
 * computed as max(previous line's end - 0.4, own first word - 1.3) so a
 * still-being-sung word is never cut off, but the poster is standing
 * before its first word arrives. A scene holds until the next scene's
 * `enter` (the last until TOTAL_DURATION).
 *
 * `anchor` is the scene's one large photographic cutout. It renders
 * INSIDE a flex zone between the headline and the script, sized by
 * max-width (`w`, % of the poster column) and the zone's own height — so
 * it geometrically cannot collide with the text on any viewport. The two
 * deliberate overlaps the reference design uses are explicit, bounded
 * parameters instead: `kiss` (dvh the image may tuck up behind the
 * headline) and `overlap` (dvh the script may sit over the anchor's dark
 * base). `x` is a lateral % offset; `rot` a resting tilt.
 *
 * `slots` map word ranges of LYRICS lines onto the poster's fixed text
 * areas — 'headline' (chunky display, upper third), 'script' (the flowing
 * script word over the anchor's base), 'sub' (smaller lines in the gold
 * lower area), 'spoken' (small caps, intro banter / whispered outro).
 * Words accumulate as sung; nothing is ever removed until the scene ends.
 */
export const SCENES = [
  { id:'intro', enter:0, hue:6, warmth:0.55,
    anchor:{ img:'vinyl.png', w:64, x:0, rot:-8, kiss:4, overlap:2 },
    slots:[
      { type:'spoken', line:0 },
      { type:'spoken', line:1 },
    ] },
  { id:'chorus-a', enter:13.4, hue:8, warmth:0.6,
    anchor:{ img:'gramophone.png', w:82, x:-4, rot:0, kiss:5, overlap:7 },
    slots:[
      { type:'headline', line:2, from:0, to:4 },   // Oh, let me call you
      { type:'script',   line:2, from:5, to:5 },   // sweetheart
      { type:'sub',      line:2, from:6, to:10 },  // I'm in love with you
      { type:'sub',      line:3, from:0, to:9 },   // Let me hear you whisper that you love me too
    ] },
  { id:'love-light', enter:34.22, hue:12, warmth:0.65,
    anchor:{ img:'candle.png', w:40, x:6, rot:0, kiss:5, overlap:0 },
    slots:[
      { type:'headline', line:4, from:0, to:3 },   // Keep the love light
      { type:'script',   line:4, from:4, to:4 },   // glowing
      { type:'sub',      line:4, from:5, to:9 },   // in your eyes so true
    ] },
  { id:'chorus-b', enter:43.32, hue:9, warmth:0.62,
    anchor:{ img:'rotary-phone.png', w:92, x:0, rot:0, kiss:5, overlap:6 },
    slots:[
      { type:'headline', line:5, from:0, to:3 },   // Let me call you
      { type:'script',   line:5, from:4, to:4 },   // sweetheart
      { type:'sub',      line:5, from:5, to:9 },   // I'm in love with you
    ] },
  { id:'dreaming', enter:60.06, hue:14, warmth:0.58,
    anchor:{ img:'dove.png', w:76, x:2, rot:0, kiss:4, overlap:0 },
    slots:[
      { type:'headline', line:6, from:0, to:2 },   // I am dreaming
      { type:'script',   line:6, from:3, to:3 },   // dear
      { type:'sub',      line:6, from:4, to:8 },   // of you day by day
      { type:'sub',      line:7, from:0, to:8 },   // Dreaming when the skies are blue...
    ] },
  { id:'moonlight', enter:79.94, hue:5, warmth:0.5,
    anchor:{ img:'pearl-necklace.png', w:82, x:0, rot:0, kiss:5, overlap:0 },
    slots:[
      { type:'headline', line:8, from:0, to:2 },   // When the silvery
      { type:'script',   line:8, from:3, to:3 },   // moonlight
      { type:'sub',      line:8, from:4, to:10 },  // gleams, still I wander on in dreams
    ] },
  { id:'land-of-love', enter:94.4, hue:12, warmth:0.68,
    anchor:{ img:'typewriter.png', w:84, x:0, rot:0, kiss:5, overlap:6 },
    slots:[
      { type:'headline', line:9, from:0, to:3 },   // In a land of
      { type:'script',   line:9, from:4, to:4 },   // love
      { type:'sub',      line:9, from:5, to:6 },   // it seems
      { type:'sub',      line:10, from:0, to:5 },  // Just with you, just with you
    ] },
  { id:'chorus-reprise', enter:112.02, hue:9, warmth:0.66,
    anchor:{ img:'rose-bouquet.png', w:60, x:-2, rot:0, kiss:5, overlap:2 },
    slots:[
      { type:'headline', line:11, from:0, to:3 },  // Let me call you
      { type:'script',   line:11, from:4, to:4 },  // sweetheart
      { type:'sub',      line:11, from:5, to:9 },  // I'm in love with you
      { type:'sub',      line:12, from:0, to:9 },  // Let me hear you whisper that you love me too
    ] },
  { id:'love-light-2', enter:133.12, hue:13, warmth:0.72,
    anchor:{ img:'ring.png', w:50, x:0, rot:0, kiss:4, overlap:0 },
    slots:[
      { type:'headline', line:13, from:0, to:3 },  // Keep the love light
      { type:'script',   line:13, from:4, to:4 },  // glowing
      { type:'sub',      line:13, from:5, to:9 },  // in your eyes so true
    ] },
  { id:'finale', enter:143.32, hue:16, warmth:0.85,
    anchor:{ img:'gramophone.png', w:80, x:-4, rot:0, kiss:5, overlap:7 },
    slots:[
      { type:'headline', line:14, from:0, to:3 },  // Let me call you
      { type:'script',   line:14, from:4, to:4 },  // sweetheart
      { type:'sub',      line:14, from:5, to:9 },  // I'm in love with you
      { type:'spoken',   line:15 },                // the whispered outro tag
    ] },
];

/** End of a scene's hold = the next scene's enter (last runs to song end). */
export function sceneEnd(idx){
  return idx + 1 < SCENES.length ? SCENES[idx + 1].enter : TOTAL_DURATION;
}
