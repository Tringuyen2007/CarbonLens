// ─────────────────────────────────────────────────────────────────────────────
// LandingPage — Single-viewport, fully responsive hero. No scroll.
// Left column: title + dashboard + description + CTA (flex-1, fills width)
// Right column: tree grove, fluid clamp() width, flush to right/bottom edge
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { LandingDashboard } from '@/components/LandingDashboard/LandingDashboard';
import { FloatingClouds } from '@/components/LandingDashboard/FloatingClouds';
import { TreeGroup } from '@/components/LandingDashboard/CartoonTree';

export function LandingPage() {
  const titleRef = useRef(null);
  const ctaRef   = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(titleRef.current, { opacity: 0, y: -32, duration: 0.7 });
      tl.from(ctaRef.current,   { opacity: 0, y: 20,  duration: 0.5 }, '+=0.4');
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden bg-[#0d1b2a]">

      {/* ── Ambient cloud background ──────────────────────────────────────── */}
      <FloatingClouds />

      {/* ── Main layout row — fills all remaining height below the header ── */}
      <div className="relative z-10 flex flex-1 min-h-0 w-full">

        {/* ── Left content column ───────────────────────────────────────── */}
        <section className="flex flex-col flex-1 min-w-0 px-[4vw] pt-[3vh] pb-[3vh] gap-[2vh]">

          {/* Title — clamp font scales with viewport */}
          <h1
            ref={titleRef}
            className="font-bold text-white leading-tight tracking-tight flex-shrink-0"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 4rem)' }}
          >
            CarbonLens AI
          </h1>

          {/* Dashboard — grows to fill remaining vertical space */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <LandingDashboard />
          </div>

          {/* Description */}
          <p
            className="text-slate-400 leading-relaxed flex-shrink-0"
            style={{ fontSize: 'clamp(0.75rem, 1.1vw, 1rem)' }}
          >
            AI-powered carbon intelligence for US cities. Explore verified emissions data,
            building performance standards, renewable energy profiles, and actionable
            sustainability insights — all in one place.
          </p>

          {/* CTA — right-aligned */}
          <div ref={ctaRef} className="flex justify-start flex-shrink-0">
            <Link
              to="/analysis"
              className="
                inline-flex items-center gap-2
                bg-emerald-700 hover:bg-emerald-600
                text-white font-medium
                px-5 py-2.5 rounded-lg
                transition-colors duration-150
              "
              style={{ fontSize: 'clamp(0.75rem, 1vw, 0.9rem)' }}
            >
              Analysis
              <span aria-hidden className="ml-1">→</span>
            </Link>
          </div>
        </section>

        {/* ── Right trees column — fluid width, flush bottom ────────────── */}
        {/* clamp: min 160px on small screens, scales with vw, max 380px on huge screens */}
        <div
          className="hidden sm:block flex-shrink-0 self-stretch"
          style={{ width: 'clamp(160px, 18vw, 380px)' }}
        >
          <TreeGroup />
        </div>

      </div>
    </div>
  );
}
