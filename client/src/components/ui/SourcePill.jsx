// PRD §11.5 — Source attribution pill
export function SourcePill({ label }) {
  return (
    <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
      {label}
    </span>
  );
}
