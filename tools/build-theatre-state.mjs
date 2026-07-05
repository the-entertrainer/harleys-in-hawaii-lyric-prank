/**
 * Generates public/assets/theatre-state.json — the pre-authored Theatre.js
 * sequence that src/main.js loads into a plain `@theatre/core` project at
 * runtime (no `@theatre/studio` ships to visitors).
 *
 * Theatre.js's own visual Studio (the mouse-driven keyframe editor) has no
 * display to run against in this environment, and — as of 0.7.2 — there is
 * no supported public API for creating sequenced keyframes from code either
 * (`studio.transaction()`'s `set()` only writes *static* overrides unless a
 * prop has already been flagged "sequenced" by Studio's UI; see the
 * still-open https://github.com/theatre-js/theatre/issues/411). So instead
 * of driving a real browser, this writes the on-disk project-state format
 * directly — Theatre.js exports and documents that exact shape as
 * `__UNSTABLE_Project_OnDiskState` for precisely this kind of tooling.
 * `@theatre/core` reads it at runtime completely normally — the animation
 * math, easing and interpolation are all real Theatre.js, only the
 * authoring step is code instead of mouse drags.
 *
 * What's sequenced here (each a genuine keyframed track):
 *  - `scene-${i}`      the poster's group fade/slide at its boundaries
 *  - `anchor-${i}`     the photographic anchor: rise-in like the reference
 *                      (from below, easing out over ~1.1s), then a gentle
 *                      idle float for the whole hold so the poster stays
 *                      alive without ever leaving its pose
 *  - `mood`            background hue/warmth crossfade between scenes
 *  - `caption`         the pinned top caption's one-time fade-in
 *  - `camera`          shot cuts + slow dolly drift + a close-up punch-in
 *                      on each scene's emotional (script) word
 *
 * The word-by-word typewriter reveal deliberately does NOT live here — a
 * letter appearing at its sung timestamp is discrete state, not a tweened
 * value (see the doc comment on main() in src/main.js).
 *
 * Run with: node tools/build-theatre-state.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LYRICS, SCENES, sceneEnd, CAPTION, TOTAL_DURATION } from '../src/lyrics-data.mjs';

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

const FADE_IN = 0.8;   // scene crossfade up
const FADE_OUT = 0.7;  // scene fade down, overlapping the next scene's rise
const RISE = 1.1;      // anchor rise-in duration, matching the reference's build

SCENES.forEach((scene, i) => {
  const start = scene.enter;
  const end = sceneEnd(i);
  const isLast = i === SCENES.length - 1;

  // Poster group: fade in at its boundary, hold, fade out over the next
  // scene's entrance (the crossfade the reference-style cut needs). The
  // final scene never exits — the ended-state finale card covers it.
  {
    const g = {};
    pushKf(g, start, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 26 });
    pushKf(g, start + FADE_IN, { opacity: 1, y: 0 });
    if (!isLast){
      pushKf(g, end, { opacity: 1, y: 0 });
      pushKf(g, end + FADE_OUT, { opacity: 0, y: -30 });
    }
    addObject(`scene-${i}`, g);
  }

  // Anchor: rises from below with a fade (exactly the reference's
  // gramophone entrance), settles, then floats gently for the whole hold.
  {
    const a = {};
    const arriveAt = start + 0.25 + RISE;
    pushKf(a, start + 0.25, { opacity: 0, y: 90, rot: scene.anchor.rot - 3 });
    pushKf(a, arriveAt, { opacity: 1, y: 0, rot: scene.anchor.rot });
    // Idle float: alternate a small dip every ~3.2s until the scene ends.
    let t = arriveAt;
    let phase = 0;
    while (t + 3.2 < end){
      t += 3.2;
      phase ^= 1;
      pushKf(a, t, { y: phase ? -8 : 0, rot: scene.anchor.rot + (phase ? 1.2 : -0.8) });
    }
    pushKf(a, end, { opacity: 1 });
    addObject(`anchor-${i}`, a);
  }
});

// Camera — a small repertoire of shots (wide, two three-quarter angles, a
// low angle) cycled scene to scene so consecutive scenes never repeat the
// same framing, cut to at each scene boundary, with a slow continuous
// dolly drift during the hold (matching the song's own slow rhythm) and a
// push-in to a tight close-up on each scene's emotional/script word — the
// moment the on-screen text most deserves the emphasis.
{
  const DEG = Math.PI / 180;
  const SHOTS = [
    { yaw: 0, pitch: 0, distanceMul: 1.00 },
    { yaw: -16 * DEG, pitch: 3 * DEG, distanceMul: 0.90 },
    { yaw: 15 * DEG, pitch: -2 * DEG, distanceMul: 0.92 },
    { yaw: -6 * DEG, pitch: -7 * DEG, distanceMul: 0.97 },
  ];
  const CUT = 0.06; // near-instant swap between two keyframes = a hard cut
  const cam = {};

  SCENES.forEach((scene, i) => {
    const start = scene.enter;
    const end = sceneEnd(i);
    const shot = SHOTS[i % SHOTS.length];

    if (i === 0){
      pushKf(cam, 0, shot);
    } else {
      pushKf(cam, start - CUT, SHOTS[(i - 1) % SHOTS.length]);
      pushKf(cam, start, shot);
    }

    // Slow dolly during the hold — a gentle continued push driven by the
    // scene's own duration rather than a fixed rate, so it always resolves
    // by the time the next cut arrives.
    const hold = end - start;
    if (hold > 4){
      pushKf(cam, start + hold * 0.6, {
        yaw: shot.yaw + (i % 2 === 0 ? 1 : -1) * 2.5 * DEG,
        pitch: shot.pitch,
        distanceMul: Math.max(shot.distanceMul - 0.07, 0.8),
      });
    }

    // Push in tight on the scene's emotional word (the connected-script
    // slot — "sweetheart," "glowing," "moonlight," etc.) while it inks on,
    // then ease back out for the sub-lines that follow.
    const scriptSlot = scene.slots.find(s => s.type === 'script');
    if (scriptSlot){
      const word = LYRICS[scriptSlot.line].words[scriptSlot.from ?? 0];
      const wordEnd = Math.max(word.e, word.s + 1.0);
      pushKf(cam, word.s - 0.35, shot);
      pushKf(cam, word.s + 0.2, { yaw: shot.yaw * 0.25, pitch: shot.pitch * 0.25, distanceMul: 0.52 });
      pushKf(cam, wordEnd + 0.6, { yaw: shot.yaw * 0.25, pitch: shot.pitch * 0.25, distanceMul: 0.52 });
      pushKf(cam, wordEnd + 1.5, shot);
    }
  });

  // After the last lyric, hold, then a slow final push-in as the closing
  // "Made with love" card takes over the screen (the sequence's extra 5s
  // of runway past TOTAL_DURATION exists for exactly this).
  const lastShot = SHOTS[(SCENES.length - 1) % SHOTS.length];
  pushKf(cam, TOTAL_DURATION, lastShot);
  pushKf(cam, TOTAL_DURATION + 4, { yaw: 0, pitch: 0, distanceMul: 0.62 });

  addObject('camera', cam);
}

// Background mood — hold each scene's hue, then ramp across the crossfade
// window into the next scene's hue, so the gradient shift reads as part of
// the same transition instead of an unrelated color event.
{
  const hue = {}, warmth = {};
  SCENES.forEach((scene, i) => {
    pushKf(hue, scene.enter + (i === 0 ? 0 : FADE_IN), { hue: scene.hue });
    pushKf(warmth, scene.enter + (i === 0 ? 0 : FADE_IN), { warmth: scene.warmth });
    const end = sceneEnd(i);
    if (i < SCENES.length - 1){
      pushKf(hue, end, { hue: scene.hue });
      pushKf(warmth, end, { warmth: scene.warmth });
    }
  });
  pushKf(hue, TOTAL_DURATION, { hue: SCENES[SCENES.length - 1].hue });
  pushKf(warmth, TOTAL_DURATION, { warmth: SCENES[SCENES.length - 1].warmth });
  addObject('mood', Object.assign({}, hue, warmth));
}

// Caption: one gentle fade-in as its typewriter starts; pinned forever after.
{
  const c = {};
  pushKf(c, CAPTION.start - 0.3, { opacity: 0 });
  pushKf(c, CAPTION.start + 0.4, { opacity: 1 });
  addObject('caption', c);
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

const outPath = path.join(ROOT, 'public', 'assets', 'theatre-state.json');
fs.writeFileSync(outPath, JSON.stringify(state));
console.log('wrote', outPath, fs.statSync(outPath).size, 'bytes,', Object.keys(tracksByObject).length, 'objects');
