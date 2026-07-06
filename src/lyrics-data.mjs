/**
 * Shared timing + content data for "My Sweetheart".
 *
 * Every start/end timestamp here — both each line's and every individual
 * word's — comes from running faster-whisper (word-level timestamps)
 * directly on audio/let-me-call-you-sweetheart.mp3, a 1924 Jubileers
 * vocal-quartet recording of the public-domain 1910 song "Let Me Call You
 * Sweetheart". See ATTRIBUTION.md for the full method. src/main.js plays
 * this data back directly — every visual event on the page derives from
 * these timestamps, nothing is hand-retimed.
 *
 * Visual model — the song plays out as a handwritten love letter: the song
 * divides into SECTIONS at its natural boundaries, each one "page" of the
 * letter (a cameo image + a few lines). Words sit on the page as faint
 * ghosts and fill with ink top-to-bottom exactly while they are sung —
 * wet words shed real running ink drips (src/ink.js). Each section's
 * emotional keyword writes itself across in connected script instead.
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

/**
 * The letter's pages. Each section owns a cameo image (a romantic object,
 * never a literal word-match), the LYRICS lines it shows, and — per line —
 * which word index is the emotional keyword written in connected script
 * (`script`). `enter` is when the page crossfades in: just before its
 * first sung word, never cutting off the previous page's last word.
 * Spoken lines (the vocal group's studio banter) are deliberately not
 * rendered — the letter has no business repeating them.
 */
export const SECTIONS = [
  // Instrumental + banter: the letter opens with its salutation inking on.
  { id:'salutation', enter:0,     img:'rose.png',           alt:'a single rose',
    salutation:{ text:'my sweetheart,', s:4.2, e:9.0 }, lines:[] },
  { id:'chorus-a',   enter:13.4,  img:'rose.png',           alt:'a single rose',
    lines:[2, 3],   script:{ 2:5 } },          // sweetheart
  { id:'love-light', enter:34.2,  img:'candle.png',         alt:'a lit candlestick',
    lines:[4],      script:{ 4:4 } },          // glowing
  { id:'chorus-b',   enter:43.3,  img:'key.png',            alt:'an old key',
    lines:[5],      script:{ 5:4 } },          // sweetheart
  { id:'dreaming',   enter:60.0,  img:'dove.png',           alt:'a white dove',
    lines:[6, 7],   script:{ 6:2 } },          // dreaming
  { id:'moonlight',  enter:79.9,  img:'pearl-necklace.png', alt:'a pearl necklace',
    lines:[8],      script:{ 8:3 } },          // moonlight
  { id:'land-of-love', enter:94.4, img:'rose-bouquet.png',  alt:'a bouquet of roses',
    lines:[9, 10],  script:{ 9:4 } },          // love
  { id:'reprise',    enter:112.0, img:'watch.png',          alt:'a pocket watch',
    lines:[11, 12], script:{ 11:4 } },         // sweetheart
  { id:'love-light-2', enter:133.1, img:'candle.png',       alt:'a lit candlestick',
    lines:[13],     script:{ 13:4 } },         // glowing
  // Holds through the long instrumental tail. Page order = ink order:
  // the last sung line (ends 163), the sign-off (166), then the whispered
  // outro tag (178) as a tiny postscript under the signature.
  { id:'finale',     enter:143.3, img:'ring.png',           alt:'a ring',
    lines:[14],     script:{ 14:4 },
    closing:{ text:'yours, always', s:166.0, e:170.0 },
    postscript:15 },
];

/** End of a section's hold = the next section's enter (last runs to song end). */
export function sectionEnd(idx){
  return idx + 1 < SECTIONS.length ? SECTIONS[idx + 1].enter : TOTAL_DURATION;
}
