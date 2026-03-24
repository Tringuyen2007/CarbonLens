// ─────────────────────────────────────────────────────────────────────────────
// LandingPage — Responsive hero entry experience
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0d1b2a]">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      {/*
        Padding scales: compact on mobile, spacious on desktop.
        max-w keeps content from stretching too wide on ultrawide screens.
      */}
      <section className="px-6 sm:px-10 lg:px-16 pt-14 sm:pt-20 lg:pt-28 pb-12 max-w-3xl">

        {/* Main title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-4 sm:mb-5">
          CarbonLens AI
        </h1>

        {/* Subtext */}
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-7 sm:mb-8 max-w-md">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>

        {/* CTA */}
        <div>
          <Link
            to="/analysis"
            className="
              inline-flex items-center gap-2
              bg-emerald-700 hover:bg-emerald-600
              text-white font-medium text-sm
              px-5 py-2.5 rounded-lg
              transition-colors duration-150
            "
          >
            Analysis
            <span aria-hidden className="ml-1">→</span>
          </Link>
        </div>
      </section>

    </div>
  );
}
