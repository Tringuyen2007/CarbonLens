// ─────────────────────────────────────────────────────────────────────────────
// AnalysisPage — Map + city panel + AI chat  —  PRD §11.1
// ─────────────────────────────────────────────────────────────────────────────

import { useCityContext } from '@/context/CityContext';
import { LeafletMap } from '@/components/Map/LeafletMap';
import { NationalSummaryBanner } from '@/components/Map/NationalSummaryBanner';
import { CityDetailPanel } from '@/components/CityPanel/CityDetailPanel';
import { AIChatBar } from '@/components/Chat/AIChatBar';
import { CompareModal } from '@/components/Compare/CompareModal';

function MainLayout() {
  const { panelOpen } = useCityContext();

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Map area — shrinks right when city panel is open on large screens */}
      <div
        className={`
          flex-1 transition-all duration-300
          ${panelOpen ? 'lg:mr-[420px]' : ''}
        `}
      >
        <LeafletMap />
      </div>

      {/* City detail panel — fixed, slides in from right */}
      <CityDetailPanel />
    </div>
  );
}

export function AnalysisPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* National summary strip */}
      <NationalSummaryBanner />

      {/* Map + panel — pb reserves space for fixed AIChatBar */}
      <div className="flex-1 flex overflow-hidden pb-[104px]">
        <MainLayout />
      </div>

      {/* Fixed bottom AI chat */}
      <AIChatBar />

      {/* Compare modal overlay */}
      <CompareModal />
    </div>
  );
}
