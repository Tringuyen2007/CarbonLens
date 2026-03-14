// ─────────────────────────────────────────────────────────────────────────────
// TrendChart — 5-year emissions trend line chart  —  PRD §11.7
// ─────────────────────────────────────────────────────────────────────────────

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useEmissions } from '@/hooks/useEmissions';
import { formatCO2e, formatAxisCO2e } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/Skeleton';

const TOOLTIP_STYLE = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '6px',
  fontSize: '12px',
  color: '#e2e8f0',
};

export function TrendChart({ cityId, bpsTarget }) {
  const { data, loading, error } = useEmissions(cityId);

  if (loading) {
    return <Skeleton className="h-[180px] w-full" />;
  }

  if (error || !data?.trend_5yr) {
    return (
      <div className="flex items-center justify-center h-[180px] text-slate-500 text-sm">
        Trend data unavailable
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data.trend_5yr} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="year"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatAxisCO2e}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Line
          type="monotone"
          dataKey="co2e_mt"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6, stroke: '#60a5fa' }}
        />
        {bpsTarget && (
          <ReferenceLine
            y={bpsTarget}
            stroke="#ef4444"
            strokeDasharray="5 5"
            label={{ value: 'BPS Target', fill: '#ef4444', fontSize: 10 }}
          />
        )}
        <Tooltip
          formatter={(v) => [formatCO2e(v), 'Total CO₂e']}
          contentStyle={TOOLTIP_STYLE}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
