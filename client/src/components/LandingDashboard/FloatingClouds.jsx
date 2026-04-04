// ─────────────────────────────────────────────────────────────────────────────
// FloatingClouds — Ambient background blobs that drift slowly across the page.
// Absolutely positioned, pointer-events-none. GSAP drives the drift.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

// Each blob: initial position (%), size (px), colour, blur radius, drift range
const CLOUDS = [
  { id: 0, x: '-8%',  y: '-10%', w: 700, h: 420, color: '#1a4a6e', opacity: 0.18, blur: 90,  driftX: 40,  driftY: 25,  dur: 22 },
  { id: 1, x: '55%',  y: '5%',   w: 550, h: 380, color: '#0d3d25', opacity: 0.22, blur: 110, driftX: -35, driftY: 30,  dur: 19 },
  { id: 2, x: '30%',  y: '40%',  w: 800, h: 350, color: '#162e4a', opacity: 0.14, blur: 130, driftX: 50,  driftY: -20, dur: 26 },
  { id: 3, x: '-5%',  y: '55%',  w: 500, h: 300, color: '#0b3320', opacity: 0.20, blur: 80,  driftX: 30,  driftY: -35, dur: 17 },
  { id: 4, x: '70%',  y: '45%',  w: 600, h: 400, color: '#1e2f55', opacity: 0.16, blur: 100, driftX: -40, driftY: 20,  dur: 24 },
  { id: 5, x: '20%',  y: '-5%',  w: 450, h: 280, color: '#0f3b28', opacity: 0.19, blur: 95,  driftX: -25, driftY: 40,  dur: 20 },
];

export function FloatingClouds() {
  const refs = useRef([]);

  useEffect(() => {
    const tweens = refs.current.map((el, i) => {
      if (!el) return null;
      const cloud = CLOUDS[i];
      return gsap.to(el, {
        x: cloud.driftX,
        y: cloud.driftY,
        duration: cloud.dur,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 1.8, // stagger start so blobs move out of sync
      });
    });

    return () => tweens.forEach(t => t?.kill());
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {CLOUDS.map((cloud, i) => (
        <div
          key={cloud.id}
          ref={el => { refs.current[i] = el; }}
          style={{
            position: 'absolute',
            left: cloud.x,
            top: cloud.y,
            width: cloud.w,
            height: cloud.h,
            background: cloud.color,
            opacity: cloud.opacity,
            borderRadius: '50%',
            filter: `blur(${cloud.blur}px)`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
}
