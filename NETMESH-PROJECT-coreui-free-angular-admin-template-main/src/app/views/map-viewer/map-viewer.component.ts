import {
  Component, OnDestroy, AfterViewInit,
  Input, ElementRef, ViewChild, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

declare const omnivore: any;

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
  private layerMap = new Map<string, any>();
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

    const order = ['Regions', 'Provinces', 'Municipalities'];
    const sorted = [...this.kmlLayers].sort(
      (a, b) => order.indexOf(a.name) - order.indexOf(b.name)
    );

    for (const kml of sorted) {
      if (kml.enabled) this.loadKmlLayer(kml);
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
      this.loadKmlLayer(kml);
    }
  }

  private getLayerStyle(kmlName: string, color: string): L.PathOptions {
    switch (kmlName) {
      case 'Regions':
        return { color, weight: 3,   opacity: 1,    fillColor: color, fillOpacity: 0    };
      case 'Provinces':
        return { color, weight: 1.5, opacity: 0.85, fillColor: color, fillOpacity: 0.04 };
      case 'Municipalities':
        return { color, weight: 0.8, opacity: 0.7,  fillColor: color, fillOpacity: 0.03 };
      default:
        return { color, weight: 1.5, opacity: 0.8,  fillColor: color, fillOpacity: 0.06 };
    }
  }

  private loadKmlLayer(kml: KmlLayerConfig): void {
    if (typeof omnivore === 'undefined') {
      console.warn('leaflet-omnivore not loaded!');
      return;
    }

    this.isLoading = true;
    const color = kml.color;
    const style = this.getLayerStyle(kml.name, color);

    const customLayer = L.geoJson(undefined, {
      style: () => style,
      onEachFeature: (feature: any, featureLayer: L.Layer) => {
        const name = feature.properties?.name
          || feature.properties?.NAME_1
          || feature.properties?.NAME_2
          || feature.properties?.NAME_3
          || feature.properties?.NAME_4
          || '';
        if (name) {
          (featureLayer as any).bindPopup(`
            <div style="font-family:sans-serif;padding:6px 4px;min-width:120px">
              <strong style="color:#0f172a;font-size:13px">${name}</strong>
              <div style="font-size:11px;color:#475569;margin-top:3px;padding-top:3px;border-top:1px solid #e2e8f0">${kml.name}</div>
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
      console.log(`KML loaded: ${kml.name}`, layer.getLayers().length, 'features');
      this.layerMap.set(kml.name, layer);
      this.isLoading = false;
    });

    layer.on('error', (e: any) => {
      console.error(`Failed to load KML: ${kml.url}`, e);
      this.isLoading = false;
    });

    layer.addTo(this.map);
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }
}