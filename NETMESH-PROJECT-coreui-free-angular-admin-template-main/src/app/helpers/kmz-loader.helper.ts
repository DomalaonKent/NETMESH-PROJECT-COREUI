import * as Leaf from 'leaflet';
import JSZip from 'jszip';

export interface KmlLayerConfig {
  name: string;
  url: string;
  color: string;
  enabled: boolean;
}

function parseCoords(text: string): number[][] {
  const coords: number[][] = [];
  const tokens = text.trim().split(/\s+/);
  for (const token of tokens) {
    if (!token) continue;
    const parts = token.split(',');
    const lng = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    if (isFinite(lng) && isFinite(lat)) {
      coords.push([lng, lat]);
    }
  }
  return coords;
}

export function getLayerStyle(kmlName: string, color: string): L.PathOptions {
  switch (kmlName) {
    case 'Country':
      return { color, weight: 3,   opacity: 1,    fillColor: color, fillOpacity: 0    };
    case 'Regions':
      return { color, weight: 2,   opacity: 1,    fillColor: color, fillOpacity: 0    };
    case 'Provinces':
      return { color, weight: 1.5, opacity: 0.85, fillColor: color, fillOpacity: 0.04 };
    case 'Municipalities':
      return { color, weight: 0.8, opacity: 0.7,  fillColor: color, fillOpacity: 0.03 };
    default:
      return { color, weight: 1.5, opacity: 0.8,  fillColor: color, fillOpacity: 0.06 };
  }
}

export async function loadKmzToMap(
  config: KmlLayerConfig,
  map: L.Map
): Promise<L.GeoJSON | null> {
  try {
    const response = await fetch(config.url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${config.url}`);
    const arrayBuffer = await response.arrayBuffer();

    const zip = await JSZip.loadAsync(arrayBuffer);
    const kmlFile = zip.file(/\.kml$/i)[0];
    if (!kmlFile) throw new Error('No .kml found inside KMZ');
    const kmlText = await kmlFile.async('text');

    const domParser = new DOMParser();
    const kmlDom = domParser.parseFromString(kmlText, 'text/xml');

    const style = getLayerStyle(config.name, config.color);

    const leafletLayer = Leaf.geoJSON(undefined, {
      style: () => style,
      onEachFeature: (feature, featureLayer) => {
        const name = feature.properties?.name || '';
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

    const placemarks = Array.from(kmlDom.getElementsByTagName('Placemark'));
    let featureCount = 0;

    for (const pm of placemarks) {
      const nameEl = pm.getElementsByTagName('name')[0]
                  || pm.getElementsByTagName('n')[0];
      let displayName = nameEl?.textContent?.trim() || '';

      if (!displayName || displayName.startsWith('PHL.')) {
        const simpleDatas = Array.from(pm.getElementsByTagName('SimpleData'));
        for (const sd of simpleDatas) {
          const attr = sd.getAttribute('name') || '';
          if (['GID_0', 'NAME_1', 'NAME_2', 'NAME_3'].includes(attr)) {
            const val = sd.textContent?.trim() || '';
            if (val && val !== 'NA' && val !== 'Philippines') {
              displayName = val;
              break;
            }
          }
        }
      }

      const polygonEls = Array.from(pm.getElementsByTagName('Polygon'));
      if (polygonEls.length === 0) continue;

      const multiPolygonCoords: number[][][][] = [];

      for (const polyEl of polygonEls) {
        const rings: number[][][] = [];

        const outer = polyEl.getElementsByTagName('outerBoundaryIs')[0];
        if (outer) {
          const coordEl = outer.getElementsByTagName('coordinates')[0];
          if (coordEl) {
            const ring = parseCoords(coordEl.textContent || '');
            if (ring.length >= 3) rings.push(ring);
          }
        }

        const inners = Array.from(polyEl.getElementsByTagName('innerBoundaryIs'));
        for (const inner of inners) {
          const coordEl = inner.getElementsByTagName('coordinates')[0];
          if (coordEl) {
            const ring = parseCoords(coordEl.textContent || '');
            if (ring.length >= 3) rings.push(ring);
          }
        }

        if (rings.length > 0) multiPolygonCoords.push(rings);
      }

      if (multiPolygonCoords.length === 0) continue;

      const geometry: any = multiPolygonCoords.length === 1
        ? { type: 'Polygon', coordinates: multiPolygonCoords[0] }
        : { type: 'MultiPolygon', coordinates: multiPolygonCoords };

      const feature: any = {
        type: 'Feature',
        properties: { name: displayName },
        geometry
      };

      try {
        leafletLayer.addData(feature);
        featureCount++;
      } catch (e) {
        console.warn('Skipped feature:', displayName, e);
      }
    }

    leafletLayer.addTo(map);
    console.log(`KMZ loaded: ${config.name}`, featureCount, 'features');
    return leafletLayer;

  } catch (err) {
    console.error(`Failed to load KMZ: ${config.url}`, err);
    return null;
  }
}