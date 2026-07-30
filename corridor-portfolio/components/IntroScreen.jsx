'use client';

import '@/styles/intro.css';

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

        <button className="door" onClick={onEnter} aria-label="Enter portfolio">
          <div className="door-panel door-left">
            <span className="badge badge-html">HTML5</span>
            <span className="badge badge-js">JS</span>
            <span className="badge badge-ts">TS</span>
          </div>
          <div className="door-panel door-right">
            <span className="badge badge-react">React</span>
            <span className="badge badge-node">node.js</span>
            <span className="badge badge-css">CSS3</span>
          </div>
          <div className="door-handle door-handle-left" />
          <div className="door-handle door-handle-right" />
        </button>

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
