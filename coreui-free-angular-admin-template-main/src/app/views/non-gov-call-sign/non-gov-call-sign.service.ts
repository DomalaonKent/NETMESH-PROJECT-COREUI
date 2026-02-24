import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    
  };

  constructor(private http: HttpClient) {}

  getPortableCommercial(): Observable<NonGovCallSignData[]> {
    return this.http.get<NonGovCallSignData[]>(this.JSON_PATHS['portable']).pipe(
      catchError(err => { console.error(err); return of([]); })
    );
  }

  getFBCommercial(): Observable<NonGovCallSignData[]> {
    return this.http.get<NonGovCallSignData[]>(this.JSON_PATHS['fb']).pipe(
      catchError(err => { console.error(err); return of([]); })
    );
  }

  getMobileCommercial(): Observable<NonGovCallSignData[]> {
    return this.http.get<NonGovCallSignData[]>(this.JSON_PATHS['mobile']).pipe(
      catchError(err => { console.error(err); return of([]); })
    );
  }

  getFXCommercial(): Observable<NonGovCallSignData[]> {
    return this.http.get<NonGovCallSignData[]>(this.JSON_PATHS['fx']).pipe(
      catchError(err => { console.error(err); return of([]); })
    );
  }

  getRepeaterCommercial(): Observable<NonGovCallSignData[]> {
    return this.http.get<NonGovCallSignData[]>(this.JSON_PATHS['repeater']).pipe(
      catchError(err => { console.error(err); return of([]); })
    );
  }
}