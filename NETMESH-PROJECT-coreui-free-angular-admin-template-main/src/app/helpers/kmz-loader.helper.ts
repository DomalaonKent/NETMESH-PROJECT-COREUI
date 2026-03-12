import * as Leaf from 'leaflet';
import JSZip from 'jszip';

export interface KmlLayerConfig {
  name: string;
  url: string;
  color: string;
  enabled: boolean;
}

const featureStore = new Map<string, Array<{ name: string; geometry: any }>>();

export function clearFeatureStore(layerName: string): void {
  featureStore.delete(layerName);
}

(window as any)['debugFeatureStore'] = (layerName?: string) => {
  if (layerName) {
    console.table(featureStore.get(layerName)?.map(f => ({ name: f.name })));
  } else {
    featureStore.forEach((v, k) => console.log(`[${k}]`, v.map(f => f.name)));
  }
};

const REGION_KMZ_NAME: Record<string, string[]> = {
  'NCR - Metro Manila':              ['Metropolitan Manila', 'Metro Manila', 'NCR'],
  'CAR - Cordillera':                ['Cordillera', 'CAR', 'Cordillera Administrative Region'],
  'Region I - Ilocos Region':        ['Ilocos Region', 'Region I', 'Ilocos'],
  'Region II - Cagayan Valley':      ['Cagayan Valley', 'Region II'],
  'Region III - Central Luzon':      ['Central Luzon', 'Region III'],
  'Region IV-A - CALABARZON':        ['CALABARZON', 'Region IV-A', 'Calabarzon'],
  'Region IV-B - MIMAROPA':          ['MIMAROPA', 'Region IV-B', 'Mimaropa'],
  'Region V - Bicol Region':         ['Bicol Region', 'Region V', 'Bicol'],
  'Region VI - Western Visayas':     ['Western Visayas', 'Region VI'],
  'Region VII - Central Visayas':    ['Central Visayas', 'Region VII'],
  'Region VIII - Eastern Visayas':   ['Eastern Visayas', 'Region VIII'],
  'Region IX - Zamboanga Peninsula': ['Zamboanga Peninsula', 'Region IX'],
  'Region X - Northern Mindanao':    ['Northern Mindanao', 'Region X'],
  'Region XI - Davao Region':        ['Davao Region', 'Region XI', 'Davao'],
  'Region XII - SOCCSKSARGEN':       ['SOCCSKSARGEN', 'Region XII'],
  'Region XIII - Caraga':            ['Caraga', 'Region XIII'],
  'BARMM':                           ['BARMM', 'Bangsamoro'],
};

function collectCoords(coords: any): number[][] {
  if (!Array.isArray(coords)) return [];
  if (typeof coords[0] === 'number') return [coords as number[]];
  return (coords as any[]).flatMap(collectCoords);
}

function boundsFrom(points: number[][]): L.LatLngBounds | null {
  if (!points.length) return null;
  let minLat =  Infinity, maxLat = -Infinity;
  let minLng =  Infinity, maxLng = -Infinity;
  for (const [lng, lat] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return Leaf.latLngBounds([minLat, minLng], [maxLat, maxLng]);
}

function getBoundsForGeometry(geometry: any): L.LatLngBounds | null {
  const points = collectCoords(geometry?.coordinates);
  const bounds = boundsFrom(points);
  return bounds?.isValid() ? bounds : null;
}

function findFeature(
  layerName: string,
  candidates: string[]
): { name: string; geometry: any } | null {
  const features = featureStore.get(layerName);
  if (!features?.length) return null;

  const lowerCandidates = candidates.map(c => c.trim().toLowerCase());

  for (const feat of features) {
    const fn = feat.name.trim().toLowerCase();
    if (lowerCandidates.some(c => c === fn)) return feat;
  }

  for (const feat of features) {
    const fn = feat.name.trim().toLowerCase();
    if (lowerCandidates.some(c => fn.startsWith(c) || c.startsWith(fn))) return feat;
  }

  return null;
}

export function flyToRegion(map: L.Map, regionKey: string): void {
  const candidates = REGION_KMZ_NAME[regionKey];
  if (!candidates) {
    console.warn(`[flyToRegion] unknown region key: "${regionKey}"`);
    return;
  }

  console.log(`[flyToRegion] searching "${regionKey}" → candidates:`, candidates);

  const feat = findFeature('Regions', candidates);
  if (feat) {
    const bounds = getBoundsForGeometry(feat.geometry);
    if (bounds) { map.flyToBounds(bounds, { padding: [30, 30], duration: 1.2 }); return; }
  }

  console.warn(`[flyToRegion] not found. Stored Regions:`,
    featureStore.get('Regions')?.map(f => f.name));
}

export function flyToProvince(map: L.Map, provinceName: string): void {
  console.log(`[flyToProvince] searching "${provinceName}"`);

  const feat = findFeature('Provinces', [provinceName]);
  if (feat) {
    const bounds = getBoundsForGeometry(feat.geometry);
    if (bounds) { map.flyToBounds(bounds, { padding: [30, 30], duration: 1.2 }); return; }
  }

  console.warn(`[flyToProvince] "${provinceName}" not found. Stored Provinces:`,
    featureStore.get('Provinces')?.map(f => f.name));
}

export function flyToCity(
  map: L.Map,
  cityName: string,
  fallbackProvince?: string
): void {
  console.log(`[flyToCity] searching "${cityName}"`);

  const feat = findFeature('Municipalities', [cityName,
    cityName.replace(/\s+city$/i, '').trim(),
    cityName.replace(/\s+municipality$/i, '').trim(),
  ]);
  if (feat) {
    const bounds = getBoundsForGeometry(feat.geometry);
    if (bounds) { map.flyToBounds(bounds, { padding: [20, 20], duration: 1.2 }); return; }
  }

  if (fallbackProvince) {
    console.log(`[flyToCity] Municipalities layer not loaded, falling back to province "${fallbackProvince}"`);
    flyToProvince(map, fallbackProvince);
    return;
  }

  console.warn(`[flyToCity] "${cityName}" not found and no fallback province.`);
}

export function flyToFeature(
  map: L.Map,
  searchName: string,
  type: 'region' | 'province' | 'city' = 'province',
  fallbackProvince?: string
): void {
  if (!searchName) {
    map.flyTo([12.8797, 121.7740], 6, { duration: 1.2 });
    return;
  }
  switch (type) {
    case 'region':   flyToRegion(map, searchName); break;
    case 'province': flyToProvince(map, searchName); break;
    case 'city':     flyToCity(map, searchName, fallbackProvince); break;
  }
}

export function getLayerStyle(kmlName: string, color: string): L.PathOptions {
  switch (kmlName) {
    case 'Country':        return { color, weight: 3,   opacity: 1,    fillColor: color, fillOpacity: 0    };
    case 'Regions':        return { color, weight: 2,   opacity: 1,    fillColor: color, fillOpacity: 0    };
    case 'Provinces':      return { color, weight: 1.5, opacity: 0.85, fillColor: color, fillOpacity: 0.04 };
    case 'Municipalities': return { color, weight: 0.8, opacity: 0.7,  fillColor: color, fillOpacity: 0.03 };
    default:               return { color, weight: 1.5, opacity: 0.8,  fillColor: color, fillOpacity: 0.06 };
  }
}

function parseCoords(text: string): number[][] {
  const coords: number[][] = [];
  for (const token of text.trim().split(/\s+/)) {
    const parts = token.split(',');
    const lng = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    if (isFinite(lng) && isFinite(lat)) coords.push([lng, lat]);
  }
  return coords;
}

export async function loadKmzToMap(
  config: KmlLayerConfig,
  map: L.Map
): Promise<L.GeoJSON | null> {
  try {
    const response = await fetch(config.url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${config.url}`);
    const arrayBuffer = await response.arrayBuffer();

    const zip     = await JSZip.loadAsync(arrayBuffer);
    const kmlFile = zip.file(/\.kml$/i)[0];
    if (!kmlFile) throw new Error('No .kml found inside KMZ');
    const kmlText = await kmlFile.async('text');
    const kmlDom  = new DOMParser().parseFromString(kmlText, 'text/xml');
    const style   = getLayerStyle(config.name, config.color);

    const leafletLayer = Leaf.geoJSON(undefined, {
      style: () => style,
      onEachFeature: (feature, featureLayer) => {
        const name = feature.properties?.['name'] || '';
        if (name) {
          (featureLayer as any).bindPopup(`
            <div style="font-family:sans-serif;padding:6px 4px;min-width:120px">
              <strong style="color:#0f172a;font-size:13px">${name}</strong>
              <div style="font-size:11px;color:#475569;margin-top:3px;padding-top:3px;
                   border-top:1px solid #e2e8f0">${config.name}</div>
            </div>
          `);
        }
        (featureLayer as any).on('mouseover', function (this: any) {
          if (typeof this.setStyle === 'function')
            this.setStyle({ weight: (style.weight ?? 1) + 1.5, fillOpacity: 0.2 });
        });
        (featureLayer as any).on('mouseout', function (this: any) {
          if (typeof this.setStyle === 'function') this.setStyle(style);
        });
      }
    });

    const placemarks     = Array.from(kmlDom.getElementsByTagName('Placemark'));
    const storedFeatures: Array<{ name: string; geometry: any }> = [];
    let   featureCount   = 0;

    for (const pm of placemarks) {
      const nameEl    = pm.getElementsByTagName('name')[0] || pm.getElementsByTagName('n')[0];
      let displayName = nameEl?.textContent?.trim() || '';

      if (!displayName || displayName.startsWith('PHL.')) {
        for (const sd of Array.from(pm.getElementsByTagName('SimpleData'))) {
          const attr = sd.getAttribute('name') || '';
          if (['GID_0','NAME_1','NAME_2','NAME_3'].includes(attr)) {
            const val = sd.textContent?.trim() || '';
            if (val && val !== 'NA' && val !== 'Philippines') { displayName = val; break; }
          }
        }
      }

      const polygonEls = Array.from(pm.getElementsByTagName('Polygon'));
      if (!polygonEls.length) continue;

      const multiPolygonCoords: number[][][][] = [];

      for (const polyEl of polygonEls) {
        const rings: number[][][] = [];

        const outer = polyEl.getElementsByTagName('outerBoundaryIs')[0];
        if (outer) {
          const ring = parseCoords(outer.getElementsByTagName('coordinates')[0]?.textContent || '');
          if (ring.length >= 3) rings.push(ring);
        }
        for (const inner of Array.from(polyEl.getElementsByTagName('innerBoundaryIs'))) {
          const ring = parseCoords(inner.getElementsByTagName('coordinates')[0]?.textContent || '');
          if (ring.length >= 3) rings.push(ring);
        }
        if (rings.length) multiPolygonCoords.push(rings);
      }

      if (!multiPolygonCoords.length) continue;

      const geometry: any = multiPolygonCoords.length === 1
        ? { type: 'Polygon',      coordinates: multiPolygonCoords[0] }
        : { type: 'MultiPolygon', coordinates: multiPolygonCoords };

      const feature: any = { type: 'Feature', properties: { name: displayName }, geometry };

      try {
        leafletLayer.addData(feature);
        storedFeatures.push({ name: displayName, geometry });
        featureCount++;
      } catch (e) {
        console.warn('Skipped feature:', displayName, e);
      }
    }

    const existing = featureStore.get(config.name) ?? [];
    featureStore.set(config.name, [...existing, ...storedFeatures]);

    leafletLayer.addTo(map);
    console.log(`KMZ loaded: ${config.name}`, featureCount, 'features. First 5:',
      storedFeatures.slice(0, 5).map(f => f.name));
    return leafletLayer;

  } catch (err) {
    console.error(`Failed to load KMZ: ${config.url}`, err);
    return null;
  }
}