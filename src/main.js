import { LYRICS, SECTIONS, TOTAL_DURATION, assetPath } from './lyrics-data.mjs';
import { createInk } from './ink.js';
import './style.css';

const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

const audio = document.getElementById('track');
const letter = document.getElementById('letter');
const seal = document.getElementById('seal');
const quillFill = document.getElementById('quill-fill');
const ink = createInk(document.getElementById('ink-canvas'));

// ---------------------------------------------------------------------
// Build the letter. Every page (section) exists up front, stacked and
// hidden; playback only ever toggles classes and background-size, so a
// seek in either direction recomputes cleanly (word state is a pure
// function of the current time, never an accumulated one).
// ---------------------------------------------------------------------

/** every timed thing on the page: {el, s, e, kind: body|script|whisper} */
const words = [];

function addWord(parent, rec, kind){
  const el = document.createElement('span');
  el.className = 'w ' + kind;
  el.textContent = rec.w;
  parent.appendChild(el);
  words.push({ el, s: rec.s, e: Math.max(rec.e, rec.s + 0.12), kind, state: -1 });
  return el;
}

const sectionEls = SECTIONS.map((sec, i) => {
  const el = document.createElement('section');
  el.className = 'page';
  el.dataset.id = sec.id;

  const cameo = document.createElement('figure');
  cameo.className = 'cameo';
  const img = document.createElement('img');
  img.src = assetPath(sec.img);
  img.alt = sec.alt;
  img.draggable = false;
  cameo.appendChild(img);
  el.appendChild(cameo);

  const body = document.createElement('div');
  body.className = 'page-body';

  if (sec.salutation){
    const sal = document.createElement('p');
    sal.className = 'line salutation-line';
    addWord(sal, { w: sec.salutation.text, s: sec.salutation.s, e: sec.salutation.e }, 'script');
    body.appendChild(sal);
  }

  for (const li of sec.lines){
    const line = LYRICS[li];
    const p = document.createElement('p');
    p.className = 'line' + (line.type === 'spoken' ? ' whisper-line' : '');
    line.words.forEach((rec, wi) => {
      if (wi > 0) p.appendChild(document.createTextNode(' '));
      const kind = line.type === 'spoken' ? 'whisper'
        : (sec.script && sec.script[li] === wi) ? 'script' : 'body';
      addWord(p, rec, kind);
    });
    body.appendChild(p);
  }

  if (sec.closing){
    const close = document.createElement('p');
    close.className = 'line closing-line';
    addWord(close, { w: sec.closing.text, s: sec.closing.s, e: sec.closing.e }, 'script');
    const heart = document.createElement('span');
    heart.className = 'closing-heart';
    heart.textContent = '❤';
    close.appendChild(heart);
    body.appendChild(close);
  }

  if (sec.postscript !== undefined){
    const line = LYRICS[sec.postscript];
    const p = document.createElement('p');
    p.className = 'line whisper-line';
    line.words.forEach((rec, wi) => {
      if (wi > 0) p.appendChild(document.createTextNode(' '));
      addWord(p, rec, 'whisper');
    });
    body.appendChild(p);
  }

  el.appendChild(body);
  letter.appendChild(el);
  return el;
});

const inkColor = { body: '', script: '' };
{
  const cs = getComputedStyle(document.documentElement);
  inkColor.body = cs.getPropertyValue('--ink').trim();
  inkColor.script = cs.getPropertyValue('--ink-accent').trim();
}

// ---------------------------------------------------------------------
// Drips. Scheduled in *song time* when a word turns wet, consumed by the
// frame loop, so pausing pauses them too. Positions are read at consume
// time so layout/resize can't strand them.
// ---------------------------------------------------------------------
const pendingDrips = [];

function scheduleDrips(word, t){
  if (REDUCED_MOTION || word.kind === 'whisper') return;
  const dur = word.e - word.s;
  const plan = [];
  if (word.kind === 'script'){
    plan.push(word.s + dur * 0.55);
    if (Math.random() < 0.4) plan.push(word.s + dur * 0.95);
  } else if (dur > 0.55 && Math.random() < 0.5){
    plan.push(word.s + dur * (0.4 + Math.random() * 0.5));
  } else if (Math.random() < 0.1){
    plan.push(word.s + dur * 0.7);
  }
  for (const at of plan){
    if (at >= t - 0.25) pendingDrips.push({ at, word });
  }
}

function consumeDrips(t){
  for (let i = pendingDrips.length - 1; i >= 0; i--){
    const p = pendingDrips[i];
    if (p.at > t) continue;
    pendingDrips.splice(i, 1);
    if (t - p.at > 0.6) continue;               // stale after a seek
    const r = p.word.el.getBoundingClientRect();
    if (r.width === 0 || r.bottom < 0 || r.top > innerHeight) continue;
    const script = p.word.kind === 'script';
    const x = r.left + r.width * (0.25 + Math.random() * 0.5);
    // hang from the glyph baseline (the box includes line-height leading),
    // with the pool overlapping the letters a touch so it reads attached
    const y = r.top + r.height * (script ? 0.78 : 0.68);
    ink.spawn(x, y, script ? inkColor.script : inkColor.body, script ? 1.5 : 1);
  }
}

// ---------------------------------------------------------------------
// Playback loop — everything below is a pure function of audio time.
// ---------------------------------------------------------------------
let activeSection = -1;
let rafId = null;
let lastNow = performance.now();

function setWordState(word, t){
  // 0 ghost, 1 wet, 2 done
  const state = t < word.s ? 0 : t < word.e ? 1 : 2;
  if (state !== word.state){
    word.state = state;
    word.el.classList.toggle('wet', state === 1);
    word.el.classList.toggle('done', state === 2);
    if (state === 1) scheduleDrips(word, t);
    if (state !== 1) word.el.style.backgroundSize = '';
  }
  if (state === 1){
    const p = Math.min((t - word.s) / (word.e - word.s), 1);
    // The +16/+8 head start skips the em-box's empty headroom (ascender
    // whitespace) so ink is visibly arriving the instant a word is sung.
    word.el.style.backgroundSize = word.kind === 'body'
      ? `100% ${(16 + p * 116).toFixed(1)}%`  // ink bleeds DOWN through the word
      : `${(8 + p * 112).toFixed(1)}% 100%`;  // script writes itself across
  }
}

function update(t){
  let idx = 0;
  for (let i = 0; i < SECTIONS.length; i++) if (t >= SECTIONS[i].enter) idx = i;
  if (idx !== activeSection){
    sectionEls.forEach((el, i) => {
      el.classList.toggle('active', i === idx);
      el.classList.toggle('past', i < idx);
    });
    if (activeSection !== -1) ink.fadeAll();   // don't strand old drips on a new page
    activeSection = idx;
  }
  for (const w of words) setWordState(w, t);
  consumeDrips(t);
  quillFill.style.width = (Math.min(t, TOTAL_DURATION) / TOTAL_DURATION * 100).toFixed(2) + '%';
}

function frame(now){
  const dt = Math.min((now - lastNow) / 1000, 0.1);
  lastNow = now;
  update(audio.currentTime);
  ink.tick(dt);
  rafId = requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------
// One control: the wax seal opens the letter; afterwards a tap on the
// paper pauses/resumes, and the seal comes back small when it ends.
// ---------------------------------------------------------------------
function startLoop(){
  lastNow = performance.now();
  if (!rafId) rafId = requestAnimationFrame(frame);
}

seal.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!document.body.classList.contains('open')){
    document.body.classList.add('open');
  }
  document.body.classList.remove('finished');
  if (audio.ended || audio.currentTime >= TOTAL_DURATION - 0.05) audio.currentTime = 0;
  audio.play();
  startLoop();
});

document.body.addEventListener('click', (e) => {
  if (!document.body.classList.contains('open')) return;
  if (e.target.closest('#seal')) return;
  if (audio.ended) return;
  if (audio.paused) audio.play(); else audio.pause();
  document.body.classList.toggle('paused', audio.paused);
});

audio.addEventListener('ended', () => {
  document.body.classList.add('finished');
  document.body.classList.remove('paused');
});

// First paint: the sealed letter (section 0 stands ready underneath).
update(0);
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('preload')));

// Hooks for the headless smoke test only — a real reader never sees these.
window.__seek = (t) => { audio.currentTime = t; update(t); };
window.__ink = ink;
window.__inkColor = inkColor;
window.__ready = document.fonts ? document.fonts.ready.then(() => true) : true;
document.fonts?.ready.then(() => { window.__fontsLoaded = true; });
