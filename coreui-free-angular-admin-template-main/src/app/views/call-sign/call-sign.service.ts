import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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

  private readonly JSON_PATHS: Record<string, string> = {
    portable: 'assets/data/call-sign-portable.json',
    fb:       'assets/data/call-sign.json',
    mobile:   'assets/data/call-sign-mobile.json',
    fx:       'assets/data/call-sign-fx.json',
    repeater: 'assets/data/call-sign-repeater.json',
  };

  constructor(private http: HttpClient) {}

  getDataByType(type: string): Observable<CallSignData[]> {
    const url = this.JSON_PATHS[type];

    if (!url) {
      console.warn(`[CallSignService] Unknown tab type: "${type}"`);
      return of([]);
    }

    return this.http.get<any[]>(url).pipe(
      map(data => this.mapData(data)),
      catchError(err => {
        console.error(`[CallSignService] Could not load "${url}". Status: ${err.status}. Make sure the file exists in src/assets/data/`);
        return of([]);
      })
    );
  }

  getData(): Observable<CallSignData[]> {
    return this.getDataByType('fb');
  }

  private mapData(data: any[]): CallSignData[] {
    return data.map((item, i) => ({
      id:           i + 1,
      callSign:     item.callSign     ?? '',
      licensee:     item.licensee     ?? '',
      txFreq:       item.txFreq       ?? null,
      rxFreq:       item.rxFreq       ?? null,
      location:     item.location     ?? '',
      serviceArea:  item.serviceArea  ?? '',
      equipment:    item.equipment    ?? null,
      serialNumber: item.serialNumber ?? null,
      source:       item.source       ?? '',
      issued:       item.issued       ?? null,
    }));
  }
}