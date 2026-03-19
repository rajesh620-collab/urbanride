import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
import {
  DARK_TILES, DARK_ATTR, LIGHT_TILES, LIGHT_ATTR,
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

function makeIcon(color, size = 32) {
  return L.icon({
    iconUrl: createMarkerIcon(color, size),
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size + 12],
    popupAnchor: [0, -(size + 8)],
  });
}

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

export default function LocationPicker({ value, onChange, label = 'Select Location', mode = 'pickup' }) {
  const { dark } = useTheme();
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const searchTimeout = useRef(null);

  const color = mode === 'pickup' ? '#4CAF50' : '#E74C3C';

  // Reverse geocode when value changes
  useEffect(() => {
    if (value?.lat && value?.lng) {
      reverseGeocode(value.lat, value.lng);
    }
  }, [value?.lat, value?.lng]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await api.get('/maps/reverse-geocode', { params: { lat, lng } });
      const data = res.data.data;
      setAddress(data.shortAddress || data.displayName);
      if (onChange) {
        onChange({ lat, lng, address: data.shortAddress, fullAddress: data.displayName });
      }
    } catch {
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const handleMapClick = useCallback(({ lat, lng }) => {
    reverseGeocode(lat, lng);
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
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
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        reverseGeocode(lat, lng);
        setDetecting(false);
        setShowMap(true);
      },
      () => setDetecting(false),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--muted)', marginBottom: 6
      }}>{label}</label>

      {/* Search + GPS row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder={address || 'Search a location or drop a pin...'}
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => setShowMap(true)}
            style={{
              width: '100%', padding: '11px 14px',
              border: `1.5px solid ${value?.lat ? color : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', fontSize: 14,
              color: 'var(--charcoal)', background: 'var(--input-bg)',
              outline: 'none', transition: 'border-color 0.2s'
            }}
          />
          {address && !searchQuery && (
            <div style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 14, color: 'var(--charcoal)', pointerEvents: 'none',
              maxWidth: 'calc(100% - 28px)', overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              📍 {address}
            </div>
          )}

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
              zIndex: 1000, maxHeight: 200, overflowY: 'auto'
            }}>
              {searchResults.map((r, i) => (
                <div key={i} onClick={() => selectResult(r)} style={{
                  padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontWeight: 500 }}>{r.shortName}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {r.displayName}
                  </span>
                </div>
              ))}
            </div>
          )}
          {searching && (
            <div style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)'
            }}>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            </div>
          )}
        </div>

        <button type="button" onClick={detectMyLocation} disabled={detecting} style={{
          padding: '8px 12px', background: 'var(--coral-pale)',
          border: `1.5px solid var(--coral)`, borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', fontSize: 16, whiteSpace: 'nowrap', color: 'var(--coral)',
          opacity: detecting ? 0.6 : 1, transition: 'opacity 0.2s'
        }} title="Use my location">
          {detecting ? '⏳' : '📍'}
        </button>

        <button type="button" onClick={() => setShowMap(s => !s)} style={{
          padding: '8px 12px', background: showMap ? 'var(--coral)' : 'var(--cream-dark)',
          border: `1.5px solid ${showMap ? 'var(--coral)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 16,
          color: showMap ? 'white' : 'var(--muted)', transition: 'all 0.2s'
        }} title="Toggle map">
          🗺️
        </button>
      </div>

      {/* Map */}
      {showMap && (
        <div style={{
          marginTop: 10, borderRadius: 'var(--radius-md)', overflow: 'hidden',
          border: '1.5px solid var(--border)', height: 250,
          transition: 'all 0.3s ease'
        }}>
          <MapContainer
            center={value?.lat ? [value.lat, value.lng] : DEFAULT_CENTER}
            zoom={value?.lat ? 15 : DEFAULT_ZOOM}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url={dark ? DARK_TILES : LIGHT_TILES}
              attribution={dark ? DARK_ATTR : LIGHT_ATTR}
            />
            <MapClickHandler onLocationSelect={handleMapClick} enabled={true} />
            {value?.lat && (
              <>
                <MapRecenter position={[value.lat, value.lng]} />
                <Marker position={[value.lat, value.lng]} icon={makeIcon(color)}>
                  <Popup>{address || 'Selected location'}</Popup>
                </Marker>
              </>
            )}
          </MapContainer>
          <div style={{
            padding: '6px 12px', background: 'var(--card-bg)',
            borderTop: '1px solid var(--border)', fontSize: 11,
            color: 'var(--muted)', textAlign: 'center'
          }}>
            Click on the map to drop a pin
          </div>
        </div>
      )}
    </div>
  );
}
