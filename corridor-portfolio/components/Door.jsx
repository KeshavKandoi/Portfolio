'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import gsap from 'gsap';
import {
  navState,
  subscribeNav,
  requestEnterDoor,
} from '@/lib/navigationStore';

const FRAME_W = 1.6;
const FRAME_H = 2.8;
const FRAME_D = 0.15;
const DOOR_W = 1.3;
const DOOR_H = 2.5;

export default function Door({ index, position, rotationY, label }) {
  const groupRef = useRef();
  const hingeRef = useRef();
  const doorMatRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const scaleRef = useRef(1);
  const glowRef = useRef(0);

  useEffect(() => {
    const unsub = subscribeNav((state) => {
      const isActive = state.activeDoor && state.activeDoor.index === index;
      if (!hingeRef.current) return;

      if (isActive && state.state === 'ENTERING') {
        gsap.to(hingeRef.current.rotation, {
          y: -Math.PI / 2,
          duration: 1.0,
          ease: 'power2.out',
          delay: 0.9,
        });
      }

      if (isActive && state.state === 'EXITING') {
        gsap.to(hingeRef.current.rotation, {
          y: 0,
          duration: 1.0,
          ease: 'power2.inOut',
          delay: 0.4,
        });
      }
    });
    return unsub;
  }, [index]);

  useFrame(() => {
    const canHover = navState.state === 'IDLE' || navState.state === 'HOVER';
    const targetScale = hovered && canHover ? 1.06 : 1;
    scaleRef.current += (targetScale - scaleRef.current) * 0.12;
    if (groupRef.current) groupRef.current.scale.setScalar(scaleRef.current);

    const targetGlow = hovered && canHover ? 1 : 0;
    glowRef.current += (targetGlow - glowRef.current) * 0.12;
    if (doorMatRef.current) doorMatRef.current.emissiveIntensity = glowRef.current * 0.8;

    const nextShowLabel = hovered && canHover;
    setShowLabel((prev) => (prev === nextShowLabel ? prev : nextShowLabel));
  });

  function handleClick(e) {
    e.stopPropagation();
    if (navState.state !== 'IDLE' && navState.state !== 'HOVER') return;
    requestEnterDoor({ index, position, rotationY, label });
  }

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotationY, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (navState.state !== 'IDLE') return;
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      onClick={handleClick}
    >
      <mesh position={[0, FRAME_H / 2, 0]}>
        <boxGeometry args={[FRAME_W, FRAME_H, FRAME_D]} />
        <meshStandardMaterial color="#F5F4F0" roughness={0.78} metalness={0} />
      </mesh>

      <group ref={hingeRef} position={[-DOOR_W / 2, 0, FRAME_D / 2 + 0.02]}>
        <mesh position={[DOOR_W / 2, DOOR_H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[DOOR_W, DOOR_H, 0.08]} />
          <meshStandardMaterial
            ref={doorMatRef}
            color="#B58A62"
            emissive="#FFF8E8"
            emissiveIntensity={0}
            roughness={0.68}
            metalness={0}
          />
        </mesh>

        <group position={[DOOR_W - 0.18, DOOR_H / 2, 0.08]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.018, 0.018, 0.42, 18]} />
            <meshStandardMaterial color="#c8c9c7" metalness={0.65} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.16, -0.035]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.014, 0.014, 0.08, 14]} />
            <meshStandardMaterial color="#c8c9c7" metalness={0.65} roughness={0.28} />
          </mesh>
          <mesh position={[0, -0.16, -0.035]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.014, 0.014, 0.08, 14]} />
            <meshStandardMaterial color="#c8c9c7" metalness={0.65} roughness={0.28} />
          </mesh>
        </group>
      </group>

      {showLabel && (
        <Html position={[0, FRAME_H + 0.3, 0]} center distanceFactor={8}>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#5f4c3d',
              background: 'rgba(250,250,248,0.86)',
              border: '1px solid rgba(168,130,94,0.22)',
              padding: '4px 10px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}
