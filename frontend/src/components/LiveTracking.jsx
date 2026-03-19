import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
import { getSocket } from '../hooks/useWebSocket';
import {
  DARK_TILES, DARK_ATTR, LIGHT_TILES, LIGHT_ATTR,
  DEFAULT_CENTER, createMarkerIcon, createCarIcon
} from '../utils/mapStyles';

function makeIcon(color, size = 32) {
  return L.icon({
    iconUrl: createMarkerIcon(color, size),
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size + 12],
    popupAnchor: [0, -(size + 8)],
  });
}

function carMarkerIcon() {
  return L.icon({
    iconUrl: createCarIcon(),
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

// Smoothly animate marker position
function AnimatedMarker({ position }) {
  const map = useMap();
  const markerRef = useRef(null);
  const prevPos = useRef(position);

  useEffect(() => {
    if (markerRef.current && prevPos.current) {
      const marker = markerRef.current;
      const start = prevPos.current;
      const end = position;
      const duration = 2000; // 2 second animation
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out

        const lat = start[0] + (end[0] - start[0]) * eased;
        const lng = start[1] + (end[1] - start[1]) * eased;
        marker.setLatLng([lat, lng]);

        if (t < 1) requestAnimationFrame(animate);
      };
      animate();
    }
    prevPos.current = position;
  }, [position]);

  return (
    <Marker ref={markerRef} position={position} icon={carMarkerIcon()}>
      <Popup>🚗 Driver's current location</Popup>
    </Marker>
  );
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, []);
  return null;
}

export default function LiveTracking({
  rideId,
  sourceCoords,
  destCoords,
  sourceName,
  destName,
  routeCoords,
  isDriver = false,
  height = 400
}) {
  const { dark } = useTheme();
  const [driverPos, setDriverPos] = useState(null);
  const [eta, setEta] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const watchIdRef = useRef(null);

  // Listen for driver location updates (passenger side)
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !rideId) return;

    socket.emit('track_ride', { rideId });

    socket.on('driver_location_update', (data) => {
      if (data.rideId === rideId) {
        setDriverPos([data.lat, data.lng]);
        setSpeed(Math.round((data.speed || 0) * 3.6)); // m/s → km/h
        setLastUpdate(new Date(data.updatedAt));

        // Simple ETA calc based on remaining distance to destination
        if (destCoords?.lat) {
          const R = 6371000;
          const dLat = (destCoords.lat - data.lat) * Math.PI / 180;
          const dLng = (destCoords.lng - data.lng) * Math.PI / 180;
          const a = Math.sin(dLat/2)**2 +
            Math.cos(data.lat * Math.PI/180) * Math.cos(destCoords.lat * Math.PI/180) *
            Math.sin(dLng/2)**2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const avgSpeed = 417; // ~25 km/h city speed in m/min
          setEta(Math.max(1, Math.ceil(dist / avgSpeed)));
        }
      }
    });

    return () => {
      socket.off('driver_location_update');
    };
  }, [rideId, destCoords?.lat]);

  // If driver, broadcast location
  useEffect(() => {
    if (!isDriver || !rideId) return;

    const socket = getSocket();
    if (!socket) return;

    const sendLocation = (pos) => {
      const data = {
        rideId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        heading: pos.coords.heading || 0,
        speed: pos.coords.speed || 0
      };
      socket.emit('driver_location_update', data);
      setDriverPos([data.lat, data.lng]);
    };

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        sendLocation,
        () => {},
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 5000 }
      );
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isDriver, rideId]);

  const bounds = [];
  if (sourceCoords?.lat) bounds.push([sourceCoords.lat, sourceCoords.lng]);
  if (destCoords?.lat) bounds.push([destCoords.lat, destCoords.lng]);
  if (driverPos) bounds.push(driverPos);

  const center = driverPos || (sourceCoords?.lat ? [sourceCoords.lat, sourceCoords.lng] : DEFAULT_CENTER);

  return (
    <div style={{
      borderRadius: 'var(--radius-md)', overflow: 'hidden',
      border: '1.5px solid var(--border)', position: 'relative'
    }}>
      {/* Status bar */}
      <div style={{
        padding: '10px 16px',
        background: driverPos ? 'var(--coral)' : 'var(--cream-dark)',
        color: driverPos ? 'white' : 'var(--muted)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 13, fontWeight: 500
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {driverPos ? (
            <>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#4CAF50', display: 'inline-block',
                animation: 'pulse 2s infinite'
              }} />
              {isDriver ? 'Broadcasting location' : 'Tracking live'}
            </>
          ) : (
            <>⏳ Waiting for driver location...</>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          {eta && <span>🕐 ETA: {eta} min</span>}
          {speed > 0 && <span>🚗 {speed} km/h</span>}
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={14}
        style={{ height, width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url={dark ? DARK_TILES : LIGHT_TILES}
          attribution={dark ? DARK_ATTR : LIGHT_ATTR}
        />

        {bounds.length >= 2 && <FitBounds bounds={bounds} />}

        {/* Source */}
        {sourceCoords?.lat && (
          <Marker position={[sourceCoords.lat, sourceCoords.lng]} icon={makeIcon('#4CAF50')}>
            <Popup><strong>Pickup</strong><br />{sourceName || 'Start'}</Popup>
          </Marker>
        )}

        {/* Destination */}
        {destCoords?.lat && (
          <Marker position={[destCoords.lat, destCoords.lng]} icon={makeIcon('#E74C3C')}>
            <Popup><strong>Drop-off</strong><br />{destName || 'Destination'}</Popup>
          </Marker>
        )}

        {/* Driver (animated) */}
        {driverPos && <AnimatedMarker position={driverPos} />}

        {/* Route line */}
        {routeCoords && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: dark ? '#E0926E' : '#CC785C',
              weight: 4, opacity: 0.7,
              lineCap: 'round', lineJoin: 'round'
            }}
          />
        )}
      </MapContainer>

      {/* Last updated */}
      {lastUpdate && (
        <div style={{
          padding: '4px 12px', background: 'var(--card-bg)',
          borderTop: '1px solid var(--border)',
          fontSize: 10, color: 'var(--muted)', textAlign: 'center'
        }}>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(76,175,80,0.5); }
          70% { box-shadow: 0 0 0 6px rgba(76,175,80,0); }
          100% { box-shadow: 0 0 0 0 rgba(76,175,80,0); }
        }
      `}</style>
    </div>
  );
}
