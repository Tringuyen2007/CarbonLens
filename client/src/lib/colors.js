// ─────────────────────────────────────────────────────────────────────────────
// Color palette — PRD §11.4 (color-blind-safe blue-orange scale)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a color for a per-capita CO₂e value using the accessible
 * blue → amber → orange → red scale specified in PRD §11.4.
 */
export function getEmissionColor(co2ePerCapita) {
  if (co2ePerCapita < 5) return '#2563EB';   // blue  — low
  if (co2ePerCapita < 10) return '#F59E0B';  // amber — moderate
  if (co2ePerCapita < 15) return '#EA580C';  // orange — high
  return '#DC2626';                           // red   — very high
}

/**
 * Returns a Leaflet CircleMarker radius proportional to total emissions.
 * Uses square-root scaling to avoid extreme size differences.
 */
export function getMarkerRadius(totalMt) {
  return Math.max(7, Math.sqrt(totalMt / 1e6) * 2.5);
}

// Sector colors for Recharts donut — PRD §11.6
export const SECTOR_COLORS = {
  Buildings: '#FF6B6B',
  Transport: '#4ECDC4',
  Industry: '#45B7D1',
  Waste: '#96CEB4',
  Other: '#FFEAA7',
};

// Confidence levels
export const CONFIDENCE_STYLES = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-red-400',
};
