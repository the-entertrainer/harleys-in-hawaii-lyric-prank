import { getProject } from '@theatre/core';
import { SCENES, TOTAL_DURATION } from './lyrics-data.mjs';
import { initTvScene } from './scene/tvScene.js';
import { createTvScreen } from './scene/tvScreen.js';
import './style.css';

const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

const audio = document.getElementById('track');
const tvCanvas = document.getElementById('tv-canvas');
const progressFill = document.getElementById('progress-fill');
const playBtn = document.getElementById('play-btn');

// ---------------------------------------------------------------------
// Shared state, written by Theatre.js onValuesChange callbacks in main()
// below and read every throttled tick by tvScreen.draw() — the exact same
// numbers that used to drive DOM styles now drive canvas draw calls
// instead; tools/build-theatre-state.mjs did not need to change at all.
// ---------------------------------------------------------------------
const sceneOpacity = SCENES.map((_, i) => (i === 0 ? 1 : 0));
const sceneY = new Array(SCENES.length).fill(0);
const anchorOpacity = new Array(SCENES.length).fill(0);
const anchorY = new Array(SCENES.length).fill(0);
const anchorRot = SCENES.map(s => s.anchor.rot);
let moodHue = SCENES[0].hue;
let moodWarmth = SCENES[0].warmth;
let captionOpacity = 0;
let finaleOpacity = 0;
let finaleStartTime = null;

// ---------------------------------------------------------------------
// Parallax — pointer-driven on desktop, a slow autonomous sway on touch
// devices (no permission-gated gyro). Nudges the Three.js camera a few
// percent of its framing distance instead of the old CSS variables.
// ---------------------------------------------------------------------
let targetPX = 0, targetPY = 0, px = 0, py = 0;
let pointerActive = false;
window.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  pointerActive = true;
  targetPX = (e.clientX / window.innerWidth) * 2 - 1;
  targetPY = (e.clientY / window.innerHeight) * 2 - 1;
});

function updateParallax(t, dt, tvScene){
  if (REDUCED_MOTION) return;
  if (!pointerActive){
    targetPX = Math.sin(t * 0.31) * 0.35;
    targetPY = Math.cos(t * 0.23) * 0.3;
  }
  const k = Math.min(dt * 3.2, 1);
  px += (targetPX - px) * k;
  py += (targetPY - py) * k;
  tvScene.setParallax(px, py);
}

async function main(){
  const tvScene = await initTvScene(tvCanvas);
  const tvScreen = createTvScreen();
  await tvScreen.ready;

  const state = await (await fetch('assets/theatre-state.json')).json();
  const project = getProject('My Sweetheart', { state });
  const sheet = project.sheet('Lyrics');
  await project.ready;

  // The mood hue/warmth only feeds the TV screen's own broadcast wash now
  // (the page background is a fixed dark room around the glowing TV).
  const moodObj = sheet.object('mood', { hue: SCENES[0].hue, warmth: SCENES[0].warmth });
  moodObj.onValuesChange(v => { moodHue = v.hue; moodWarmth = v.warmth; });

  const captionObj = sheet.object('caption', { opacity: 0 });
  captionObj.onValuesChange(v => { captionOpacity = v.opacity; });

  const cameraObj = sheet.object('camera', { yaw: 0, pitch: 0, distanceMul: 1 });
  cameraObj.onValuesChange(v => { tvScene.setShot(v); });

  SCENES.forEach((scene, i) => {
    const group = sheet.object(`scene-${i}`, { opacity: i === 0 ? 1 : 0, y: 0 });
    group.onValuesChange(v => { sceneOpacity[i] = v.opacity; sceneY[i] = v.y; });

    const anchor = sheet.object(`anchor-${i}`, { opacity: 0, y: 90, rot: scene.anchor.rot });
    anchor.onValuesChange(v => {
      anchorOpacity[i] = v.opacity;
      anchorY[i] = v.y;
      anchorRot[i] = v.rot;
    });
  });

  function screenState(){
    return { sceneOpacity, sceneY, anchorOpacity, anchorY, anchorRot, moodHue, moodWarmth, captionOpacity, finaleOpacity };
  }

  let rafId = null;
  let lastNow = performance.now();
  let lastScreenDraw = 0;
  const SCREEN_THROTTLE_MS = 1000 / 30;

  function frame(now){
    const dt = Math.min((now - lastNow) / 1000, 0.1);
    lastNow = now;
    // audio.currentTime freezes once the track ends, but the camera's
    // finale push-in (and the card's fade-in) needs the sequence to keep
    // advancing past TOTAL_DURATION — driven by real elapsed time instead
    // once 'ended' fires (see the extra 5s of sequence runway authored in
    // tools/build-theatre-state.mjs).
    const t = finaleStartTime !== null
      ? TOTAL_DURATION + (now - finaleStartTime) / 1000
      : audio.currentTime;
    sheet.sequence.position = t;
    updateParallax(t, dt, tvScene);
    progressFill.style.width = (Math.min(t, TOTAL_DURATION) / TOTAL_DURATION * 100).toFixed(2) + '%';

    if (finaleStartTime !== null){
      finaleOpacity = Math.min((now - finaleStartTime) / 900, 1);
    }

    if (now - lastScreenDraw > SCREEN_THROTTLE_MS){
      lastScreenDraw = now;
      tvScreen.draw(t, screenState());
      tvScene.compositeScreenContent(tvScreen.canvas);
    }
    tvScene.render();
    rafId = requestAnimationFrame(frame);
  }

  function togglePlay(){
    if (audio.paused){
      if (audio.ended || audio.currentTime >= TOTAL_DURATION - 0.05){
        audio.currentTime = 0;
        finaleStartTime = null;
        finaleOpacity = 0;
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

  // The TV stays "on" after the song ends — the loop keeps running so the
  // closing card fades in and the screen keeps its idle CRT life (scanline
  // shimmer, static, specular highlight) rather than freezing on a cut.
  audio.addEventListener('ended', () => {
    playBtn.classList.remove('is-playing');
    finaleStartTime = performance.now();
  });

  // Render a single static first frame so the TV already shows the intro
  // card (gradient wash, caption) before Play is pressed — the continuous
  // RAF loop (parallax, CRT shimmer, specular) only starts once playback
  // actually begins, matching this page's one-button, battery-conscious
  // design (see togglePlay above).
  sheet.sequence.position = 0;
  tvScreen.draw(0, screenState());
  tvScene.compositeScreenContent(tvScreen.canvas);
  tvScene.render();
}

main().catch(err => console.error('init failed:', err));
