import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  // NCR
  'Metro Manila':             'NCR',
  'National Capital Region':  'NCR',

  // CAR
  'Abra':                     'CAR',
  'Apayao':                   'CAR',
  'Benguet':                  'CAR',
  'Ifugao':                   'CAR',
  'Kalinga':                  'CAR',
  'Mountain Province':        'CAR',

  // Region I
  'Ilocos Norte':             'Region I',
  'Ilocos Sur':               'Region I',
  'La Union':                 'Region I',
  'Pangasinan':               'Region I',

  // Region II
  'Batanes':                  'Region II',
  'Cagayan':                  'Region II',
  'Isabela':                  'Region II',
  'Nueva Vizcaya':            'Region II',
  'Quirino':                  'Region II',

  // Region III
  'Aurora':                   'Region III',
  'Bataan':                   'Region III',
  'Bulacan':                  'Region III',
  'Nueva Ecija':              'Region III',
  'Pampanga':                 'Region III',
  'Tarlac':                   'Region III',
  'Zambales':                 'Region III',

  // Region IV-A – CALABARZON
  'Batangas':                 'Region IV-A',
  'Cavite':                   'Region IV-A',
  'Laguna':                   'Region IV-A',
  'Quezon':                   'Region IV-A',
  'Rizal':                    'Region IV-A',

  // Region IV-B – MIMAROPA
  'Marinduque':               'Region IV-B',
  'Occidental Mindoro':       'Region IV-B',
  'Oriental Mindoro':         'Region IV-B',
  'Palawan':                  'Region IV-B',
  'Romblon':                  'Region IV-B',

  // Region V – Bicol
  'Albay':                    'Region V',
  'Camarines Norte':          'Region V',
  'Camarines Sur':            'Region V',
  'Catanduanes':              'Region V',
  'Masbate':                  'Region V',
  'Sorsogon':                 'Region V',

  // Region VI
  'Aklan':                    'Region VI',
  'Antique':                  'Region VI',
  'Capiz':                    'Region VI',
  'Guimaras':                 'Region VI',
  'Iloilo':                   'Region VI',
  'Negros Occidental':        'Region VI',

  // Region VII
  'Bohol':                    'Region VII',
  'Cebu':                     'Region VII',
  'Negros Oriental':          'Region VII',
  'Siquijor':                 'Region VII',

  // Region VIII
  'Biliran':                  'Region VIII',
  'Eastern Samar':            'Region VIII',
  'Leyte':                    'Region VIII',
  'Northern Samar':           'Region VIII',
  'Samar':                    'Region VIII',
  'Southern Leyte':           'Region VIII',

  // Region IX
  'Zamboanga del Norte':      'Region IX',
  'Zamboanga del Sur':        'Region IX',
  'Zamboanga Sibugay':        'Region IX',

  // Region X
  'Bukidnon':                 'Region X',
  'Camiguin':                 'Region X',
  'Lanao del Norte':          'Region X',
  'Misamis Occidental':       'Region X',
  'Misamis Oriental':         'Region X',

  // Region XI
  'Compostela Valley':        'Region XI',
  'Davao de Oro':             'Region XI',
  'Davao del Norte':          'Region XI',
  'Davao del Sur':            'Region XI',
  'Davao Occidental':         'Region XI',
  'Davao Oriental':           'Region XI',

  // Region XII
  'Cotabato':                 'Region XII',
  'North Cotabato':           'Region XII',
  'Sarangani':                'Region XII',
  'South Cotabato':           'Region XII',
  'Sultan Kudarat':           'Region XII',

  // Region XIII – Caraga
  'Agusan del Norte':         'Region XIII',
  'Agusan del Sur':           'Region XIII',
  'Dinagat Islands':          'Region XIII',
  'Surigao del Norte':        'Region XIII',
  'Surigao del Sur':          'Region XIII',

  // BARMM
  'Basilan':                  'BARMM',
  'Lanao del Sur':            'BARMM',
  'Maguindanao':              'BARMM',
  'Maguindanao del Norte':    'BARMM',
  'Maguindanao del Sur':      'BARMM',
  'Sulu':                     'BARMM',
  'Tawi-Tawi':                'BARMM',
};

function getRegionFromProvince(province: string): string {
  if (!province) return '';
  const trimmed = province.trim();

  if (PROVINCE_TO_REGION[trimmed]) return PROVINCE_TO_REGION[trimmed];

  const lower = trimmed.toLowerCase();
  for (const key of Object.keys(PROVINCE_TO_REGION)) {
    if (key.toLowerCase() === lower) return PROVINCE_TO_REGION[key];
  }


  for (const key of Object.keys(PROVINCE_TO_REGION)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return PROVINCE_TO_REGION[key];
    }
  }

  return '';
}

@Injectable({ providedIn: 'root' })
export class ValidationPageService {
  private dataUrl = 'assets/data/validation.data.json';

  constructor(private http: HttpClient) {}

  getData(): Observable<ConnectivityData[]> {
    return this.http.get<any[]>(this.dataUrl).pipe(
      map(data => data.map(item => {
        const province       = item.Province         ?? item.province         ?? '';
        const regionFromJson = item.Region           ?? item.region           ?? '';

        const region = regionFromJson.trim()
          ? regionFromJson.trim()
          : getRegionFromProvince(province);

        return {
          id:               item.ID               ?? item.id,
          region,
          province,
          cityMunicipality: item.CityMunicipality ?? item.cityMunicipality,
          barangay:         item.Barangay         ?? item.barangay,
          location:         item.Location         ?? item.location,
          validationDate:   item.ValidationDate   ?? item.validationDate,
          validationTime:   item.ValidationTime   ?? item.validationTime,
          technology:       item.Technology       ?? item.technology,
          serviceProvider:  item.ServiceProvider  ?? item.serviceProvider,
          upload:           item.Upload           ?? item.upload,
          download:         item.Download         ?? item.download,
          signalStrength:   item.SignalStrength    ?? item.signalStrength    ?? null,
          uploadDataSize:   item.UploadDataSize    ?? item.uploadDataSize    ?? null,
          downloadDataSize: item.DownloadDataSize  ?? item.downloadDataSize  ?? null,
          collectedBy:      item.CollectedBy       ?? item.collectedBy       ?? 'Unknown',
        };
      }))
    );
  }
}