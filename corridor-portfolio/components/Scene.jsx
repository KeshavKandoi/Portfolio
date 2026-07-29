'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Lenis from 'lenis';
import Corridor from './Corridor';
import Doors from './Doors';
import Lights from './Lights';
import CameraRig from './CameraRig';
import CameraController from './CameraController';
import ProjectsRoom from './ProjectsRoom';
import { scrollState } from '@/lib/scrollStore';
import { subscribeNav, requestExitRoom } from '@/lib/navigationStore';

export default function Scene() {
  const lenisRef = useRef(null);
  const fadeRef = useRef(null);
  const [inRoom, setInRoom] = useState(false);
  const [activeDoor, setActiveDoor] = useState(null);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    lenis.on('scroll', ({ progress }) => {
      scrollState.progress = progress;
    });

    const unsub = subscribeNav((state) => {
      setInRoom(state.state === 'ROOM');
      setActiveDoor(state.activeDoor);
    });

    return () => {
      lenis.destroy();
      unsub();
    };
  }, []);

  return (
    <>
      <Canvas
        camera={{ position: [0, 1.6, 8], fov: 70 }}
        style={{ position: 'fixed', inset: 0 }}
      >
        <color attach="background" args={['#141414']} />
        <fog attach="fog" args={['#141414', 6, 30]} />
        <Lights />
        <Corridor />
        <Doors />
        <CameraRig />
        <CameraController fadeRef={fadeRef} lenisRef={lenisRef} />
        {activeDoor?.label === 'Projects' && <ProjectsRoom door={activeDoor} />}
      </Canvas>

      <div
        ref={fadeRef}
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {inRoom && (
        <button
          onClick={() => requestExitRoom()}
          style={{
            position: 'fixed',
            top: '24px',
            left: '24px',
            zIndex: 11,
            fontFamily: 'monospace',
            fontSize: '13px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#fff',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      )}
    </>
  );
}
