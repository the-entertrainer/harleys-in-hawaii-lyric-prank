/**
 * Generates assets/theatre-state.json — the pre-authored Theatre.js
 * sequence that index.html loads into a plain `@theatre/core` project at
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
 * Run with: node tools/build-theatre-state.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LYRICS, GAP_ASSETS, INTRO_ASSET, TOTAL_DURATION, buildTimeline, VARIANTS } from '../lyrics-data.mjs';

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

function lineRecipe(variant){
  const R = {
    rise:   { enter:{x:0,y:170,opacity:0,scale:0.92,rotate:0,blur:5},    exit:{x:0,y:-170,opacity:0,scale:1.05,rotate:0,blur:5} },
    zoom:   { enter:{x:0,y:0,opacity:0,scale:0.5,rotate:0,blur:7},      exit:{x:0,y:0,opacity:0,scale:1.4,rotate:0,blur:7} },
    skew:   { enter:{x:0,y:90,opacity:0,scale:0.9,rotate:-14,blur:3},   exit:{x:0,y:-90,opacity:0,scale:0.98,rotate:11,blur:3} },
    blur:   { enter:{x:0,y:40,opacity:0,scale:1,rotate:0,blur:16},      exit:{x:0,y:-40,opacity:0,scale:1,rotate:0,blur:16} },
    drift:  { enter:{x:-190,y:16,opacity:0,scale:0.95,rotate:-7,blur:2},exit:{x:190,y:-16,opacity:0,scale:0.95,rotate:7,blur:2} },
    bounce: { enter:{x:0,y:230,opacity:0,scale:0.68,rotate:-5,blur:0},  exit:{x:0,y:-150,opacity:0,scale:1.18,rotate:5,blur:0}, overshoot:{scale:1.09} },
  };
  return R[variant];
}
const ARRIVED = {x:0, y:0, opacity:1, scale:1, rotate:0, blur:0};
const LEAD = 1.6, FADE = 2.0;

function pushKf(bucket, t, values){
  for (const k in values){
    (bucket[k] || (bucket[k] = [])).push({ position: Math.max(0, t), value: values[k] });
  }
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
    pushKf(bucket, entry.start + 0.15, {opacity:0, scale:0.55, rotate});
    pushKf(bucket, entry.start + 0.9,  {opacity:0.85, scale:1, rotate});
    pushKf(bucket, holdEnd,            {opacity:0.85, scale:1, rotate});
    pushKf(bucket, entry.end,          {opacity:0, scale:0.7, rotate});
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
    pushKf(bucket, entry.start + 0.35, ARRIVED);
  } else {
    pushKf(bucket, entry.start, ARRIVED);
  }
  pushKf(bucket, entry.end, ARRIVED);
  pushKf(bucket, entry.end + FADE, rec.exit);
  addObject(`line-${i}`, bucket);

  if (entry.asset){
    const aBucket = {};
    const staticRotate = ((i * 47) % 13) - 6;
    const holdOpacity = entry.tier === 'ambient' ? 0.6 : 1;
    pushKf(aBucket, entry.start - 0.6, {opacity:0, scale:0.6, rotate:staticRotate});
    pushKf(aBucket, entry.start + 0.5, {opacity:holdOpacity, scale:1, rotate:staticRotate});
    pushKf(aBucket, entry.end,         {opacity:holdOpacity, scale:1, rotate:staticRotate});
    pushKf(aBucket, entry.end + 1.3,   {opacity:0, scale:0.75, rotate:staticRotate});
    addObject(`asset-${i}`, aBucket);
  }
});

// Intro vinyl-record ambience, under the spoken banter before the singing starts.
{
  const bucket = {};
  pushKf(bucket, 0.2, {opacity:0, scale:0.8});
  pushKf(bucket, 1.2, {opacity:0.9, scale:1});
  pushKf(bucket, INTRO_ASSET.end - 1.2, {opacity:0.9, scale:1});
  pushKf(bucket, INTRO_ASSET.end, {opacity:0, scale:0.9});
  addObject('intro-vinyl', bucket);
}

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

const outPath = path.join(ROOT, 'assets', 'theatre-state.json');
fs.writeFileSync(outPath, JSON.stringify(state));
console.log('wrote', outPath, fs.statSync(outPath).size, 'bytes,', Object.keys(tracksByObject).length, 'objects');
