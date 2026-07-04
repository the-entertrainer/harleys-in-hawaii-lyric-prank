import * as THREE from 'three';

/**
 * Three procedurally-authored "glass" geometries — no downloaded 3D model
 * dependency. Free CC0 catalogs (Poly Pizza / Quaternius / Kenney) turned
 * out to all be low-poly *game* assets (flat-shaded trees/rocks/blocky
 * hearts) that fought the painterly glass look this page wants, and the
 * ones worth using are gated behind JS-rendered download flows this
 * environment can't drive reliably. Authoring the geometry directly means
 * a guaranteed license-free, guaranteed-on-brand, guaranteed-to-load
 * object — and is the more advanced Three.js skill anyway.
 */

function heartShape(){
  const shape = new THREE.Shape();
  const x = 0, y = 0;
  shape.moveTo(x + 5, y + 5);
  shape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
  shape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
  shape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
  shape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
  shape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
  shape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);
  return shape;
}

function buildHeart(){
  const geo = new THREE.ExtrudeGeometry(heartShape(), {
    depth: 4.2, bevelEnabled: true, bevelThickness: 1.4, bevelSize: 1.1, bevelSegments: 8, curveSegments: 24,
  });
  geo.center();
  geo.rotateX(Math.PI);
  geo.rotateZ(Math.PI);
  geo.scale(0.07, 0.07, 0.07);
  return geo;
}

function petalShape(){
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.55, 0.4, 0.62, 1.5, 0, 2.2);
  shape.bezierCurveTo(-0.62, 1.5, -0.55, 0.4, 0, 0);
  return shape;
}

/** An abstracted glass bloom: layered rings of extruded petals fanning out
 * and curling upward, rather than a literal (and much harder to get right)
 * rose model. */
function buildBloom(){
  const group = new THREE.Group();
  const petalGeo = new THREE.ExtrudeGeometry(petalShape(), { depth: 0.05, bevelEnabled: false, curveSegments: 12 });
  petalGeo.translate(0, 0, -0.025);
  const rings = [
    { count: 5, radius: 0.05, tilt: 0.15, scale: 0.55, yOff: 0.3 },
    { count: 6, radius: 0.16, tilt: 0.55, scale: 0.78, yOff: 0.14 },
    { count: 7, radius: 0.30, tilt: 1.05, scale: 1.0, yOff: 0 },
    { count: 8, radius: 0.42, tilt: 1.5, scale: 1.18, yOff: -0.12 },
  ];
  rings.forEach((ring, ringIdx) => {
    for (let i = 0; i < ring.count; i++){
      const angle = (i / ring.count) * Math.PI * 2 + ringIdx * 0.35;
      const petal = new THREE.Mesh(petalGeo);
      petal.position.set(Math.cos(angle) * ring.radius, ring.yOff, Math.sin(angle) * ring.radius);
      petal.rotation.y = -angle + Math.PI / 2;
      petal.rotation.x = ring.tilt;
      petal.scale.setScalar(ring.scale);
      group.add(petal);
    }
  });
  group.scale.setScalar(0.42);
  return group;
}

/** A satin ribbon: a flat rectangular cross-section extruded along a
 * flowing S-curve, using ExtrudeGeometry's `extrudePath` option. */
function buildRibbon(){
  const crossSection = new THREE.Shape();
  crossSection.moveTo(-0.55, -0.06);
  crossSection.lineTo(0.55, -0.06);
  crossSection.lineTo(0.55, 0.06);
  crossSection.lineTo(-0.55, 0.06);
  crossSection.lineTo(-0.55, -0.06);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.6, 1.0, 0),
    new THREE.Vector3(-0.6, 0.4, 0.7),
    new THREE.Vector3(0.2, 0.9, -0.6),
    new THREE.Vector3(1.0, 0.0, 0.5),
    new THREE.Vector3(1.7, -0.9, -0.4),
  ]);

  const geo = new THREE.ExtrudeGeometry(crossSection, {
    steps: 120, bevelEnabled: false, extrudePath: curve,
  });
  geo.center();
  geo.scale(0.5, 0.5, 0.5);
  return geo;
}

const GEOMETRY_BUILDERS = { heart: buildHeart, bloom: buildBloom, ribbon: buildRibbon };

export function createHeroObject(type, hue){
  const color = new THREE.Color().setHSL(hue / 360, 0.55, 0.68);
  const material = new THREE.MeshPhysicalMaterial({
    color,
    transmission: 1,
    thickness: 1.6,
    roughness: 0.22,
    ior: 1.45,
    metalness: 0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.3,
    attenuationColor: color,
    attenuationDistance: 1.5,
    envMapIntensity: 0.8,
  });

  const built = GEOMETRY_BUILDERS[type]();
  let mesh;
  if (built.isGroup){
    mesh = built;
    mesh.traverse(child => { if (child.isMesh) child.material = material; });
  } else {
    mesh = new THREE.Mesh(built, material);
  }
  mesh.visible = false;
  mesh.userData.material = material;
  return mesh;
}
