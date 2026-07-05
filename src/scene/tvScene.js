import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const IS_MOBILE = matchMedia('(max-width: 640px)').matches;
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

// The CRT screen's UV island inside the baseColor atlas, found by flood-fill
// pixel analysis of the source 2048x2048 texture (bbox 38,1010 - 436,1519,
// confirmed against the metallicRoughness map: low roughness/higher
// metalness there vs. the matte wood bezel everywhere else). Stored as
// fractions so it's resolution-independent of whatever the atlas canvas's
// actual pixel size ends up being.
export const SCREEN_UV = { u0: 0.0186, u1: 0.2129, v0: 0.4932, v1: 0.7417 };

// This model's screen UV island turned out to be unwrapped mirrored + rotated
// 90° relative to a "reads upright" orientation — found empirically with an
// asymmetric-glyph ("F") render/screenshot/compare loop (a pure bounding-box
// check can't catch rotation/mirroring, only position). The fix is applied
// once here, in compositeScreenContent, so every caller can just draw normal
// upright content at screenRect's own w x h and have it appear correct on
// the physical model.
function applyScreenContentTransform(ctx, screenRect){
  // Order matters here (matrix composition isn't commutative) — this is
  // the exact order confirmed correct by the asymmetric-glyph test: rotate
  // first, then mirror. Swapping the order nets a 180°-rotated result.
  ctx.translate(screenRect.x + screenRect.w / 2, screenRect.y + screenRect.h / 2);
  ctx.rotate(90 * Math.PI / 180);
  ctx.scale(1, -1);
  ctx.translate(-screenRect.w / 2, -screenRect.h / 2);
}

function fitDistance(camera, sphere, padding = 1.2){
  const vHalf = (camera.fov * Math.PI / 180) / 2;
  const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
  const limitingHalf = Math.min(vHalf, hHalf);
  return sphere.radius * padding / Math.sin(limitingHalf);
}

export async function initTvScene(canvas, opts = {}){
  const modelUrl = opts.modelUrl || 'models/retro-tv/scene.gltf';
  const baseColorUrl = opts.baseColorUrl || 'models/retro-tv/textures/material_baseColor.png';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_MOBILE, powerPreference: 'high-performance', alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.6 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Transparent clear — the page's own #bg (now a near-black cinematic
  // ambience, CSS, behind the canvas) shows through everywhere the TV
  // model doesn't cover, so the glowing screen reads against real dark.
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.05, 50);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const keyLight = new THREE.DirectionalLight(0xffedd2, 0.9);
  keyLight.position.set(2.4, 3, 3.2);
  scene.add(keyLight);
  scene.add(new THREE.AmbientLight(0xfff3e0, 0.35));

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(modelUrl);
  const model = gltf.scene;
  // The source asset's screen faces world +X as authored; rotate so it
  // faces the camera's default +Z framing axis instead (found empirically
  // by orbiting a test camera around the loaded model).
  model.rotation.y = -Math.PI / 2;
  scene.add(model);

  let mesh = null;
  model.traverse(o => { if (o.isMesh) mesh = o; });
  const material = mesh.material;
  // Tuned down from a "correct in isolation" value — a glossy, higher-
  // metalness screen region sitting behind on-screen text blows out to a
  // flat highlight at full env intensity (same lesson as the prior Three.js
  // build's glass hero objects, re-derived for this material/palette).
  material.envMapIntensity = 0.75;

  // ---- Screen texture atlas -------------------------------------------
  // Fetched independently of GLTFLoader's own baseColor texture so we get
  // an explicit, predictable canvas + colorSpace/flipY setup rather than
  // depending on internals of whatever GLTFLoader wired up. glTF's UV origin
  // is top-left, same as a 2D canvas/decoded image, and GLTFLoader sets
  // flipY=false on its own textures for exactly that reason — our
  // replacement CanvasTexture (sampled by the SAME UV set) must match that
  // convention or the whole atlas silently renders upside down.
  const bitmap = await createImageBitmap(await (await fetch(baseColorUrl)).blob());
  const atlasCanvas = document.createElement('canvas');
  atlasCanvas.width = bitmap.width;
  atlasCanvas.height = bitmap.height;
  const atlasCtx = atlasCanvas.getContext('2d');
  atlasCtx.drawImage(bitmap, 0, 0);

  // glTF UV (0,0) is the top-left corner of the image (same convention as
  // a 2D canvas/decoded PNG row order), which is exactly why flipY=false
  // below matches it — so pixel_y comes directly from v0, no (1-v) flip.
  const screenRect = {
    x: Math.round(SCREEN_UV.u0 * atlasCanvas.width),
    y: Math.round(SCREEN_UV.v0 * atlasCanvas.height),
    w: Math.round((SCREEN_UV.u1 - SCREEN_UV.u0) * atlasCanvas.width),
    h: Math.round((SCREEN_UV.v1 - SCREEN_UV.v0) * atlasCanvas.height),
  };

  const atlasTexture = new THREE.CanvasTexture(atlasCanvas);
  atlasTexture.flipY = false;
  atlasTexture.colorSpace = THREE.SRGBColorSpace;
  // Disabling mipmaps stops texture-atlas "UV bleed" — without this, the
  // GPU's mip pyramid blends the screen rect's high-contrast text with the
  // wood-bezel texels just outside it at minified distances, showing a
  // faint sliver of screen content smeared above the actual glass. The
  // canvas is already supersampled in tvScreen.js, so plain bilinear
  // filtering (no mip chain) still looks sharp at normal viewing distance.
  atlasTexture.generateMipmaps = false;
  atlasTexture.minFilter = THREE.LinearFilter;
  atlasTexture.magFilter = THREE.LinearFilter;
  material.map?.dispose();
  material.map = atlasTexture;

  // ---- Emissive glow ---------------------------------------------------
  // A second atlas-sized canvas, black everywhere except the screen rect
  // (which mirrors the live broadcast content) — so only the CRT glass
  // itself glows/blooms, never the wood bezel or knobs, no matter how
  // bright the on-screen content gets.
  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = atlasCanvas.width;
  emissiveCanvas.height = atlasCanvas.height;
  const emissiveCtx = emissiveCanvas.getContext('2d');
  emissiveCtx.fillStyle = '#000';
  emissiveCtx.fillRect(0, 0, emissiveCanvas.width, emissiveCanvas.height);

  const emissiveTexture = new THREE.CanvasTexture(emissiveCanvas);
  emissiveTexture.flipY = false;
  emissiveTexture.colorSpace = THREE.SRGBColorSpace;
  emissiveTexture.generateMipmaps = false;
  emissiveTexture.minFilter = THREE.LinearFilter;
  emissiveTexture.magFilter = THREE.LinearFilter;
  material.emissiveMap?.dispose();
  material.emissiveMap = emissiveTexture;
  material.emissive = new THREE.Color(0xffffff);
  material.emissiveIntensity = 1.4;
  material.needsUpdate = true;

  /** Composite a screen-content source canvas (drawn normally, upright, at
   * whatever its own native w x h is) into the atlas's screen rect (and the
   * matching emissive rect), applying the model-specific correction
   * transform, then flag both textures dirty. */
  function compositeScreenContent(sourceCanvas){
    atlasCtx.save();
    applyScreenContentTransform(atlasCtx, screenRect);
    atlasCtx.drawImage(sourceCanvas, 0, 0, screenRect.w, screenRect.h);
    atlasCtx.restore();
    atlasTexture.needsUpdate = true;

    emissiveCtx.save();
    applyScreenContentTransform(emissiveCtx, screenRect);
    emissiveCtx.drawImage(sourceCanvas, 0, 0, screenRect.w, screenRect.h);
    emissiveCtx.restore();
    emissiveTexture.needsUpdate = true;
  }

  // ---- Bloom post-processing ------------------------------------------
  // Threshold tuned so only the emissive screen glow (and its own bright
  // specular highlight) blooms — the PBR-lit wood bezel stays clean.
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 0.85, 0.55, 0.72,
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  // ---- Framing -----------------------------------------------------
  const box = new THREE.Box3().setFromObject(model);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  let baseDist = 0;

  function frame(){
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    baseDist = fitDistance(camera, sphere, 1.2);
  }
  frame();
  window.addEventListener('resize', frame);

  let px = 0, py = 0;
  function setParallax(nx, ny){ px = nx; py = ny; }

  // ---- Camera choreography --------------------------------------------
  // Driven by Theatre.js (see tools/build-theatre-state.mjs's `camera`
  // track): yaw/pitch orbit the base framing, distanceMul dollies in/out,
  // roll gives an occasional subtle dutch tilt. Theatre's own bezier
  // keyframe interpolation is what makes cuts/dollies smooth — this just
  // applies whatever value it's given each frame.
  let shotYaw = 0, shotPitch = 0, shotDistanceMul = 1, shotRoll = 0;
  function setShot(s){
    if (s.yaw !== undefined) shotYaw = s.yaw;
    if (s.pitch !== undefined) shotPitch = s.pitch;
    if (s.distanceMul !== undefined) shotDistanceMul = s.distanceMul;
    if (s.roll !== undefined) shotRoll = s.roll;
  }

  function render(){
    if (!REDUCED_MOTION){
      const dist = baseDist * shotDistanceMul;
      // Parallax is a small nudge on top of the choreographed shot, scaled
      // down on tight close-ups so it doesn't read as jitter.
      const parallaxScale = Math.min(shotDistanceMul, 1) * 0.05;
      const yaw = shotYaw + px * parallaxScale;
      const pitch = shotPitch - py * parallaxScale * 0.7;
      camera.position.set(
        sphere.center.x + Math.sin(yaw) * Math.cos(pitch) * dist,
        sphere.center.y + Math.sin(pitch) * dist,
        sphere.center.z + Math.cos(yaw) * Math.cos(pitch) * dist,
      );
      camera.up.set(0, 1, 0);
      camera.lookAt(sphere.center);
      if (shotRoll) camera.rotateZ(shotRoll);
    } else {
      camera.position.set(sphere.center.x, sphere.center.y, sphere.center.z + baseDist);
      camera.up.set(0, 1, 0);
      camera.lookAt(sphere.center);
    }
    composer.render();
  }

  return {
    renderer, scene, camera, model,
    screenRect, atlasTexture, compositeScreenContent,
    render, resize: frame, setParallax, setShot,
  };
}
