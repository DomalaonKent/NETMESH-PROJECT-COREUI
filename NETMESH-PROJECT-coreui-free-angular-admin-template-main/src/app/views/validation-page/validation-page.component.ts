import { Component, OnInit, HostListener, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ValidationPageService, ConnectivityData, getProvincesForRegion, toInputDate, toInputTime } from './validation-page.service';
import { MapViewerComponent, KmlLayerConfig } from '../map-viewer/map-viewer.component';
import { readExcelFile, pickExcelFile, readExcelFromUrl, readExcelFileWithSummary, readExcelFromUrlWithSummary, FailedRow } from '../../helpers/excel-upload.helper';
import { REGION_PROVINCE_MAP, MapCenter } from '../../helpers/coordinate.helper';
import { ExcelCoordUploadComponent, PlotResult } from '../excel-coord-upload/excel-coord-upload.component';

interface ProviderStats {
  totalTests: number;
  avgUpload: number;
  avgDownload: number;
  noSignal: number;
  weakSignal: number;
}
interface PersonStat {
  name: string;
  uploadDataSize: number;
  downloadDataSize: number;
}

export interface UploadSummary {
  totalRows: number;
  successCount: number;
  failedCount: number;
  failedRows: FailedRow[];
}

interface CoordPoint {
  lat: number;
  lng: number;
  label?: string;
}

interface ValidationFormData {
  location: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  validationDate: string;   
  validationTime: string;   
  technology: string;
  serviceProvider: string;
  upload: number | null;
  download: number | null;
  signalStrength: string;
  uploadDataSize: number | null;
  downloadDataSize: number | null;
  collectedBy: string;
}

const ALL_REGIONS: string[] = [
  'NCR - Metro Manila',
  'CAR - Cordillera',
  'Region I - Ilocos Region',
  'Region II - Cagayan Valley',
  'Region III - Central Luzon',
  'Region IV-A - CALABARZON',
  'Region IV-B - MIMAROPA',
  'Region V - Bicol Region',
  'Region VI - Western Visayas',
  'Region VII - Central Visayas',
  'Region VIII - Eastern Visayas',
  'Region IX - Zamboanga Peninsula',
  'Region X - Northern Mindanao',
  'Region XI - Davao Region',
  'Region XII - SOCCSKSARGEN',
  'Region XIII - Caraga',
  'BARMM',
];

@Component({
  selector: 'app-validation-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MapViewerComponent, ExcelCoordUploadComponent],
  templateUrl: './validation-page.component.html',
  styleUrls: ['./validation-page.component.scss']
})
export class ValidationPageComponent implements OnInit {

  @ViewChild(MapViewerComponent) mapViewer!: MapViewerComponent;

  allData: ConnectivityData[] = [];
  filteredData: ConnectivityData[] = [];
  pagedData: ConnectivityData[] = [];

  dynamicColumns: string[] = [];
  dynamicSortColumn: string | null = null;
  dynamicSortDirection: 'asc' | 'desc' | null = null;

  searchTerm: string = '';
  selectedRegion: string = '';
  selectedProvince: string = '';
  selectedCity: string = '';
  selectedBarangay: string = '';

  regionList: string[] = ALL_REGIONS;

  provinceList: string[] = [];
  cityList: string[] = [];
  barangayList: string[] = [];

  filteredProvinceList: string[] = [];
  filteredCityList: string[] = [];
  filteredBarangayList: string[] = [];

  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  pageSizeOptions: number[] = [10, 25, 50, 100];

  showMap: boolean = false;

  kmlLayers: KmlLayerConfig[] = [
    { name: 'Regions',        url: 'assets/kmz/gadm41_PHL_1.kmz', color: '#a78bfa', enabled: false },
    { name: 'Provinces',      url: 'assets/kmz/gadm41_PHL_2.kmz', color: '#34d399', enabled: false },
    { name: 'Municipalities', url: 'assets/kmz/gadm41_PHL_3.kmz', color: '#fb923c', enabled: false },
  ];

  dateList: string[] = [];
  activeDateIndex: number = -1;
  get activeDate(): string | null { return this.activeDateIndex >= 0 ? this.dateList[this.activeDateIndex] : null; }

  periodList: string[] = ['AM', 'PM'];
  activePeriodIndex: number = -1;
  get activePeriod(): string | null { return this.activePeriodIndex >= 0 ? this.periodList[this.activePeriodIndex] : null; }

  providerList: string[] = [];
  activeProviderIndex: number = -1;
  get activeProvider(): string | null { return this.activeProviderIndex >= 0 ? this.providerList[this.activeProviderIndex] : null; }

  sortColumn: keyof ConnectivityData | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  readonly carouselTotal: number = 5;
  readonly carouselVisible: number = 4;
  carouselIndex: number = 0;

  get carouselMaxIndex(): number { return this.carouselTotal - this.carouselVisible; }
  get carouselDots(): number[]   { return Array.from({ length: this.carouselMaxIndex + 1 }, (_, i) => i); }
  carouselPrev(): void { if (this.carouselIndex > 0) this.carouselIndex--; }
  carouselNext(): void { if (this.carouselIndex < this.carouselMaxIndex) this.carouselIndex++; }
  goToCarousel(index: number): void { this.carouselIndex = index; }

  smartStats:  ProviderStats = this.emptyStats();
  globeStats:  ProviderStats = this.emptyStats();
  ditoStats:   ProviderStats = this.emptyStats();
  allStats:    ProviderStats = this.emptyStats();
  personStats: PersonStat[]  = [];

  showUploadDropdown: boolean = false;
  showUrlInput: boolean = false;
  excelUrl: string = '';
  isLoadingFromUrl: boolean = false;
  urlErrorMessage: string = '';

  coordLat: string = '';
  coordLng: string = '';
  coordErrorMessage: string = '';
  coordSuccessMessage: string = '';

  showUploadSummary: boolean = false;
  uploadSummary: UploadSummary | null = null;

  showCoordUpload: boolean = false;

  showDetailForm: boolean = false;
  isEditMode: boolean = false;
  selectedItem: ConnectivityData | null = null;
  isSavingForm: boolean = false;
  formErrorMessage: string = '';
  formData: ValidationFormData = this.emptyFormData();

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.upload-dropdown-wrap')) {
      this.showUploadDropdown = false;
    }
  }

  constructor(
    private router: Router,
    private validationPageService: ValidationPageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadData(); }

  private buildDynamicColumns(): void {
    const seen = new LinkedSet<string>();
    for (const row of this.allData) {
      for (const key of Object.keys(row as any)) {
        seen.add(key);
      }
    }
    this.dynamicColumns = seen.toArray();
  }

  getCellValue(row: any, col: string): any {
    const val = row[col];
    if (val === undefined || val === null || val === '') return '—';
    return val;
  }

  sortByDynamic(col: string): void {
    if (this.dynamicSortColumn === col) {
      if (this.dynamicSortDirection === 'asc') {
        this.dynamicSortDirection = 'desc';
      } else if (this.dynamicSortDirection === 'desc') {
        this.dynamicSortColumn = null;
        this.dynamicSortDirection = null;
      }
    } else {
      this.dynamicSortColumn = col;
      this.dynamicSortDirection = 'asc';
    }
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  emptyStats(): ProviderStats {
    return { totalTests: 0, avgUpload: 0, avgDownload: 0, noSignal: 0, weakSignal: 0 };
  }

  private emptyFormData(): ValidationFormData {
    return {
      location: '',
      barangay: '',
      cityMunicipality: '',
      province: '',
      validationDate: '',  
      validationTime: '',  
      technology: '',
      serviceProvider: '',
      upload: null,
      download: null,
      signalStrength: '',
      uploadDataSize: null,
      downloadDataSize: null,
      collectedBy: '',
    };
  }

  private toInputDate(dateStr: string): string {
    return toInputDate(dateStr);
  }

  private toInputTime(timeStr: string): string {
    return toInputTime(timeStr);
  }

  private toDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${m}/${d}/${y}`;
    }
    return dateStr;
  }

  private toDisplayTime(timeStr: string): string {
    if (!timeStr) return '';
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      const [hStr, min] = timeStr.split(':');
      let hour = parseInt(hStr, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      if (hour === 0) hour = 12;
      else if (hour > 12) hour -= 12;
      return `${hour}:${min} ${period}`;
    }
    return timeStr;
  }

  private calcStats(rows: ConnectivityData[]): ProviderStats {
    if (!rows.length) return this.emptyStats();
    const toNum = (v: any) => parseFloat(v) || 0;
    const totalTests  = rows.length;
    const avgUpload   = rows.reduce((s, r) => s + toNum(r.upload),   0) / totalTests;
    const avgDownload = rows.reduce((s, r) => s + toNum(r.download), 0) / totalTests;
    const noSignal    = new Set(
      rows.filter(r => !r.signalStrength || Number(r.signalStrength) === 0).map(r => r.barangay)
    ).size;
    const weakSignal  = new Set(
      rows.filter(r => toNum(r.upload) < 1 || toNum(r.download) < 5).map(r => r.barangay)
    ).size;
    return { totalTests, avgUpload, avgDownload, noSignal, weakSignal };
  }

  private computeStats(): void {
    this.smartStats = this.calcStats(
      this.filteredData.filter(d => d.serviceProvider?.toLowerCase().trim() === 'smart')
    );
    this.globeStats = this.calcStats(
      this.filteredData.filter(d => d.serviceProvider?.toLowerCase().trim() === 'globe')
    );
    this.ditoStats  = this.calcStats(
      this.filteredData.filter(d => d.serviceProvider?.toLowerCase().trim() === 'dito')
    );
    this.allStats   = this.calcStats(this.filteredData);

    const map = new Map<string, PersonStat>();
    const toNum = (v: any) => parseFloat(v) || 0;
    for (const row of this.filteredData) {
      const name = row.collectedBy || 'Unknown';
      if (!map.has(name)) map.set(name, { name, uploadDataSize: 0, downloadDataSize: 0 });
      const e = map.get(name)!;
      e.uploadDataSize   += toNum(row.uploadDataSize);
      e.downloadDataSize += toNum(row.downloadDataSize);
    }
    this.personStats = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  loadData(): void {
    this.validationPageService.getData({}).subscribe({
      next: (data: ConnectivityData[]) => {
        this.allData = data;
        this.buildDynamicColumns();
        this.buildAllDropdownLists();
        this.buildDateList();
        this.buildProviderList();
        this.applyFilterAndSort();
      },
      error: (err: unknown) => console.error('Failed to load data:', err)
    });
  }

  private buildAllDropdownLists(): void {
    const provinces = new Set<string>();
    const cities    = new Set<string>();
    const barangays = new Set<string>();

    for (const item of this.allData) {
      if (item.province?.trim())         provinces.add(item.province.trim());
      if (item.cityMunicipality?.trim()) cities.add(item.cityMunicipality.trim());
      if (item.barangay?.trim())         barangays.add(item.barangay.trim());
    }

    this.provinceList = Array.from(provinces).sort();
    this.cityList     = Array.from(cities).sort();
    this.barangayList = Array.from(barangays).sort();

    this.cascadeDropdowns();
  }

  buildDropdownLists(): void { this.buildAllDropdownLists(); }

  private cascadeDropdowns(): void {
    if (this.selectedRegion) {
      const provincesForRegion = getProvincesForRegion(this.selectedRegion);
      this.filteredProvinceList = this.provinceList.filter(p =>
        provincesForRegion.some(rp => rp.toLowerCase() === p.toLowerCase())
      );
    } else {
      this.filteredProvinceList = [...this.provinceList];
    }

    if (this.selectedProvince) {
      const cities = new Set<string>();
      for (const item of this.allData) {
        if (item.province?.trim().toLowerCase() === this.selectedProvince.toLowerCase() && item.cityMunicipality?.trim())
          cities.add(item.cityMunicipality.trim());

      }
      this.filteredCityList = Array.from(cities).sort();
    } else if (this.selectedRegion) {
      const provincesForRegion = getProvincesForRegion(this.selectedRegion).map(p => p.toLowerCase());
      const cities = new Set<string>();
      for (const item of this.allData) {
        if (provincesForRegion.includes(item.province?.trim().toLowerCase() ?? '') && item.cityMunicipality?.trim())
          cities.add(item.cityMunicipality.trim());

      }
      this.filteredCityList = Array.from(cities).sort();
    } else {
      this.filteredCityList = [...this.cityList];
    }

    if (this.selectedCity) {
      const barangays = new Set<string>();
      for (const item of this.allData) {
        if (item.cityMunicipality?.trim().toLowerCase() === this.selectedCity.toLowerCase() && item.barangay?.trim())
          barangays.add(item.barangay.trim());

      }
      this.filteredBarangayList = Array.from(barangays).sort();
    } else if (this.selectedProvince) {
      const barangays = new Set<string>();
      for (const item of this.allData) {
        if (item.province?.trim().toLowerCase() === this.selectedProvince.toLowerCase() && item.barangay?.trim())
          barangays.add(item.barangay.trim());

      }
      this.filteredBarangayList = Array.from(barangays).sort();
    } else {
      this.filteredBarangayList = [...this.barangayList];
    }
  }

  onRegionChange(): void {
    this.selectedProvince = ''; this.selectedCity = ''; this.selectedBarangay = '';
    if (this.selectedRegion) {
      const regionsLayer = this.kmlLayers.find(l => l.name === 'Regions');
      if (regionsLayer && !regionsLayer.enabled) { regionsLayer.enabled = true; this.mapViewer?.toggleLayer(regionsLayer); }
    }
    this.cascadeDropdowns(); this.currentPage = 1; this.applyFilterAndSort(); this.zoomMap();
  }

  onProvinceChange(): void {
    this.selectedCity = ''; this.selectedBarangay = '';
    if (this.selectedProvince) {
      const provincesLayer = this.kmlLayers.find(l => l.name === 'Provinces');
      if (provincesLayer && !provincesLayer.enabled) { provincesLayer.enabled = true; this.mapViewer?.toggleLayer(provincesLayer); }
    }
    this.cascadeDropdowns(); this.currentPage = 1; this.applyFilterAndSort(); this.zoomMap();
  }

  onCityChange(): void {
    this.selectedBarangay = '';

    if (this.selectedCity) {
      const municipalitiesLayer = this.kmlLayers.find(l => l.name === 'Municipalities');
      if (municipalitiesLayer && !municipalitiesLayer.enabled) { municipalitiesLayer.enabled = true; this.mapViewer?.toggleLayer(municipalitiesLayer); }
    }
    this.cascadeDropdowns(); this.currentPage = 1; this.applyFilterAndSort(); this.zoomMap();
  }

  onBarangayChange(): void {
    this.currentPage = 1; this.applyFilterAndSort();
    if (!this.mapViewer) return;
    if (this.selectedBarangay) {
      const row = this.filteredData.find(d =>
        d.barangay?.trim() === this.selectedBarangay && (d as any).latitude && (d as any).longitude
      );
      if (row) {
        const lat = parseFloat((row as any).latitude);
        const lng = parseFloat((row as any).longitude);
        if (isFinite(lat) && isFinite(lng)) { this.mapViewer.flyTo([lat, lng], 14); return; }
      }
    }
    this.zoomMap();
  }

  private applyFilterAndSort(): void {
    let result = [...this.allData] as any[];
    
    if (this.selectedRegion) {
      const provincesForRegion = getProvincesForRegion(this.selectedRegion).map(p => p.toLowerCase());
      result = result.filter(item => provincesForRegion.includes(item.province?.trim().toLowerCase() ?? ''));
    }
    if (this.selectedProvince)
      result = result.filter(item => item.province?.trim().toLowerCase() === this.selectedProvince.toLowerCase());
    if (this.selectedCity)
      result = result.filter(item => item.cityMunicipality?.trim().toLowerCase() === this.selectedCity.toLowerCase());
    if (this.selectedBarangay)
      result = result.filter(item => item.barangay?.trim().toLowerCase() === this.selectedBarangay.toLowerCase());
    if (this.activeDate)
      result = result.filter(item => item.validationDate?.trim() === this.activeDate);
    if (this.activePeriod)
      result = result.filter(item => this.extractPeriod(item.validationTime) === this.activePeriod);
    if (this.activeProvider)
      result = result.filter(item => item.serviceProvider?.trim().toLowerCase() === this.activeProvider!.toLowerCase());
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(item =>
        Object.values(item).some(val => String(val ?? '').toLowerCase().includes(term))
      );
    }

    if (this.dynamicSortColumn && this.dynamicSortDirection) {
      const col = this.dynamicSortColumn;
      const dir = this.dynamicSortDirection === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        const aVal = String(a[col] ?? '').trim();
        const bVal = String(b[col] ?? '').trim();
        const aNum = parseFloat(aVal); const bNum = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) return (aNum - bNum) * dir;
        if (!aVal && bVal) return 1; if (aVal && !bVal) return -1;
        return aVal.localeCompare(bVal) * dir;
      });
    }
    
    this.filteredData = result as ConnectivityData[];
    this.applyPagination();
    this.computeStats();
  }

  private extractCoordPoints(rows: Record<string, any>[]): CoordPoint[] {
    if (!rows.length) return [];
    const keys   = Object.keys(rows[0]);
    const latKey = keys.find(k => /^(lat(itude)?|y)$/i.test(k.trim()));
    const lngKey = keys.find(k => /^(lo?ng(itude)?|lon|x)$/i.test(k.trim()));
    if (!latKey || !lngKey) return [];
    const points: CoordPoint[] = [];
    for (const row of rows) {
      const lat = parseFloat(row[latKey]);
      const lng = parseFloat(row[lngKey]);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
      const label: string | undefined =
        row['barangay'] || row['Barangay'] || row['location'] || row['Location'] ||
        row['name'] || row['Name'] || row['cityMunicipality'] || undefined;
      points.push({ lat, lng, label });
    }
    return points;
  }

  private plotUploadedCoords(rows: Record<string, any>[]): void {
    const points = this.extractCoordPoints(rows);
    if (!points.length) return;
    this.showMap = true;
    setTimeout(() => { this.mapViewer?.plotMarkers(points); this.cdr.detectChanges(); }, 350);
  }

  async uploadFromLocalFile(): Promise<void> {
    const file = await pickExcelFile();
    if (!file) return;

    const result = await readExcelFileWithSummary<ConnectivityData>(file);
    this.allData = [...result.successRows, ...this.allData];
    this.refreshTable();
    this.plotUploadedCoords(result.successRows as Record<string, any>[]);

    this.uploadSummary = {
      totalRows: result.successRows.length + result.failedRows.length,
      successCount: result.successRows.length,
      failedCount: result.failedRows.length,
      failedRows: result.failedRows,
    };
    this.showUploadSummary = true;
    this.cdr.detectChanges();
  }

  toggleUrlInput(): void { this.showUrlInput = !this.showUrlInput; this.excelUrl = ''; this.urlErrorMessage = ''; }

  private convertToDirectDownloadUrl(url: string): string {
    const googleSheetsMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (googleSheetsMatch) return `https://docs.google.com/spreadsheets/d/${googleSheetsMatch[1]}/export?format=xlsx`;
    const googleDriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (googleDriveMatch) return `https://drive.google.com/uc?export=download&id=${googleDriveMatch[1]}`;
    return url;
  }

  async uploadFromUrl(): Promise<void> {
    if (!this.excelUrl.trim()) { this.urlErrorMessage = 'Please enter a valid URL.'; return; }
    this.isLoadingFromUrl = true; this.urlErrorMessage = '';
    try {
      const downloadUrl = this.convertToDirectDownloadUrl(this.excelUrl.trim());
      const result = await readExcelFromUrlWithSummary<ConnectivityData>(downloadUrl);
      this.allData = [...result.successRows, ...this.allData];
      this.refreshTable();
      this.showUrlInput = false; this.excelUrl = '';
      this.plotUploadedCoords(result.successRows as Record<string, any>[]);

      this.isLoadingFromUrl = false;
      this.uploadSummary = {
        totalRows: result.successRows.length + result.failedRows.length,
        successCount: result.successRows.length,
        failedCount: result.failedRows.length,
        failedRows: result.failedRows,
      };
      this.showUploadSummary = true;
      this.cdr.detectChanges();
    } catch (error) {
      this.urlErrorMessage = 'Failed to load file. Please check the URL and try again.';
      console.error(error);
    } finally {
      this.isLoadingFromUrl = false;
      this.cdr.detectChanges();
    }
  }

  closeUploadSummary(): void { this.showUploadSummary = false; this.uploadSummary = null; }

  flyToInputCoordinates(): void {
    this.coordErrorMessage = ''; this.coordSuccessMessage = '';
    const result = this.mapViewer?.flyToCoordinates(this.coordLat.trim(), this.coordLng.trim());
    if (!result || !result.success) {
      this.coordErrorMessage = result?.error ?? 'Unable to navigate. Please enter valid decimal coordinates.';
    } else {
      this.coordSuccessMessage = `Flying to (${this.coordLat.trim()}, ${this.coordLng.trim()})`;
      setTimeout(() => this.coordSuccessMessage = '', 3000);
    }
  }

  toggleCoordUpload(): void { this.showCoordUpload = !this.showCoordUpload; }

  onExcelCoordPlot(result: PlotResult): void {
    this.showMap = true;
    setTimeout(() => { this.mapViewer?.plotMarkers(result.points, result.meta); this.cdr.detectChanges(); }, 350);
  }

  onExcelCoordClear(): void { this.mapViewer?.clearMarkers(); }

  private refreshTable(): void {
    this.buildDynamicColumns();
    this.buildAllDropdownLists();
    this.buildDateList();
    this.buildProviderList();
    this.applyFilterAndSort();
  }

  buildDateList(): void {
    const seen = new Set<string>();
    for (const item of this.allData) {
      const d = item.validationDate?.trim();
      if (d) seen.add(d);
    }
    this.dateList = Array.from(seen).sort((a, b) => {
      const toMs = (s: string) => { const [m, d, y] = s.split('/'); return new Date(+y, +m - 1, +d).getTime(); };
      return toMs(a) - toMs(b);
    });
  }

  buildProviderList(): void {
    const seen = new Set<string>();
    for (const item of this.allData) {
      const p = item.serviceProvider?.trim();
      if (p) seen.add(p);
    }
    const preferred = ['Smart', 'DITO', 'Globe'];
    const ordered: string[] = [];
    for (const p of preferred) {
      const found = Array.from(seen).find(s => s.toLowerCase() === p.toLowerCase());
      if (found) { ordered.push(found); seen.delete(found); }
    }
    for (const p of seen) ordered.push(p);
    this.providerList = ordered;
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedRegion || this.selectedProvince || this.selectedCity || this.selectedBarangay || this.searchTerm);
  }

  clearFilters(): void {
    this.selectedRegion = ''; this.selectedProvince = ''; this.selectedCity = ''; this.selectedBarangay = ''; this.searchTerm = '';
    this.cascadeDropdowns(); this.currentPage = 1;
    this.kmlLayers.forEach(layer => { if (layer.enabled) { layer.enabled = false; this.mapViewer?.toggleLayer(layer); } });
    if (this.mapViewer) this.mapViewer.flyTo([12.8797, 121.7740], 6);
    this.mapViewer?.clearMarkers();

    this.applyFilterAndSort();
  }

  private zoomMap(): void {
    if (!this.mapViewer) return;
    const [lat, lng, zoom] = MapCenter(this.selectedCity, this.selectedProvince, this.selectedRegion);
    this.mapViewer.flyTo([lat, lng], zoom);
  }

  private extractPeriod(timeStr: string): string {
    if (!timeStr) return '';
    const match = timeStr.trim().toLowerCase().match(/\b(am|pm)$/);
    return match ? match[1].toUpperCase() : '';
  }

  formatTime(timeStr: string): { hour: string; minute: string; period: string } {
    if (!timeStr) return { hour: '--', minute: '--', period: '' };
    const match = timeStr.trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
    if (!match) return { hour: timeStr, minute: '', period: '' };
    return { hour: match[1], minute: match[2], period: match[3].toUpperCase() };
  }

  onServiceProviderClick(): void {
    this.activeProviderIndex++;
    if (this.activeProviderIndex >= this.providerList.length) this.activeProviderIndex = -1;
    this.currentPage = 1; this.applyFilterAndSort();
  }

  onValidationDateClick(): void {
    this.activeDateIndex++;
    if (this.activeDateIndex >= this.dateList.length) this.activeDateIndex = -1;
    this.currentPage = 1; this.applyFilterAndSort();
  }

  onValidationTimeClick(): void {
    this.activePeriodIndex++;
    if (this.activePeriodIndex >= this.periodList.length) this.activePeriodIndex = -1;
    this.currentPage = 1; this.applyFilterAndSort();
  }

  sortBy(column: keyof ConnectivityData): void { this.sortByDynamic(column as string); }
  getColSort(column: keyof ConnectivityData): 'asc' | 'desc' | null {
    return this.dynamicSortColumn === (column as string) ? this.dynamicSortDirection : null;
  }

  get dateHeaderLabel():     string { return this.activeDateIndex     >= 0 ? this.dateList[this.activeDateIndex]         : 'Validation Date'; }
  get timeHeaderLabel():     string { return this.activePeriodIndex   >= 0 ? this.periodList[this.activePeriodIndex]     : 'Validation Time'; }
  get providerHeaderLabel(): string { return this.activeProviderIndex >= 0 ? this.providerList[this.activeProviderIndex] : 'Service Provider'; }

  applyPagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredData.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedData = this.filteredData.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page; this.applyPagination();
  }
  onPageSizeChange(): void { this.pageSize = Number(this.pageSize); this.currentPage = 1; this.applyPagination(); }
  get pageStart(): number { return this.filteredData.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1; }
  get pageEnd():   number { return Math.min(this.currentPage * this.pageSize, this.filteredData.length); }

  get pageNumbers(): number[] {
    const total = this.totalPages; const current = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  onSearch(): void { this.currentPage = 1; this.applyFilterAndSort(); }
  goBack(): void   { this.router.navigate(['/connectivity-dashboard']); }
  onAddNew(): void { this.openAddForm(); }

  openAddForm(): void {
    this.isEditMode = false;
    this.selectedItem = null;
    this.formData = this.emptyFormData();
    this.formErrorMessage = '';
    this.showDetailForm = true;
  }

  openEditForm(item: ConnectivityData): void {
    this.isEditMode = true;
    this.selectedItem = item;
    this.formData = {
      location:         item.location         ?? '',
      barangay:         item.barangay         ?? '',
      cityMunicipality: item.cityMunicipality ?? '',
      province:         item.province         ?? '',

      validationDate:   this.toInputDate(item.validationDate  ?? ''),  
      validationTime:   this.toInputTime(item.validationTime  ?? ''),   
      technology:       item.technology       ?? '',
      serviceProvider:  item.serviceProvider  ?? '',
      upload:           item.upload           ?? null,
      download:         item.download         ?? null,
      signalStrength:   item.signalStrength   ?? '',
      uploadDataSize:   item.uploadDataSize   ?? null,
      downloadDataSize: item.downloadDataSize ?? null,
      collectedBy:      item.collectedBy      ?? '',
    };
    this.formErrorMessage = '';
    this.showDetailForm = true;
  }

  cancelForm(): void {
    this.showDetailForm = false;
    this.formData = this.emptyFormData();
    this.formErrorMessage = '';
    this.selectedItem = null;
  }

  saveForm(): void {
    if (!this.formData.serviceProvider) {
      this.formErrorMessage = 'Service Provider is required.';
      return;
    }

    this.isSavingForm = true;
    this.formErrorMessage = '';

    const payload: Partial<ConnectivityData> = {
      location:         this.formData.location,
      barangay:         this.formData.barangay,
      cityMunicipality: this.formData.cityMunicipality,
      province:         this.formData.province,
      validationDate:   this.formData.validationDate,   
      validationTime:   this.formData.validationTime,   
      technology:       this.formData.technology,
      serviceProvider:  this.formData.serviceProvider,
      upload:           this.formData.upload   ?? 0,
      download:         this.formData.download ?? 0,
      signalStrength:   this.formData.signalStrength,
      uploadDataSize:   this.formData.uploadDataSize   ?? 0,
      downloadDataSize: this.formData.downloadDataSize ?? 0,
      collectedBy:      this.formData.collectedBy,
    };

    if (this.isEditMode && this.selectedItem) {
      this.validationPageService.update(this.selectedItem.id, payload).subscribe({
        next: () => {
          console.log(' Record updated in database');
          const idx = this.allData.findIndex(d => d.id === this.selectedItem!.id);
          if (idx !== -1) {
            this.allData[idx] = {
              ...this.allData[idx],
              ...payload,
              validationDate: this.toDisplayDate(this.formData.validationDate),
              validationTime: this.toDisplayTime(this.formData.validationTime),
            };
          }
          this.buildAllDropdownLists();
          this.buildDateList();
          this.buildProviderList();
          this.applyFilterAndSort();
          this.isSavingForm = false;
          this.showDetailForm = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          const status  = err?.status ?? 0;
          const detail  = err?.error?.detail ?? err?.error?.message ?? err?.message ?? JSON.stringify(err?.error ?? err);
          const msg     = `❌ Update failed (HTTP ${status}): ${detail}`;
          console.error(msg, err);
          this.formErrorMessage = msg;
          this.isSavingForm = false;
          this.cdr.detectChanges();
        }
      });

    } else {
      this.validationPageService.create(payload).subscribe({
        next: (created: any) => {
          console.log('✅ Record saved to database! ID:', created?.id);
          const newRecord: ConnectivityData = {
            id:               created?.id            ?? Date.now(),
            region:           this.formData.province ?? '',
            province:         this.formData.province,
            cityMunicipality: this.formData.cityMunicipality,
            barangay:         this.formData.barangay,
            location:         this.formData.location,
            validationDate:   this.toDisplayDate(this.formData.validationDate),
            validationTime:   this.toDisplayTime(this.formData.validationTime),
            technology:       this.formData.technology,
            serviceProvider:  this.formData.serviceProvider,
            upload:           this.formData.upload   ?? 0,
            download:         this.formData.download ?? 0,
            signalStrength:   this.formData.signalStrength,
            uploadDataSize:   this.formData.uploadDataSize   ?? 0,
            downloadDataSize: this.formData.downloadDataSize ?? 0,
            collectedBy:      this.formData.collectedBy,
          } as ConnectivityData;
          this.allData = [newRecord, ...this.allData];
          this.buildAllDropdownLists();
          this.buildDateList();
          this.buildProviderList();
          this.applyFilterAndSort();
          this.isSavingForm = false;
          this.showDetailForm = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          const status = err?.status ?? 0;
          let detail: string;
          if (err?.error?.detail) {
            if (Array.isArray(err.error.detail)) {
              detail = err.error.detail
                .map((e: any) => `[${(e.loc ?? []).join('→')}] ${e.msg ?? e.type}`)
                .join(' | ');
            } else {
              detail = typeof err.error.detail === 'string'
                ? err.error.detail
                : JSON.stringify(err.error.detail);
            }
          } else if (err?.error?.message) {
            detail = err.error.message;
          } else if (typeof err?.error === 'string') {
            detail = err.error;
          } else if (err?.message) {
            detail = err.message;
          } else {
            detail = JSON.stringify(err?.error ?? err);
          }
          const msg = `Save failed (HTTP ${status}): ${detail}`;
          console.error('❌ Create error:', msg, err);
          this.formErrorMessage = msg;
          this.isSavingForm = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteFromForm(): void {
  if (!this.selectedItem) return;
  const confirmMsg = `Are you sure you want to delete this record? You won't be able to recover this data.`;
  
  if (confirm(confirmMsg)) {
    this.allData = this.allData.filter(d => d !== this.selectedItem);
    this.buildDropdownLists();
    this.buildDateList();
    this.buildProviderList();
    this.applyFilterAndSort();
    this.showDetailForm = false;
    this.selectedItem = null;

    alert("Record deleted successfully.");
  }
}
}

class LinkedSet<T> {
  private map = new Map<T, true>();
  add(val: T): void { this.map.set(val, true); }
  toArray(): T[]    { return Array.from(this.map.keys()); }
}