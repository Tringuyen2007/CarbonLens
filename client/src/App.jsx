// ─────────────────────────────────────────────────────────────────────────────
// App — Root layout  —  PRD §11.1 Component Tree
// ─────────────────────────────────────────────────────────────────────────────

import { CityProvider, useCityContext } from '@/context/CityContext';
import { Header } from '@/components/Header';
import { LeafletMap } from '@/components/Map/LeafletMap';
import { NationalSummaryBanner } from '@/components/Map/NationalSummaryBanner';
import { CityDetailPanel } from '@/components/CityPanel/CityDetailPanel';
import { AIChatBar } from '@/components/Chat/AIChatBar';
import { CompareModal } from '@/components/Compare/CompareModal';

// MapContainer adjusts width when panel is open (PRD §11.1)
// On large screens: 70% → 55% when panel is open.
// On small screens: always full width (panel slides over).
function MainLayout() {
  const { panelOpen } = useCityContext();

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Map area */}
      <div
        className={`
          flex-1 transition-all duration-300
          ${panelOpen ? 'lg:mr-[420px]' : ''}
        `}
      >
        <LeafletMap />
      </div>

      {/* City detail panel — fixed position, slides in from right */}
      <CityDetailPanel />
    </div>
  );
}

export default function App() {
  return (
    <CityProvider>
      {/* Full-height column layout */}
      <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
        {/* Fixed header */}
        <Header />

        {/* National summary strip */}
        <NationalSummaryBanner />

        {/* Main content — map + panel */}
        {/* pb-[104px] reserves space above the fixed AIChatBar */}
        <div className="flex-1 flex overflow-hidden pb-[104px]">
          <MainLayout />
        </div>

        {/* Fixed bottom AI chat bar */}
        <AIChatBar />

        {/* Compare modal overlay */}
        <CompareModal />
      </div>
    </CityProvider>
  );
}
