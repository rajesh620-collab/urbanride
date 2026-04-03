import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
import {
  DARK_TILES, DARK_ATTR, LIGHT_TILES, LIGHT_ATTR,
  DEFAULT_CENTER, DEFAULT_ZOOM, createMarkerIcon, createCarIcon
} from '../utils/mapStyles';
import api from '../api/axiosInstance';

// Fix leaflet default icon
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

function carIcon() {
  return L.icon({
    iconUrl: createCarIcon(),
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

// Auto-fit bounds
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, duration: 0.8 });
    }
  }, [bounds, map]);
  return null;
}

export default function RouteMap({
  sourceCoords,
  destCoords,
  driverLocation,
  routeGeometry,
  height = 300,
  showRoute = true,
  style = {}
}) {
  const { dark } = useTheme();
  const [route, setRoute] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch route when source/dest change
  useEffect(() => {
    if (!showRoute || !sourceCoords?.lat || !destCoords?.lat) return;

    // Use provided geometry or fetch from API
    if (routeGeometry) {
      setRoute(routeGeometry.coordinates.map(([lng, lat]) => [lat, lng]));
      return;
    }

    const fetchRoute = async () => {
      setLoading(true);
      try {
        const res = await api.get('/maps/route', {
          params: {
            srcLat: sourceCoords.lat, srcLng: sourceCoords.lng,
            dstLat: destCoords.lat, dstLng: destCoords.lng
          }
        });
        const data = res.data.data;
        setRouteInfo(data);
        if (data.geometry?.coordinates) {
          setRoute(data.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
        }
      } catch {
        // Fallback: straight line
        setRoute([
          [sourceCoords.lat, sourceCoords.lng],
          [destCoords.lat, destCoords.lng]
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchRoute();
  }, [sourceCoords?.lat, sourceCoords?.lng, destCoords?.lat, destCoords?.lng, showRoute]);

  // Calculate bounds for markers
  const bounds = [];
  if (sourceCoords?.lat) bounds.push([sourceCoords.lat, sourceCoords.lng]);
  if (destCoords?.lat) bounds.push([destCoords.lat, destCoords.lng]);
  if (driverLocation?.lat) bounds.push([driverLocation.lat, driverLocation.lng]);

  const center = bounds.length > 0 ? bounds[0] : DEFAULT_CENTER;

  return (
    <div style={{
      borderRadius: 'var(--radius-md)', overflow: 'hidden',
      border: '1.5px solid var(--border)', position: 'relative',
      ...style
    }}>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        style={{ height, width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url={dark ? DARK_TILES : LIGHT_TILES}
          attribution={dark ? DARK_ATTR : LIGHT_ATTR}
        />

        {bounds.length >= 2 && <FitBounds bounds={bounds} />}

        {/* Source marker */}
        {sourceCoords?.lat && (
          <Marker position={[sourceCoords.lat, sourceCoords.lng]} icon={makeIcon('#4CAF50')}>
            <Popup><strong>Pickup</strong><br />{sourceCoords.address || 'Start'}</Popup>
          </Marker>
        )}

        {/* Destination marker */}
        {destCoords?.lat && (
          <Marker position={[destCoords.lat, destCoords.lng]} icon={makeIcon('#E74C3C')}>
            <Popup><strong>Drop-off</strong><br />{destCoords.address || 'Destination'}</Popup>
          </Marker>
        )}

        {/* Driver location */}
        {driverLocation?.lat && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={carIcon()}>
            <Popup>🚗 Driver's current location</Popup>
          </Marker>
        )}

        {/* Route polyline with glow effect */}
        {route && (
          <>
            <Polyline
              positions={route}
              pathOptions={{
                color: 'var(--coral)',
                weight: 8,
                opacity: 0.2,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            <Polyline
              positions={route}
              pathOptions={{
                color: 'var(--coral)',
                weight: 4,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
                smoothFactor: 2
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Route info overlay */}
      {routeInfo && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12, right: 12,
          background: dark ? 'rgba(30,30,30,0.92)' : 'rgba(255,255,255,0.95)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: 'var(--shadow-md)', zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Distance
              </span>
              <p style={{ fontWeight: 600, fontSize: 15 }}>{routeInfo.distanceKm} km</p>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ETA
              </span>
              <p style={{ fontWeight: 600, fontSize: 15 }}>{routeInfo.durationMinutes} min</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 1000
        }}>
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}
