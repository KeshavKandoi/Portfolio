'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';

export default function IntroDoor({ onEnter }) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const [opening, setOpening] = useState(false);

  function openDoor() {
    if (opening) return;
    setOpening(true);

    const tl = gsap.timeline({
      defaults: { duration: 1.6, ease: 'power3.inOut' },
      onComplete: () => {
        gsap.delayedCall(0.4, () => onEnter?.());
      },
    });

    tl.to(leftRef.current, { rotateY: -105, transformOrigin: 'right center' }, 0);
    tl.to(rightRef.current, { rotateY: 105, transformOrigin: 'left center' }, 0);
  }

  return (
    <div
      className={`door ${opening ? 'door-opening' : ''}`}
      onClick={openDoor}
      role="button"
      aria-label="Enter portfolio"
    >
      <img src="/assets/door/frame.svg" className="door-frame" alt="" />
      <img ref={leftRef} src="/assets/door/left.svg" className="leftDoor" alt="" />
      <img ref={rightRef} src="/assets/door/right.svg" className="rightDoor" alt="" />
    </div>
  );
}
