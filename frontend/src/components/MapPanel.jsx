import { useMemo, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Rectangle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';

// ─── Exact aircraft DivIcon from spec ───
function createPlaneIcon(tier, heading) {
  const colors = { GREEN: '#00ff88', AMBER: '#ffaa00', RED: '#ff4444', CRITICAL: '#cc00ff' };
  const color = colors[tier] || '#00ff88';
  return L.divIcon({
    className: '',
    html: `<div style="transform: rotate(${heading}deg); width:24px; height:24px; pointer-events: auto; filter: drop-shadow(0 0 4px ${color})">
      <svg viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// ─── Selection ring DivIcon (white pulsing circle) ───
function createSelectionRing() {
  return L.divIcon({
    className: '',
    html: `<div class="selection-ring"></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

// ─── Map Legend Control ───
function MapLegend() {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: 'topleft' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = `
        <div style="font-size:10px;font-weight:600;letter-spacing:0.1em;color:#a0aec0;margin-bottom:4px;text-transform:uppercase;">Threat Tier</div>
        <div class="legend-item"><div class="legend-dot" style="background:#00ff88;"></div><span style="font-size:11px;">Green — Safe</span></div>
        <div class="legend-item"><div class="legend-dot" style="background:#ffaa00;"></div><span style="font-size:11px;">Amber — Monitor</span></div>
        <div class="legend-item"><div class="legend-dot" style="background:#ff4444;"></div><span style="font-size:11px;">Red — At Risk</span></div>
        <div class="legend-item"><div class="legend-dot" style="background:#cc00ff;"></div><span style="font-size:11px;">Critical — Urgent</span></div>
      `;
      return div;
    };
    legend.addTo(map);
    return () => legend.remove();
  }, [map]);

  return null;
}

// ─── Demo mode: fly map to North Atlantic ───
function DemoFlyTo({ demoMode }) {
  const map = useMap();
  useEffect(() => {
    if (demoMode) {
      map.flyTo([55, -30], 3, { duration: 1.2 });
    } else {
      map.flyTo([30, 0], 3, { duration: 1.2 });
    }
  }, [demoMode, map]);
  return null;
}

// ─── ICE673 Demo Route Lines ───
function DemoRouteLines({ selectedAircraft, demoMode }) {
  if (!demoMode) return null;
  if (!selectedAircraft || selectedAircraft.callsign !== 'ICE673') return null;

  const origin = [66.1, -25.8];
  const jfk = [40.6, -73.8];

  return (
    <>
      {/* Current route: dashed white */}
      <Polyline
        positions={[origin, jfk]}
        pathOptions={{
          color: '#ffffff',
          opacity: 0.35,
          weight: 1.5,
          dashArray: '8,8',
        }}
      />
      {/* Deviation route: solid neon blue arc */}
      <Polyline
        positions={[origin, [58, -30], [45, -55], jfk]}
        pathOptions={{
          color: '#0075ff',
          opacity: 0.8,
          weight: 2,
        }}
      />
    </>
  );
}

// ─── Generic Route Lines (live mode, non-ICE673 demo aircraft) ───
function RouteLines({ aircraft }) {
  // Only show for aircraft with deviations
  if (!aircraft?.deviations?.length) return null;

  const AIRPORT_COORDS = {
    MAD: [40.47, -3.56], JFK: [40.64, -73.78], LHR: [51.47, -0.46],
    ORD: [41.97, -87.91], CDG: [49.01, 2.55], LAX: [33.94, -118.41],
    FRA: [50.03, 8.57], YYZ: [43.68, -79.63], DXB: [25.25, 55.36],
    SYD: [-33.95, 151.18], SIN: [1.36, 103.99], LGW: [51.15, -0.19],
    FCO: [41.80, 12.25], STN: [51.89, 0.26], AGP: [36.67, -4.49],
    BCN: [41.30, 2.08], PMI: [39.55, 2.74], EWR: [40.69, -74.17],
    AMS: [52.31, 4.76], ATL: [33.64, -84.43], HEL: [60.32, 24.96],
    NYC: [40.64, -73.78], OSL: [60.19, 11.10], CPH: [55.62, 12.66],
    BOS: [42.36, -71.01], KEF: [63.99, -22.61], YVR: [49.19, -123.18],
    YYC: [51.13, -114.02], IST: [41.26, 28.73], DUB: [53.42, -6.27],
    LIS: [38.78, -9.14], GRU: [-23.43, -46.47], SCL: [-33.39, -70.79],
    NRT: [35.76, 140.39],
  };

  const pos = [aircraft.lat, aircraft.lon];
  const destCoords = AIRPORT_COORDS[aircraft.dest];
  if (!destCoords) return null;

  const midLat = (pos[0] + destCoords[0]) / 2 - 3;
  const midLon = (pos[1] + destCoords[1]) / 2;

  return (
    <>
      <Polyline
        positions={[pos, destCoords]}
        pathOptions={{ color: 'white', opacity: 0.4, weight: 1, dashArray: '6, 6' }}
      />
      <Polyline
        positions={[pos, [midLat, midLon], destCoords]}
        pathOptions={{ color: '#0075ff', opacity: 0.7, weight: 2 }}
      />
    </>
  );
}

// ─── Radiation Zones ───
function RadiationZones({ alertLevel }) {
  const opacityMap = {
    GREEN: 0.05,
    AMBER: 0.10,
    RED: 0.20,
    CRITICAL: 0.35,
  };
  const opacity = opacityMap[alertLevel] || 0.05;

  return (
    <>
      {/* North polar */}
      <Rectangle
        bounds={[[60, -180], [90, 180]]}
        pathOptions={{ fillColor: '#ff4444', fillOpacity: opacity, stroke: false }}
      />
      {/* South polar */}
      <Rectangle
        bounds={[[-90, -180], [-60, 180]]}
        pathOptions={{ fillColor: '#ff4444', fillOpacity: opacity, stroke: false }}
      />
    </>
  );
}

export default function MapPanel({ fleet, solar, selectedCallsign, selectedAircraft, onSelect, demoMode }) {
  const aircraft = fleet?.aircraft || [];
  const alertLevel = solar?.alert_level || 'GREEN';

  const markers = useMemo(() => {
    return aircraft.map(ac => ({
      callsign: ac.callsign,
      position: [ac.lat, ac.lon],
      heading: ac.heading || 0,
      tier: ac.tier,
    }));
  }, [aircraft]);

  // Determine selected position for the highlight ring
  const selectedPosition = useMemo(() => {
    if (!selectedCallsign) return null;
    const ac = aircraft.find(a => a.callsign === selectedCallsign);
    return ac ? [ac.lat, ac.lon] : null;
  }, [selectedCallsign, aircraft]);

  // Show generic route lines for non-ICE673 selections that have deviations
  const showGenericRoutes = selectedAircraft &&
    selectedAircraft.deviations?.length > 0 &&
    !(demoMode && selectedAircraft.callsign === 'ICE673');

  return (
    <MapContainer
      center={[30, 0]}
      zoom={3}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
      attributionControl={true}
      id="solaris-map"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      <MapLegend />
      <DemoFlyTo demoMode={demoMode} />
      <RadiationZones alertLevel={alertLevel} />

      {/* ICE673 demo route lines */}
      <DemoRouteLines selectedAircraft={selectedAircraft} demoMode={demoMode} />

      {/* Generic route lines for other selected aircraft with deviations */}
      {showGenericRoutes && <RouteLines aircraft={selectedAircraft} />}

      {/* Selection ring behind selected aircraft */}
      {selectedPosition && (
        <Marker
          position={selectedPosition}
          icon={createSelectionRing()}
          interactive={false}
          zIndexOffset={-1000}
        />
      )}

      {/* Aircraft markers */}
      {markers.map(m => (
        <Marker
          key={m.callsign}
          position={m.position}
          icon={createPlaneIcon(m.tier, m.heading)}
          eventHandlers={{
            click: () => onSelect(m.callsign),
          }}
          zIndexOffset={m.callsign === selectedCallsign ? 1000 : 0}
        />
      ))}
    </MapContainer>
  );
}
