import { useMemo, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Rectangle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { assessFlightDecision } from '../services/decisionEngine';

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

function MapLegend() {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: 'topleft' });
    legend.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      container.style.backgroundColor = 'rgba(6,11,40,0.8)';
      container.style.border = '1px solid rgba(255,255,255,0.1)';
      container.style.borderRadius = '8px';
      container.style.backdropFilter = 'blur(8px)';
      container.style.overflow = 'hidden';
      container.style.cursor = 'pointer';

      const btn = L.DomUtil.create('div', '', container);
      btn.innerHTML = 'Legend';
      btn.style.padding = '6px 12px';
      btn.style.fontSize = '11px';
      btn.style.fontWeight = 'bold';
      btn.style.color = '#a0aec0';
      btn.style.textAlign = 'center';
      btn.style.textTransform = 'uppercase';
      btn.style.letterSpacing = '0.05em';

      const content = L.DomUtil.create('div', '', container);
      content.style.display = 'none';
      content.style.borderTop = '1px solid rgba(255,255,255,0.1)';
      content.style.padding = '10px';
      content.innerHTML = `
        <div style="font-size:10px;font-weight:600;letter-spacing:0.1em;color:#a0aec0;margin-bottom:6px;text-transform:uppercase;">Threat Tier</div>
        <div class="legend-item" style="display:flex;align-items:center;gap:8px;margin-bottom:4px;color:white;"><div class="legend-dot" style="width:8px;height:8px;border-radius:50%;background:#00ff88;box-shadow:0 0 6px #00ff88;"></div><span style="font-size:11px;">Green — Safe</span></div>
        <div class="legend-item" style="display:flex;align-items:center;gap:8px;margin-bottom:4px;color:white;"><div class="legend-dot" style="width:8px;height:8px;border-radius:50%;background:#ffaa00;box-shadow:0 0 6px #ffaa00;"></div><span style="font-size:11px;">Amber — Monitor</span></div>
        <div class="legend-item" style="display:flex;align-items:center;gap:8px;margin-bottom:4px;color:white;"><div class="legend-dot" style="width:8px;height:8px;border-radius:50%;background:#ff4444;box-shadow:0 0 6px #ff4444;"></div><span style="font-size:11px;">Red — At Risk</span></div>
        <div class="legend-item" style="display:flex;align-items:center;gap:8px;color:white;"><div class="legend-dot" style="width:8px;height:8px;border-radius:50%;background:#cc00ff;box-shadow:0 0 6px #cc00ff;"></div><span style="font-size:11px;">Critical — Urgent</span></div>
      `;

      let isOpen = false;
      container.addEventListener('click', (e) => {
        L.DomEvent.stopPropagation(e);
        isOpen = !isOpen;
        content.style.display = isOpen ? 'block' : 'none';
        btn.style.color = isOpen ? '#ffffff' : '#a0aec0';
        btn.style.backgroundColor = isOpen ? 'rgba(255,255,255,0.05)' : 'transparent';
      });

      L.DomEvent.disableClickPropagation(container);

      return container;
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

function RouteOverlay({ selectedAircraft, demoMode }) {
  const map = useMap();
  const routeLayersRef = useRef([]);

  useEffect(() => {
    // remove existing route layers if any
    if (routeLayersRef.current) {
      routeLayersRef.current.forEach(l => map.removeLayer(l));
      routeLayersRef.current = [];
    }

    if (!selectedAircraft) return;

    if (selectedAircraft.callsign === 'ICE673' && demoMode) {
      const current = L.polyline([[66.1,-25.8],[40.6,-73.8]], {color:'#ffffff', weight:1.5, opacity:0.35, dashArray:'8,8'}).addTo(map);
      const deviation = L.polyline([[66.1,-25.8],[58,-30],[45,-55],[40.6,-73.8]], {color:'#00d4ff', weight:2.5, opacity:0.9}).addTo(map);
      routeLayersRef.current = [current, deviation];
    } else {
      const decision = assessFlightDecision(selectedAircraft, { score: selectedAircraft.risk_score || 0 });
      
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
        NRT: [35.76, 140.39], IAD: [38.95, -77.45]
      };
      
      const pos = [selectedAircraft.lat, selectedAircraft.lon];
      const destCoords = AIRPORT_COORDS[selectedAircraft.dest];
      const originCoords = AIRPORT_COORDS[selectedAircraft.origin];
      
      if (destCoords) {
        let current;
        if (originCoords) {
          current = L.polyline([originCoords, pos, destCoords], { color: 'white', opacity: 0.4, weight: 1, dashArray: '6, 6' }).addTo(map);
        } else {
          current = L.polyline([pos, destCoords], { color: 'white', opacity: 0.4, weight: 1, dashArray: '6, 6' }).addTo(map);
        }
        routeLayersRef.current.push(current);

        if (decision.decision === 'DEVIATE' || selectedAircraft.deviations?.length > 0) {
          const midLat = (pos[0] + destCoords[0]) / 2 - 3;
          const midLon = (pos[1] + destCoords[1]) / 2;
          const deviation = L.polyline([pos, [midLat, midLon], destCoords], { color: '#0075ff', opacity: 0.7, weight: 2 }).addTo(map);
          routeLayersRef.current.push(deviation);
        }
      }
    }
  }, [selectedAircraft, demoMode, map]);

  return null;
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

      {/* Imperative route rendering to prevent stale layers */}
      <RouteOverlay selectedAircraft={selectedAircraft} demoMode={demoMode} />

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
