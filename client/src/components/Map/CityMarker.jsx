// Individual city CircleMarker — PRD §11.8
// Rendered inside LeafletMap as a child of MapContainer.

import { CircleMarker, Tooltip } from 'react-leaflet';
import { getEmissionColor, getMarkerRadius } from '@/lib/colors';
import { formatCO2e } from '@/lib/formatters';

export function CityMarker({ city, onSelect }) {
  const color = getEmissionColor(city.co2e_per_capita);
  const radius = getMarkerRadius(city.total_co2e_mt);

  return (
    <CircleMarker
      center={[city.lat, city.lng]}
      radius={radius}
      fillColor={color}
      fillOpacity={0.85}
      // Gold ring for BPS cities (PRD §11.8) — fix 4: shape + color encoding
      stroke={city.has_bps}
      color="#fbbf24"
      weight={city.has_bps ? 2.5 : 0}
      eventHandlers={{ click: () => onSelect(city.city_id) }}
    >
      <Tooltip>
        <div className="text-sm font-semibold">{city.name}, {city.state}</div>
        <div className="text-xs text-slate-300">{formatCO2e(city.total_co2e_mt)} total</div>
        <div className="text-xs text-slate-300">{city.co2e_per_capita} tCO₂e/capita</div>
        {city.has_bps && (
          <div className="text-xs text-amber-400 mt-0.5">BPS Active</div>
        )}
      </Tooltip>
    </CircleMarker>
  );
}
