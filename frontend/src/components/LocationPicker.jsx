import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
import {
  DARK_TILES, DARK_ATTR, LIGHT_TILES, LIGHT_ATTR, SATELLITE_TILES, SATELLITE_ATTR,
  DEFAULT_CENTER, DEFAULT_ZOOM, createMarkerIcon
} from '../utils/mapStyles';
import api from '../api/axiosInstance';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Removed makeIcon global function to move it inside using useMemo

// Component to handle map click for pin-drop
function MapClickHandler({ onLocationSelect, enabled }) {
  useMapEvents({
    click(e) {
      if (enabled) {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    }
  });
  return null;
}

// Force Leaflet to recalculate its size after mount (fixes collapsed/grey map in flex/absolute layouts)
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Small delay lets the DOM fully render before Leaflet measures
    const t = setTimeout(() => { map.invalidateSize(); }, 50);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// Component to recenter map
function MapRecenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 0.8 });
    }
  }, [position, map]);
  return null;
}

export default function LocationPicker({ 
  value, onChange, label = 'Select Location', mode = 'pickup', 
  onLocationDetected, hideGps = false, hideMapToggle = false,
  minimal = false, placeholder = "Search location..."
}) {
  const { dark } = useTheme();
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'
  const [landmarks, setLandmarks] = useState([]);
  const [geoError, setGeoError] = useState('');
  const searchTimeout = useRef(null);

  const color = mode === 'pickup' ? '#4CAF50' : '#E74C3C';

  // Use useMemo for the marker icon to prevent frequent re-initialization which can lead to invisible markers
  const markerIcon = useRef(null);
  if (!markerIcon.current) {
    markerIcon.current = L.icon({
      iconUrl: createMarkerIcon(color, 32),
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -40]
    });
  }

  useEffect(() => {
    api.get('/landmarks').then(res => {
      const data = res.data.data?.landmarks || res.data.landmarks || [];
      setLandmarks(data);
    });
  }, []);

  // Check if location is in India (rough bounding box)
  const isIndia = (lat, lng) => {
    return (lat > 8.0 && lat < 38.0) && (lng > 68.0 && lng < 98.0);
  };

  // Reverse geocode when value changes
  useEffect(() => {
    if (value?.lat && value?.lng) {
      if (isIndia(value.lat, value.lng)) {
        setGeoError('');
        reverseGeocode(value.lat, value.lng);
      } else {
        setGeoError('Currently, UrbanRide is only available in India.');
        setAddress('Outside India');
      }
    }
  }, [value?.lat, value?.lng]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await api.get('/maps/reverse-geocode', { params: { lat, lng } });
      const data = res.data.data;
      const addr = data.shortAddress || data.displayName;
      setAddress(addr);
      if (onChange) {
        onChange({ lat, lng, address: addr, fullAddress: data.displayName });
      }
    } catch {
      const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setAddress(fallback);
    }
  };

  const handleMapClick = useCallback(({ lat, lng }) => {
    if (!isIndia(lat, lng)) {
      setGeoError('Currently, UrbanRide is only available in India.');
      return;
    }
    setGeoError('');
    reverseGeocode(lat, lng);
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setAddress(''); // clear displayed address while typing
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/maps/search', { params: { q: query } });
        setSearchResults(res.data.data?.results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const selectResult = (result) => {
    if (!isIndia(result.lat, result.lng)) {
      setGeoError('Currently, UrbanRide is only available in India.');
      return;
    }
    setGeoError('');
    setSearchResults([]);
    setSearchQuery('');
    setAddress(result.shortName);
    if (onChange) {
      onChange({ lat: result.lat, lng: result.lng, address: result.shortName, fullAddress: result.displayName });
    }
  };

  const detectMyLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        await reverseGeocode(lat, lng);
        setDetecting(false);
        setShowMap(true);
        if (onLocationDetected) onLocationDetected({ lat, lng });
      },
      () => setDetecting(false),
      { enableHighAccuracy: true }
    );
  };

  // The displayed value in the input
  const inputDisplayValue = inputFocused ? searchQuery : (address || searchQuery || '');

  return (
    <div style={{ marginBottom: minimal ? 0 : 18 }}>
      {!minimal && (
        <label style={{
          display: 'block', fontSize: 12, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--muted)', marginBottom: 6
        }}>{label}</label>
      )}

      {geoError && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1.2px solid rgba(239,68,68,0.2)',
          borderRadius: 12, padding: '10px 14px', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 10, animation: 'shake 0.4s ease-in-out'
        }}>
          <span style={{ fontSize: 16 }}>🇮🇳</span>
          <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, margin: 0 }}>{geoError}</p>
        </div>
      )}

      {/* Search + GPS row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {minimal && (
          <div style={{ 
            fontSize: 20, color: 'var(--muted)', display: 'flex', alignItems: 'center', 
            opacity: 0.6, marginRight: 8 
          }}>
             {mode === 'pickup' ? '⭕' : '📍'}
          </div>
        )}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            autoComplete="off"
            placeholder={inputFocused ? "Start typing..." : placeholder}
            value={inputDisplayValue}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => { 
                setInputFocused(true); 
                if (!minimal) setShowMap(true); 
                setSearchQuery(''); 
            }}
            onBlur={() => { setInputFocused(false); setTimeout(() => setSearchResults([]), 200); }}
            style={{
              width: '100%', padding: minimal ? '6px 0' : '11px 14px',
              border: minimal ? 'none' : `1.5px solid ${value?.lat ? color : 'var(--border)'}`,
              borderRadius: minimal ? 0 : 'var(--radius-sm)', fontSize: 16,
              fontWeight: 500,
              color: 'var(--charcoal)',
              background: 'transparent',
              outline: 'none', transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
          />

          {/* Smart Search Dropdown */}
          {inputFocused && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, 
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
              zIndex: 1000, maxHeight: 250, overflowY: 'auto', marginTop: 4,
              minWidth: minimal ? 400 : '100%', width: minimal ? 'auto' : '100%',
              maxWidth: minimal ? 550 : '100%'
            }}>
              {/* Smart Actions (only when query is short) */}
              {searchQuery.length < 3 && (
                <>
                  <div onMouseDown={detectMyLocation} style={{
                    padding: '12px 14px', cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 10,
                    borderBottom: '1px solid var(--border)', transition: 'background 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 16 }}>📍</span>
                    <div>
                      <span style={{ fontWeight: 600 }}>My Current Location</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>Use GPS to detect automatically</span>
                    </div>
                  </div>

                  <div onMouseDown={() => { setShowMap(true); setInputFocused(false); }} style={{
                    padding: '12px 14px', cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 10,
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 16 }}>🗺️</span>
                    <div>
                      <span style={{ fontWeight: 600 }}>Select from Map</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>Drop a pin manually</span>
                    </div>
                  </div>

                  {/* Landmarks / Suggested Locations */}
                  {landmarks.length > 0 && (
                    <>
                      <div style={{
                        padding: '8px 14px', background: 'var(--cream-dark)',
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                        color: 'var(--muted)', letterSpacing: '0.05em'
                      }}>Suggested Locations</div>
                      {landmarks.map((lm) => (
                        <div key={lm._id} onMouseDown={() => selectResult({
                          lat: lm.lat, lng: lm.lng, shortName: lm.name, displayName: lm.name
                        })} style={{
                          padding: '12px 14px', cursor: 'pointer', fontSize: 13,
                          display: 'flex', alignItems: 'center', gap: 10,
                          borderBottom: '1px solid var(--border)', transition: 'background 0.15s'
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontSize: 16 }}>🏢</span>
                          <div>
                            <span style={{ fontWeight: 600 }}>{lm.name}</span>
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>Popular landmark</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}

              {/* API Search Results */}
              {searchResults.map((r, i) => (
                <div key={i} onMouseDown={() => selectResult(r)} style={{
                  padding: '12px 14px', cursor: 'pointer', fontSize: 13,
                  borderBottom: i === searchResults.length - 1 ? 'none' : '1px solid var(--border)',
                  transition: 'background 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontWeight: 600 }}>{r.shortName}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {r.displayName}
                  </span>
                </div>
              ))}

              {searching && (
                <div style={{ padding: '10px 14px', textAlign: 'center' }}>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                </div>
              )}
            </div>
          )}
        </div>

        {!hideGps && (
          <button type="button" onClick={detectMyLocation} disabled={detecting} style={{
            padding: '8px 12px', background: 'var(--coral-pale)',
            border: `1.5px solid var(--coral)`, borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', fontSize: 16, whiteSpace: 'nowrap', color: 'var(--coral)',
            opacity: detecting ? 0.6 : 1, transition: 'opacity 0.2s'
          }} title="Use my location">
            {detecting ? '⏳' : '📍'}
          </button>
        )}

        {!hideMapToggle && (
          <button type="button" onClick={() => setShowMap(s => !s)} style={{
            padding: '8px 12px', background: showMap ? 'var(--coral)' : 'var(--cream-dark)',
            border: `1.5px solid ${showMap ? 'var(--coral)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 16,
            color: showMap ? 'white' : 'var(--muted)', transition: 'all 0.2s'
          }} title="Toggle map">
            🗺️
          </button>
        )}
      </div>

      {/* Map */}
      {showMap && (
        <div style={{
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1.5px solid var(--border)',
          // Use explicit pixel height so it never collapses inside flex/absolute containers
          height: 260,
          position: minimal ? 'absolute' : 'relative',
          top: minimal ? 'calc(100% + 4px)' : 'auto',
          left: minimal ? 0 : 'auto',
          // Fixed 340px for minimal (dropdown); full-width block for normal
          width: minimal ? 340 : '100%',
          zIndex: minimal ? 1200 : 10,
          boxShadow: minimal
            ? '0 8px 32px rgba(0,0,0,0.18)'
            : '0 2px 8px rgba(0,0,0,0.08)',
          background: dark ? '#1a1a1a' : '#f0ebe3',
        }}>
          {/* MapContainer must have explicit px height — "100%" won't work if parent has overflow:hidden */}
          <MapContainer
            center={value?.lat ? [value.lat, value.lng] : DEFAULT_CENTER}
            zoom={value?.lat ? 15 : DEFAULT_ZOOM}
            style={{ height: 212, width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              key={`${dark}-${mapType}`}
              url={mapType === 'satellite' ? SATELLITE_TILES : (dark ? DARK_TILES : LIGHT_TILES)}
              attribution={mapType === 'satellite' ? SATELLITE_ATTR : (dark ? DARK_ATTR : LIGHT_ATTR)}
            />
            {/* Calls invalidateSize() after DOM settles — fixes grey/blank map on first render */}
            <MapResizer />
            <MapClickHandler onLocationSelect={handleMapClick} enabled={true} />
            {value?.lat && (
              <>
                <MapRecenter position={[value.lat, value.lng]} />
                <Marker position={[value.lat, value.lng]} icon={markerIcon.current}>
                  <Popup>{address || 'Selected location'}</Popup>
                </Marker>
              </>
            )}
          </MapContainer>
          <div style={{
            padding: '5px 12px',
            background: dark ? '#1a1a1a' : '#fff',
            borderTop: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--muted)',
            textAlign: 'center',
          }}>
            Tap the map to drop a pin
          </div>

          {/* Layer Toggle (Mini) */}
          <div 
            onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
            style={{
              position: 'absolute', bottom: 35, right: 10, width: 44, height: 44,
              borderRadius: 6, border: '2px solid white', overflow: 'hidden',
              cursor: 'pointer', zIndex: 1000, boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            <img 
              src={mapType === 'roadmap' ? 'https://khms0.google.com/kh/v=977?x=0&y=0&z=0' : 'https://mt1.google.com/vt/lyrs=m&x=0&y=0&z=0'} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 8, fontWeight: 800
            }}>{mapType === 'roadmap' ? 'SAT' : 'MAP'}</div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
