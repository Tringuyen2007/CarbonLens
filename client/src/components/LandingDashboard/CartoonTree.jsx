// ─────────────────────────────────────────────────────────────────────────────
// CartoonTree — Animated SVG cartoon tree. SVG fills its container via viewBox.
// TreeGroup  — Three trees in a triangle arrangement, fully fluid/responsive.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

// ── Single tree ───────────────────────────────────────────────────────────────
// Width & height are controlled by the parent container — SVG stretches to fill.
export function CartoonTree({
  swayDeg = 2.5,
  swayDur = 3.8,
  swayDelay = 0,
  entranceDelay = 0.3,
  leafDelay = 1.5,
}) {
  const treeRef    = useRef(null);
  const canopy1Ref = useRef(null);
  const canopy2Ref = useRef(null);
  const canopy3Ref = useRef(null);
  const leaf1Ref   = useRef(null);
  const leaf2Ref   = useRef(null);
  const leaf3Ref   = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      gsap.from(treeRef.current, {
        scaleY: 0, transformOrigin: 'bottom center',
        opacity: 0, duration: 0.9, delay: entranceDelay, ease: 'back.out(1.4)',
      });

      gsap.to(treeRef.current, {
        rotation: swayDeg, transformOrigin: 'bottom center',
        duration: swayDur, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: swayDelay,
      });

      [canopy1Ref, canopy2Ref, canopy3Ref].forEach((ref, i) => {
        if (!ref.current) return;
        gsap.to(ref.current, {
          scale: 1.06, transformOrigin: 'center center',
          duration: 2.2 + i * 0.4, repeat: -1, yoyo: true,
          ease: 'sine.inOut', delay: swayDelay + i * 0.5,
        });
      });

      function animateLeaf(ref, delay) {
        const el = ref.current;
        if (!el) return;
        function drop() {
          gsap.set(el, { x: 0, y: 0, opacity: 0, rotation: 0 });
          gsap.timeline({ onComplete: drop })
            .to(el, { opacity: 0.9, duration: 0.25 })
            .to(el, {
              x: gsap.utils.random(-30, 30),
              y: gsap.utils.random(60, 100),
              rotation: gsap.utils.random(-130, 130),
              opacity: 0,
              duration: gsap.utils.random(2.2, 3.8),
              ease: 'power1.inOut',
            }, '-=0.05');
        }
        gsap.delayedCall(delay, drop);
      }

      animateLeaf(leaf1Ref, leafDelay);
      animateLeaf(leaf2Ref, leafDelay + 1.3);
      animateLeaf(leaf3Ref, leafDelay + 2.6);

    }, treeRef);

    return () => ctx.revert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    // Block wrapper fills whatever size the parent gives it
    <div style={{ width: '100%', height: '100%' }}>
      <svg
        ref={treeRef}
        viewBox="0 0 120 200"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMax meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ willChange: 'transform', overflow: 'visible', display: 'block' }}
        aria-hidden
      >
        <ellipse cx="60" cy="197" rx="22" ry="5" fill="#0a1a28" opacity="0.35" />

        <rect x="49" y="140" width="22" height="55" rx="6" fill="#6b3f1e" />
        <line x1="55" y1="148" x2="53" y2="175" stroke="#4a2c12" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="65" y1="152" x2="67" y2="180" stroke="#4a2c12" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <path d="M49 162 Q34 155 30 148" stroke="#6b3f1e" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M49 162 Q34 155 30 148" stroke="#4a2c12" strokeWidth="2"  strokeLinecap="round" fill="none" opacity="0.4" />
        <path d="M71 168 Q84 159 90 152" stroke="#6b3f1e" strokeWidth="6"  strokeLinecap="round" fill="none" />
        <path d="M71 168 Q84 159 90 152" stroke="#4a2c12" strokeWidth="2"  strokeLinecap="round" fill="none" opacity="0.4" />

        <circle ref={canopy3Ref} cx="60" cy="120" r="34" fill="#14532d" />
        <circle ref={canopy2Ref} cx="40" cy="105" r="27" fill="#166534" />
        <circle cx="80" cy="108" r="25" fill="#166534" />
        <circle ref={canopy1Ref} cx="60" cy="82"  r="30" fill="#16a34a" />
        <circle cx="50" cy="70" r="10" fill="#4ade80" opacity="0.18" />

        <ellipse ref={leaf1Ref} cx="48" cy="62" rx="5"   ry="3"   fill="#4ade80" style={{ opacity: 0, willChange: 'transform' }} />
        <ellipse ref={leaf2Ref} cx="72" cy="50" rx="4"   ry="2.5" fill="#86efac" style={{ opacity: 0, willChange: 'transform' }} />
        <ellipse ref={leaf3Ref} cx="32" cy="72" rx="4.5" ry="2.5" fill="#4ade80" style={{ opacity: 0, willChange: 'transform' }} />
      </svg>
    </div>
  );
}

// ── Cartoon sun ──────────────────────────────────────────────────────────────
function CartoonSun() {
  const sunRef  = useRef(null);
  const raysRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // entrance — drop in from above
      gsap.from(sunRef.current, {
        y: -40, opacity: 0, duration: 1.0, delay: 0.1, ease: 'back.out(1.6)',
      });

      // gentle vertical bob
      gsap.to(sunRef.current, {
        y: -8, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut',
      });

      // rays spin slowly
      gsap.to(raysRef.current, {
        rotation: 360, transformOrigin: '50% 50%',
        duration: 18, repeat: -1, ease: 'none',
      });

      // glow pulse
      gsap.to(glowRef.current, {
        opacity: 0.55, scale: 1.18, transformOrigin: '50% 50%',
        duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut',
      });

    }, sunRef);

    return () => ctx.revert();
  }, []);

  // 8 evenly spaced rays
  const RAY_COUNT = 8;
  const rays = Array.from({ length: RAY_COUNT }, (_, i) => {
    const angle = (i * 360) / RAY_COUNT;
    const rad   = (angle * Math.PI) / 180;
    const cx = 50, cy = 50, r1 = 22, r2 = 36;
    const x1 = cx + r1 * Math.cos(rad), y1 = cy + r1 * Math.sin(rad);
    const x2 = cx + r2 * Math.cos(rad), y2 = cy + r2 * Math.sin(rad);
    return { x1, y1, x2, y2 };
  });

  return (
    <div ref={sunRef} style={{ width: '100%', aspectRatio: '1', willChange: 'transform' }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" overflow="visible" aria-hidden>
        {/* outer glow */}
        <circle ref={glowRef} cx="50" cy="50" r="26"
          fill="#fde68a" opacity="0.3"
          style={{ willChange: 'transform' }}
        />
        {/* rays */}
        <g ref={raysRef} style={{ willChange: 'transform' }}>
          {rays.map((r, i) => (
            <line key={i}
              x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
              stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round"
            />
          ))}
        </g>
        {/* main disc */}
        <circle cx="50" cy="50" r="18" fill="#fcd34d" />
        {/* inner highlight */}
        <circle cx="44" cy="44" r="6" fill="#fef9c3" opacity="0.55" />
      </svg>
    </div>
  );
}

// ── Triangle grove ────────────────────────────────────────────────────────────
// Fills its parent entirely. Use percentage-based positions so the layout
// scales with whatever container size the parent gives.
export function TreeGroup({ className = '' }) {
  return (
    <div
      className={`pointer-events-none select-none w-full h-full ${className}`}
      aria-hidden
    >
      <div className="relative w-full h-full">

        {/* sun — floats in the top-centre of the column */}
        <div className="absolute" style={{ top: '1%', left: '10%', width: '80%' }}>
          <CartoonSun />
        </div>

        {/* back-centre — tallest, centred */}
        <div className="absolute bottom-0" style={{ left: '20%', width: '60%', height: '74%' }}>
          <CartoonTree swayDeg={2} swayDur={4.2} swayDelay={0}   entranceDelay={0.3}  leafDelay={1.2} />
        </div>

        {/* front-left — medium */}
        <div className="absolute bottom-0" style={{ left: 0, width: '55%', height: '58%' }}>
          <CartoonTree swayDeg={3} swayDur={3.6} swayDelay={0.6} entranceDelay={0.55} leafDelay={2.1} />
        </div>

        {/* front-right — medium */}
        <div className="absolute bottom-0" style={{ right: 0, width: '53%', height: '56%' }}>
          <CartoonTree swayDeg={2.8} swayDur={3.9} swayDelay={1.1} entranceDelay={0.75} leafDelay={3.0} />
        </div>

      </div>
    </div>
  );
}
