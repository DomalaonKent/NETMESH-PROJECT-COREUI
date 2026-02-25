import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface PrsData {
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
export class PrsService {
  private readonly JSON_PATHS: Record<string, string> = {
    portable: 'assets/data/prs/portable-prs.json',
    fb:       'assets/data/prs/fb-prs.json',
    mobile:   'assets/data/prs/mobile-prs.json',
  };

  constructor(private http: HttpClient) {}

  private mapData(data: any[]): PrsData[] {
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

  getDataByType(type: string): Observable<PrsData[]> {
    const path = this.JSON_PATHS[type];
    if (!path) return of([]);
    return this.http.get<any[]>(path).pipe(
      map(data => this.mapData(data)),
      catchError(err => { console.error(err); return of([]); })
    );
  }

  getPortablePrs(): Observable<PrsData[]> {
    return this.getDataByType('portable');
  }

  getFBPrs(): Observable<PrsData[]> {
    return this.getDataByType('fb');
  }

  getMobilePrs(): Observable<PrsData[]> {
    return this.getDataByType('mobile');
  }
}