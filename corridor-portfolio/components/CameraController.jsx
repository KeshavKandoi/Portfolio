'use client';

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import {
  navState,
  subscribeNav,
  setRoomState,
  requestExitRoom,
  returnToIdle,
} from '@/lib/navigationStore';
import { getRoomTransform } from '@/lib/roomGeometry';

function getFocus(door) {
  const { position } = getRoomTransform(door, 3.0);
  return { x: position[0], y: 1.6, z: position[2] };
}

export default function CameraController({ fadeRef, lenisRef }) {
  const { camera } = useThree();
  const savedCamera = useRef(null);
  const orbitAngle = useRef(0);
  const orbitActive = useRef(false);

  useEffect(() => {
    const unsub = subscribeNav((state) => {
      if (state.state === 'ENTERING' && state.activeDoor) {
        enterDoor(state.activeDoor);
      } else if (state.state === 'EXITING') {
        exitRoom();
      }
    });

    function handleKey(e) {
      if (e.key === 'Escape' && navState.state === 'ROOM') {
        requestExitRoom();
      }
    }
    window.addEventListener('keydown', handleKey);

    return () => {
      unsub();
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  useFrame((_, delta) => {
    if (!orbitActive.current || navState.state !== 'ROOM' || !navState.activeDoor) return;

    const focus = getFocus(navState.activeDoor);
    orbitAngle.current += delta * 0.15;
    const radius = 1.3;

    camera.position.x = focus.x + Math.sin(orbitAngle.current) * radius;
    camera.position.z = focus.z + Math.cos(orbitAngle.current) * radius;
    camera.position.y = 1.65 + Math.sin(orbitAngle.current * 0.6) * 0.05;
    camera.lookAt(focus.x, focus.y, focus.z);
  });

  function enterDoor(door) {
    lenisRef.current?.stop();

    savedCamera.current = {
      position: camera.position.clone(),
      rotationY: camera.rotation.y,
      rotationX: camera.rotation.x,
    };

    const [dx, , dz] = door.position;
    const rotY = door.rotationY;
    const standDistance = 1.6;

    const approachX = dx + Math.sin(rotY) * standDistance;
    const approachZ = dz + Math.cos(rotY) * standDistance;
    const throughX = dx - Math.sin(rotY) * 1.2;
    const throughZ = dz - Math.cos(rotY) * 1.2;

    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

    // 1. walk up to the door
    tl.to(camera.position, { x: approachX, z: approachZ, duration: 1.0 }, 0);
    // 2. turn to face it
    tl.to(camera.rotation, { y: rotY, duration: 0.8 }, 0.1);
    // 3. hold while it swings open
    tl.to({}, { duration: 0.5 });
    // 4. step through
    tl.to(camera.position, { x: throughX, z: throughZ, duration: 1.0 });
    // 5. fade to black to hide the pop-in
    tl.to(fadeRef.current, { opacity: 1, duration: 0.4 }, '-=0.3');
    // 6. snap orbit setup while hidden, then reveal the room
    tl.call(() => {
      const focus = getFocus(door);
      orbitAngle.current = Math.atan2(
        camera.position.x - focus.x,
        camera.position.z - focus.z
      );
      orbitActive.current = true;
      setRoomState();
    });
    tl.to(fadeRef.current, { opacity: 0, duration: 0.6 });
  }

  function exitRoom() {
    orbitActive.current = false;
    camera.rotation.order = 'YXZ';

    if (!savedCamera.current) {
      returnToIdle();
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        lenisRef.current?.start();
        returnToIdle();
      },
    });

    tl.to(fadeRef.current, { opacity: 1, duration: 0.4 });
    tl.call(() => {
      camera.position.copy(savedCamera.current.position);
      camera.rotation.y = savedCamera.current.rotationY;
      camera.rotation.x = savedCamera.current.rotationX;
    });
    tl.to(fadeRef.current, { opacity: 0, duration: 0.6 });
  }

  return null;
}
