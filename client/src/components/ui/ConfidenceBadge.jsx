// PRD §11.5 — Confidence indicator badge
// Adds MEDIUM (amber) to the HIGH/LOW spec'd in the PRD.

const styles = {
  high: 'text-emerald-400 bg-emerald-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  low: 'text-red-400 bg-red-500/10',
};

export function ConfidenceBadge({ level }) {
  const key = (level || 'medium').toLowerCase();
  const cls = styles[key] || styles.medium;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {key.toUpperCase()}
    </span>
  );
}
