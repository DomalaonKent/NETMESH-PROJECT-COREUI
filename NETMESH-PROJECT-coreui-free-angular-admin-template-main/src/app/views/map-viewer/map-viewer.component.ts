import {
  Component, OnDestroy, AfterViewInit,
  Input, ElementRef, ViewChild, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import JSZip from 'jszip';

export interface KmlLayerConfig {
  name: string;
  url: string;
  color: string;
  enabled: boolean;
}

@Component({
  selector: 'app-map-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-viewer.component.html',
  styleUrls: ['./map-viewer.component.scss']
})
export class MapViewerComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  @Input() kmlLayers: KmlLayerConfig[] = [];
  @Input() center: [number, number] = [12.8797, 121.7740];
  @Input() zoom: number = 6;

  private map!: L.Map;
  private layerMap = new Map<string, L.Layer>();
  private pendingFlyTo: { center: [number, number]; zoom: number } | null = null;
  isLoading = false;

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['kmlLayers'] && this.map) {
      this.reloadAllLayers();
    }
  }

  flyTo(center: [number, number], zoom: number): void {
    if (this.map) {
      this.map.flyTo(center, zoom, { duration: 1.2 });
    } else {
      this.pendingFlyTo = { center, zoom };
    }
  }

  private initMap(): void {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    this.map = L.map(this.mapContainer.nativeElement, {
      center: this.center,
      zoom: this.zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    this.reloadAllLayers();
    setTimeout(() => this.map.invalidateSize(), 200);

    if (this.pendingFlyTo) {
      const { center, zoom } = this.pendingFlyTo;
      this.pendingFlyTo = null;
      setTimeout(() => this.map.flyTo(center, zoom, { duration: 1.2 }), 300);
    }
  }

  private reloadAllLayers(): void {
    if (!this.map) return;
    this.layerMap.forEach(layer => this.map.removeLayer(layer));
    this.layerMap.clear();

    const order = ['Country', 'Regions', 'Provinces', 'Municipalities'];
    const sorted = [...this.kmlLayers].sort(
      (a, b) => order.indexOf(a.name) - order.indexOf(b.name)
    );

    for (const kml of sorted) {
      if (kml.enabled) this.loadLayer(kml);
    }
  }

  toggleLayer(kml: KmlLayerConfig): void {
    if (!this.map) return;
    if (!kml.enabled) {
      const existing = this.layerMap.get(kml.name);
      if (existing) {
        this.map.removeLayer(existing);
        this.layerMap.delete(kml.name);
      }
    } else {
      this.loadLayer(kml);
    }
  }

  private loadLayer(kml: KmlLayerConfig): void {
    const isKmz = kml.url.toLowerCase().endsWith('.kmz');
    if (isKmz) {
      this.loadKmzLayer(kml);
    } else {
      this.loadKmlLayer(kml);
    }
  }

  private parseCoords(text: string): number[][] {
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

  private async loadKmzLayer(config: KmlLayerConfig): Promise<void> {
    this.isLoading = true;
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

      const style = this.getLayerStyle(config.name, config.color);
      const leafletLayer = L.geoJSON(undefined, {
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
            if (attr === 'GID_0' || attr === 'NAME_1' || attr === 'NAME_2' || attr === 'NAME_3') {
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
              const ring = this.parseCoords(coordEl.textContent || '');
              if (ring.length >= 3) rings.push(ring);
            }
          }

          const inners = Array.from(polyEl.getElementsByTagName('innerBoundaryIs'));
          for (const inner of inners) {
            const coordEl = inner.getElementsByTagName('coordinates')[0];
            if (coordEl) {
              const ring = this.parseCoords(coordEl.textContent || '');
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

      leafletLayer.addTo(this.map);
      this.layerMap.set(config.name, leafletLayer);
      console.log(`KMZ loaded: ${config.name}`, featureCount, 'features');

    } catch (err) {
      console.error(`Failed to load KMZ: ${config.url}`, err);
    } finally {
      this.isLoading = false;
    }
  }

  private loadKmlLayer(kml: KmlLayerConfig): void {
    const omnivore = (window as any)['omnivore'];
    if (!omnivore) {
      console.warn('leaflet-omnivore not loaded!');
      return;
    }

    this.isLoading = true;
    const style = this.getLayerStyle(kml.name, kml.color);

    const customLayer = L.geoJson(undefined, {
      style: () => style,
      onEachFeature: (feature: any, featureLayer: L.Layer) => {
        const name = feature.properties?.name
          || feature.properties?.NAME_1
          || feature.properties?.NAME_2
          || feature.properties?.NAME_3
          || '';
        if (name) {
          (featureLayer as any).bindPopup(`
            <div style="font-family:sans-serif;padding:6px 4px;min-width:120px">
              <strong style="color:#0f172a;font-size:13px">${name}</strong>
              <div style="font-size:11px;color:#475569;margin-top:3px;padding-top:3px;
                   border-top:1px solid #e2e8f0">${kml.name}</div>
            </div>
          `);
          (featureLayer as any).on('mouseover', function (this: any) {
            this.setStyle({ weight: (style.weight ?? 1) + 1.5, fillOpacity: 0.15 });
          });
          (featureLayer as any).on('mouseout', function (this: any) {
            this.setStyle(style);
          });
        }
      }
    });

    const layer = omnivore.kml(kml.url, null, customLayer);
    layer.on('ready', () => {
      this.layerMap.set(kml.name, layer);
      this.isLoading = false;
    });
    layer.on('error', (e: any) => {
      console.error(`Failed to load KML: ${kml.url}`, e);
      this.isLoading = false;
    });
    layer.addTo(this.map);
  }

  private getLayerStyle(kmlName: string, color: string): L.PathOptions {
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

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }
}