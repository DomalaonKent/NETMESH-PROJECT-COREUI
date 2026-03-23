import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ConnectivityData {
  id: number;
  region: string;
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

const PROVINCE_TO_REGION: Record<string, string> = {
  'Metro Manila': 'NCR', 'National Capital Region': 'NCR',
  'Abra': 'CAR', 'Apayao': 'CAR', 'Benguet': 'CAR', 'Ifugao': 'CAR', 'Kalinga': 'CAR', 'Mountain Province': 'CAR',
  'Ilocos Norte': 'Region I', 'Ilocos Sur': 'Region I', 'La Union': 'Region I', 'Pangasinan': 'Region I',
  'Batanes': 'Region II', 'Cagayan': 'Region II', 'Isabela': 'Region II', 'Nueva Vizcaya': 'Region II', 'Quirino': 'Region II',
  'Aurora': 'Region III', 'Bataan': 'Region III', 'Bulacan': 'Region III', 'Nueva Ecija': 'Region III',
  'Pampanga': 'Region III', 'Tarlac': 'Region III', 'Zambales': 'Region III',
  'Batangas': 'Region IV-A', 'Cavite': 'Region IV-A', 'Laguna': 'Region IV-A', 'Quezon': 'Region IV-A', 'Rizal': 'Region IV-A',
  'Marinduque': 'Region IV-B', 'Occidental Mindoro': 'Region IV-B', 'Oriental Mindoro': 'Region IV-B',
  'Palawan': 'Region IV-B', 'Romblon': 'Region IV-B',
  'Albay': 'Region V', 'Camarines Norte': 'Region V', 'Camarines Sur': 'Region V',
  'Catanduanes': 'Region V', 'Masbate': 'Region V', 'Sorsogon': 'Region V',
  'Aklan': 'Region VI', 'Antique': 'Region VI', 'Capiz': 'Region VI',
  'Guimaras': 'Region VI', 'Iloilo': 'Region VI', 'Negros Occidental': 'Region VI',
  'Bohol': 'Region VII', 'Cebu': 'Region VII', 'Negros Oriental': 'Region VII', 'Siquijor': 'Region VII',
  'Biliran': 'Region VIII', 'Eastern Samar': 'Region VIII', 'Leyte': 'Region VIII',
  'Northern Samar': 'Region VIII', 'Samar': 'Region VIII', 'Southern Leyte': 'Region VIII',
  'Zamboanga del Norte': 'Region IX', 'Zamboanga del Sur': 'Region IX', 'Zamboanga Sibugay': 'Region IX',
  'Bukidnon': 'Region X', 'Camiguin': 'Region X', 'Lanao del Norte': 'Region X',
  'Misamis Occidental': 'Region X', 'Misamis Oriental': 'Region X',
  'Compostela Valley': 'Region XI', 'Davao de Oro': 'Region XI', 'Davao del Norte': 'Region XI',
  'Davao del Sur': 'Region XI', 'Davao Occidental': 'Region XI', 'Davao Oriental': 'Region XI',
  'Cotabato': 'Region XII', 'North Cotabato': 'Region XII', 'Sarangani': 'Region XII',
  'South Cotabato': 'Region XII', 'Sultan Kudarat': 'Region XII',
  'Agusan del Norte': 'Region XIII', 'Agusan del Sur': 'Region XIII', 'Dinagat Islands': 'Region XIII',
  'Surigao del Norte': 'Region XIII', 'Surigao del Sur': 'Region XIII',
  'Basilan': 'BARMM', 'Lanao del Sur': 'BARMM', 'Maguindanao': 'BARMM',
  'Maguindanao del Norte': 'BARMM', 'Maguindanao del Sur': 'BARMM', 'Sulu': 'BARMM', 'Tawi-Tawi': 'BARMM',
};

const REGION_TO_PROVINCES: Record<string, string[]> = {
  'NCR - Metro Manila':           ['Metro Manila', 'National Capital Region'],
  'CAR - Cordillera':             ['Abra', 'Apayao', 'Benguet', 'Ifugao', 'Kalinga', 'Mountain Province'],
  'Region I - Ilocos Region':     ['Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan'],
  'Region II - Cagayan Valley':   ['Batanes', 'Cagayan', 'Isabela', 'Nueva Vizcaya', 'Quirino'],
  'Region III - Central Luzon':   ['Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 'Pampanga', 'Tarlac', 'Zambales'],
  'Region IV-A - CALABARZON':     ['Batangas', 'Cavite', 'Laguna', 'Quezon', 'Rizal'],
  'Region IV-B - MIMAROPA':       ['Marinduque', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Romblon'],
  'Region V - Bicol Region':      ['Albay', 'Camarines Norte', 'Camarines Sur', 'Catanduanes', 'Masbate', 'Sorsogon'],
  'Region VI - Western Visayas':  ['Aklan', 'Antique', 'Capiz', 'Guimaras', 'Iloilo', 'Negros Occidental'],
  'Region VII - Central Visayas': ['Bohol', 'Cebu', 'Negros Oriental', 'Siquijor'],
  'Region VIII - Eastern Visayas':['Biliran', 'Eastern Samar', 'Leyte', 'Northern Samar', 'Samar', 'Southern Leyte'],
  'Region IX - Zamboanga Peninsula': ['Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay'],
  'Region X - Northern Mindanao': ['Bukidnon', 'Camiguin', 'Lanao del Norte', 'Misamis Occidental', 'Misamis Oriental'],
  'Region XI - Davao Region':     ['Compostela Valley', 'Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental', 'Davao Oriental'],
  'Region XII - SOCCSKSARGEN':    ['Cotabato', 'North Cotabato', 'Sarangani', 'South Cotabato', 'Sultan Kudarat'],
  'Region XIII - Caraga':         ['Agusan del Norte', 'Agusan del Sur', 'Dinagat Islands', 'Surigao del Norte', 'Surigao del Sur'],
  'BARMM':                        ['Basilan', 'Lanao del Sur', 'Maguindanao', 'Maguindanao del Norte', 'Maguindanao del Sur', 'Sulu', 'Tawi-Tawi'],
};

export function getProvincesForRegion(region: string): string[] {
  if (!region) return [];
  if (REGION_TO_PROVINCES[region]) return REGION_TO_PROVINCES[region];

  const lower = region.toLowerCase();
  for (const key of Object.keys(REGION_TO_PROVINCES)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return REGION_TO_PROVINCES[key];
    }
  }
  return [];
}

function getRegionFromProvince(province: string): string {
  if (!province) return '';
  const trimmed = province.trim();

  if (PROVINCE_TO_REGION[trimmed]) return PROVINCE_TO_REGION[trimmed];

  const lower = trimmed.toLowerCase();
  for (const key of Object.keys(PROVINCE_TO_REGION)) {
    if (key.toLowerCase() === lower) return PROVINCE_TO_REGION[key];
  }

  for (const key of Object.keys(PROVINCE_TO_REGION)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return PROVINCE_TO_REGION[key];
  }

  return '';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';
  if (/AM|PM/i.test(timeStr)) return timeStr;
  const [hStr, mStr] = timeStr.split(':');
  const hour = parseInt(hStr, 10);
  const minute = mStr ?? '00';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute} ${period}`;
}

export function toInputDate(dateStr: string): string {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [m, d, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

export function toInputTime(timeStr: string): string {
  if (!timeStr) return '';
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const min  = match[2];
    const period = match[3].toUpperCase();
    if (period === 'AM' && hour === 12) hour = 0;
    if (period === 'PM' && hour !== 12) hour += 12;
    return `${String(hour).padStart(2, '0')}:${min}`;
  }
  return '';
}

@Injectable({ providedIn: 'root' })
export class ValidationPageService {
  private readonly API_URL = 'http://localhost:8002';

  constructor(private http: HttpClient) {}

  getData(filters?: {
    region?: string;
    province?: string;
    city_municipality?: string;
    barangay?: string;
    service_provider?: string;
    technology?: string;
    limit?: number;
  }): Observable<ConnectivityData[]> {

    let params = new HttpParams();

    if (filters?.region && filters.region !== 'All Regions') {
      params = params.set('region', filters.region);
    }

    if (filters?.province && filters.province !== 'All Provinces') {
      params = params.set('province', filters.province);
    }

    if (filters?.city_municipality && filters.city_municipality !== 'All Cities / Municipalities') {
      params = params.set('city_municipality', filters.city_municipality);
    }

    if (filters?.barangay && filters.barangay !== 'All Barangays') {
      params = params.set('barangay', filters.barangay);
    }

    if (filters?.service_provider) {
      params = params.set('service_provider', filters.service_provider);
    }

    if (filters?.technology) {
      params = params.set('technology', filters.technology);
    }

    params = params.set('limit', (filters?.limit ?? 5000).toString());

    return this.http.get<any[]>(`${this.API_URL}/validations`, { params }).pipe(
      map(data => data.map(item => {
        const province       = item.province ?? '';
        const regionFromJson = item.region   ?? '';
        const region = regionFromJson.trim()
          ? regionFromJson.trim()
          : getRegionFromProvince(province);

        return {
          id:               item.id,
          region,
          province,
          cityMunicipality: item.city_municipality  ?? '',
          barangay:         item.barangay            ?? '',
          location:         item.location            ?? '',
          validationDate:   formatDate(item.validation_date),
          validationTime:   formatTime(item.validation_time),
          technology:       item.technology          ?? '',
          serviceProvider:  item.service_provider    ?? '',
          upload:           item.upload              ?? 0,
          download:         item.download            ?? 0,
          signalStrength:   item.signal_strength     ?? null,
          uploadDataSize:   item.upload_data_size     ?? null,
          downloadDataSize: item.download_data_size   ?? null,
          collectedBy:      item.collected_by         ?? 'Unknown',
        } as ConnectivityData;
      }))
    );
  }

  getProvinces(): Observable<string[]> {
    return this.getData().pipe(
      map(data => [...new Set(data.map(d => d.province).filter(Boolean))].sort())
    );
  }

  getCities(province?: string): Observable<string[]> {
    return this.getData({ province }).pipe(
      map(data => [...new Set(data.map(d => d.cityMunicipality).filter(Boolean))].sort())
    );
  }

  getBarangays(province?: string, city_municipality?: string): Observable<string[]> {
    return this.getData({ province, city_municipality }).pipe(
      map(data => [...new Set(data.map(d => d.barangay).filter(Boolean))].sort())
    );
  }

  create(record: Partial<ConnectivityData>): Observable<any> {
    const payload = this.toCreatePayload(record);
    console.log('📤 POST /validations payload:', JSON.stringify(payload, null, 2));
    return this.http.post(
      `${this.API_URL}/validations`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  getById(id: number): Observable<ConnectivityData> {
    return this.http.get<any>(`${this.API_URL}/validations/${id}`).pipe(
      map(item => {
        const province       = item.province ?? '';
        const regionFromJson = item.region   ?? '';
        const region = regionFromJson.trim()
          ? regionFromJson.trim()
          : getRegionFromProvince(province);
        return {
          id:               item.id,
          region,
          province,
          cityMunicipality: item.city_municipality  ?? '',
          barangay:         item.barangay            ?? '',
          location:         item.location            ?? '',
          validationDate:   formatDate(item.validation_date),
          validationTime:   formatTime(item.validation_time),
          technology:       item.technology          ?? '',
          serviceProvider:  item.service_provider    ?? '',
          upload:           item.upload              ?? 0,
          download:         item.download            ?? 0,
          signalStrength:   item.signal_strength     ?? null,
          uploadDataSize:   item.upload_data_size     ?? null,
          downloadDataSize: item.download_data_size   ?? null,
          collectedBy:      item.collected_by         ?? 'Unknown',
        } as ConnectivityData;
      })
    );
  }

  update(id: number, record: Partial<ConnectivityData>): Observable<any> {
    const payload = this.toUpdatePayload(record);
    return this.http.put(`${this.API_URL}/validations/${id}`, payload);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/validations/${id}`);
  }

  getStatsByProvider(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/validations/stats/by-provider`);
  }

  private toCreatePayload(record: Partial<ConnectivityData>): any {
    return {
      province:          record.province         ?? null,
      city_municipality: record.cityMunicipality ?? null,
      barangay:          record.barangay         ?? null,
      location:          record.location         ?? null,
      validation_date:   record.validationDate   ?? null,
      validation_time:   this.normalizeTime(record.validationTime),
      technology:        record.technology       ?? null,
      service_provider:  record.serviceProvider  ?? null,
      upload:            record.upload           ?? 0,
      download:          record.download         ?? 0,
      signal_strength:   record.signalStrength   ?? null,
      remarks:           null,
    };
  }

  private toUpdatePayload(record: Partial<ConnectivityData>): any {
    return {
      province:          record.province         ?? null,
      city_municipality: record.cityMunicipality ?? null,
      barangay:          record.barangay         ?? null,
      location:          record.location         ?? null,
      validation_date:   record.validationDate   ?? null,
      validation_time:   this.normalizeTime(record.validationTime),
      technology:        record.technology       ?? null,
      service_provider:  record.serviceProvider  ?? null,
      upload:            record.upload           ?? 0,
      download:          record.download         ?? 0,
      signal_strength:   record.signalStrength   ?? null,
      remarks:           null,
    };
  }

  private normalizeTime(timeStr: string | null | undefined): string | null {
    if (!timeStr) return null;
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return timeStr;
    let h = parseInt(match[1], 10);
    const m = match[2];
    const p = (match[3] ?? '').toUpperCase();
    if (p === 'AM' && h === 12) h = 0;
    if (p === 'PM' && h !== 12) h += 12;
    return `${String(h).padStart(2, '0')}:${m}`;
  }
}