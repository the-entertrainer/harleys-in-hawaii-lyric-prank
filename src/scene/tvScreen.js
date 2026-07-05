/**
 * The TV's CRT screen content — a small canvas drawn every throttled tick
 * and composited into the model's texture atlas by tvScene.js. Reuses the
 * exact same timing data (SCENES/LYRICS/CAPTION) and Theatre.js-driven
 * per-scene/per-anchor numbers that used to drive the DOM poster — only how
 * those numbers get CONSUMED changes (canvas draw calls instead of styles).
 *
 * Adaptation from the DOM poster, deliberate: the physical screen is small
 * and already busy with scanlines/grain/vignette, so a scene shows fewer,
 * bigger elements — a lower-third title-card band (headline/script/sub or
 * spoken lines) over the anchor photo — rather than every DOM nuance
 * (doodles, simultaneous headline+script+sub+spoken) at once. Word reveal
 * is a "ghost layout": each scene's final wrapped line layout is computed
 * once from its full text, then words pop in at their real sung timestamp
 * at their already-fixed final position — stable on a small screen, no
 * reflow jitter, still typewriter-paced to the real singing.
 */
import { LYRICS, SCENES, sceneEnd, CAPTION, TOTAL_DURATION, assetPath } from '../lyrics-data.mjs';

const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Supersampled over the confirmed screen rect's own pixel budget (398x509)
// purely so drawImage's downscale antialiases edges — text/photo sharpness
// is still ultimately capped by that fixed atlas-texel ceiling.
const SCREEN_W = 640;
const SCREEN_H = 820;
const PAD = 44;

const FONT = { headline: 'Titan One', script: 'Cookie', sub: 'Titan One', spoken: 'Oswald' };

function moodGradient(ctx, hue, warmth){
  const g = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
  g.addColorStop(0, `hsl(${hue} 48% ${39 + warmth * 4}%)`);
  g.addColorStop(0.44, `hsl(${hue} 50% ${41 + warmth * 5}%)`);
  g.addColorStop(0.72, `hsl(${hue + 18} 55% ${51 + warmth * 8}%)`);
  g.addColorStop(1, `hsl(${hue + 34} 62% ${66 + warmth * 9}%)`);
  return g;
}

/** Same letter-spread math as the DOM build's letterSpans(): each letter of
 * a word gets an even share of the word's (capped) sung duration. */
function letterTimings(word){
  const span = Math.min(word.e - word.s, 0.6);
  const n = [...word.w].length;
  return [...word.w].map((ch, k) => word.s + (k / n) * span);
}

function revealedText(word, timings, t){
  if (t < word.s) return '';
  let n = 0;
  while (n < timings.length && timings[n] <= t) n++;
  return [...word.w].slice(0, n).join('');
}

/** Greedy word-wrap into centered lines, run once per slot against its
 * FULL final text — the "ghost layout" every word pops into as it's sung. */
function wrapWords(ctx, words, font, maxWidth, lineHeight, startY){
  ctx.font = font;
  const lines = [[]];
  let lineWidth = 0;
  const spaceW = ctx.measureText(' ').width;
  for (const word of words){
    const w = ctx.measureText(word.w).width;
    const cur = lines[lines.length - 1];
    if (cur.length && lineWidth + spaceW + w > maxWidth){
      lines.push([]);
      lineWidth = 0;
    }
    lines[lines.length - 1].push({ word, w });
    lineWidth += (lines[lines.length - 1].length > 1 ? spaceW : 0) + w;
  }
  const laidOut = [];
  lines.forEach((line, li) => {
    const totalW = line.reduce((s, e) => s + e.w, 0) + spaceW * (line.length - 1);
    let x = (SCREEN_W - totalW) / 2;
    const y = startY + li * lineHeight;
    for (const entry of line){
      laidOut.push({ word: entry.word, x, y, timings: letterTimings(entry.word) });
      x += entry.w + spaceW;
    }
  });
  return { laidOut, height: lines.length * lineHeight };
}

function slotWords(slot){
  const line = LYRICS[slot.line];
  const from = slot.from ?? 0;
  const to = slot.to ?? line.words.length - 1;
  return line.words.slice(from, to + 1);
}

export function createTvScreen(){
  const canvas = document.createElement('canvas');
  canvas.width = SCREEN_W;
  canvas.height = SCREEN_H;
  const ctx = canvas.getContext('2d');

  // ---- One-time precomputed assets ------------------------------------
  const photos = new Map();
  SCENES.forEach(s => {
    if (photos.has(s.anchor.img)) return;
    const img = new Image();
    img.src = assetPath(s.anchor.img);
    photos.set(s.anchor.img, img);
  });

  const scanlineTile = document.createElement('canvas');
  scanlineTile.width = 4; scanlineTile.height = 4;
  { const c = scanlineTile.getContext('2d');
    c.fillStyle = 'rgba(20,8,4,0)'; c.fillRect(0, 0, 4, 4);
    c.fillStyle = 'rgba(20,8,4,0.35)'; c.fillRect(0, 0, 4, 1); }
  const scanlinePattern = ctx.createPattern(scanlineTile, 'repeat');

  const vignette = ctx.createRadialGradient(
    SCREEN_W / 2, SCREEN_H * 0.44, SCREEN_H * 0.2,
    SCREEN_W / 2, SCREEN_H * 0.5, SCREEN_H * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.75, 'rgba(0,0,0,0.12)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');

  // A handful of pre-rendered static tiles, cycled/offset per draw rather
  // than synthesizing fresh random noise every tick.
  const NOISE_TILES = 5;
  const noiseTiles = Array.from({ length: NOISE_TILES }, () => {
    const t = document.createElement('canvas');
    t.width = 160; t.height = 160;
    const tctx = t.getContext('2d');
    const id = tctx.createImageData(160, 160);
    for (let i = 0; i < id.data.length; i += 4){
      const v = Math.random() * 255;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = Math.random() * 40;
    }
    tctx.putImageData(id, 0, 0);
    return t;
  });

  const layoutCache = new Map();
  function layoutForScene(scene, idx){
    if (layoutCache.has(idx)) return layoutCache.get(idx);
    const headline = scene.slots.find(s => s.type === 'headline');
    const script = scene.slots.find(s => s.type === 'script');
    const sub = scene.slots.filter(s => s.type === 'sub');
    const spoken = scene.slots.filter(s => s.type === 'spoken');
    const maxW = SCREEN_W - PAD * 2;

    const out = {};
    let y = SCREEN_H * 0.60;
    if (headline){
      const words = slotWords(headline);
      const r = wrapWords(ctx, words, `400 46px "${FONT.headline}"`, maxW, 50, y);
      out.headline = r; y += r.height + 8;
    }
    if (script){
      const words = slotWords(script);
      out.script = { word: words[0], timings: null, y: y + 44 };
      y += 78;
    }
    if (sub.length){
      const words = sub.flatMap(slotWords);
      const r = wrapWords(ctx, words, `400 26px "${FONT.sub}"`, maxW, 32, y);
      out.sub = r; y += r.height;
    }
    if (!headline && !script && !sub.length && spoken.length){
      const words = spoken.flatMap(slotWords);
      const r = wrapWords(ctx, words, `500 22px "${FONT.spoken}"`, maxW, 30, SCREEN_H * 0.62);
      out.spoken = r;
    }
    layoutCache.set(idx, out);
    return out;
  }

  function currentSceneIndex(t){
    for (let i = SCENES.length - 1; i >= 0; i--){
      if (t >= SCENES[i].enter) return i;
    }
    return 0;
  }

  let noiseFrame = 0;
  let glitchUntil = 0, glitchOffset = 0, nextGlitchCheck = 0;

  function drawWords(laidOut, font, color, t, shadow){
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';
    for (const { word, x, y, timings } of laidOut){
      const text = revealedText(word, timings, t);
      if (!text) continue;
      if (shadow){
        ctx.save();
        ctx.shadowColor = shadow;
        ctx.shadowBlur = 6;
        ctx.fillText(text, x, y);
        ctx.restore();
      } else {
        ctx.fillText(text, x, y);
      }
    }
  }

  /**
   * @param t seconds into the song
   * @param state { sceneOpacity, sceneY, anchorOpacity, anchorY, anchorRot,
   *   moodHue, moodWarmth, captionOpacity, finaleOpacity }
   */
  function draw(t, state){
    ctx.save();
    ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);

    const idx = currentSceneIndex(t);
    ctx.fillStyle = moodGradient(ctx, state.moodHue, state.moodWarmth);
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Render current + previous scene during their crossfade window so the
    // handoff isn't an abrupt cut — mirrors the DOM build's overlapping
    // scene-i opacity tracks.
    for (const i of [idx - 1, idx]){
      if (i < 0 || i >= SCENES.length) continue;
      const opacity = state.sceneOpacity[i] ?? (i === idx ? 1 : 0);
      if (opacity < 0.01) continue;
      drawScene(i, t, opacity, state);
    }

    // Caption — pinned top line, part of "everything happens on the TV".
    if (state.captionOpacity > 0.01){
      ctx.globalAlpha = state.captionOpacity;
      ctx.font = `500 20px "${FONT.spoken}"`;
      ctx.fillStyle = '#f9eed6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const words = CAPTION.text.split(' ');
      const r = wrapWords(ctx, words.map(w => ({ w, s: CAPTION.start, e: CAPTION.end })), `500 20px "${FONT.spoken}"`, SCREEN_W - PAD * 2, 26, 20);
      for (const { word, x, y } of r.laidOut) ctx.fillText(word.w, x + (ctx.measureText(word.w).width / 2), y);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }

    if (state.finaleOpacity > 0.01) drawFinale(state.finaleOpacity);

    drawCrtEffects(t);
    ctx.restore();
  }

  function drawScene(i, t, opacity, state){
    const scene = SCENES[i];
    const layout = layoutForScene(scene, i);
    ctx.save();
    ctx.globalAlpha = opacity;

    // Anchor photo — large, upper area, faded/risen via the same numbers
    // that used to drive the DOM .anchor transform.
    const img = photos.get(scene.anchor.img);
    const aOpacity = state.anchorOpacity[i] ?? 0;
    if (img && img.complete && img.naturalWidth && aOpacity > 0.01){
      const zoneW = SCREEN_W * 0.72, zoneH = SCREEN_H * 0.5;
      const scale = Math.min(zoneW / img.naturalWidth, zoneH / img.naturalHeight);
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      const x = (SCREEN_W - w) / 2;
      const y = SCREEN_H * 0.08 + (state.anchorY[i] ?? 0) * 0.4;
      ctx.save();
      ctx.globalAlpha = opacity * aOpacity;
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((scene.anchor.rot || 0) * Math.PI / 180 * 0.3);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    // Lower-third scrim — classic broadcast title-card treatment, and the
    // legibility fix for text sitting over a busy photo.
    const scrimTop = SCREEN_H * 0.56;
    const scrim = ctx.createLinearGradient(0, scrimTop, 0, SCREEN_H);
    scrim.addColorStop(0, 'rgba(20,8,4,0)');
    scrim.addColorStop(0.3, 'rgba(20,8,4,0.55)');
    scrim.addColorStop(1, 'rgba(20,8,4,0.72)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, scrimTop, SCREEN_W, SCREEN_H - scrimTop);

    if (layout.headline) drawWords(layout.headline.laidOut, `400 46px "${FONT.headline}"`, '#f9eed6', t, 'rgba(96,18,6,.5)');
    if (layout.script){
      const w = layout.script.word;
      const p = Math.min(Math.max((t - w.s) / (Math.max(w.e - w.s, 0.4) + 0.4), 0), 1);
      if (p > 0){
        ctx.font = `400 64px "${FONT.script}"`;
        const tw = ctx.measureText(w.w).width;
        const x = (SCREEN_W - tw) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - 4, layout.script.y - 70, tw * p + 8, 90);
        ctx.clip();
        ctx.fillStyle = '#fff3d0';
        ctx.fillText(w.w, x, layout.script.y);
        ctx.restore();
      }
    }
    if (layout.sub) drawWords(layout.sub.laidOut, `400 26px "${FONT.sub}"`, '#f6d97e', t);
    if (layout.spoken) drawWords(layout.spoken.laidOut, `500 22px "${FONT.spoken}"`, '#f9eed6', t);

    ctx.restore();
  }

  function drawFinale(opacity){
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = 'rgba(10,4,2,0.86)';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f9eed6';
    ctx.font = `500 26px "${FONT.spoken}"`;
    ctx.fillText('MADE WITH LOVE', SCREEN_W / 2, SCREEN_H * 0.44);
    ctx.fillStyle = '#fff3d0';
    ctx.font = `400 72px "${FONT.script}"`;
    ctx.fillText('by Naveen', SCREEN_W / 2, SCREEN_H * 0.58);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  function drawCrtEffects(t){
    // Static/grain — cycle a pre-rendered tile rather than synthesizing
    // fresh randomness every tick.
    noiseFrame++;
    if (!REDUCED_MOTION || true){ // grain itself is static-look, fine under reduced-motion
      const tile = noiseTiles[noiseFrame % NOISE_TILES];
      ctx.save();
      ctx.globalAlpha = 0.5;
      for (let y = 0; y < SCREEN_H; y += 160){
        for (let x = 0; x < SCREEN_W; x += 160) ctx.drawImage(tile, x, y);
      }
      ctx.restore();
    }

    // Scanlines + vignette — static, always present regardless of motion pref.
    ctx.fillStyle = scanlinePattern;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    if (!REDUCED_MOTION){
      // Occasional brief horizontal roll glitch — a timer-gated rare event,
      // not a per-frame cost.
      if (t > nextGlitchCheck){
        nextGlitchCheck = t + 2 + Math.random() * 5;
        if (Math.random() < 0.35){ glitchUntil = t + 0.09; glitchOffset = (Math.random() - 0.5) * 14; }
      }
      if (t < glitchUntil){
        const band = ctx.getImageData(0, SCREEN_H * 0.3, SCREEN_W, SCREEN_H * 0.08);
        ctx.putImageData(band, glitchOffset, SCREEN_H * 0.3);
      }

      // Subtle brightness flicker.
      const flicker = 0.965 + Math.sin(t * 19) * 0.012 + Math.sin(t * 5.3) * 0.01;
      if (flicker < 0.995){
        ctx.fillStyle = `rgba(0,0,0,${(1 - flicker) * 0.6})`;
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      }
    }
  }

  const ready = document.fonts ? document.fonts.ready : Promise.resolve();

  return { canvas, ready, draw };
}
