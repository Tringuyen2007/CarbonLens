// ─────────────────────────────────────────────────────────────────────────────
// LandingDashboard — Animated hero preview widget
// Uses real city data via useCities(). GSAP drives all entrance animations.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useCities } from '@/hooks/useCities';

// ── Emission tier config (colour-blind safe) ─────────────────────────────────
const TIERS = [
  { label: 'Low',       max: 5,        color: '#3b82f6', textColor: 'text-blue-400'   },
  { label: 'Mid',       max: 10,       color: '#f59e0b', textColor: 'text-amber-400'  },
  { label: 'High',      max: 15,       color: '#f97316', textColor: 'text-orange-400' },
  { label: 'Very High', max: Infinity, color: '#ef4444', textColor: 'text-red-400'    },
];

// ── Sector breakdown (national avg — no per-city data in list endpoint) ───────
const SECTOR_BARS = [
  { label: 'Buildings', pct: 38, color: '#ef4444' },
  { label: 'Transport', pct: 31, color: '#14b8a6' },
  { label: 'Industry',  pct: 21, color: '#3b82f6' },
  { label: 'Waste',     pct: 10, color: '#22c55e' },
];

function getTier(co2e) {
  return TIERS.find(t => co2e < t.max) ?? TIERS[TIERS.length - 1];
}

function formatMt(mt) {
  if (mt >= 1e9) return (mt / 1e9).toFixed(1) + 'B';
  if (mt >= 1e6) return (mt / 1e6).toFixed(0) + 'M';
  return mt.toLocaleString();
}

// ── Skeleton shimmer shown while data loads ───────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-700/50 rounded ${className}`} />
  );
}

export function LandingDashboard() {
  const { cities, loading } = useCities();

  const containerRef  = useRef(null);
  const headerRef     = useRef(null);
  const liveDotRef    = useRef(null);
  const statCardRefs  = useRef([]);
  const statValueRefs = useRef([]);
  const tierBarRefs   = useRef([]);
  const sectorRefs    = useRef([]);
  const cityRowRefs   = useRef([]);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const sorted = [...cities].sort((a, b) => a.co2e_per_capita - b.co2e_per_capita);
  const avgTrend  =cities.length ? (cities.reduce((s, c) => s + c.trend_yoy, 0) / cities.length) : 0;
  const totalCo2e = cities.reduce((s, c) => s + c.total_co2e_mt, 0);
  const bpsCount  = cities.filter(c => c.has_bps).length;

  const tierCounts = TIERS.map(t => ({
    ...t,
    count: cities.filter(c => getTier(c.co2e_per_capita).label === t.label).length,
  }));

  const STATS = [
    { label: 'Cities Tracked',  value: cities.length,        display: cities.length.toString(),          suffix: '' },
    { label: 'Total CO₂e',      value: totalCo2e,            display: formatMt(totalCo2e) + ' t',         suffix: '' },
    { label: 'BPS Active',      value: bpsCount,             display: bpsCount.toString(),                suffix: '' },
    { label: 'Avg Trend YoY',   value: Math.abs(avgTrend),   display: avgTrend.toFixed(1) + '%',          suffix: '', isNeg: avgTrend < 0 },
  ];

  // ── GSAP — re-runs whenever data finishes loading ────────────────────────────
  useEffect(() => {
    if (loading || !cities.length) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      // Panel entrance
      tl.from(containerRef.current, { opacity: 0, y: 24, duration: 0.55 });

      // Header
      tl.from(headerRef.current, { opacity: 0, x: -12, duration: 0.4 }, '-=0.3');

      // Live dot infinite pulse (runs independently)
      gsap.to(liveDotRef.current, {
        scale: 2, opacity: 0, repeat: -1, duration: 1.1,
        ease: 'sine.out', transformOrigin: 'center center',
      });

      // Stat cards stagger
      tl.from(statCardRefs.current.filter(Boolean), {
        opacity: 0, y: 14, stagger: 0.1, duration: 0.45,
      }, '-=0.1');

      // Stat counters (numeric proxy)
      STATS.forEach((stat, i) => {
        const el = statValueRefs.current[i];
        if (!el) return;
        const proxy = { val: 0 };
        gsap.to(proxy, {
          val: stat.value,
          duration: 1.2,
          delay: 0.5 + i * 0.08,
          ease: 'power1.out',
          onUpdate() {
            if (!el) return;
            const v = proxy.val;
            if (i === 1) {
              el.textContent = formatMt(v) + ' t';
            } else if (i === 3) {
              el.textContent = (stat.isNeg ? '−' : '+') + Math.abs(v).toFixed(1) + '%';
            } else {
              el.textContent = Math.round(v).toString();
            }
          },
        });
      });

      // Tier distribution bars
      tierBarRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.from(el, { width: '0%', duration: 0.5, delay: 0.9 + i * 0.07, ease: 'power2.out' });
      });

      // Sector bars
      sectorRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.from(el, { width: '0%', duration: 0.65, delay: 1.1 + i * 0.09, ease: 'power2.out' });
      });

      // City rows
      tl.from(cityRowRefs.current.filter(Boolean), {
        opacity: 0, x: -10, stagger: 0.05, duration: 0.35,
      }, '+=0.2');

    }, containerRef);

    return () => ctx.revert();
  }, [loading, cities.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-slate-700/50 bg-[#0f2035] shadow-2xl shadow-black/40 overflow-hidden text-sm"
    >

      {/* ── Header bar ───────────────────────────────────────────────────────── */}
      <div
        ref={headerRef}
        className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              ref={liveDotRef}
              className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
            />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-slate-400 text-xs font-medium tracking-wide uppercase">
            Live Preview
          </span>
        </div>
        <span className="text-slate-600 text-xs">2026 · US Cities</span>
      </div>

      {/* ── 4 Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-700/50 divide-x divide-slate-700/50">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            ref={el => { statCardRefs.current[i] = el; }}
            className="px-3 py-3 bg-[#0f2035]"
          >
            <div className="text-slate-500 text-xs mb-1 whitespace-nowrap truncate">{stat.label}</div>
            {loading ? (
              <Skeleton className="h-6 w-12 mt-1" />
            ) : (
              <div className={`font-bold text-xl tabular-nums ${stat.isNeg ? 'text-emerald-400' : 'text-emerald-400'}`}>
                <span ref={el => { statValueRefs.current[i] = el; }}>0</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Emission tier distribution ────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-xs">Emission Tiers (tCO₂e/capita)</span>
        </div>

        {loading ? (
          <Skeleton className="h-3 w-full rounded-full" />
        ) : (
          <>
            {/* Proportional tier bar */}
            <div className="flex h-3 rounded-full overflow-hidden gap-px">
              {tierCounts.map((t, i) => (
                <div
                  key={t.label}
                  ref={el => { tierBarRefs.current[i] = el; }}
                  style={{
                    width: cities.length ? `${(t.count / cities.length) * 100}%` : '0%',
                    backgroundColor: t.color,
                  }}
                  className="h-full"
                />
              ))}
            </div>
            {/* Legend with city counts */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {tierCounts.map(t => (
                <span key={t.label} className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: t.color }} />
                  {t.label}
                  <span className="text-slate-600">({t.count})</span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Sector breakdown (national avg) ──────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <div className="text-slate-500 text-xs mb-2">National Avg Sector Mix</div>
        <div className="flex h-3 rounded-full overflow-hidden gap-px">
          {SECTOR_BARS.map((s, i) => (
            <div
              key={s.label}
              ref={el => { sectorRefs.current[i] = el; }}
              style={{ width: `${s.pct}%`, backgroundColor: s.color }}
              className="h-full"
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {SECTOR_BARS.map(s => (
            <span key={s.label} className="flex items-center gap-1 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── City rankings table ───────────────────────────────────────────────── */}
      <div>
        <div className="grid grid-cols-3 sm:grid-cols-4 px-4 py-1.5 text-slate-600 text-xs border-b border-slate-700/30">
          <span>City</span>
          <span className="text-right">CO₂e/cap</span>
          <span className="text-right">Trend</span>
          <span className="text-right hidden sm:block">BPS</span>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-700/30">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="grid grid-cols-3 sm:grid-cols-4 px-4 py-2.5 gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-10 ml-auto" />
                <Skeleton className="h-4 w-10 ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30 max-h-48 overflow-y-auto scrollbar-thin">
            {sorted.map((city, i) => {
              const tier = getTier(city.co2e_per_capita);
              const trendGood = city.trend_yoy < 0;
              return (
                <div
                  key={city.city_id}
                  ref={el => { cityRowRefs.current[i] = el; }}
                  className="grid grid-cols-3 sm:grid-cols-4 px-4 py-2 items-center"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="text-slate-200 font-medium truncate text-xs sm:text-sm">
                      {city.name}
                    </span>
                  </span>
                  <span className={`text-right tabular-nums text-xs font-medium ${tier.textColor}`}>
                    {city.co2e_per_capita.toFixed(1)} t
                  </span>
                  <span className={`text-right tabular-nums text-xs ${trendGood ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trendGood ? '▼' : '▲'} {Math.abs(city.trend_yoy).toFixed(1)}%
                  </span>
                  <span className="text-right text-xs hidden sm:block">
                    {city.has_bps
                      ? <span className="text-emerald-500 font-medium">✓</span>
                      : <span className="text-slate-600">—</span>
                    }
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
