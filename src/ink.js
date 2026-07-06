/**
 * Ink drips, drawn on a full-viewport 2D canvas laid over the letter.
 *
 * A drip is modeled the way ink actually behaves on upright paper — it
 * never free-falls. Phases:
 *   grow  — a bead swells at the wet word's baseline while gravity starts
 *           pulling it into a short rivulet;
 *   run   — the bead runs DOWN THE PAPER, decelerating as its ink is
 *           spent, leaving a tapering trail behind it that stays anchored
 *           where it was drawn;
 *   soak  — the bead flattens into the paper and the whole mark slowly
 *           dries away.
 * Drawn with multiply compositing so the ink darkens the paper texture
 * under it instead of sitting on top like a sticker.
 */

const MAX_DRIPS = 8;

export function createInk(canvas){
  const ctx = canvas.getContext('2d');
  let dpr = 1;

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
  }
  resize();
  addEventListener('resize', resize);

  const drips = [];

  /**
   * x/y in CSS pixels (bottom edge of a wet glyph). `color` is the word's
   * computed ink color. `scale` ~1 for body words, larger for script.
   */
  function spawn(x, y, color, scale = 1){
    if (drips.length >= MAX_DRIPS) return;
    const travel = Math.min((22 + Math.random() * 46) * scale, 95);
    drips.push({
      x0: x, y0: y, color,
      r: 1.1 * scale,
      maxR: (2.2 + Math.random() * 1.4) * scale,
      y: y,
      travel,
      speed: 0,
      phase: 'grow',
      wobbleSeed: Math.random() * 100,
      trail: [{ y, r: 1.1 * scale }],
      age: 0,
      dryness: 0,        // 0 wet … 1 gone
    });
  }

  function wobble(d, y){
    return Math.sin(y * 0.03 + d.wobbleSeed) * 1.8;
  }

  function update(dt){
    for (let i = drips.length - 1; i >= 0; i--){
      const d = drips[i];
      d.age += dt;
      if (d.phase === 'grow'){
        d.r += (d.maxR - d.r) * Math.min(dt * 3.5, 1);
        d.y += 6 * dt;
        if (d.age > 0.45 + Math.random() * 0.2){ d.phase = 'run'; d.speed = 26; }
      } else if (d.phase === 'run'){
        const spent = (d.y - d.y0) / d.travel;           // 0 → 1
        d.speed = Math.max(22 * (1 - spent * spent), 3); // decelerate
        d.y += d.speed * dt * (1 + d.maxR * 0.18);
        d.r = d.maxR * (1 - spent * 0.3);
        if (d.y - d.y0 >= d.travel) d.phase = 'soak';
      } else {
        d.dryness += dt / (d.fast ? 0.9 : 3.2);
        if (d.dryness >= 1){ drips.splice(i, 1); continue; }
      }
      if (d.fast && d.phase !== 'soak'){ d.phase = 'soak'; }
      const last = d.trail[d.trail.length - 1];
      if (d.y - last.y > 2.2) d.trail.push({ y: d.y, r: d.r });
    }
  }

  function draw(){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalCompositeOperation = 'multiply';
    for (const d of drips){
      const alpha = 0.68 * (1 - d.dryness);
      ctx.strokeStyle = ctx.fillStyle = d.color;
      ctx.lineCap = 'round';
      // the little pool where the ink collected before it ran — wide and
      // flat so it merges with the glyph it hangs from
      ctx.globalAlpha = alpha * 0.55;
      ctx.beginPath();
      ctx.ellipse(d.x0, d.y0, d.maxR * 1.2, d.maxR * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      // the track: one smooth tapered shape — thin where it started
      // (drained and dried), widest just behind the bead. Filled in a
      // single pass so there are no per-segment alpha bands or cap knots.
      const n = d.trail.length;
      if (n > 1){
        ctx.globalAlpha = alpha * 0.6;
        ctx.beginPath();
        for (let i = 0; i < n; i++){
          const pt = d.trail[i];
          const w = Math.max(d.maxR * (0.35 + 0.5 * (i / (n - 1))), 0.5);
          const x = d.x0 + wobble(d, pt.y);
          if (i === 0) ctx.moveTo(x - w / 2, pt.y);
          else ctx.lineTo(x - w / 2, pt.y);
        }
        for (let i = n - 1; i >= 0; i--){
          const pt = d.trail[i];
          const w = Math.max(d.maxR * (0.35 + 0.5 * (i / (n - 1))), 0.5);
          ctx.lineTo(d.x0 + wobble(d, pt.y) + w / 2, pt.y);
        }
        ctx.closePath();
        ctx.fill();
      }
      // bead — slightly pear-shaped while running, flattening as it soaks
      ctx.globalAlpha = alpha;
      const bx = d.x0 + wobble(d, d.y);
      const squish = d.phase === 'soak' ? 1 - d.dryness * 0.4 : 1;
      ctx.beginPath();
      ctx.ellipse(bx, d.y, d.r * 0.95, d.r * 1.3 * squish, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  return {
    spawn,
    /** one call per RAF frame */
    tick(dt){ update(dt); draw(); },
    /** page turned: whatever is still wet dries out quickly */
    fadeAll(){ for (const d of drips) d.fast = true; },
    get active(){ return drips.length > 0; },
  };
}
