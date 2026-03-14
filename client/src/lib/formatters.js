// ─────────────────────────────────────────────────────────────────────────────
// Formatting helpers used across all components
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format CO₂e in metric tons to a human-readable string.
 * e.g. 48200000 → "48.2M tons"  |  750000 → "750k tons"
 */
export function formatCO2e(mt) {
  if (mt == null) return '—';
  if (mt >= 1_000_000) return `${(mt / 1_000_000).toFixed(1)}M tons`;
  if (mt >= 1_000) return `${(mt / 1_000).toFixed(0)}k tons`;
  return `${mt} tons`;
}

/**
 * Format per-capita CO₂e.  e.g. 5.78 → "5.78 tCO₂e/capita"
 */
export function formatPerCapita(value) {
  if (value == null) return '—';
  return `${value.toFixed(2)} tCO₂e`;
}

/**
 * Format a percentage change with sign.  e.g. -2.3 → "↓ 2.3%"
 */
export function formatTrendYoY(value) {
  if (value == null) return '—';
  const abs = Math.abs(value).toFixed(1);
  if (value < 0) return { label: `↓ ${abs}%`, positive: true };
  if (value > 0) return { label: `↑ ${abs}%`, positive: false };
  return { label: '0%', positive: null };
}

/**
 * Format a large number with commas.  e.g. 1304379 → "1,304,379"
 */
export function formatNumber(n) {
  if (n == null) return '—';
  return n.toLocaleString('en-US');
}

/**
 * Format MW value.  e.g. 5800 → "5,800 MW"
 */
export function formatMW(mw) {
  if (mw == null) return '—';
  return `${mw.toLocaleString('en-US')} MW`;
}

/**
 * Format a percentage.  e.g. 32.1 → "32.1%"
 */
export function formatPct(pct) {
  if (pct == null) return '—';
  return `${pct.toFixed(1)}%`;
}

/**
 * Format CO₂e shorthand for chart Y-axis ticks.
 */
export function formatAxisCO2e(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return `${value}`;
}
