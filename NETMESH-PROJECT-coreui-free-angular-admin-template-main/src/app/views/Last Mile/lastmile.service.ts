import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface LastMileData {
  id: number;
  province: string;
  cityMunicipality: string;
  barangay: string;
  location: string;
  validationDate: string;
  validationTime: string;
  technology: string;
  serviceProvider: string;
  averageDownloadSpeed: string;
  averageUploadSpeed: string;
  latency: string;
  packetLoss: string;
  jitter: string;
  serviceAvailability: string;
  serviceUptime: string;
  collectedBy: string;
}

@Injectable({ providedIn: 'root' })
export class LastMileService {
  private dataUrl = 'assets/data/lastmile.data.json';

  constructor(private http: HttpClient) {}

  getData(): Observable<LastMileData[]> {
    return this.http.get<any[]>(this.dataUrl).pipe(
      map(data => data.map(item => ({
        id:                   item.ID                   ?? item.id,
        province:             item.Province             ?? item.province,
        cityMunicipality:     item.CityMunicipality     ?? item.cityMunicipality,
        barangay:             item.Barangay             ?? item.barangay,
        location:             item.Location             ?? item.location,
        validationDate:       item.ValidationDate       ?? item.validationDate,
        validationTime:       item.ValidationTime       ?? item.validationTime,
        technology:           item.Technology           ?? item.technology,
        serviceProvider:      item.ServiceProvider      ?? item.serviceProvider,
        averageDownloadSpeed: item.AverageDownloadSpeed ?? item.averageDownloadSpeed ?? null,
        averageUploadSpeed:   item.AverageUploadSpeed   ?? item.averageUploadSpeed   ?? null,
        latency:              item.Latency              ?? item.latency              ?? null,
        packetLoss:           item.PacketLoss           ?? item.packetLoss           ?? null,
        jitter:               item.Jitter               ?? item.jitter               ?? null,
        serviceAvailability:  item.ServiceAvailability  ?? item.serviceAvailability  ?? null,
        serviceUptime:        item.ServiceUptime        ?? item.serviceUptime        ?? null,
        collectedBy:          item.CollectedBy          ?? item.collectedBy          ?? 'Unknown'
      })))
    );
  }
}