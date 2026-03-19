import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
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

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds?.length >= 2) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, duration: 0.8 });
    }
  }, [bounds, map]);
  return null;
}

function RecenterOnDriver({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.panTo(position, { animate: true, duration: 0.5 });
    }
  }, [position, map]);
  return null;
}

export default function DriverNavigation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dark } = useTheme();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverPos, setDriverPos] = useState(null);
  const [route, setRoute] = useState(null);
  const [steps, setSteps] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [followDriver, setFollowDriver] = useState(true);
  const [showSteps, setShowSteps] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const watchIdRef = useRef(null);

  // Load ride data
  useEffect(() => {
    api.get(`/rides/${id}`)
      .then(res => {
        const r = res.data.data?.ride || res.data.ride;
        setRide(r);
      })
      .catch(() => navigate('/my-rides'))
      .finally(() => setLoading(false));
  }, [id]);

  // Get driver's current position
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setDriverPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  // Start watching driver position and broadcasting
  useEffect(() => {
    if (!ride || !navigator.geolocation) return;

    const socket = getSocket();
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        setDriverPos(newPos);

        // Broadcast to passengers
        if (socket) {
          socket.emit('driver_location_update', {
            rideId: id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading || 0,
            speed: pos.coords.speed || 0
          });
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 5000 }
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [ride, id]);

  // Fetch route when driver position and ride are available
  useEffect(() => {
    if (!driverPos || !ride?.sourceCoords?.lat || !ride?.destCoords?.lat) return;

    const fetchRoute = async () => {
      try {
        // Route from driver → pickup → destination
        const res = await api.get('/maps/route', {
          params: {
            srcLat: driverPos[0], srcLng: driverPos[1],
            dstLat: ride.destCoords.lat, dstLng: ride.destCoords.lng
          }
        });
        const data = res.data.data;
        setRouteInfo(data);
        setSteps(data.steps || []);
        if (data.geometry?.coordinates) {
          setRoute(data.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
        }
      } catch {
        // Direct line fallback
        setRoute([driverPos, [ride.destCoords.lat, ride.destCoords.lng]]);
      }
    };
    fetchRoute();
  }, [driverPos?.[0], ride?.destCoords?.lat]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!ride) return null;

  const bounds = [];
  if (driverPos) bounds.push(driverPos);
  if (ride.sourceCoords?.lat) bounds.push([ride.sourceCoords.lat, ride.sourceCoords.lng]);
  if (ride.destCoords?.lat) bounds.push([ride.destCoords.lat, ride.destCoords.lng]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--cream)' }}>

      {/* Top bar */}
      <div style={{
        padding: '12px 20px', background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 100
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 13, display: 'flex',
          alignItems: 'center', gap: 4, padding: 0
        }}>← Back</button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Navigation</p>
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>
            {ride.sourceLandmark} → {ride.destinationLandmark}
          </p>
        </div>
        <button
          onClick={() => setFollowDriver(f => !f)}
          style={{
            padding: '6px 10px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', cursor: 'pointer',
            background: followDriver ? 'var(--coral)' : 'var(--cream-dark)',
            color: followDriver ? 'white' : 'var(--muted)', fontSize: 12
          }}
        >
          {followDriver ? '📍 Following' : '🗺️ Free'}
        </button>
      </div>

      {/* Map — full screen */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={driverPos || DEFAULT_CENTER}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url={dark ? DARK_TILES : LIGHT_TILES}
            attribution={dark ? DARK_ATTR : LIGHT_ATTR}
          />

          {bounds.length >= 2 && <FitBounds bounds={bounds} />}
          {followDriver && driverPos && <RecenterOnDriver position={driverPos} />}

          {/* Driver marker */}
          {driverPos && (
            <Marker position={driverPos} icon={carMarkerIcon()}>
              <Popup>📍 Your location</Popup>
            </Marker>
          )}

          {/* Pickup marker */}
          {ride.sourceCoords?.lat && (
            <Marker position={[ride.sourceCoords.lat, ride.sourceCoords.lng]} icon={makeIcon('#4CAF50')}>
              <Popup><strong>Pickup</strong><br />{ride.sourceLandmark}</Popup>
            </Marker>
          )}

          {/* Destination marker */}
          {ride.destCoords?.lat && (
            <Marker position={[ride.destCoords.lat, ride.destCoords.lng]} icon={makeIcon('#E74C3C')}>
              <Popup><strong>Drop-off</strong><br />{ride.destinationLandmark}</Popup>
            </Marker>
          )}

          {/* Route */}
          {route && (
            <Polyline
              positions={route}
              pathOptions={{
                color: dark ? '#E0926E' : '#CC785C',
                weight: 5, opacity: 0.85,
                lineCap: 'round', lineJoin: 'round'
              }}
            />
          )}
        </MapContainer>

        {/* ETA overlay */}
        {routeInfo && (
          <div style={{
            position: 'absolute', top: 16, left: 16, right: 16,
            background: dark ? 'rgba(30,30,30,0.92)' : 'rgba(255,255,255,0.95)',
            borderRadius: 'var(--radius-md)', padding: '14px 18px',
            boxShadow: 'var(--shadow-lg)', zIndex: 1000,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backdropFilter: 'blur(10px)'
          }}>
            <div>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--coral)' }}>
                {routeInfo.durationMinutes} <span style={{ fontSize: 14, fontWeight: 500 }}>min</span>
              </p>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                {routeInfo.distanceKm} km remaining
              </p>
            </div>
            <button
              onClick={() => setShowSteps(s => !s)}
              style={{
                padding: '8px 16px', background: 'var(--coral)',
                color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}
            >
              {showSteps ? 'Hide Steps' : 'Directions'}
            </button>
          </div>
        )}

        {/* Turn-by-turn directions panel */}
        {showSteps && steps.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: dark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.97)',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            maxHeight: '40%', overflowY: 'auto',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)', zIndex: 1000,
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              padding: '12px 18px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Turn-by-Turn</span>
              <button onClick={() => setShowSteps(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted)', fontSize: 16, padding: 0
              }}>✕</button>
            </div>
            {steps.map((step, i) => (
              <div key={i} style={{
                padding: '12px 18px', borderBottom: '1px solid var(--border)',
                display: 'flex', gap: 12, alignItems: 'flex-start',
                background: i === activeStep ? 'var(--coral-pale)' : 'transparent'
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i === activeStep ? 'var(--coral)' : 'var(--cream-dark)',
                  color: i === activeStep ? 'white' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0
                }}>{i + 1}</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>
                    {step.instruction}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {step.name} · {step.distance}m · {step.duration} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
