/**
 * Custom map tile layers and styling for Leaflet maps
 * Premium CARTO tiles with custom urban-dark navigation theme
 */

// Navigation-optimized dark tiles (great for driver mode)
export const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const DARK_ATTR = '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org/copyright">OSM</a>';

// Premium light tiles (clean, modern Voyager style like a refined Google Maps)
export const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
export const LIGHT_ATTR = '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org/copyright">OSM</a>';

// Navigation-specific dark tiles (deeper contrast for driving)
export const NAV_DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
export const NAV_LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';

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
 * Create a custom SVG marker for Leaflet — premium pin design
 */
export function createMarkerIcon(color = '#F97316', size = 32) {
  const svg = `
    <svg width="${size}" height="${size + 14}" viewBox="0 0 32 46" xmlns="http://www.w3.org/2000/svg">
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${color}" flood-opacity="0.4"/>
      </filter>
      <path d="M16 0C7.16 0 0 7.16 0 16c0 10 16 30 16 30S32 26 32 16C32 7.16 24.84 0 16 0z"
        fill="${color}" filter="url(#shadow)"/>
      <circle cx="16" cy="15" r="7" fill="white" opacity="0.95"/>
      <circle cx="16" cy="15" r="4" fill="${color}" opacity="0.7"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Create a premium car marker for driver tracking with heading
 */
export function createCarIcon(color = '#F97316', heading = 0) {
  const svg = `
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <!-- Outer ring (pulse) -->
      <circle cx="24" cy="24" r="22" fill="${color}" opacity="0.15"/>
      <!-- Inner circle -->
      <circle cx="24" cy="24" r="16" fill="${color}" filter="url(#glow)"/>
      <!-- Direction arrow -->
      <g transform="rotate(${heading}, 24, 24)">
        <polygon points="24,10 18,20 24,17 30,20" fill="white" opacity="0.9"/>
      </g>
      <!-- Car icon -->
      <text x="24" y="29" text-anchor="middle" fill="white" font-size="14" font-family="Arial">🚗</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
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
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Create a pickup origin dot (like Google Maps blue dot)
 */
export function createPickupIcon(color = '#22C55E') {
  const svg = `
    <svg width="36" height="48" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1"/>
          <stop offset="100%" style="stop-color:${color}99;stop-opacity:1"/>
        </linearGradient>
        <filter id="pinShadow">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.25"/>
        </filter>
      </defs>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z"
        fill="url(#pinGrad)" filter="url(#pinShadow)"/>
      <circle cx="18" cy="17" r="8" fill="white" opacity="0.95"/>
      <circle cx="18" cy="17" r="4.5" fill="${color}"/>
      <circle cx="18" cy="17" r="2" fill="white"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
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
