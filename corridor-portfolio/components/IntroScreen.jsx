'use client';

import '@/styles/intro.css';
import IntroDoor from './IntroDoor';

export default function IntroScreen({ onEnter }) {
  return (
    <div className="background">
      <div className="sky" />
      <div className="noise" />
      <div className="grass" />
      <div className="ground" />

      <div className="tree" aria-hidden="true">
        <div className="tree-leaves" />
        <div className="tree-trunk" />
      </div>

      <div className="cat" aria-hidden="true" />

      <div className="brick-wall">
        <div className="sign">PORTFOLIO</div>
        <div className="window" />

        <IntroDoor onEnter={onEnter} />

        <div className="planter">
          <div className="plant" />
          <div className="plant" />
          <div className="plant" />
        </div>
      </div>

      <div className="fog" />

      <div className="explorer-hint">
        <p className="explorer-title">EXPLORER</p>
        <p className="explorer-sub">Click the door to enter</p>
      </div>
    </div>
  );
}
