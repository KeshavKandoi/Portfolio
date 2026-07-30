'use client';

// ── Lighting: 4 lights total ───────────────────────────────────
// The previous setup had 28 point lights (14 LED strips + 14 wall
// washes). Each point light requires per-pixel lighting calculations
// in the fragment shader, and WebGL has a hard limit on concurrent
// light uniforms (typically 8–16). Oversubscribing causes expensive
// fallback passes.
//
// New approach (4 lights):
//   1. ambientLight — fills shadows uniformly, zero per-pixel cost
//   2. hemisphereLight — natural top-down warmth without multiple lights
//   3. pointLight (far end, z=-60) — creates depth/atmosphere
//   4. pointLight (near entrance, z=5) — subtle foreground fill
//
// The LED strips are now purely emissive (in Corridor.jsx), so
// they no longer need matching point lights. The emissive material
// uses toneMapped: false and intensity 2.5 to appear very bright,
// and the camera's tone-mapping pass naturally creates a soft glow
// around bright pixels — similar to what a bloom post-process would
// produce, but without the cost of a full-screen blur pass.
export default function Lights() {
  return (
    <>
      {/* Bright diffuse ambient — fills the entire corridor uniformly.
          No per-pixel cost, no distance falloff. */}
      <ambientLight color="#fff9f2" intensity={0.9} />

      {/* Hemisphere light — gives subtle color variation between
          the ceiling lights and the oak floor, simulating
          bounced light without multiple point lights. */}
      <hemisphereLight color="#ffffff" groundColor="#D9C6A5" intensity={0.9} />

      <directionalLight
        position={[0, 7, 8]}
        color="#fff9f2"
        intensity={0.7}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.5}
        shadow-camera-far={32}
        shadow-bias={-0.00012}
      />

      {/* Far-end fill — keeps the corridor high-key and airy. */}
      <pointLight
        position={[0, 3, -60]}
        color="#fff8e8"
        intensity={0.85}
        distance={65}
        decay={1.2}
      />

      {/* Near-entrance fill — soft 4000K warmth without orange tint. */}
      <pointLight
        position={[0, 3, 5]}
        color="#fff8e8"
        intensity={0.45}
        distance={22}
        decay={1.8}
      />
    </>
  );
}
