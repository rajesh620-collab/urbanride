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

// Force Leaflet to recalculate its size after mount
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => { map.invalidateSize(); }, 80);
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

/* ─────────────────────────────────────────────────────────
   Fullscreen Map Modal — Uber/Ola style
   ───────────────────────────────────────────────────────── */
function FullscreenMapModal({ dark, value, onSelect, onClose, mode, markerIcon, address }) {
  const [mapType, setMapType] = useState('roadmap');
  const [tempAddress, setTempAddress] = useState(address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [tempPos, setTempPos] = useState(
    value?.lat ? [value.lat, value.lng] : DEFAULT_CENTER
  );
  const searchTimeout = useRef(null);
  const color = mode === 'pickup' ? '#4CAF50' : '#E74C3C';

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await api.get('/maps/reverse-geocode', { params: { lat, lng } });
      const data = res.data.data;
      setTempAddress(data.shortAddress || data.displayName);
    } catch {
      setTempAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const handleMapClick = ({ lat, lng }) => {
    setTempPos([lat, lng]);
    reverseGeocode(lat, lng);
  };

  const handleSearchInput = (query) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 3) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/maps/search', { params: { q: query } });
        setSearchResults(res.data.data?.results || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
  };

  const selectSearchResult = (r) => {
    setTempPos([r.lat, r.lng]);
    setTempAddress(r.shortName);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleConfirm = () => {
    onSelect({ lat: tempPos[0], lng: tempPos[1], address: tempAddress });
    onClose();
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setTempPos([lat, lng]);
        reverseGeocode(lat, lng);
      },
      () => {},
      { enableHighAccuracy: true }
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--cream)', display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.25s ease-out'
    }}>
      {/* ── Top Bar ── */}
      <div style={{
        padding: '12px 16px', background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border)', zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, color: 'var(--charcoal)', padding: 0, lineHeight: 1
          }}>←</button>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder={mode === 'pickup' ? 'Search pickup location...' : 'Search destination...'}
              value={searchQuery}
              onChange={e => handleSearchInput(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '12px 16px', fontSize: 15, fontWeight: 500,
                border: `2px solid ${color}`, borderRadius: 14,
                background: 'var(--input-bg)', color: 'var(--charcoal)',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Search results dropdown inside the top bar */}
        {searchResults.length > 0 && (
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 14, maxHeight: 220, overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {searchResults.map((r, i) => (
              <div key={i} onClick={() => selectSearchResult(r)} style={{
                padding: '14px 16px', cursor: 'pointer', fontSize: 14,
                borderBottom: i < searchResults.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.15s'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 18, opacity: 0.6 }}>📍</span>
                <div>
                  <p style={{ fontWeight: 600, margin: 0 }}>{r.shortName}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, marginTop: 2 }}>{r.displayName}</p>
                </div>
              </div>
            ))}
            {searching && (
              <div style={{ padding: 12, textAlign: 'center' }}>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Map (fills remaining space) ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={tempPos}
          zoom={value?.lat ? 15 : DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            key={`fs-${dark}-${mapType}`}
            url={mapType === 'satellite' ? SATELLITE_TILES : (dark ? DARK_TILES : LIGHT_TILES)}
            attribution={mapType === 'satellite' ? SATELLITE_ATTR : (dark ? DARK_ATTR : LIGHT_ATTR)}
          />
          <MapResizer />
          <MapClickHandler onLocationSelect={handleMapClick} enabled={true} />

          {tempPos && (
            <>
              <MapRecenter position={tempPos} />
              <Marker position={tempPos} icon={markerIcon}>
                <Popup>{tempAddress || 'Selected location'}</Popup>
              </Marker>
            </>
          )}
        </MapContainer>

        {/* My Location Button (Google style — bottom right circle) */}
        <button onClick={handleMyLocation} style={{
          position: 'absolute', bottom: 160, right: 16, width: 48, height: 48,
          borderRadius: '50%', background: 'var(--card-bg)', border: '1px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
        }} title="My Location">
          📍
        </button>

        {/* Layer Toggle */}
        <div
          onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
          style={{
            position: 'absolute', bottom: 160, left: 16, width: 56, height: 56,
            borderRadius: 10, border: '2px solid white', overflow: 'hidden',
            cursor: 'pointer', zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
        >
          <img
            src={mapType === 'roadmap' ? 'https://khms0.google.com/kh/v=977?x=0&y=0&z=0' : 'https://mt1.google.com/vt/lyrs=m&x=0&y=0&z=0'}
            alt="Toggle"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 9, fontWeight: 900, letterSpacing: '0.04em'
          }}>{mapType === 'roadmap' ? 'SAT' : 'MAP'}</div>
        </div>

        {/* ── Bottom Confirm Panel (Uber/Ola style) ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
          background: 'var(--card-bg)', borderRadius: '24px 24px 0 0',
          padding: '24px 20px', paddingBottom: 28,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
          borderTop: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: mode === 'pickup' ? 'rgba(76,175,80,0.1)' : 'rgba(231,76,60,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, border: `1.5px solid ${color}`,
            }}>
              <span style={{ fontSize: 20 }}>{mode === 'pickup' ? '🟢' : '🔴'}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                {mode === 'pickup' ? 'Pickup Location' : 'Drop-off Location'}
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--charcoal)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tempAddress || 'Tap the map to select'}
              </p>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!tempAddress}
            style={{
              width: '100%', padding: '16px', borderRadius: 16, border: 'none',
              background: tempAddress ? color : 'var(--cream-dark)',
              color: tempAddress ? 'white' : 'var(--muted)',
              fontSize: 16, fontWeight: 800, cursor: tempAddress ? 'pointer' : 'default',
              transition: 'all 0.2s', boxShadow: tempAddress ? `0 8px 20px ${color}33` : 'none',
            }}
          >
            {tempAddress ? 'Confirm Location' : 'Tap map to select a point'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main LocationPicker Component
   ───────────────────────────────────────────────────────── */
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
  const [showFullMap, setShowFullMap] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [landmarks, setLandmarks] = useState([]);
  const [geoError, setGeoError] = useState('');
  const searchTimeout = useRef(null);

  const color = mode === 'pickup' ? '#4CAF50' : '#E74C3C';

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

  const handleSearch = (query) => {
    setSearchQuery(query);
    setAddress('');
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
        if (onLocationDetected) onLocationDetected({ lat, lng });
      },
      () => setDetecting(false),
      { enableHighAccuracy: true }
    );
  };

  const handleFullMapSelect = (loc) => {
    setAddress(loc.address);
    setGeoError('');
    if (onChange) {
      onChange({ lat: loc.lat, lng: loc.lng, address: loc.address });
    }
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

      {/* Search + GPS + Map button row */}
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
              zIndex: 1000, maxHeight: 280, overflowY: 'auto', marginTop: 4,
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

                  {/* Open Full Map option */}
                  <div onMouseDown={() => { setShowFullMap(true); setInputFocused(false); }} style={{
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
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>Open full map to drop a pin</span>
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

        {/* Map button — opens fullscreen map */}
        {!hideMapToggle && (
          <button type="button" onClick={() => setShowFullMap(true)} style={{
            padding: '8px 12px', background: 'var(--cream-dark)',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 16,
            color: 'var(--muted)', transition: 'all 0.2s'
          }} title="Open fullscreen map">
            🗺️
          </button>
        )}
      </div>

      {/* Fullscreen Map Modal */}
      {showFullMap && (
        <FullscreenMapModal
          dark={dark}
          value={value}
          onSelect={handleFullMapSelect}
          onClose={() => setShowFullMap(false)}
          mode={mode}
          markerIcon={markerIcon.current}
          address={address}
        />
      )}
    </div>
  );
}
