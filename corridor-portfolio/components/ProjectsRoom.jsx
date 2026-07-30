'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { getRoomTransform } from '@/lib/roomGeometry';

const CONTENT = {
  About: ['Designer', 'Developer', 'Minimal systems', 'Calm interfaces'],
  Skills: ['React', 'Three.js', 'Next.js', 'GSAP'],
  Projects: ['Portfolio', 'WebGL', 'Motion', 'Architecture'],
  Contact: ['Email', 'LinkedIn', 'Resume', 'Availability'],
};

function seededRandom(seed) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export default function ProjectsRoom({ door }) {
  const { position, rotationY } = getRoomTransform(door, 3.0);
  const projectRef = useRef();
  const particlesRef = useRef();

  const particlePositions = useMemo(() => {
    const count = 36;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (seededRandom(i * 3 + 1) - 0.5) * 4;
      arr[i * 3 + 1] = seededRandom(i * 3 + 2) * 3;
      arr[i * 3 + 2] = (seededRandom(i * 3 + 3) - 0.5) * 4;
    }
    return arr;
  }, []);

  const labels = CONTENT[door.label] ?? CONTENT.Projects;

  useFrame((state, delta) => {
    if (projectRef.current) {
      projectRef.current.rotation.y += delta * 0.4;
      projectRef.current.position.y =
        1.6 + Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
    }
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        let y = posAttr.getY(i) + delta * 0.15;
        if (y > 3) y = 0;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#ECE8DF" roughness={0.72} />
      </mesh>

      <mesh position={[0, 1.6, -2.48]}>
        <boxGeometry args={[5, 3.2, 0.05]} />
        <meshStandardMaterial color="#F4F3EF" roughness={0.95} />
      </mesh>

      <mesh position={[0, 3.18, 0]}>
        <boxGeometry args={[5, 0.05, 5]} />
        <meshStandardMaterial color="#FAFAF8" roughness={0.88} />
      </mesh>

      <pointLight position={[0, 2.45, 0]} color="#fff8e8" intensity={1.4} distance={6} />

      {/* Desk */}
      <mesh position={[0, 0.5, 1.2]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.06, 0.7]} />
        <meshStandardMaterial color="#D9C6A5" roughness={0.6} />
      </mesh>
      <mesh position={[-0.55, 0.25, 1.4]} castShadow>
        <boxGeometry args={[0.06, 0.5, 0.06]} />
        <meshStandardMaterial color="#B58A62" roughness={0.65} />
      </mesh>
      <mesh position={[0.55, 0.25, 1.4]} castShadow>
        <boxGeometry args={[0.06, 0.5, 0.06]} />
        <meshStandardMaterial color="#B58A62" roughness={0.65} />
      </mesh>

      {/* Laptop */}
      <group position={[0, 0.53, 1.2]}>
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.5, 0.02, 0.35]} />
          <meshStandardMaterial color="#d7d8d5" metalness={0.28} roughness={0.36} />
        </mesh>
        <mesh position={[0, 0.2, -0.16]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[0.5, 0.32, 0.02]} />
          <meshStandardMaterial color="#f6f4ee" emissive="#FFF8E8" emissiveIntensity={0.15} />
        </mesh>
      </group>

      {/* Floating project */}
      <mesh ref={projectRef} position={[0, 1.6, 0]}>
        <icosahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#B58A62" emissive="#FFF8E8" emissiveIntensity={0.18} wireframe />
      </mesh>

      <Html position={[0, 2.15, 0]} center distanceFactor={6}>
        <div
          style={{
              fontFamily: 'monospace',
              fontSize: '14px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#5f4c3d',
              whiteSpace: 'nowrap',
            }}
          >
          {door.label}
        </div>
      </Html>

      {/* Tech stack badges, arranged in a ring */}
      {labels.map((t, i) => {
        const angle = (i / labels.length) * Math.PI * 2;
        const r = 1.1;
        const x = Math.sin(angle) * r;
        const z = Math.cos(angle) * r;
        return (
          <Html key={t} position={[x, 0.9, z]} center distanceFactor={7}>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#6b5848',
                background: 'rgba(250,250,248,0.78)',
                border: '1px solid rgba(181,138,98,0.2)',
                borderRadius: '4px',
                padding: '3px 8px',
                whiteSpace: 'nowrap',
              }}
            >
              {t}
            </div>
          </Html>
        );
      })}

      {/* Drifting particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlePositions.length / 3}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.018} color="#B58A62" transparent opacity={0.22} />
      </points>
    </group>
  );
}
