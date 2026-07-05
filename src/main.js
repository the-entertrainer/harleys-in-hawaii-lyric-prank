import { getProject } from '@theatre/core';
import {
  LYRICS, SCENES, sceneDoodles, CAPTION, TOTAL_DURATION, assetPath,
} from './lyrics-data.mjs';
import './style.css';

import heartSvg from './doodles/heart.svg?raw';
import sparkleSvg from './doodles/sparkle.svg?raw';
import sparklesSvg from './doodles/sparkles.svg?raw';
import starSvg from './doodles/star.svg?raw';
import xSvg from './doodles/x.svg?raw';

const DOODLE_ICONS = { heart: heartSvg, sparkle: sparkleSvg, sparkles: sparklesSvg, star: starSvg, x: xSvg };
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

const audio = document.getElementById('track');
const posterEl = document.getElementById('poster');
const captionEl = document.getElementById('caption');
const progressFill = document.getElementById('progress-fill');
const playBtn = document.getElementById('play-btn');
const finaleEl = document.getElementById('finale');
const root = document.documentElement;

// ---------------------------------------------------------------------
// DOM construction — one .scene poster per SCENES entry, each with the
// reference's fixed composition: headline block, anchor photo, script
// word, sub-lines, doodles. Text is split to per-letter spans so the
// per-frame loop can reveal them typewriter-style at real timestamps.
// ---------------------------------------------------------------------

/** Every letter carries the exact time it should appear: the word's sung
 * start, plus an even spread of the word's (capped) duration across its
 * letters — so typing speed follows the actual singing. */
function letterSpans(word, className){
  const frag = document.createDocumentFragment();
  const letters = [...word.w];
  const span = Math.min(word.e - word.s, 0.6);
  const all = [];
  letters.forEach((ch, k) => {
    const el = document.createElement('span');
    el.className = className;
    el.textContent = ch;
    frag.appendChild(el);
    all.push({ el, at: word.s + (k / letters.length) * span });
  });
  return { frag, letters: all };
}

const revealQueue = []; // flat [{el, at}] — sorted once, swept per frame
const scriptWipes = []; // [{el, s, e}] — script words revealed by clip wipe

function buildSlot(slot){
  const line = LYRICS[slot.line];
  const from = slot.from ?? 0;
  const to = slot.to ?? line.words.length - 1;
  const el = document.createElement('div');
  el.className = `slot slot-${slot.type}`;
  line.words.slice(from, to + 1).forEach((word, wi) => {
    const wordEl = document.createElement('span');
    wordEl.className = 'w';
    if (slot.type === 'script'){
      // Cookie is a connected script — per-letter spans would break the
      // cursive joins, so the whole word stays one text node and reveals
      // with a left-to-right clip wipe, like ink being written.
      wordEl.textContent = word.w;
      wordEl.classList.add('script-word');
      scriptWipes.push({ el: wordEl, s: word.s, e: Math.max(word.e, word.s + 1.0) });
    } else {
      const { frag, letters } = letterSpans(word, 'ltr');
      wordEl.appendChild(frag);
      revealQueue.push(...letters);
    }
    el.appendChild(wordEl);
    if (wi < to - from) el.appendChild(document.createTextNode(' '));
  });
  return el;
}

const sceneEls = SCENES.map((scene, i) => {
  const el = document.createElement('section');
  el.className = 'scene';
  el.style.opacity = i === 0 ? 1 : 0;

  // The anchor is a flow item in the poster's flex column — contained in
  // its own zone between headline and script so it cannot collide with
  // text on any viewport (see .anchor-box in style.css).
  const anchorBox = document.createElement('div');
  anchorBox.className = 'anchor-box';
  anchorBox.style.setProperty('--kiss', scene.anchor.kiss ?? 0);
  const anchorWrap = document.createElement('div');
  anchorWrap.className = 'anchor';
  anchorWrap.style.setProperty('--aw', (scene.anchor.w ?? 60) + '%');
  anchorWrap.style.setProperty('--ax', (scene.anchor.x ?? 0) + '%');
  anchorWrap.style.setProperty('--arot', (scene.anchor.rot ?? 0) + 'deg');
  anchorWrap.innerHTML = `<img src="${assetPath(scene.anchor.img)}" alt="" loading="lazy" draggable="false">`;
  anchorBox.appendChild(anchorWrap);

  const doodleEls = sceneDoodles(i).map(d => {
    const dEl = document.createElement('div');
    dEl.className = 'doodle';
    dEl.style.left = d.x + '%';
    dEl.style.top = d.y + '%';
    dEl.style.setProperty('--dsize', d.size);
    dEl.innerHTML = DOODLE_ICONS[d.icon] || '';
    el.appendChild(dEl);
    return dEl;
  });

  const text = document.createElement('div');
  text.className = 'scene-text';
  let anchorPlaced = false;
  for (const slot of scene.slots){
    if (!anchorPlaced && (slot.type === 'script' || slot.type === 'sub')){
      text.appendChild(anchorBox);
      anchorPlaced = true;
    }
    const slotEl = buildSlot(slot);
    if (slot.type === 'script') slotEl.style.setProperty('--soverlap', scene.anchor.overlap ?? 0);
    text.appendChild(slotEl);
  }
  if (!anchorPlaced) text.appendChild(anchorBox);
  el.appendChild(text);

  posterEl.appendChild(el);
  return { el, anchorWrap, doodleEls };
});

// The caption types on with synthetic timestamps spread across its window.
{
  const chars = [...CAPTION.text];
  chars.forEach((ch, k) => {
    const el = document.createElement('span');
    el.className = 'ltr';
    el.textContent = ch;
    captionEl.appendChild(el);
    revealQueue.push({ el, at: CAPTION.start + (k / chars.length) * (CAPTION.end - CAPTION.start) });
  });
}

revealQueue.sort((a, b) => a.at - b.at);

// ---------------------------------------------------------------------
// Parallax — pointer-driven on desktop, a slow autonomous sway on touch
// devices (no permission-gated gyro), applied through two CSS variables
// that every depth layer multiplies differently (see style.css). This is
// what gives the flat poster its depth without any of it living in the
// keyframe data.
// ---------------------------------------------------------------------
let targetPX = 0, targetPY = 0, px = 0, py = 0;
let pointerActive = false;
window.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  pointerActive = true;
  targetPX = (e.clientX / window.innerWidth) * 2 - 1;
  targetPY = (e.clientY / window.innerHeight) * 2 - 1;
});

function updateParallax(t, dt){
  if (REDUCED_MOTION) return;
  if (!pointerActive){
    targetPX = Math.sin(t * 0.31) * 0.35;
    targetPY = Math.cos(t * 0.23) * 0.3;
  }
  const k = Math.min(dt * 3.2, 1);
  px += (targetPX - px) * k;
  py += (targetPY - py) * k;
  root.style.setProperty('--px', px.toFixed(4));
  root.style.setProperty('--py', py.toFixed(4));
}

// ---------------------------------------------------------------------
// Playback wiring: Theatre.js drives every tweened value (scene fades,
// anchor rise/float, doodles, mood, caption fade); the per-frame sweep
// below only flips discrete letter visibility at real timestamps — a
// letter having "appeared" is a state change, not an animated value.
// ---------------------------------------------------------------------
async function main(){
  const state = await (await fetch('assets/theatre-state.json')).json();
  const project = getProject('My Sweetheart', { state });
  const sheet = project.sheet('Lyrics');
  await project.ready;

  const moodObj = sheet.object('mood', { hue: 6, warmth: 0.55 });
  moodObj.onValuesChange(v => {
    root.style.setProperty('--mood-hue', v.hue.toFixed(1));
    root.style.setProperty('--mood-warmth', v.warmth.toFixed(2));
  });

  const captionObj = sheet.object('caption', { opacity: 0 });
  captionObj.onValuesChange(v => { captionEl.style.opacity = v.opacity; });

  SCENES.forEach((scene, i) => {
    const { el, anchorWrap, doodleEls } = sceneEls[i];

    const group = sheet.object(`scene-${i}`, { opacity: i === 0 ? 1 : 0, y: 0 });
    group.onValuesChange(v => {
      el.style.opacity = v.opacity;
      el.style.transform = `translateY(${v.y}px)`;
      el.style.visibility = v.opacity < 0.005 ? 'hidden' : 'visible';
    });

    const anchor = sheet.object(`anchor-${i}`, { opacity: 0, y: 90, rot: scene.anchor.rot });
    anchor.onValuesChange(v => {
      anchorWrap.style.opacity = v.opacity;
      anchorWrap.style.setProperty('--ay', v.y.toFixed(2) + 'px');
      anchorWrap.style.setProperty('--arot', v.rot.toFixed(2) + 'deg');
    });

    doodleEls.forEach((dEl, j) => {
      const doodle = sheet.object(`doodle-${i}-${j}`, { opacity: 0, scale: 1, rot: 0 });
      doodle.onValuesChange(v => {
        dEl.style.opacity = v.opacity;
        dEl.style.setProperty('--dscale', v.scale.toFixed(3));
        dEl.style.setProperty('--drot', v.rot.toFixed(2) + 'deg');
      });
    });
  });

  // Discrete letter reveal — a sorted queue swept forward each frame; on
  // seek/replay the whole queue is rescanned so state always matches t.
  let cursor = 0;
  function renderLetters(t, force = false){
    if (force){
      cursor = 0;
      for (const item of revealQueue) item.el.classList.toggle('on', item.at <= t);
      while (cursor < revealQueue.length && revealQueue[cursor].at <= t) cursor++;
      return;
    }
    while (cursor < revealQueue.length && revealQueue[cursor].at <= t){
      revealQueue[cursor].el.classList.add('on');
      cursor++;
    }
  }

  // Script words: a continuous ink-wipe across each word's real sung
  // window (plus a little grace so a fast word still writes gracefully).
  function renderScriptWipes(t){
    for (const w of scriptWipes){
      const p = Math.min(Math.max((t - w.s) / (w.e - w.s), 0), 1);
      w.el.style.clipPath = `inset(-20% ${((1 - p) * 104).toFixed(2)}% -20% -2%)`;
    }
  }

  let rafId = null;
  let lastNow = performance.now();
  let lastT = 0;
  function frame(now){
    const dt = Math.min((now - lastNow) / 1000, 0.1);
    lastNow = now;
    const t = audio.currentTime;
    sheet.sequence.position = t;
    renderLetters(t, t < lastT - 0.05);
    renderScriptWipes(t);
    lastT = t;
    updateParallax(t, dt);
    progressFill.style.width = (t / TOTAL_DURATION * 100).toFixed(2) + '%';
    rafId = requestAnimationFrame(frame);
  }

  function togglePlay(){
    if (audio.paused){
      finaleEl.classList.remove('visible');
      posterEl.classList.remove('hidden');
      if (audio.ended || audio.currentTime >= TOTAL_DURATION - 0.05){
        audio.currentTime = 0;
        renderLetters(0, true);
      }
      audio.play();
      playBtn.classList.add('is-playing');
      lastNow = performance.now();
      if (!rafId) rafId = requestAnimationFrame(frame);
    } else {
      audio.pause();
      playBtn.classList.remove('is-playing');
    }
  }
  playBtn.addEventListener('click', togglePlay);

  audio.addEventListener('ended', () => {
    playBtn.classList.remove('is-playing');
    posterEl.classList.add('hidden');
    finaleEl.classList.add('visible');
    if (rafId){ cancelAnimationFrame(rafId); rafId = null; }
  });

  // Render the very first frame so the intro poster (gradient, caption
  // spot, rising vinyl pose) is already composed before play is pressed.
  sheet.sequence.position = 0;
  renderLetters(0, true);
  renderScriptWipes(0);
  root.style.setProperty('--mood-hue', SCENES[0].hue);
  root.style.setProperty('--mood-warmth', SCENES[0].warmth);
}

main().catch(err => console.error('Theatre.js init failed:', err));
