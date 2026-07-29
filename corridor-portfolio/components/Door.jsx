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
          delay: 0.9, // door opens after the camera has walked up to it
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

    setShowLabel(hovered && canHover);
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
      {/* Frame */}
      <mesh position={[0, FRAME_H / 2, 0]}>
        <boxGeometry args={[FRAME_W, FRAME_H, FRAME_D]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>

      {/* Door — hinged on its left edge so it swings, doesn't teleport */}
      <group ref={hingeRef} position={[-DOOR_W / 2, 0, FRAME_D / 2 + 0.02]}>
        <mesh position={[DOOR_W / 2, DOOR_H / 2, 0]}>
          <boxGeometry args={[DOOR_W, DOOR_H, 0.08]} />
          <meshStandardMaterial
            ref={doorMatRef}
            color="#4a4a4a"
            emissive="#7ab8ff"
            emissiveIntensity={0}
          />
        </mesh>

        {/* Handle moves with the door */}
        <mesh position={[DOOR_W - 0.15, DOOR_H / 2, 0.06]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#c9c9c9" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {showLabel && (
        <Html position={[0, FRAME_H + 0.3, 0]} center distanceFactor={8}>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#fff',
              background: 'rgba(0,0,0,0.6)',
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
