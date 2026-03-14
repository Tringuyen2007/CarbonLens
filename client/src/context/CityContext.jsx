// ─────────────────────────────────────────────────────────────────────────────
// CityContext — global state for selected city + compare modal
// PRD §11.2
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState } from 'react';

const CityContext = createContext(null);

export function CityProvider({ children }) {
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const selectCity = (cityId) => {
    setSelectedCityId(cityId);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedCityId(null);
  };

  const openCompare = () => setCompareOpen(true);
  const closeCompare = () => setCompareOpen(false);

  return (
    <CityContext.Provider
      value={{
        selectedCityId,
        panelOpen,
        selectCity,
        closePanel,
        compareOpen,
        openCompare,
        closeCompare,
      }}
    >
      {children}
    </CityContext.Provider>
  );
}

export function useCityContext() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCityContext must be used inside <CityProvider>');
  return ctx;
}
