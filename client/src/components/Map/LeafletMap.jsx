// ─────────────────────────────────────────────────────────────────────────────
// LeafletMap — Interactive US map with CartoDB Dark Matter tiles
// PRD §11.8
// ─────────────────────────────────────────────────────────────────────────────

import { MapContainer, TileLayer } from 'react-leaflet';
import { useCityContext } from '@/context/CityContext';
import { useCities } from '@/hooks/useCities';
import { CityMarker } from './CityMarker';
import { MapLegend } from './MapLegend';
import { Skeleton } from '@/components/ui/Skeleton';

export function LeafletMap() {
  const { selectCity } = useCityContext();
  const { cities, loading, error } = useCities();

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 text-red-400 text-sm">
        Failed to load map data. Check your connection or API configuration.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-400 text-sm">Loading cities…</span>
          </div>
        </div>
      )}

      <MapContainer
        center={[39.8, -98.5]}
        zoom={4}
        minZoom={3}
        maxZoom={12}
        className="w-full h-full"
        zoomControl={true}
      >
        {/* CartoDB Dark Matter tiles — PRD §11.8 */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {cities.map(city => (
          <CityMarker key={city.city_id} city={city} onSelect={selectCity} />
        ))}
      </MapContainer>

      <MapLegend />
    </div>
  );
}
