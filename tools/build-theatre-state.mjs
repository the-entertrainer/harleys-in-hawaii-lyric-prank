/**
 * Generates assets/theatre-state.json — the pre-authored Theatre.js
 * sequence that src/main.js loads into a plain `@theatre/core` project at
 * runtime (no `@theatre/studio` ships to visitors).
 *
 * Theatre.js's own visual Studio (the mouse-driven keyframe editor) has no
 * display to run against in this environment, and — as of 0.7.2 — there is
 * no supported public API for creating sequenced keyframes from code either
 * (`studio.transaction`'s `set()` only writes *static* overrides unless a
 * prop has already been flagged "sequenced" by Studio's UI; see the
 * still-open https://github.com/theatre-js/theatre/issues/411). So instead
 * of driving a real browser, this writes the on-disk project-state format
 * directly — Theatre.js exports and documents that exact shape as
 * `__UNSTABLE_Project_OnDiskState` for precisely this kind of tooling
 * (its own doc comment on `BasicKeyframedTrack` even says the format
 * "could also be useful for users who manually edit the project state").
 * `@theatre/core` reads it at runtime completely normally — the animation
 * math, easing and interpolation are all real Theatre.js, only the
 * authoring step is code instead of mouse drags.
 *
 * What's sequenced here (each a genuine keyframed track, not per-frame
 * math in the page):
 *  - `line-${i}`      per-line entrance/hold/exit motion + a variable-font
 *                     weight breathe on emotionally central lines
 *  - `asset-${i}`     the handful of curated 2D image accents
 *  - `gap-${key}`     ambient imagery during instrumental gaps
 *  - `intro-vinyl`    fade for the spun-up-front vinyl disc
 *  - `mood`           background hue/warmth crossfade between song sections
 *  - `camera`         a slow cinematic dolly, most active during hero windows
 *  - `hero-${type}`   scale/position for each of the three Three.js glass
 *                     objects (heart / bloom / ribbon), one per chorus/finale
 *
 * Run with: node tools/build-theatre-state.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LYRICS, GAP_ASSETS, INTRO_ASSET, HERO_WINDOWS, COLLAGE_ASSETS, MOODS, TOTAL_DURATION, buildTimeline, VARIANTS } from '../src/lyrics-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let uidCounter = 0;
const uid = () => 'kf' + (uidCounter++).toString(36);

/** Builds one BasicKeyframedTrack from [{position, value}, ...], sorted ascending. */
function makeTrack(points){
  const sorted = [...points].sort((a, b) => a.position - b.position);
  return {
    type: 'BasicKeyframedTrack',
    keyframes: sorted.map((p, i) => ({
      id: uid(),
      position: Math.round(Math.max(0, p.position) * 1000) / 1000,
      value: p.value,
      handles: [0.5, 1, 0.5, 0],
      connectedRight: i < sorted.length - 1,
      type: 'bezier',
    })),
  };
}

const tracksByObject = {};

/** propPoints: { propName: [{position, value}, ...] } */
function addObject(objectKey, propPoints){
  const trackIdByPropPath = {};
  const trackData = {};
  for (const propName of Object.keys(propPoints)){
    const tid = uid();
    trackIdByPropPath[JSON.stringify([propName])] = tid;
    trackData[tid] = makeTrack(propPoints[propName]);
  }
  tracksByObject[objectKey] = { trackIdByPropPath, trackData };
}

function pushKf(bucket, t, values){
  for (const k in values){
    (bucket[k] || (bucket[k] = [])).push({ position: Math.max(0, t), value: values[k] });
  }
}

/**
 * Six distinct motion recipes, refreshed for a slower, more considered
 * "editorial" feel than the previous build's snappier PowerPoint-adjacent
 * curves: bigger depth cues (blur + scale), longer holds, gentler overshoot.
 */
function lineRecipe(variant){
  const R = {
    rise:   { enter:{x:0,y:130,opacity:0,scale:0.94,rotate:0,blur:9},     exit:{x:0,y:-120,opacity:0,scale:1.04,rotate:0,blur:9} },
    zoom:   { enter:{x:0,y:0,opacity:0,scale:0.62,rotate:0,blur:11},      exit:{x:0,y:0,opacity:0,scale:1.28,rotate:0,blur:11} },
    skew:   { enter:{x:0,y:70,opacity:0,scale:0.93,rotate:-9,blur:6},     exit:{x:0,y:-70,opacity:0,scale:0.98,rotate:7,blur:6} },
    blur:   { enter:{x:0,y:26,opacity:0,scale:1,rotate:0,blur:20},        exit:{x:0,y:-26,opacity:0,scale:1,rotate:0,blur:20} },
    drift:  { enter:{x:-150,y:10,opacity:0,scale:0.97,rotate:-4,blur:4},  exit:{x:150,y:-10,opacity:0,scale:0.97,rotate:4,blur:4} },
    bounce: { enter:{x:0,y:190,opacity:0,scale:0.74,rotate:-3,blur:0},    exit:{x:0,y:-130,opacity:0,scale:1.14,rotate:3,blur:0}, overshoot:{scale:1.06} },
  };
  return R[variant];
}
const ARRIVED = { x:0, y:0, opacity:1, scale:1, rotate:0, blur:0 };
const LEAD = 1.7, FADE = 2.1;

function inHeroWindow(t){
  return HERO_WINDOWS.find(w => t >= w.start && t < w.end);
}

const TIMELINE = buildTimeline(LYRICS, TOTAL_DURATION);
let lineIndex = 0;

TIMELINE.forEach((entry) => {
  if (entry.type === 'gap'){
    const key = entry.start.toFixed(2);
    const cue = GAP_ASSETS[key];
    if (!cue) return;
    const bucket = {};
    const rotate = ((lineIndex * 53) % 17) - 8;
    const span = entry.end - entry.start;
    const holdEnd = entry.start + Math.max(span * 0.6, span - 1.0);
    pushKf(bucket, entry.start + 0.15, {opacity:0, scale:0.5, rotate});
    pushKf(bucket, entry.start + 1.0,  {opacity:0.8, scale:1, rotate});
    pushKf(bucket, holdEnd,            {opacity:0.8, scale:1, rotate});
    pushKf(bucket, entry.end,          {opacity:0, scale:0.66, rotate});
    addObject(`gap-${key}`, bucket);
    return;
  }

  const i = lineIndex++;
  const variant = VARIANTS[i % VARIANTS.length];
  const rec = lineRecipe(variant);
  const bucket = {};

  pushKf(bucket, entry.start - LEAD, rec.enter);
  if (rec.overshoot){
    pushKf(bucket, entry.start + 0.05, Object.assign({}, ARRIVED, rec.overshoot));
    pushKf(bucket, entry.start + 0.4, ARRIVED);
  } else {
    pushKf(bucket, entry.start, ARRIVED);
  }
  pushKf(bucket, entry.end, ARRIVED);
  pushKf(bucket, entry.end + FADE, rec.exit);

  // A variable-font weight breathe on lines that fall inside a hero
  // window — the visual "emphasis" is shared between the type and the
  // glass object behind it, rather than piling more decoration onto the
  // line itself.
  const hero = inHeroWindow(entry.start);
  const midpoint = entry.start + (entry.end - entry.start) / 2;
  if (hero){
    pushKf(bucket, entry.start, { weight: 560 });
    pushKf(bucket, midpoint, { weight: 720 });
    pushKf(bucket, entry.end, { weight: 560 });
  } else {
    pushKf(bucket, entry.start, { weight: 600 });
    pushKf(bucket, entry.end, { weight: 600 });
  }

  addObject(`line-${i}`, bucket);

  if (entry.asset){
    const aBucket = {};
    const staticRotate = ((i * 47) % 13) - 6;
    pushKf(aBucket, entry.start - 0.6, {opacity:0, scale:0.6, rotate:staticRotate});
    pushKf(aBucket, entry.start + 0.5, {opacity:1, scale:1, rotate:staticRotate});
    pushKf(aBucket, entry.end,         {opacity:1, scale:1, rotate:staticRotate});
    pushKf(aBucket, entry.end + 1.3,   {opacity:0, scale:0.75, rotate:staticRotate});
    addObject(`asset-${i}`, aBucket);
  }
});

// Intro vinyl-disc ambience, under the spoken banter before the singing starts.
{
  const bucket = {};
  pushKf(bucket, 0.2, {opacity:0, scale:0.8});
  pushKf(bucket, 1.2, {opacity:0.95, scale:1});
  pushKf(bucket, INTRO_ASSET.end - 1.2, {opacity:0.95, scale:1});
  pushKf(bucket, INTRO_ASSET.end, {opacity:0, scale:0.9});
  addObject('intro-vinyl', bucket);
}

// A musical-note accent right as the spoken banter names "that old love
// song" (5.8s) — the one place in the whole piece where the picture is
// literally what's being said out loud, held through the "Russ?" aside.
{
  const bucket = {};
  pushKf(bucket, 5.3, { opacity:0, scale:0.6, rotate:-6 });
  pushKf(bucket, 6.1, { opacity:0.75, scale:1, rotate:-6 });
  pushKf(bucket, 8.6, { opacity:0.75, scale:1, rotate:-6 });
  pushKf(bucket, 9.4, { opacity:0, scale:0.7, rotate:-6 });
  addObject('intro-notes', bucket);
}

// Background mood — hue/warmth crossfade at each section boundary instead
// of a hard cut, so the whole room's color temperature breathes with the
// lyric instead of looping the same gradient under every line.
{
  const hueBucket = {}, warmthBucket = {};
  MOODS.forEach((mood, idx) => {
    const next = MOODS[idx + 1];
    pushKf(hueBucket, mood.start, { hue: mood.hue });
    pushKf(warmthBucket, mood.start, { warmth: mood.warmth });
    if (next){
      // hold most of the way, then start crossfading ~3s before the next
      // section so the shift reads as a breath, not a jump cut
      const crossStart = Math.max(mood.start, next.start - 3.2);
      pushKf(hueBucket, crossStart, { hue: mood.hue });
      pushKf(warmthBucket, crossStart, { warmth: mood.warmth });
    }
  });
  pushKf(hueBucket, TOTAL_DURATION, { hue: MOODS[MOODS.length - 1].hue });
  pushKf(warmthBucket, TOTAL_DURATION, { warmth: MOODS[MOODS.length - 1].warmth });
  addObject('mood', Object.assign({}, hueBucket, warmthBucket));
}

// Camera — a slow, subtle dolly that only really moves during the three
// hero windows (elsewhere the frame just holds, since there's no glass
// object to give the movement meaning, and a typography-only screen
// shouldn't be jostled for its own sake).
{
  const bucket = {};
  pushKf(bucket, 0, { z: 8, fov: 45, yaw: 0 });
  HERO_WINDOWS.forEach((w, idx) => {
    const dollyStart = w.start - 1.5;
    const mid = (w.start + w.end) / 2;
    const yaw = idx % 2 === 0 ? 0.09 : -0.09;
    pushKf(bucket, Math.max(0, dollyStart), { z: 8, fov: 45, yaw: 0 });
    pushKf(bucket, w.start + 1.5, { z: 6.6, fov: 42, yaw });
    pushKf(bucket, mid, { z: 6.9, fov: 42.5, yaw: -yaw * 0.6 });
    pushKf(bucket, w.end - 1.5, { z: 6.6, fov: 42, yaw });
    pushKf(bucket, w.end, { z: 8, fov: 45, yaw: 0 });
  });
  addObject('camera', bucket);
}

// The three Three.js glass hero objects — one owns each whole
// chorus/finale stanza. Scale-to-zero doubles as visibility (a
// transmissive material doesn't alpha-composite cleanly, so hiding via
// scale avoids any translucency-over-translucency artifacts).
HERO_WINDOWS.forEach((w, idx) => {
  const bucket = {};
  const side = idx % 2 === 0 ? -1 : 1;
  // `x` is a *fraction of the camera's visible half-width* at the hero
  // object's depth (applied in src/main.js using the live camera aspect),
  // not a raw world-unit offset — that's what keeps it pinned to the
  // margin, clear of the centered text column, on every viewport from a
  // narrow phone to an ultrawide monitor instead of just going off-frustum
  // on portrait screens.
  pushKf(bucket, w.start - 1.2, { scale:0, x: side * 0.86, y: 0.3 });
  pushKf(bucket, w.start + 1.6, { scale:1, x: side * 0.74, y: 0.2 });
  pushKf(bucket, (w.start + w.end) / 2, { scale:1.08, x: side * 0.68, y: -0.2 });
  pushKf(bucket, w.end - 1.4, { scale:1, x: side * 0.74, y: 0.2 });
  pushKf(bucket, w.end, { scale:0, x: side * 0.86, y: 0.3 });
  addObject(`hero-${w.type}`, bucket);

  (COLLAGE_ASSETS[w.type] || []).forEach((cue, cIdx) => {
    const cBucket = {};
    const rotate = cIdx === 0 ? -6 : 5;
    pushKf(cBucket, w.start + 0.4, { opacity:0, scale:0.7, rotate });
    pushKf(cBucket, w.start + 2.2, { opacity:0.5, scale:1, rotate });
    pushKf(cBucket, w.end - 2.2,   { opacity:0.5, scale:1, rotate });
    pushKf(cBucket, w.end - 0.2,   { opacity:0, scale:0.8, rotate });
    addObject(`collage-${w.type}-${cIdx}`, cBucket);
  });
});

const state = {
  sheetsById: {
    Lyrics: {
      staticOverrides: { byObject: {} },
      sequence: {
        type: 'PositionalSequence',
        length: Math.ceil(TOTAL_DURATION) + 5,
        subUnitsPerUnit: 30,
        tracksByObject,
      },
    },
  },
  definitionVersion: '0.4.0',
  revisionHistory: [],
};

const outPath = path.join(ROOT, 'public', 'assets', 'theatre-state.json');
fs.writeFileSync(outPath, JSON.stringify(state));
console.log('wrote', outPath, fs.statSync(outPath).size, 'bytes,', Object.keys(tracksByObject).length, 'objects');
