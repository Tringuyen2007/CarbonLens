// ─────────────────────────────────────────────────────────────────────────────
// AnalysisPage — Responsive two-column dashboard: map+chat left, panel right
// ─────────────────────────────────────────────────────────────────────────────

import { LeafletMap } from '@/components/Map/LeafletMap';
import { CityDetailPanel } from '@/components/CityPanel/CityDetailPanel';
import { AIChatBar } from '@/components/Chat/AIChatBar';
import { CompareModal } from '@/components/Compare/CompareModal';

export function AnalysisPage() {
  return (
    <div className="flex-1 flex overflow-hidden bg-[#0d1b2a]">

      {/* ── Left column: map + AI chat ──────────────────────────────── */}
      {/* flex-1 + min-w-0 lets the map fill all remaining space fluidly */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 min-h-0">
          <LeafletMap />
        </div>
        <AIChatBar />
      </div>

      {/* ── Right column: analysis panel ────────────────────────────── */}
      {/*
        Width scales with viewport:
          - sm/md: 280px (enough to read data without crowding the map)
          - lg:    340px
          - xl+:   400px
        flex-shrink-0 prevents it from being squeezed by the map.
      */}
      <div className="
        w-[280px] md:w-[320px] lg:w-[360px] xl:w-[400px]
        flex-shrink-0
        border-l border-white/8
        flex flex-col overflow-hidden
      ">
        <CityDetailPanel />
      </div>

      {/* ── Compare modal overlay ────────────────────────────────────── */}
      <CompareModal />
    </div>
  );
}
