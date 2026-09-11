import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Tooltip, useMap } from 'react-leaflet';

export const HOTSPOTS = [
  // Pune / PCMC
  { name: 'Alandi / MIT Alandi', region: 'Pune',   lat: 18.6750, lng: 73.8920, issues:  5, top: 'Garbage',     resolved: 0 },
  { name: 'Pimpri-Chinchwad', region: 'Pune',   lat: 18.6298, lng: 73.7997, issues:  7, top: 'Garbage',     resolved: 0 },
  { name: 'Pune Central',     region: 'Pune',   lat: 18.5314, lng: 73.8446, issues:  4, top: 'Road',        resolved: 1 },
  { name: 'Kothrud',          region: 'Pune',   lat: 18.5074, lng: 73.8077, issues:  3, top: 'Water',       resolved: 1 },
  { name: 'Hinjawadi',        region: 'Pune',   lat: 18.5913, lng: 73.7389, issues:  3, top: 'Streetlight', resolved: 1 },

  // Mumbai & MMR
  { name: 'Dharavi',          region: 'Mumbai', lat: 19.0390, lng: 72.8542, issues: 118, top: 'Sewage',      resolved: 22 },
  { name: 'Kurla',            region: 'Mumbai', lat: 19.0726, lng: 72.8845, issues: 104, top: 'Road',        resolved: 31 },
  { name: 'Mankhurd',         region: 'Mumbai', lat: 19.0470, lng: 72.9280, issues:  97, top: 'Garbage',     resolved: 18 },
  { name: 'Andheri',          region: 'Mumbai', lat: 19.1364, lng: 72.8296, issues:  74, top: 'Streetlight', resolved: 29 },
  { name: 'Goregaon',         region: 'Mumbai', lat: 19.1666, lng: 72.8506, issues:  68, top: 'Road',        resolved: 24 },
  { name: 'Chembur',          region: 'Mumbai', lat: 19.0600, lng: 72.8970, issues:  61, top: 'Sewage',      resolved: 20 },
  { name: 'Ghatkopar',        region: 'Mumbai', lat: 19.0862, lng: 72.9088, issues:  55, top: 'Electricity', resolved: 17 },
  { name: 'Bandra',           region: 'Mumbai', lat: 19.0607, lng: 72.8362, issues:  43, top: 'Garbage',     resolved: 19 },
  { name: 'Sion',             region: 'Mumbai', lat: 19.0388, lng: 72.8610, issues:  38, top: 'Water',       resolved: 14 },
  { name: 'Dadar',            region: 'Mumbai', lat: 19.0270, lng: 72.8381, issues:  34, top: 'Road',        resolved: 13 },
  { name: 'Vikhroli',         region: 'Mumbai', lat: 19.1100, lng: 72.9200, issues:  29, top: 'Garbage',     resolved: 11 },
  { name: 'Malad',            region: 'Mumbai', lat: 19.1872, lng: 72.8483, issues:  24, top: 'Water',       resolved: 10 },
  { name: 'Powai',            region: 'Mumbai', lat: 19.1187, lng: 72.9053, issues:  21, top: 'Electricity', resolved: 12 },
  { name: 'Thane',            region: 'Mumbai', lat: 19.2183, lng: 72.9781, issues:  19, top: 'Road',        resolved:  8 },
  { name: 'Juhu',             region: 'Mumbai', lat: 19.1075, lng: 72.8263, issues:  16, top: 'Noise',       resolved:  9 },
  { name: 'Borivali',         region: 'Mumbai', lat: 19.2290, lng: 72.8560, issues:  14, top: 'Garbage',     resolved:  7 },
  { name: 'Vashi',            region: 'Mumbai', lat: 19.0696, lng: 72.9987, issues:   8, top: 'Water',       resolved:  4 },
];

export function getColor(issues, maxIssues = 100) {
  if (maxIssues >= 50) {
    if (issues >= 90) return '#ef4444';
    if (issues >= 55) return '#f97316';
    if (issues >= 30) return '#f59e0b';
    return '#22c55e';
  }
  // Adaptive scaling for lower counts (live database)
  const ratio = issues / (maxIssues || 1);
  if (ratio >= 0.7 || issues >= 6) return '#ef4444'; // Critical (Red)
  if (ratio >= 0.4 || issues >= 4) return '#f97316'; // High (Orange)
  if (ratio >= 0.2 || issues >= 2) return '#f59e0b'; // Moderate (Yellow)
  return '#22c55e'; // Low (Green)
}

export function getLabel(issues, maxIssues = 100) {
  if (maxIssues >= 50) {
    if (issues >= 90) return 'Critical';
    if (issues >= 55) return 'High';
    if (issues >= 30) return 'Moderate';
    return 'Low';
  }
  const ratio = issues / (maxIssues || 1);
  if (ratio >= 0.7 || issues >= 6) return 'Critical';
  if (ratio >= 0.4 || issues >= 4) return 'High';
  if (ratio >= 0.2 || issues >= 2) return 'Moderate';
  return 'Low';
}

function MapViewController({ regionCenter, zoomLevel }) {
  const map = useMap();
  useEffect(() => {
    if (regionCenter && zoomLevel) {
      map.flyTo(regionCenter, zoomLevel, { duration: 0.8 });
    }
  }, [regionCenter, zoomLevel, map]);
  return null;
}

export default function MumbaiMap({
  hotspots = HOTSPOTS,
  fullscreen = false,
  onFullscreen,
  onExitFullscreen,
}) {
  const height = fullscreen ? '100%' : '440px';

  // Region presets
  const REGIONS = {
    all: { label: 'All Maharashtra', center: [18.88, 73.35], zoom: 9 },
    pune: { label: 'Pune / PCMC', center: [18.62, 73.82], zoom: 12 },
    mumbai: { label: 'Mumbai MMR', center: [19.08, 72.88], zoom: 12 },
  };

  const [activeRegion, setActiveRegion] = useState('all');

  // Filter spots with issues > 0 if available, else show all
  const activeSpots = (hotspots && hotspots.length > 0)
    ? (hotspots.some((s) => s.issues > 0) ? hotspots.filter((s) => s.issues > 0) : hotspots)
    : HOTSPOTS;

  const maxIssues = Math.max(...activeSpots.map((s) => s.issues), 1);

  const currentRegion = REGIONS[activeRegion] || REGIONS.all;

  return (
    <div
      style={{
        height,
        width: '100%',
        borderRadius: fullscreen ? 0 : '16px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 0,
      }}
    >
      {/* Quick Region Selector overlay on top-left of the map */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 999,
          display: 'flex',
          gap: 6,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '5px 8px',
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
        }}
      >
        {Object.entries(REGIONS).map(([key, reg]) => {
          const isSelected = activeRegion === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveRegion(key)}
              style={{
                background: isSelected ? '#2563eb' : 'transparent',
                color: isSelected ? '#ffffff' : '#334155',
                border: 'none',
                borderRadius: 8,
                padding: '5px 10px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {reg.label}
            </button>
          );
        })}
      </div>

      <MapContainer
        center={currentRegion.center}
        zoom={fullscreen ? currentRegion.zoom + 1 : currentRegion.zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <MapViewController
          regionCenter={currentRegion.center}
          zoomLevel={fullscreen ? currentRegion.zoom + 1 : currentRegion.zoom}
        />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {activeSpots.map((spot) => {
          const color = getColor(spot.issues, maxIssues);
          const label = getLabel(spot.issues, maxIssues);
          const isCritical = label === 'Critical';
          const isHigh = label === 'High';

          // Adaptive circle radius based on issue count
          const radius =
            maxIssues >= 50
              ? spot.issues >= 90 ? 3800 : spot.issues >= 55 ? 2800 : spot.issues >= 30 ? 1900 : 1200
              : isCritical ? 3800 : isHigh ? 2800 : spot.issues >= 2 ? 2000 : 1300;

          return (
            <Circle
              key={spot.name}
              center={[spot.lat, spot.lng]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: isCritical ? 0.5 : 0.35,
                weight: isCritical ? 3 : 2,
              }}
            >
              <Tooltip permanent={isCritical || isHigh} direction="top" offset={[0, -8]}>
                <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.5 }}>
                  <div style={{ color, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {(isCritical || isHigh) && <span style={{ fontSize: 10 }}>⚠</span>}
                    {spot.name}
                    {spot.region && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: '#f1f5f9',
                          color: '#475569',
                          marginLeft: 2,
                        }}
                      >
                        {spot.region}
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#475569', fontWeight: 600 }}>
                    {spot.issues} {spot.issues === 1 ? 'issue' : 'issues'} · {label}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Top: {spot.top}</div>
                  {spot.resolved !== undefined && (
                    <div style={{ color: '#059669', fontSize: 10 }}>
                      {spot.resolved}/{spot.issues} resolved
                    </div>
                  )}
                </div>
              </Tooltip>
            </Circle>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          zIndex: 999,
          background: 'rgba(255,255,255,0.93)',
          backdropFilter: 'blur(10px)',
          borderRadius: 12,
          padding: '8px 12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.13)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {[
          { label: maxIssues >= 50 ? 'Critical (90+)' : `Critical (${Math.max(6, Math.round(maxIssues * 0.7))}+)`, color: '#ef4444' },
          { label: maxIssues >= 50 ? 'High (55–89)' : `High (${Math.max(4, Math.round(maxIssues * 0.4))}+)`, color: '#f97316' },
          { label: maxIssues >= 50 ? 'Moderate (30–54)' : `Moderate (2+)`, color: '#f59e0b' },
          { label: maxIssues >= 50 ? 'Low (<30)' : `Low (1)`, color: '#22c55e' },
        ].map((l) => (
          <div
            key={l.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              color: '#334155',
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: l.color,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {l.label}
          </div>
        ))}
      </div>

      {/* Fullscreen toggle button */}
      {fullscreen ? (
        <button
          onClick={onExitFullscreen}
          type="button"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 999,
            background: 'rgba(255,255,255,0.93)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 12,
            fontWeight: 700,
            color: '#1e293b',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}
        >
          <i className="fas fa-compress" style={{ fontSize: 13 }} />
          Exit Fullscreen
        </button>
      ) : (
        <button
          onClick={onFullscreen}
          type="button"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 999,
            background: 'rgba(255,255,255,0.93)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 12,
            fontWeight: 700,
            color: '#1e293b',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}
        >
          <i className="fas fa-expand" style={{ fontSize: 13 }} />
          Full Screen
        </button>
      )}
    </div>
  );
}
