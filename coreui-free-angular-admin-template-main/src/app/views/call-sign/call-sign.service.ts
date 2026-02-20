import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CallSignData {
  id: number;
  callSign: string;
  licensee: string;
  txFreq: string | null;
  rxFreq: string | null;
  location: string;
  serviceArea: string;
  equipment: string | null;
  serialNumber: string | null;
  source: string;
  issued: string | null;
}

@Injectable({ providedIn: 'root' })
export class CallSignService {
  private dataUrl = 'assets/data/call-sign.json';

  constructor(private http: HttpClient) {}

  getData(): Observable<CallSignData[]> {
    return this.http.get<any[]>(this.dataUrl).pipe(
      map(data => data.map((item, i) => ({
        id: i + 1,
        callSign: item.callSign ?? '',
        licensee: item.licensee ?? '',
        txFreq: item.txFreq ?? null,
        rxFreq: item.rxFreq ?? null,
        location: item.location ?? '',
        serviceArea: item.serviceArea ?? '',
        equipment: item.equipment ?? null,
        serialNumber: item.serialNumber ?? null,
        source: item.source ?? '',
        issued: item.issued ?? null,
      })))
    );
  }
}