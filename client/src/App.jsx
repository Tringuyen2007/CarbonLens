// ─────────────────────────────────────────────────────────────────────────────
// App — Layout shell with routing  —  PRD §11.1
// ─────────────────────────────────────────────────────────────────────────────

import { Routes, Route } from 'react-router-dom';
import { CityProvider } from '@/context/CityContext';
import { Header } from '@/components/Header';
import { LandingPage } from '@/pages/LandingPage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { RankingsPage } from '@/pages/RankingsPage';

export default function App() {
  return (
    <CityProvider>
      <div className="h-screen flex flex-col bg-[#0d1b2a] overflow-hidden">
        {/* Fixed top navbar — present on all pages */}
        <Header />

        {/* Page content */}
        <Routes>
          <Route path="/"          element={<LandingPage />} />
          <Route path="/analysis"  element={<AnalysisPage />} />
          <Route path="/rankings"  element={<RankingsPage />} />
        </Routes>
      </div>
    </CityProvider>
  );
}
