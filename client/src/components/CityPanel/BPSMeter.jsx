// ─────────────────────────────────────────────────────────────────────────────
// BPSMeter — Building Performance Standard compliance section
// ─────────────────────────────────────────────────────────────────────────────

import { Skeleton } from '@/components/ui/Skeleton';
import { Scale } from 'lucide-react';

function ComplianceBar({ gapPct }) {
  // gapPct = 0 means fully compliant, positive means % over limit
  const isCompliant = gapPct <= 0;
  const fill = isCompliant ? 100 : Math.max(0, 100 - gapPct);
  const barColor = isCompliant ? 'bg-emerald-500' : gapPct < 15 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>Compliance</span>
        <span className={isCompliant ? 'text-emerald-400' : 'text-red-400'}>
          {isCompliant ? 'Compliant' : `${gapPct}% over limit`}
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  );
}

export function BPSMeter({ city, loading }) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-3 w-48" />
      </div>
    );
  }

  // Non-BPS city — PRD §11.3 empty state
  if (!city?.bps || city.bps.status === null) {
    return (
      <div className="text-slate-500 text-sm italic">
        {city?.name} does not currently have a Building Performance Standard.
      </div>
    );
  }

  const { bps } = city;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-white font-medium text-sm">{bps.name}</span>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            bps.status === 'active'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-600/20 text-slate-400'
          }`}
        >
          {bps.status === 'active' ? <><Scale size={10} className="inline mr-0.5" />ACTIVE</> : bps.status?.toUpperCase()}
        </span>
      </div>

      {bps.compliance_gap_pct != null && (
        <ComplianceBar gapPct={bps.compliance_gap_pct} />
      )}

      {/* Thresholds table */}
      {bps.thresholds?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="text-slate-500 border-b border-slate-700">
                <th className="text-left py-1 pr-3">Period</th>
                <th className="text-left py-1 pr-3">Type</th>
                <th className="text-right py-1 pr-3">Limit</th>
                <th className="text-right py-1">Penalty</th>
              </tr>
            </thead>
            <tbody>
              {bps.thresholds.map((t, i) => (
                <tr key={i} className="border-b border-slate-800">
                  <td className="py-1 pr-3 whitespace-nowrap">{t.period}</td>
                  <td className="py-1 pr-3">{t.type}</td>
                  <td className="py-1 pr-3 text-right">
                    {t.limit ? `${t.limit} ${t.unit}` : t.unit}
                  </td>
                  <td className="py-1 text-right">
                    {t.penalty ? `$${t.penalty}/ton` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
