// ─────────────────────────────────────────────────────────────────────────────
// EmissionsDonut — Sector breakdown pie chart  —  PRD §11.6
// ─────────────────────────────────────────────────────────────────────────────

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useEmissions } from '@/hooks/useEmissions';
import { formatCO2e } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/Skeleton';

const TOOLTIP_STYLE = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '6px',
  fontSize: '12px',
  color: '#e2e8f0',
};

export function EmissionsDonut({ cityId }) {
  const { data, loading, error } = useEmissions(cityId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[220px]">
        <Skeleton className="w-[160px] h-[160px] rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">
        Emissions data unavailable
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data.sectors}
          dataKey="co2e_mt"
          nameKey="sector"
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={82}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.sectors.map((entry) => (
            <Cell key={entry.sector} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => [formatCO2e(v), 'CO₂e']}
          contentStyle={TOOLTIP_STYLE}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
