'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

// ── Dimensions ──
// Keeping these as module-level constants avoids recreating them
// on every render — they're hoisted and never re-allocated.
const W = 6;       // corridor width
const H = 5;       // corridor height
const L = 120;     // corridor length
const LED_N = 14;  // number of LED strip segments
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
  }), []);
}

// ── Procedural Textures ────────────────────────────────────────
// Canvas-generated textures avoid network requests and disk I/O.
// They're created once (via useMemo) and remain in GPU memory
// for the component's lifetime.

function useFloorTexture() {
  return useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base coat: light natural oak.
    ctx.fillStyle = '#D9C6A5';
    ctx.fillRect(0, 0, size, size);

    const plankWid = 44;

    // Long straight planks, scaled to run down the corridor.
    for (let x = 0; x < size; x += plankWid) {
      const shade = 0.94 + seededRandom(x + 17) * 0.12;
      const r = Math.floor(217 * shade);
      const g = Math.floor(198 * shade);
      const b = Math.floor(165 * shade);

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, 0, plankWid - 1, size);

      ctx.strokeStyle = '#B6956E';
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + plankWid - 1, 0);
      ctx.lineTo(x + plankWid - 1, size);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = 'rgba(110,82,50,0.12)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 180; i++) {
      const sx = seededRandom(i * 4 + 1) * size;
      const sy = seededRandom(i * 4 + 2) * size;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(
        sx + seededRandom(i * 4 + 3) * 3 - 1.5, sy + 24,
        sx + seededRandom(i * 4 + 4) * 3 - 1.5, sy + 48
      );
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(W / 1.5, L / 8);
    // anisotropy 4 is plenty for a floor seen from ~1.6m height;
    // 8 would read 8× the texels per pixel for negligible gain.
    tex.anisotropy = 4;
    return tex;
  }, []);
}

function useWallTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#F4F3EF';
    ctx.fillRect(0, 0, size, size);

    // Tiny plaster imperfections.
    const img = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const noise = (seededRandom(i + 101) - 0.5) * 8;
      img.data[i]     += noise; // R
      img.data[i + 1] += noise; // G
      img.data[i + 2] += noise; // B
    }
    ctx.putImageData(img, 0, 0);

    ctx.strokeStyle = 'rgba(0,0,0,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < size; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }

    for (let y = 0; y < size; y += 6) {
      const streak = (seededRandom(y + 211) - 0.5) * 4;
      ctx.fillStyle = `rgba(${210 + streak},${208 + streak},${202 + streak},0.08)`;
      ctx.fillRect(0, y, size, 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 18);
    // Walls are viewed nearly head-on in the corridor, so
    // anisotropic filtering buys nothing — keep it 0.
    tex.anisotropy = 0;
    return tex;
  }, []);
}

// ── Shared Materials ───────────────────────────────────────────
// One material instance per surface type. When multiple meshes
// reference the same material, Three.js can sort and batch them
// without a shader re-compile between draw calls.
function useMaterials(floorTex, wallTex) {
  return useMemo(() => ({
    floor:     new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55, metalness: 0.0 }),
    wall:      new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.92, metalness: 0.0 }),
    ceiling:   new THREE.MeshStandardMaterial({ color: '#FAFAF8', roughness: 0.8, metalness: 0.0 }),
    // toneMapped: false lets the emissive value exceed 1.0 in
    // HDR space, so the strip appears intensely bright without
    // needing a matching point light. The camera's tone-mapping
    // pass naturally creates a soft glow around bright pixels.
    led:       new THREE.MeshStandardMaterial({
      color: '#FFF8E8',
      emissive: '#FFF8E8',
      emissiveIntensity: 1.15,
      toneMapped: false,
    }),
    baseboard: new THREE.MeshStandardMaterial({ color: '#E8E2D8', roughness: 0.74, metalness: 0.0 }),
  }), [floorTex, wallTex]);
}

// ── Corridor Component ────────────────────────────────────────
// The corridor is a single group containing all structural meshes.
// There are ZERO point lights here — the LED strips are purely
// emissive, and all scene lighting lives in Lights.jsx.
export default function Corridor() {
  const geos = useGeometries();
  const floorTex = useFloorTexture();
  const wallTex = useWallTexture();
  const mats = useMaterials(floorTex, wallTex);

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
      />

      {/* ── Ceiling — matte white ── */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, H, 0]}
        geometry={geos.ceiling}
        material={mats.ceiling}
      />

      {/* ── Left wall — off-white textured plaster ── */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-W / 2, H / 2, 0]}
        geometry={geos.wall}
        material={mats.wall}
      />

      {/* ── Right wall — same material, shared geometry ── */}
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[W / 2, H / 2, 0]}
        geometry={geos.wall}
        material={mats.wall}
      />

      {/* ── Baseboards (left & right) — pale architectural trim ──
           Adds a subtle architectural detail that separates the
           floor from the wall visually. Only 2 extra draw calls
           with a shared geometry and material.                */}
      <mesh
        position={[-W / 2 + 0.01, 0.075, 0]}
        geometry={geos.baseboard}
        material={mats.baseboard}
      />
      <mesh
        position={[W / 2 - 0.01, 0.075, 0]}
        geometry={geos.baseboard}
        material={mats.baseboard}
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
    </group>
  );
}
