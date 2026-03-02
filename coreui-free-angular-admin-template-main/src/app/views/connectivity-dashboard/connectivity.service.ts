import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ConnectivityData {
  id: number;
  province: string;
  cityMunicipality: string;
  barangay: string;
  location: string;
  validationDate: string;
  validationTime: string;
  technology: string;
  serviceProvider: string;
  upload: number;
  download: number;
  signalStrength: string;
  uploadDataSize: number;
  downloadDataSize: number;
  collectedBy: string; 
}

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private dataUrl = 'assets/data/validation.data.json';
  constructor(private http: HttpClient) {}

  getData(): Observable<ConnectivityData[]> {
    return this.http.get<any[]>(this.dataUrl).pipe(
      map(data => data.map(item => ({
        id: item.ID ?? item.id,
        province: item.Province ?? item.province,
        cityMunicipality: item.CityMunicipality ?? item.cityMunicipality,
        barangay: item.Barangay ?? item.barangay,
        location: item.Location ?? item.location,
        validationDate: item.ValidationDate ?? item.validationDate,
        validationTime: item.ValidationTime ?? item.validationTime,
        technology: item.Technology ?? item.technology,
        serviceProvider: item.ServiceProvider ?? item.serviceProvider,
        upload: item.Upload ?? item.upload,
        download: item.Download ?? item.download,
        signalStrength: item.SignalStrength ?? item.signalStrength ?? null,
        uploadDataSize: item.UploadDataSize ?? item.uploadDataSize ?? null,
        downloadDataSize: item.DownloadDataSize ?? item.downloadDataSize ?? null,
        collectedBy: item.CollectedBy ?? item.collectedBy ?? 'Unknown' 
      })))
    );
  }
}