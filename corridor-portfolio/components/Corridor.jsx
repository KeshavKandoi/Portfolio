'use client';

import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

// ── Dimensions ──
// Keeping these as module-level constants avoids recreating them
// on every render — they're hoisted and never re-allocated.
const W = 6;       // corridor width
const H = 5;       // corridor height
const L = 120;     // corridor length
const LED_N = 12;  // number of recessed LED segments
const LED_STEP = L / LED_N;

function seededRandom(seed) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ── Shared Geometries ──────────────────────────────────────────
// Every unique geometry is created once via useMemo and reused
// across all meshes that share its shape. This means:
//   1. One GPU vertex buffer allocation per shape, not per mesh.
//   2. Three.js can batch draw calls when consecutive meshes
//      share the same geometry + material combination.
//   3. Less GC pressure from orphaned BufferGeometry objects.
function useGeometries() {
  return useMemo(() => ({
    floor:      new THREE.PlaneGeometry(W, L),
    wall:       new THREE.PlaneGeometry(L, H),
    ceiling:    new THREE.PlaneGeometry(W, L),
    ledStrip:   new THREE.PlaneGeometry(0.14, LED_STEP * 0.7),
    baseboard:  new THREE.PlaneGeometry(L, 0.15),
    cornerBand: new THREE.PlaneGeometry(L, 0.7),
  }), []);
}

function useCeilingTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FAFAF8';
    ctx.fillRect(0, 0, size, size);

    const img = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const noise = (seededRandom(i + 311) - 0.5) * 4;
      img.data[i]     += noise; // R
      img.data[i + 1] += noise; // G
      img.data[i + 2] += noise; // B
    }
    ctx.putImageData(img, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 20);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

function useSurfaceTextures() {
  const [wallSource, floorSource] = useLoader(THREE.TextureLoader, [
    '/assets/Background/wall.png',
    '/assets/Background/floor.png',
  ]);

  return useMemo(() => {
    const wall = wallSource.clone();
    wall.wrapS = wall.wrapT = THREE.RepeatWrapping;
    wall.repeat.set(6, 2);
    wall.colorSpace = THREE.SRGBColorSpace;
    wall.anisotropy = 4;
    wall.needsUpdate = true;

    const floor = floorSource.clone();
    floor.wrapS = floor.wrapT = THREE.RepeatWrapping;
    floor.repeat.set(8, 20);
    floor.rotation = Math.PI / 2;
    floor.center.set(0.5, 0.5);
    floor.colorSpace = THREE.SRGBColorSpace;
    floor.anisotropy = 8;
    floor.needsUpdate = true;

    return { wall, floor };
  }, [wallSource, floorSource]);
}

// ── Shared Materials ───────────────────────────────────────────
// One material instance per surface type. When multiple meshes
// reference the same material, Three.js can sort and batch them
// without a shader re-compile between draw calls.
function useMaterials(floorTex, wallTex) {
  const ceilingTex = useCeilingTexture();

  return useMemo(() => ({
    floor:     new THREE.MeshStandardMaterial({ map: floorTex, color: '#ECE8DF', roughness: 0.65, metalness: 0.0 }),
    wall:      new THREE.MeshStandardMaterial({ map: wallTex, color: '#F4F3EF', roughness: 0.95, metalness: 0.0 }),
    ceiling:   new THREE.MeshStandardMaterial({ map: ceilingTex, color: '#FAFAF8', roughness: 0.9, metalness: 0.0 }),
    led:       new THREE.MeshStandardMaterial({
      color: '#FFF8E8',
      emissive: '#FFF8E8',
      emissiveIntensity: 1.6,
      toneMapped: false,
    }),
    ledGlow:   new THREE.MeshBasicMaterial({
      color: '#FFF8E8',
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    baseboard: new THREE.MeshStandardMaterial({ color: '#F5F4F0', roughness: 0.78, metalness: 0.0 }),
    cornerAo:  new THREE.MeshBasicMaterial({
      color: '#7b7469',
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
    }),
  }), [ceilingTex, floorTex, wallTex]);
}

// ── Corridor Component ────────────────────────────────────────
// The corridor is a single group containing all structural meshes.
// There are ZERO point lights here — the LED strips are purely
// emissive, and all scene lighting lives in Lights.jsx.
export default function Corridor() {
  const geos = useGeometries();
  const textures = useSurfaceTextures();
  const mats = useMaterials(textures.floor, textures.wall);

  // LED Z positions — computed once.
  // The corridor extends from -L/2 to +L/2 relative to the group.
  const ledZ = useMemo(
    () => Array.from({ length: LED_N }, (_, i) => -L / 2 + i * LED_STEP),
    []
  );

  return (
    <group position={[0, 0, -L / 2 + 8]}>
      {/* ── Floor — light oak long planks ── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={geos.floor}
        material={mats.floor}
        receiveShadow
      />

      {/* ── Ceiling — matte white ── */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, H, 0]}
        geometry={geos.ceiling}
        material={mats.ceiling}
        receiveShadow
      />

      {/* ── Left wall — off-white textured plaster ── */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-W / 2, H / 2, 0]}
        geometry={geos.wall}
        material={mats.wall}
        receiveShadow
      />

      {/* ── Right wall — same material, shared geometry ── */}
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[W / 2, H / 2, 0]}
        geometry={geos.wall}
        material={mats.wall}
        receiveShadow
      />

      {/* ── Baseboards (left & right) — pale architectural trim ──
           Adds a subtle architectural detail that separates the
           floor from the wall visually. Only 2 extra draw calls
           with a shared geometry and material.                */}
      <mesh
        position={[-W / 2 + 0.01, 0.075, 0]}
        rotation={[0, Math.PI / 2, 0]}
        geometry={geos.baseboard}
        material={mats.baseboard}
      />
      <mesh
        position={[W / 2 - 0.01, 0.075, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        geometry={geos.baseboard}
        material={mats.baseboard}
      />

      {/* Soft ambient occlusion strips at the floor-wall corners. */}
      <mesh
        position={[-W / 2 + 0.018, 0.32, 0]}
        rotation={[0, Math.PI / 2, 0]}
        geometry={geos.cornerBand}
        material={mats.cornerAo}
      />
      <mesh
        position={[W / 2 - 0.018, 0.32, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        geometry={geos.cornerBand}
        material={mats.cornerAo}
      />

      {/* ── Recessed LED strips — emissive only ──
           NO point lights. Each strip is a thin emissive plane.
           toneMapped: false lets them clip past 1.0 in HDR,
           so they appear intensely bright and the camera's
           tone-mapping pass creates a soft glow around them.
           This is the single most impactful optimization: 14
           meshes vs. 14 meshes + 28 point lights.            */}
      {ledZ.map((z, i) => (
        <mesh
          key={`led-${i}`}
          position={[0, H - 0.015, z]}
          rotation={[Math.PI / 2, 0, 0]}
          geometry={geos.ledStrip}
          material={mats.led}
        />
      ))}

      {ledZ.map((z, i) => (
        <mesh
          key={`led-glow-${i}`}
          position={[0, H - 0.02, z]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[2.9, 1.35, 1]}
          geometry={geos.ledStrip}
          material={mats.ledGlow}
        />
      ))}
    </group>
  );
}
