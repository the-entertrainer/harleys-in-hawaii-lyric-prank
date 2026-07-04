import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createHeroObject } from './heroObjects.js';

export const IS_MOBILE = matchMedia('(max-width: 640px)').matches;
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PARTICLE_COUNT = IS_MOBILE ? 26 : 60;

/** A soft circular sprite drawn once to a canvas — no external texture
 * download, no license to track, and it is trivially cheap to regenerate
 * at any tint. */
function makeBokehTexture(){
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildParticles(){
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const speeds = new Float32Array(PARTICLE_COUNT);
  const phases = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++){
    positions[i * 3] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    speeds[i] = 0.06 + Math.random() * 0.10;
    phases[i] = Math.random() * Math.PI * 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    size: IS_MOBILE ? 0.55 : 0.7,
    map: makeBokehTexture(),
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: new THREE.Color().setHSL(0.9, 0.6, 0.85),
  });
  const points = new THREE.Points(geo, material);
  points.userData = { speeds, phases, basePositions: positions.slice() };
  return points;
}

export function initScene(canvas){
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !IS_MOBILE, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.6 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(0, 0, 8);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const keyLight = new THREE.DirectionalLight(0xffe6c9, 1.0);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0xff8fb8, 3.5, 20);
  rimLight.position.set(-4, -2, 3);
  scene.add(rimLight);
  scene.add(new THREE.AmbientLight(0x2a1230, 0.6));

  const particles = buildParticles();
  scene.add(particles);

  const heroObjects = {
    heart: createHeroObject('heart', 340),
    bloom: createHeroObject('bloom', 320),
    ribbon: createHeroObject('ribbon', 38),
  };
  Object.values(heroObjects).forEach(obj => scene.add(obj));

  function resize(){
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  let clock = 0;
  function render(dt){
    clock += dt;
    if (!REDUCED_MOTION){
      const pos = particles.geometry.attributes.position;
      const { speeds, phases, basePositions } = particles.userData;
      for (let i = 0; i < PARTICLE_COUNT; i++){
        pos.array[i * 3 + 1] = basePositions[i * 3 + 1] + Math.sin(clock * speeds[i] + phases[i]) * 0.6;
        pos.array[i * 3] = basePositions[i * 3] + Math.cos(clock * speeds[i] * 0.7 + phases[i]) * 0.35;
      }
      pos.needsUpdate = true;
      Object.values(heroObjects).forEach(obj => {
        if (obj.visible) obj.rotation.y += dt * 0.18;
      });
    }
    renderer.render(scene, camera);
  }

  function setParticleHue(hue){
    particles.material.color.setHSL(hue / 360, 0.55, 0.82);
  }

  return { renderer, scene, camera, heroObjects, particles, render, resize, setParticleHue };
}
