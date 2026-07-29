'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { scrollState } from '@/lib/scrollStore';
import { navState } from '@/lib/navigationStore';

const START_Z = 8;
const CORRIDOR_TRAVEL = 110; // matches the new LENGTH, minus a margin at the far wall
const SCROLL_DAMPING = 0.07;
const LOOK_DAMPING = 0.06;
const MAX_YAW = 0.18;
const MAX_PITCH = 0.1;

export default function CameraRig() {
  const { camera, mouse } = useThree();
  const targetRot = useRef({ x: 0, y: 0 });

  useFrame(() => {
    if (navState.state !== 'IDLE' && navState.state !== 'HOVER') return;

    const targetZ = START_Z - scrollState.progress * CORRIDOR_TRAVEL;
    camera.position.z += (targetZ - camera.position.z) * SCROLL_DAMPING;

    targetRot.current.y = -mouse.x * MAX_YAW;
    targetRot.current.x = mouse.y * MAX_PITCH;

    camera.rotation.order = 'YXZ';
    camera.rotation.y += (targetRot.current.y - camera.rotation.y) * LOOK_DAMPING;
    camera.rotation.x += (targetRot.current.x - camera.rotation.x) * LOOK_DAMPING;
  });

  return null;
}
