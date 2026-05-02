/**
 * Custom map tile layers and styling for Leaflet maps
 * Premium CARTO tiles with custom urban-dark navigation theme
 */

// Google Maps Roadmap tiles — used for both light and dark modes
export const DARK_TILES = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
export const DARK_ATTR = '&copy; Google Maps';

export const LIGHT_TILES = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
export const LIGHT_ATTR = '&copy; Google Maps';

// Google Maps Satellite tiles
export const SATELLITE_TILES = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
export const SATELLITE_ATTR = '&copy; Google Maps';

// Navigation-specific tiles (Google Maps for consistency)
export const NAV_DARK_TILES = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
export const NAV_LIGHT_TILES = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

// Default center (Hyderabad)
export const DEFAULT_CENTER = [17.385, 78.4867];
export const DEFAULT_ZOOM = 13;

// Color palette
export const markerColors = {
  source:      '#22C55E',
  destination: '#EF4444',
  driver:      '#F97316',
  user:        '#3B82F6',
};

/**
 * Create a custom SVG marker for Leaflet — Premium Google-style Pin
 */
export function createMarkerIcon(color = '#EA4335', size = 32) {
  const filterId = `shadow-${color.replace('#', '')}`;
  const svg = `
    <svg width="${size}" height="${size * 1.5}" viewBox="0 0 32 46" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="${filterId}" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity="0.25"/>
        </filter>
      </defs>
      <!-- Pin shadow -->
      <path d="M16 46c-1 0-1-1-1-1 0-3 1-7 1-7s1 4 1 7c0 0 0 1-1 1z" fill="#000" opacity="0.2"/>
      <!-- Main teardrop -->
      <path d="M16 0C7.16 0 0 7.16 0 16c0 11.5 16 30 16 30s16-18.5 16-30C32 7.16 24.84 0 16 0z" 
        fill="${color}" filter="url(#${filterId})"/>
      <!-- Inner white circle -->
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Create a premium car marker for driver tracking with heading
 */
export function createCarIcon(color = '#F97316', heading = 0) {
  const glowId = `glow-${color.replace('#', '')}`;
  const svg = `
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="${glowId}">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <!-- Outer ring (pulse) -->
      <circle cx="24" cy="24" r="22" fill="${color}" opacity="0.15"/>
      <!-- Inner circle -->
      <circle cx="24" cy="24" r="16" fill="${color}" filter="url(#${glowId})"/>
      <!-- Direction arrow -->
      <g transform="rotate(${heading}, 24, 24)">
        <polygon points="24,10 18,20 24,17 30,20" fill="white" opacity="0.9"/>
      </g>
      <!-- Car icon -->
      <text x="24" y="29" text-anchor="middle" fill="white" font-size="14" font-family="Arial">🚗</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Create a pulsing dot icon (for live broadcast)
 */
export function createPulsingDot(color = '#F97316') {
  const svg = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="${color}" opacity="0.3">
        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="12" cy="12" r="6" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Create a pickup origin dot (like Google Maps blue dot)
 */
export function createPickupIcon(color = '#22C55E') {
  const gradId = `pinGrad-${color.replace('#', '')}`;
  const shadId = `pinShadow-${color.replace('#', '')}`;
  const svg = `
    <svg width="36" height="48" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1"/>
          <stop offset="100%" style="stop-color:${color}99;stop-opacity:1"/>
        </linearGradient>
        <filter id="${shadId}">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.25"/>
        </filter>
      </defs>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z"
        fill="url(#${gradId})" filter="url(#${shadId})"/>
      <circle cx="18" cy="17" r="8" fill="white" opacity="0.95"/>
      <circle cx="18" cy="17" r="4.5" fill="${color}"/>
      <circle cx="18" cy="17" r="2" fill="white"/>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Direction step icons for turn-by-turn
 */
export const DIRECTION_ICONS = {
  'turn-right':    '↱',
  'turn-left':     '↰',
  'straight':      '↑',
  'slight right':  '↗',
  'slight left':   '↖',
  'sharp right':   '↳',
  'sharp left':    '↲',
  'u-turn':        '↩',
  'roundabout':    '↻',
  'arrive':        '🏁',
  'depart':        '📍',
  'default':       '→',
};

export function getDirectionIcon(type, modifier) {
  const key = modifier ? `${modifier} ${type}` : type;
  return DIRECTION_ICONS[key] || DIRECTION_ICONS[modifier] || DIRECTION_ICONS['default'];
}
