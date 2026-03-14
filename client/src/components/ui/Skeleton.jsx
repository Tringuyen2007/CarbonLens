// PRD §11.3 — Skeleton loading component
export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-700 rounded ${className}`} />
  );
}
