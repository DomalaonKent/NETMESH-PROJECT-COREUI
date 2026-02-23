import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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

  constructor(private http: HttpClient) {}

  getDataByType(type: string): Observable<CallSignData[]> {
    const url = `assets/data/call-sign-${type}.json`;
    const fallbackUrl = `assets/data/call-sign.json`;

    return this.http.get<any[]>(url).pipe(
      map(data => this.mapData(data)),
      catchError(() => {
        if (type === 'fb') {
          return this.http.get<any[]>(fallbackUrl).pipe(
            map(data => this.mapData(data)),
            catchError(() => of([]))
          );
        }
        return of([]);
      })
    );
  }

  getData(): Observable<CallSignData[]> {
    return this.getDataByType('fb');
  }

  private mapData(data: any[]): CallSignData[] {
    return data.map((item, i) => ({
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
    }));
  }
}