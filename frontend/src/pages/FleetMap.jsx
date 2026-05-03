import FleetSidebar from '../components/FleetSidebar';
import MapPanel from '../components/MapPanel';
import DetailPanel from '../components/DetailPanel';

export default function FleetMap({ fleet, solar, selectedCallsign, selectedAircraft, onSelect, loading, dataVersion, demoMode }) {
  return (
    <div className="flex flex-1 h-full min-h-0">
      {/* Left: Fleet List */}
      <FleetSidebar
        fleet={fleet}
        loading={loading}
        selectedCallsign={selectedCallsign}
        onSelect={onSelect}
        dataVersion={dataVersion}
      />

      {/* Center: Map */}
      <div className="flex-1 min-w-0 relative">
        <MapPanel
          fleet={fleet}
          solar={solar}
          selectedCallsign={selectedCallsign}
          selectedAircraft={selectedAircraft}
          onSelect={onSelect}
          demoMode={demoMode}
        />
      </div>

      {/* Right: Detail */}
      <DetailPanel aircraft={selectedAircraft} />
    </div>
  );
}
