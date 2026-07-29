'use client';

import Door from './Door';

const doorDefs = [
  { z: -8,  side: 'left',  label: 'About' },
  { z: -16, side: 'right', label: 'Skills' },
  { z: -24, side: 'left',  label: 'Projects' },
  { z: -32, side: 'right', label: 'Contact' },
];

const WALL_X = 2.98;

export default function Doors() {
  return (
    <>
      {doorDefs.map((d, i) => {
        const x = d.side === 'left' ? -WALL_X : WALL_X;
        const rotationY = d.side === 'left' ? Math.PI / 2 : -Math.PI / 2;
        return (
          <Door
            key={i}
            index={i}
            position={[x, 0, d.z]}
            rotationY={rotationY}
            label={d.label}
          />
        );
      })}
    </>
  );
}
