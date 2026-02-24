import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface NonGovCallSignData {
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
export class NonGovCallSignService {
  private readonly JSON_PATHS: Record<string, string> = {
    portable: 'assets/data/non-gov/portable-commercial.json',
    fb:       'assets/data/non-gov/fb-commercial.json',
    mobile:   'assets/data/non-gov/mobile-commercial.json',
    fx:       'assets/data/non-gov/fx-commercial.json',
    repeater: 'assets/data/non-gov/repeater-commercial.json',
  };

  constructor(private http: HttpClient) {}

  private mapData(data: any[]): NonGovCallSignData[] {
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

  getDataByType(type: string): Observable<NonGovCallSignData[]> {
    const path = this.JSON_PATHS[type];
    if (!path) return of([]);
    return this.http.get<any[]>(path).pipe(
      map(data => this.mapData(data)),
      catchError(err => { console.error(err); return of([]); })
    );
  }

  getPortableCommercial(): Observable<NonGovCallSignData[]> {
    return this.getDataByType('portable');
  }

  getFBCommercial(): Observable<NonGovCallSignData[]> {
    return this.getDataByType('fb');
  }

  getMobileCommercial(): Observable<NonGovCallSignData[]> {
    return this.getDataByType('mobile');
  }

  getFXCommercial(): Observable<NonGovCallSignData[]> {
    return this.getDataByType('fx');
  }

  getRepeaterCommercial(): Observable<NonGovCallSignData[]> {
    return this.getDataByType('repeater');
  }
}