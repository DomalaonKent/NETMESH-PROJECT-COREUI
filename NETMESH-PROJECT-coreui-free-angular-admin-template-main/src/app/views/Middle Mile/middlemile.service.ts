import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UpstreamData {
  id: number;
  province: string;
  cityMunicipality: string;
  barangay: string;
  location: string;
  validationDate: string;
  validationTime: string;
  technology: string;
  serviceProvider: string;
  uptime: string;
  packetLoss: string;
  latency: string;
  aggregatedOpticalSignalLoss: string;
  collectedBy: string;
}

@Injectable({ providedIn: 'root' })
export class MiddleMileService {
  private dataUrl = 'assets/data/middlemile.data.json';

  constructor(private http: HttpClient) {}

  getData(): Observable<UpstreamData[]> {
    return this.http.get<any[]>(this.dataUrl).pipe(
      map(data => data.map(item => ({
        id:                          item.ID                          ?? item.id,
        province:                    item.Province                    ?? item.province,
        cityMunicipality:            item.CityMunicipality            ?? item.cityMunicipality,
        barangay:                    item.Barangay                    ?? item.barangay,
        location:                    item.Location                    ?? item.location,
        validationDate:              item.ValidationDate              ?? item.validationDate,
        validationTime:              item.ValidationTime              ?? item.validationTime,
        technology:                  item.Technology                  ?? item.technology,
        serviceProvider:             item.ServiceProvider             ?? item.serviceProvider,
        uptime:                      item.Uptime                      ?? item.uptime                      ?? null,
        packetLoss:                  item.PacketLoss                  ?? item.packetLoss                  ?? null,
        latency:                     item.Latency                     ?? item.latency                     ?? null,
        aggregatedOpticalSignalLoss: item.AggregatedOpticalSignalLoss ?? item.aggregatedOpticalSignalLoss ?? null,
        collectedBy:                 item.CollectedBy                 ?? item.collectedBy                 ?? 'Unknown'
      })))
    );
  }
}