'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { getRoomTransform } from '@/lib/roomGeometry';

const TECH = ['React', 'Three.js', 'GSAP', 'Next.js'];

export default function ProjectsRoom({ door }) {
  const { position, rotationY } = getRoomTransform(door, 3.0);
  const projectRef = useRef();
  const particlesRef = useRef();

  const particlePositions = useMemo(() => {
    const count = 60;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 4;
      arr[i * 3 + 1] = Math.random() * 3;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return arr;
  }, []);

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
        <meshStandardMaterial color="#1c1c1c" />
      </mesh>

      {/* Accent light near the floating project */}
      <pointLight position={[0, 2.2, 0]} color="#7ab8ff" intensity={8} distance={5} />

      {/* Desk */}
      <mesh position={[0, 0.5, 1.2]}>
        <boxGeometry args={[1.4, 0.06, 0.7]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[-0.55, 0.25, 1.4]}>
        <boxGeometry args={[0.06, 0.5, 0.06]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0.55, 0.25, 1.4]}>
        <boxGeometry args={[0.06, 0.5, 0.06]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Laptop */}
      <group position={[0, 0.53, 1.2]}>
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.5, 0.02, 0.35]} />
          <meshStandardMaterial color="#3a3a3a" />
        </mesh>
        <mesh position={[0, 0.2, -0.16]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[0.5, 0.32, 0.02]} />
          <meshStandardMaterial color="#3a3a3a" emissive="#7ab8ff" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* Floating project */}
      <mesh ref={projectRef} position={[0, 1.6, 0]}>
        <icosahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#7ab8ff" emissive="#7ab8ff" emissiveIntensity={0.5} wireframe />
      </mesh>

      <Html position={[0, 2.15, 0]} center distanceFactor={6}>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '14px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#fff',
            whiteSpace: 'nowrap',
          }}
        >
          Project Alpha
        </div>
      </Html>

      {/* Tech stack badges, arranged in a ring */}
      {TECH.map((t, i) => {
        const angle = (i / TECH.length) * Math.PI * 2;
        const r = 1.1;
        const x = Math.sin(angle) * r;
        const z = Math.cos(angle) * r;
        return (
          <Html key={t} position={[x, 0.9, z]} center distanceFactor={7}>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.7)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
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
        <pointsMaterial size={0.02} color="#7ab8ff" transparent opacity={0.6} />
      </points>
    </group>
  );
}
