> **Note:** This was the original concept doc, written around "Harleys in
> Hawaii" (a copyrighted Katy Perry song). The project has since pivoted to
> "Let Me Call You Sweetheart," a public-domain 1910 song, so the actual
> build in `index.html` differs in song, visual system, and asset sourcing
> from what's described below. Kept here as historical reference for the
> core prank mechanic and scroll↔time math, which carried over. See
> `README.md` and `ATTRIBUTION.md` for what's actually shipped.

# HARLEYS IN HAWAII
## Interactive Lyric Sync Prank — Design Document

**Project:** A mobile-first, scroll-driven interactive lyric video experience with a clever prank twist.  
**Song Example:** "Harleys in Hawaii" by Katy Perry (140 BPM, ~3:05, tropical pop/reggae/R&B vibe)  
**Platform:** Static website — GitHub repo + Vercel deployment (zero backend, pure client-side magic)  
**Creator:** Naveen | entertrainer.in | the-entertrainer (GitHub)  
**Date:** July 2026  
**Version:** 1.0 — Design Spec & Implementation Blueprint

---

## 1. Concept & Vision

A **premium, shareable web toy** that feels like a high-end lyric video but hides a delightful prank.

### Core Experience
Users land on a beautiful, immersive page. They are invited to **"ride the beat"** by scrolling the long vertical lyrics in sync with the music's 140 BPM groove. The mathematical mapping between scroll position and audio time is precise and satisfying when done perfectly.

**The Prank Twist:**
Perfect manual sync is *intentionally difficult* for a human (variable finger speed, momentum, fatigue, phone in hand). After a short while of trying, the interface gently calls them out with charm:

> "Hey… you can’t really enjoy the song if you’re busy trying to nail the perfect scroll sync.  
> So lemme do that for you."

Two clear paths:
- **"Let Naveen Sync It 🔥 (Auto)"** — The perfect, buttery-smooth, mathematically flawless auto-scroll + precisely timed typography animations.
- **"I’ll Do It Myself (Manual Challenge)"** — Pure manual mode for the competitive or curious. Includes subtle "sync quality" feedback.

The auto mode is the hero payoff: stunning, bleeding-edge typography that reacts on-beat, perfectly timed reveals, and smooth programmatic scrolling that keeps the current lyric perfectly framed. It feels *expensive*.

This is not just a lyric video. It’s a **conversation piece**, a **portfolio flex**, and a **viral-friendly micro-experience** perfect for Instagram Reels, TikTok, and Twitter shares ("I tried the manual mode… never again 😂").

---

## 2. User Flow & Information Architecture

### 2.1 Landing / Hero (First Fold)
- Full-bleed or generous hero with cinematic tropical sunset gradient background (deep navy → hot pink → purple → golden orange).
- Large, bold, variable-font or heavily styled title treatment: **HARLEYS IN HAWAII**.
- Subtle tagline: "An Interactive Lyric Sync Experience by Naveen" or "Ride the Beat. Or Let Me Drive."
- Elegant instruction block (glassmorphism or subtle card):
  > Scroll to match the groove.  
  > Try to keep the lyrics perfectly in sync with the 140 BPM.  
  > It’s harder than it looks.
- Two large, prominent CTAs (side-by-side or stacked on mobile):
  1. **🔥 LET NAVEEN SYNC IT** (primary, hot pink gradient fill)
  2. **I’LL SYNC IT MYSELF** (secondary, outlined or teal)
- Subtle audio waveform visual or static album-art style graphic with motorcycle/palm silhouette.
- Small "Uses original MP3 • Best on mobile • Scroll with thumb" note.

### 2.2 The Experience Zone (Main Content)
A single long vertical scroll container (`#lyrics-scroll`).

**Sticky / Fixed UI Elements (always accessible):**
- Top or bottom mini audio player bar:
  - Song title + artist
  - Play / Pause (big tap target)
  - Current time / Total duration
  - Progress scrubber (also shows current lyric time)
  - Subtle BPM indicator (140)
- Floating or docked "Mode" indicator + switch button (once in a mode)
- Optional right-side or bottom "Sync Quality" meter in manual mode (fun % or "Groove Score")

**Lyrics Content Structure:**
Long vertical list of lyric blocks/sections with generous vertical rhythm (lots of breathing room between verses/choruses).

Each block:
- Large, bold typography (font-size responsive: ~2.8rem → 4.5rem on desktop)
- Generous line-height (1.35–1.5)
- Section labels subtly shown (VERSE 1, PRE-CHORUS, CHORUS) in smaller, tracking-widest, mono or display font, colored accent.
- Individual lines or logical phrases as separate scroll-snappable or highlightable units.

**Visual Hierarchy & Animation Targets:**
- Inactive lines: Slightly muted color or lower opacity.
- Active / Current line (in both modes): Dramatic treatment — scale up slightly, color shift to vibrant accent (hot pink or gold), text-shadow/glow, perhaps subtle variable font weight or width change on beat.
- Special lines get unique micro-animations:
  - "vroom vroom" or revving lines → speed lines or engine particle burst (CSS or lightweight Canvas)
  - "hula-hula, hula" → gentle sway/rotate animation
  - "pink and purple in the sky" → background or text gradient shift to those colors
  - Final chorus/outro → bigger celebration (confetti burst or intensified glow)

### 2.3 Mode-Specific Behaviors

#### Manual Mode ("I’ll Do It Myself")
- User has full control of scroll.
- **Core Math (the soul):** 
  - Total scrollable height of `#lyrics-scroll` is mapped 1:1 to audio duration.
  - On `scroll` event (throttled + requestAnimationFrame):
    ```js
    const progress = (scrollTop + viewportCenterOffset) / (scrollHeight - viewportHeight);
    const targetTime = progress * audioDuration;
    audio.currentTime = targetTime;   // or smooth lerp for less jitter
    ```
  - Optional advanced: Calculate recent scroll velocity (px/ms) and map to `audio.playbackRate` (clamped 0.6–1.8). This makes fast scrolling speed up the track (with acceptable pitch shift for the prank feel) and slow scrolling slow it down. Makes the "sync challenge" more visceral and fun.
- Visual feedback: Current active line highlights automatically based on `audio.currentTime`.
- After ~15–25 seconds of play or noticeable struggle detection (high variance in scroll velocity or frequent stops/starts), a charming, non-intrusive toast or modal appears:
  > "Maintaining perfect 140 BPM scroll sync is kind of brutal, huh? 😌  
  > Want Naveen to take over with flawless auto timing?"
  - Buttons: "Yes, let’s go auto" | "Nah, I got this"
- A persistent "Switch to Auto Sync by Naveen" floating action button appears after first interaction.

#### Auto Mode ("Let Naveen Sync It")
- Audio plays at exact 1.0 rate (perfect pitch & timing).
- **Programmatic smooth auto-scroll** driven by `requestAnimationFrame`:
  1. Read `audio.currentTime`
  2. Find the currently active lyric block(s) using pre-defined `startTime` / `endTime` data.
  3. Smoothly `scrollTo` or use a custom eased scroll (Lenis.js recommended or custom ease function) so the active lyric is centered in viewport with comfortable padding.
  4. Trigger per-line or per-word entrance/reveal animations exactly on their timestamps (or on entering view).
- User can still manually scroll to override temporarily (for curiosity), but the RAF loop gently corrects back within 800–1200ms unless user is actively dragging.
- Big, beautiful, confident typography treatments that feel "produced".
- A prominent but elegant badge: **AUTO-SYNC BY NAVEEN** with a small math/precision icon.

### 2.4 End State & Outro
- After final outro lyric, nice closing screen or section:
  - "Thanks for riding with me." — Naveen
  - "Try the manual challenge again?" or "Share your sync attempt"
  - Subtle replay button
  - Links: View source on GitHub, Try another song (future), Jozi Bakes or personal site if appropriate (light touch)
- Optional: Fake "Sync Score" for manual mode attempts (calculate how close velocity stayed to ideal 140 BPM average). Fun, not serious.

---

## 3. Visual Design System

### 3.1 Color Palette (Tropical Sunset Ride)
- **Deep Base:** `#0F0A1F` or `#1A1429` (rich night sky / road)
- **Hot Accent:** `#FF2E63` or `#FF4D94` (Katy pink / brake light)
- **Purple Magic:** `#7B2CBF` or `#9D4EDD` (twilight)
- **Golden Hour:** `#FFD166`, `#FF9F1C`
- **Ocean Teal:** `#06D6A0`, `#118AB2`
- **Text Primary:** `#FFFFFF` / `#F1E9FF`
- **Text Muted:** `#A8A4B8` or semi-transparent white
- Gradients everywhere: `linear-gradient(135deg, #FF4D94, #7B2CBF)`, conic or radial for sky effects.

### 3.2 Typography
- **Display / Titles:** Bold condensed or extended variable font (e.g. Inter Tight, Clash Display, or system `font-weight: 900` + `font-stretch` if supported). Heavy tracking or tight for impact.
- **Lyrics Body:** Large, highly legible sans (Inter, Satoshi, or SF Pro / system). Prioritize readability at big sizes on mobile.
- **Accents / Labels:** Monospace or narrow display for "VERSE 1", "140 BPM".
- Variable font axes (if used): Weight + width for micro-animations on active lines.

### 3.3 Motion & Animation Philosophy
- **Respect reduced motion.**
- Smooth, confident, slightly luxurious easing (custom cubic-bezier or GSAP defaults).
- **Auto mode:** Programmatic scroll feels like a high-end music video director is in control.
- **Manual mode:** Natural scroll physics + satisfying highlight feedback.
- Micro-interactions on special phrases (hula sway = `transform: rotate(-2deg) scale(1.02)` with transition; rev lines = quick horizontal translate of pseudo speed lines).
- Subtle background: Very slow parallax palm/road elements or CSS animated gradient shifts that respond to mode or audio energy (advanced).

### 3.4 Layout & Spacing
- Mobile-first, thumb-friendly.
- Generous vertical whitespace between lyric blocks (1.5–2.5× line height).
- Max content width ~680–780px centered for readability on desktop; full bleed on mobile.
- Safe areas respected on notched phones.

---

## 4. Technical Architecture & Implementation

### 4.1 Tech Stack (Recommended for Quality + Easy Deploy)
- **Build Tool:** Vite (or Parcel) — fast, modern, great for static deploy.
- **Styling:** Tailwind CSS v4 (or v3) + custom CSS for fancy effects. Or pure CSS Modules if preferred.
- **Audio:** Native `<audio>` + Web Audio API for advanced needs. Consider Howler.js for easier sprite/precise control if multiple sounds added later.
- **Smooth Scroll (Auto mode):** 
  - Lightweight: Native `scrollTo({ behavior: 'smooth' })` + custom JS easing loop, OR
  - Recommended: [Lenis](https://lenis.darkroom.engineering/) (tiny, buttery, controllable) — perfect for this.
- **Animations:** CSS transitions + `requestAnimationFrame` for timing logic. GSAP (ScrollTrigger + Tween) only if budget allows (increases bundle).
- **No heavy frameworks** unless you want React/ Vue for state (overkill for this; vanilla + signals or simple state object is cleaner and lighter).
- **Deployment:** Vercel (automatic from GitHub main branch). GitHub Pages also works but Vercel is superior for previews + speed.

### 4.2 Data Model ( Crucial for Sync )
Create `src/data/harleys-in-hawaii.js` (or JSON):

```js
export const song = {
  title: "Harleys in Hawaii",
  artist: "Katy Perry",
  duration: 185.2,           // seconds (precise from your MP3)
  bpm: 140,
  audioSrc: "/audio/harleys-in-hawaii.mp3",  // place in public/audio
  lyrics: [
    {
      id: "v1-1",
      start: 0.0,
      end: 4.8,
      section: "VERSE 1",
      text: "Boy, tell me, can you take my breath away?",
      animation: "default"
    },
    {
      id: "v1-2",
      start: 4.8,
      end: 9.1,
      text: "Cruisin' down a heart-shaped highway",
      animation: "default"
    },
    // ... full timed data for every line
    {
      id: "chorus-peak",
      start: 32.5,
      end: 38.0,
      section: "CHORUS",
      text: "Ridin' Harleys in Hawaii-i-i",
      animation: "sky-shift"   // special handler
    },
    // ... continue for all
  ]
}
```

**How to get precise timings:**
1. Play MP3 in any DAW, Audacity, or browser audio player with waveform.
2. Manually note start/end times for each logical phrase (or use AI tools / forced alignment libs later for automation).
3. For MVP: Line-level timing is excellent. Word-level is pro polish.

### 4.3 Core Sync Logic (Pseudocode)

**Manual Scroll → Audio**
```js
let isUserScrolling = false;
lyricsScrollEl.addEventListener('scroll', () => {
  if (currentMode !== 'manual') return;
  isUserScrolling = true;
  
  const progress = (lyricsScrollEl.scrollTop + (window.innerHeight * 0.4)) / 
                   (lyricsScrollEl.scrollHeight - window.innerHeight);
  const targetTime = Math.max(0, Math.min(song.duration, progress * song.duration));
  
  // Smooth seek to avoid audio glitches
  audio.currentTime = targetTime; 
  
  // Optional velocity → playbackRate
  // const velocity = calculateRecentScrollVelocity();
  // audio.playbackRate = Math.max(0.65, Math.min(1.75, velocity / idealPxPerSecond));
}, { passive: true });
```

**Auto Mode RAF Loop**
```js
function autoSyncLoop() {
  if (currentMode !== 'auto' || audio.paused) return;
  
  const t = audio.currentTime;
  const active = song.lyrics.find(l => t >= l.start && t < l.end);
  
  if (active && active.id !== lastActiveId) {
    lastActiveId = active.id;
    highlightLyricBlock(active.id);
    triggerSpecialAnimation(active);
    
    // Smooth center the active block
    const blockEl = document.getElementById(active.id);
    if (blockEl) {
      const targetY = blockEl.offsetTop - (window.innerHeight * 0.38);
      lyricsScrollEl.scrollTo({ top: targetY, behavior: 'smooth' });
      // Or use Lenis: lenis.scrollTo(targetY, { duration: 0.8, easing: customEase })
    }
  }
  requestAnimationFrame(autoSyncLoop);
}
```

### 4.4 File & Folder Structure (Suggested)
```
harleys-in-hawaii-lyric-prank/
├── index.html
├── src/
│   ├── main.js                 # Boot, mode switching, event wiring
│   ├── audio.js                # Audio setup, play/pause, timeupdate helpers
│   ├── sync.js                 # Manual + Auto logic, RAF loop, struggle detection
│   ├── animations.js           # Highlight, special FX handlers
│   ├── data/
│   │   └── harleys-in-hawaii.js
│   └── styles/
│       ├── tailwind.css
│       └── custom.css          # Glass, gradients, lyric styles, animations
├── public/
│   ├── audio/
│   │   └── harleys-in-hawaii.mp3   # IMPORTANT: Add your original file here
│   └── assets/                 # SVGs for icons, palm silhouette, etc.
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md                   # How to run + how to add new songs
```

### 4.5 Performance & Mobile Notes
- Keep DOM reasonable (30–40 lyric blocks max is fine).
- Use `will-change: transform` sparingly on active elements.
- Test scroll jank on low-end Android — Lenis or native is usually fine.
- Audio: `preload="metadata"`, handle `canplaythrough`.
- Add `touch-action: pan-y` on scroll container.
- Respect `prefers-reduced-motion`.
- Make it installable as PWA (optional but nice for "app-like" feel).

---

## 5. Content & Copy Guidelines

**Tone:** Playful, confident, slightly mischievous, matching the flirty adventurous song vibe. Warm and human ("lemme do that for you").

Key microcopy examples:
- Hero instruction: "Try scrolling in perfect rhythm with the music. Match the BPM. Keep the lyrics locked in. Most people can’t do it for long."
- Struggle toast: "Okay, be honest… that was kinda hard, right? Let Naveen handle the timing so you can actually feel the song."
- Auto badge: "AUTO-SYNC BY NAVEEN — Mathematically perfect • 140 BPM locked"
- Manual success (if they do well): Subtle "Nice groove 👏" toast (rare, so satisfying when it triggers).

---

## 6. Implementation Phases (Recommended)

**Phase 1 (MVP — 1–2 days)**
- Static HTML + Tailwind
- Hardcoded full lyrics (with approximate timings first)
- Basic `<audio>` playback
- Manual scroll → `currentTime` mapping (core math working)
- Simple active line highlighting via `timeupdate` or RAF
- Two mode buttons that toggle a `data-mode` attribute + basic behavior switch

**Phase 2 (Polish — 1–2 days)**
- Accurate timing data for the whole song
- Auto mode with smooth scroll centering + basic per-section animations
- Struggle detection + charming prompt to switch
- Special animation handlers for "hula-hula", "pink and purple in the sky", rev lines
- Refined typography scaling, colors, gradients, glass effects
- Mobile testing + responsive tweaks

**Phase 3 (Production Quality)**
- Lenis or custom smooth scroll
- PlaybackRate velocity mapping in manual (fun factor)
- Subtle background visual sync (gradient or lightweight canvas)
- "Sync Score" for manual attempts
- Share buttons (capture canvas of current view + text)
- Easy config to swap songs (new JSON + MP3 drop-in)
- README with beautiful screenshots + deployment guide
- Optional: Add 1–2 more songs later to turn it into a mini "Naveen’s Lyric Pranks" series

---

## 7. Assets Needed
- Original high-quality MP3 of the song (user provides)
- Album art or custom key visual (Harley + Hawaii sunset + palm + ocean — can generate or commission)
- Simple SVG icons: Play, Pause, Motorcycle, Palm, Math symbol for "Naveen Sync"
- Optional: Subtle looping background texture or video (muted, low opacity) — keep very light

---

## 8. Success Metrics & Future Ideas
- Time spent on page, mode switch rate (manual → auto should be high)
- Share rate / screenshot rate
- Fun: People posting "I synced it myself" or "I lasted X seconds in manual" videos

**Future Expansions:**
- User can upload their own MP3 + paste lyrics → auto-generates a timed experience (more advanced timing UI)
- Gallery of multiple pranks/songs
- "Create your own prank version" flow
- Integration with Jozi Bakes branding for fun bakery-themed lyric videos? (stretch)

---

## 9. Why This Will Work
- **Novelty + Prank:** Most lyric videos are passive. This gives the user agency then lovingly takes it away in the most satisfying way.
- **Mathematical Soul:** The precise scroll-to-time mapping feels clever and "built by a developer who cares".
- **Premium Execution:** Bleeding-edge typography, perfect timing, and charming copy will make it feel like a studio production.
- **Mobile Native:** Built for the way people actually consume music content today.
- **Portfolio Power:** Shows deep understanding of timing, animation, UX psychology, performance, and delightful micro-interactions.

---

**Ready to build?**

This document is intentionally detailed enough to start coding immediately. The core loop (scroll ↔ time mapping + timed auto-scroll) is the technical heart — nail that first and everything else layers beautifully on top.

Naveen, this has the potential to be one of those "I wish I made that" projects that gets shared widely. The combination of technical precision and playful human psychology is rare and memorable.

Let’s make the beat ride perfectly — whether the user does it themselves or lets you handle it.

---

*Document prepared for implementation. All design decisions prioritize delight, performance on mobile, and that perfect "Naveen touch" of mathematical elegance + warm personality.*

**Next Step Recommendation:** Create the Vite + Tailwind repo, drop in the MP3, implement Phase 1 core sync, then we iterate on the animations and copy together.

---

# Update: the ink-letter build (current)

Everything above is preserved history. The shipped design is now a
handwritten love letter: aged cream paper with fold creases and a
stationery rule, a wax seal that opens the letter, each song section one
"page" with an oval photo cameo (rose / candle / key / dove / pearls /
bouquet / pocket watch / ring — romantic register, never literal
word-matching), body words filling with sepia ink top-to-bottom at their
real sung timestamps, script keywords (Great Vibes) writing themselves
across in oxblood, wet words shedding running ink drips on a canvas
overlay, "my sweetheart," / "yours, always ❤" as salutation and sign-off,
and the whispered outro as a postscript. No song title, no names, no
credits on the page itself. Three.js/Theatre.js removed; DOM + one 2D
canvas; see README.md and CLAUDE.md Update 4.
