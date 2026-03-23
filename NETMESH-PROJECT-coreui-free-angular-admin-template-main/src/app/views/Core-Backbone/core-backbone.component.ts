import { Component, OnInit, HostListener, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CoreBackboneService, UpstreamData } from './core-backbone.service';
import { MapViewerComponent, KmlLayerConfig } from '../map-viewer/map-viewer.component';
import { pickExcelFile, readExcelFileWithSummary, readExcelFromUrlWithSummary, FailedRow } from '../../helpers/excel-upload.helper';
import { REGION_PROVINCE_MAP, MapCenter } from '../../helpers/coordinate.helper';
import { ExcelCoordUploadComponent, PlotResult } from '../excel-coord-upload/excel-coord-upload.component';

interface ProviderStats {
  totalTests:     number;
  avgUptime:      number;
  avgPacketLoss:  number;
  avgLatency:     number;
  highPacketLoss: number;
}

interface PersonStat {
  name:         string;
  totalRecords: number;
}

export interface UploadSummary {
  totalRows:    number;
  successCount: number;
  failedCount:  number;
  failedRows:   FailedRow[];
}

interface CoordPoint {
  lat:    number;
  lng:    number;
  label?: string;
}

interface BackboneFormData {
  location:                    string;
  barangay:                    string;
  cityMunicipality:            string;
  province:                    string;
  validationDate:              string;
  validationTime:              string;
  technology:                  string;
  serviceProvider:             string;
  uptime:                      string;
  packetLoss:                  string;
  latency:                     string;
  aggregatedOpticalSignalLoss: string;
  collectedBy:                 string;
}

@Component({
  selector: 'app-core-backbone',
  standalone: true,
  imports: [CommonModule, FormsModule, MapViewerComponent, ExcelCoordUploadComponent],
  templateUrl: './core-backbone.component.html',
  styleUrls: ['./core-backbone.component.scss']
})
export class CoreBackboneComponent implements OnInit {

  @ViewChild(MapViewerComponent) mapViewer!: MapViewerComponent;

  allData:      UpstreamData[] = [];
  filteredData: UpstreamData[] = [];
  pagedData:    UpstreamData[] = [];

  searchTerm:       string = '';
  selectedRegion:   string = '';
  selectedProvince: string = '';
  selectedCity:     string = '';
  selectedBarangay: string = '';

  regionList:           string[] = Object.keys(REGION_PROVINCE_MAP);
  provinceList:         string[] = [];
  filteredProvinceList: string[] = [];
  cityList:             string[] = [];
  filteredCityList:     string[] = [];
  barangayList:         string[] = [];
  filteredBarangayList: string[] = [];

  currentPage:     number   = 1;
  pageSize:        number   = 10;
  totalPages:      number   = 1;
  pageSizeOptions: number[] = [10, 25, 50, 100];

  dateList:        string[] = [];
  activeDateIndex: number   = -1;
  get activeDate(): string | null {
    return this.activeDateIndex >= 0 ? this.dateList[this.activeDateIndex] : null;
  }

  periodList:        string[] = ['AM', 'PM'];
  activePeriodIndex: number   = -1;
  get activePeriod(): string | null {
    return this.activePeriodIndex >= 0 ? this.periodList[this.activePeriodIndex] : null;
  }

  providerList:        string[] = [];
  activeProviderIndex: number   = -1;
  get activeProvider(): string | null {
    return this.activeProviderIndex >= 0 ? this.providerList[this.activeProviderIndex] : null;
  }

  sortColumn:    keyof UpstreamData | null = null;
  sortDirection: 'asc' | 'desc' | null    = null;

  showMap:            boolean = false;
  showUploadDropdown: boolean = false;
  showUrlInput:       boolean = false;
  excelUrl:           string  = '';
  isLoadingFromUrl:   boolean = false;
  urlErrorMessage:    string  = '';

  kmlLayers: KmlLayerConfig[] = [
    { name: 'Regions',        url: 'assets/kmz/gadm41_PHL_1.kmz', color: '#a78bfa', enabled: true  },
    { name: 'Provinces',      url: 'assets/kmz/gadm41_PHL_2.kmz', color: '#34d399', enabled: false },
    { name: 'Municipalities', url: 'assets/kmz/gadm41_PHL_3.kmz', color: '#fb923c', enabled: false },
  ];

  readonly carouselTotal:   number = 5;
  readonly carouselVisible: number = 4;
  carouselIndex: number = 0;

  get carouselMaxIndex(): number   { return this.carouselTotal - this.carouselVisible; }
  get carouselDots():     number[] { return Array.from({ length: this.carouselMaxIndex + 1 }, (_, i) => i); }
  carouselPrev(): void { if (this.carouselIndex > 0) this.carouselIndex--; }
  carouselNext(): void { if (this.carouselIndex < this.carouselMaxIndex) this.carouselIndex++; }
  goToCarousel(index: number): void { this.carouselIndex = index; }

  smartStats:  ProviderStats = this.emptyStats();
  globeStats:  ProviderStats = this.emptyStats();
  ditoStats:   ProviderStats = this.emptyStats();
  allStats:    ProviderStats = this.emptyStats();
  personStats: PersonStat[]  = [];

  coordLat:            string = '';
  coordLng:            string = '';
  coordErrorMessage:   string = '';
  coordSuccessMessage: string = '';

  showUploadSummary: boolean             = false;
  uploadSummary:     UploadSummary | null = null;
  showCoordUpload:   boolean             = false;

  showDetailForm:   boolean              = false;
  isEditMode:       boolean              = false;
  selectedItem:     UpstreamData | null  = null;
  isSavingForm:     boolean              = false;
  formErrorMessage: string               = '';
  formData:         BackboneFormData   = this.emptyFormData();

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.upload-dropdown-wrap')) {
      this.showUploadDropdown = false;
    }
  }

  constructor(
    private router:            Router,
    private coreBackboneService: CoreBackboneService,
    private cdr:               ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadData(); }

  emptyStats(): ProviderStats {
    return { totalTests: 0, avgUptime: 0, avgPacketLoss: 0, avgLatency: 0, highPacketLoss: 0 };
  }

  private emptyFormData(): BackboneFormData {
    return {
      location:                    '',
      barangay:                    '',
      cityMunicipality:            '',
      province:                    '',
      validationDate:              '',
      validationTime:              '',
      technology:                  '',
      serviceProvider:             '',
      uptime:                      '',
      packetLoss:                  '',
      latency:                     '',
      aggregatedOpticalSignalLoss: '',
      collectedBy:                 '',
    };
  }

  private toInputDate(dateStr: string): string {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [m, d, y] = parts;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return '';
  }

  private toInputTime(timeStr: string): string {
    if (!timeStr) return '';
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let hour     = parseInt(match[1], 10);
      const min    = match[2];
      const period = match[3].toUpperCase();
      if (period === 'AM' && hour === 12) hour = 0;
      if (period === 'PM' && hour !== 12) hour += 12;
      return `${String(hour).padStart(2, '0')}:${min}`;
    }
    return '';
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
      let hour          = parseInt(hStr, 10);
      const period      = hour >= 12 ? 'PM' : 'AM';
      if (hour === 0)      hour = 12;
      else if (hour > 12)  hour -= 12;
      return `${hour}:${min} ${period}`;
    }
    return timeStr;
  }

  private parseNum(v: any): number {
    if (v === null || v === undefined) return 0;
    return parseFloat(String(v).replace(/[^0-9.\-]/g, '')) || 0;
  }

  private calcStats(rows: UpstreamData[]): ProviderStats {
    if (!rows.length) return this.emptyStats();
    const n = rows.length;
    return {
      totalTests:     n,
      avgUptime:      rows.reduce((s, r) => s + this.parseNum(r.uptime),     0) / n,
      avgPacketLoss:  rows.reduce((s, r) => s + this.parseNum(r.packetLoss), 0) / n,
      avgLatency:     rows.reduce((s, r) => s + this.parseNum(r.latency),    0) / n,
      highPacketLoss: new Set(
        rows.filter(r => this.parseNum(r.packetLoss) > 2).map(r => r.location || r.barangay)
      ).size,
    };
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
    for (const row of this.filteredData) {
      const name = (row as any).collectedBy || 'Unknown';
      if (!map.has(name)) map.set(name, { name, totalRecords: 0 });
      map.get(name)!.totalRecords++;
    }
    this.personStats = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  loadData(): void {
    this.coreBackboneService.getData().subscribe({
      next: (data) => {
        this.allData = data;
        this.buildDropdownLists();
        this.buildDateList();
        this.buildProviderList();
        this.applyFilterAndSort();
      },
      error: (err) => console.error('Failed to load data:', err)
    });
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
      if (isNaN(lat) || isNaN(lng))  continue;
      if (lat < -90  || lat > 90)    continue;
      if (lng < -180 || lng > 180)   continue;
      const label: string | undefined =
        row['barangay'] || row['Barangay'] ||
        row['location'] || row['Location'] ||
        row['name']     || row['Name']     ||
        row['cityMunicipality'] || undefined;
      points.push({ lat, lng, label });
    }
    return points;
  }

  private plotUploadedCoords(rows: Record<string, any>[]): void {
    const points = this.extractCoordPoints(rows);
    if (!points.length) return;
    this.showMap = true;
    setTimeout(() => {
      this.mapViewer?.plotMarkers(points);
      this.cdr.detectChanges();
    }, 350);
  }

  async uploadFromLocalFile(): Promise<void> {
    const file = await pickExcelFile();
    if (!file) return;

    const result = await readExcelFileWithSummary<UpstreamData>(file);
    this.allData  = [...result.successRows, ...this.allData];
    this.refreshTable();
    this.plotUploadedCoords(result.successRows as Record<string, any>[]);

    this.uploadSummary = {
      totalRows:    result.successRows.length + result.failedRows.length,
      successCount: result.successRows.length,
      failedCount:  result.failedRows.length,
      failedRows:   result.failedRows,
    };
    this.showUploadSummary = true;
    this.cdr.detectChanges();
  }

  toggleUrlInput(): void {
    this.showUrlInput    = !this.showUrlInput;
    this.excelUrl        = '';
    this.urlErrorMessage = '';
  }

  private convertToDirectDownloadUrl(url: string): string {
    const googleSheetsMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (googleSheetsMatch) {
      return `https://docs.google.com/spreadsheets/d/${googleSheetsMatch[1]}/export?format=xlsx`;
    }
    const googleDriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (googleDriveMatch) {
      return `https://drive.google.com/uc?export=download&id=${googleDriveMatch[1]}`;
    }
    return url;
  }

  async uploadFromUrl(): Promise<void> {
    if (!this.excelUrl.trim()) { this.urlErrorMessage = 'Please enter a valid URL.'; return; }
    this.isLoadingFromUrl = true;
    this.urlErrorMessage  = '';
    try {
      const downloadUrl = this.convertToDirectDownloadUrl(this.excelUrl.trim());
      const result      = await readExcelFromUrlWithSummary<UpstreamData>(downloadUrl);
      this.allData      = [...result.successRows, ...this.allData];
      this.refreshTable();
      this.showUrlInput  = false;
      this.excelUrl      = '';
      this.plotUploadedCoords(result.successRows as Record<string, any>[]);

      this.isLoadingFromUrl = false;
      this.uploadSummary = {
        totalRows:    result.successRows.length + result.failedRows.length,
        successCount: result.successRows.length,
        failedCount:  result.failedRows.length,
        failedRows:   result.failedRows,
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

  closeUploadSummary(): void {
    this.showUploadSummary = false;
    this.uploadSummary     = null;
  }

  flyToInputCoordinates(): void {
    this.coordErrorMessage   = '';
    this.coordSuccessMessage = '';
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
    setTimeout(() => {
      this.mapViewer?.plotMarkers(result.points, result.meta);
      this.cdr.detectChanges();
    }, 350);
  }

  onExcelCoordClear(): void { this.mapViewer?.clearMarkers(); }

  private refreshTable(): void {
    this.buildDropdownLists();
    this.buildDateList();
    this.buildProviderList();
    this.applyFilterAndSort();
  }

  buildDropdownLists(): void {
    const provinces = new Set<string>();
    const cities    = new Set<string>();
    const barangays = new Set<string>();

    for (const item of this.allData) {
      if (item.province?.trim())         provinces.add(item.province.trim());
      if (item.cityMunicipality?.trim()) cities.add(item.cityMunicipality.trim());
      if (item.barangay?.trim())         barangays.add(item.barangay.trim());
    }

    this.provinceList         = Array.from(provinces).sort();
    this.filteredProvinceList = [...this.provinceList];
    this.cityList             = Array.from(cities).sort();
    this.filteredCityList     = [...this.cityList];
    this.barangayList         = Array.from(barangays).sort();
    this.filteredBarangayList = [...this.barangayList];
  }

  buildDateList(): void {
    const seen = new Set<string>();
    for (const item of this.allData) {
      if (item.validationDate?.trim()) seen.add(item.validationDate.trim());
    }
    this.dateList = Array.from(seen).sort((a, b) => {
      const toMs = (s: string) => {
        const [m, d, y] = s.split('/');
        return new Date(+y, +m - 1, +d).getTime();
      };
      return toMs(a) - toMs(b);
    });
  }

  buildProviderList(): void {
    const seen = new Set<string>();
    for (const item of this.allData) {
      if (item.serviceProvider?.trim()) seen.add(item.serviceProvider.trim());
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

  private zoomMap(): void {
    if (!this.mapViewer) return;
    const [lat, lng, zoom] = MapCenter(this.selectedCity, this.selectedProvince, this.selectedRegion);
    this.mapViewer.flyTo([lat, lng], zoom);
  }

  onRegionChange(): void {
    this.selectedProvince = '';
    this.selectedCity     = '';
    this.selectedBarangay = '';
    this.filteredCityList     = [];
    this.filteredBarangayList = [];

    if (this.selectedRegion) {
      const regionsLayer = this.kmlLayers.find(l => l.name === 'Regions');
      if (regionsLayer && !regionsLayer.enabled) {
        regionsLayer.enabled = true;
        this.mapViewer?.toggleLayer(regionsLayer);
      }
      const allowed = REGION_PROVINCE_MAP[this.selectedRegion] ?? [];
      this.filteredProvinceList = this.provinceList.filter(p => allowed.includes(p));
      const inRegion            = this.allData.filter(d => allowed.includes(d.province?.trim() ?? ''));
      this.filteredCityList     = [...new Set(inRegion.map(d => d.cityMunicipality?.trim()).filter(Boolean) as string[])].sort();
      this.filteredBarangayList = [...new Set(inRegion.map(d => d.barangay?.trim()).filter(Boolean) as string[])].sort();
    } else {
      this.filteredProvinceList = [...this.provinceList];
      this.filteredCityList     = [...this.cityList];
      this.filteredBarangayList = [...this.barangayList];
    }

    this.currentPage = 1;
    this.applyFilterAndSort();
    this.zoomMap();
  }

  onProvinceChange(): void {
    this.selectedCity     = '';
    this.selectedBarangay = '';

    if (this.selectedProvince) {
      const provincesLayer = this.kmlLayers.find(l => l.name === 'Provinces');
      if (provincesLayer && !provincesLayer.enabled) {
        provincesLayer.enabled = true;
        this.mapViewer?.toggleLayer(provincesLayer);
      }
    }

    const base = this.allData.filter(d =>
      (!this.selectedRegion || (REGION_PROVINCE_MAP[this.selectedRegion] ?? []).includes(d.province?.trim() ?? ''))
    );

    if (this.selectedProvince) {
      const inProv = base.filter(d => d.province?.trim() === this.selectedProvince);
      this.filteredCityList     = [...new Set(inProv.map(d => d.cityMunicipality?.trim()).filter(Boolean) as string[])].sort();
      this.filteredBarangayList = [...new Set(inProv.map(d => d.barangay?.trim()).filter(Boolean) as string[])].sort();
    } else {
      this.filteredCityList     = [...new Set(base.map(d => d.cityMunicipality?.trim()).filter(Boolean) as string[])].sort();
      this.filteredBarangayList = [...new Set(base.map(d => d.barangay?.trim()).filter(Boolean) as string[])].sort();
    }

    this.currentPage = 1;
    this.applyFilterAndSort();
    this.zoomMap();
  }

  onCityChange(): void {
    this.selectedBarangay = '';

    if (this.selectedCity) {
      const municipalitiesLayer = this.kmlLayers.find(l => l.name === 'Municipalities');
      if (municipalitiesLayer && !municipalitiesLayer.enabled) {
        municipalitiesLayer.enabled = true;
        this.mapViewer?.toggleLayer(municipalitiesLayer);
      }
    }

    const base = this.allData.filter(d => {
      const regionOk   = !this.selectedRegion   || (REGION_PROVINCE_MAP[this.selectedRegion] ?? []).includes(d.province?.trim() ?? '');
      const provinceOk = !this.selectedProvince || d.province?.trim()         === this.selectedProvince;
      const cityOk     = !this.selectedCity     || d.cityMunicipality?.trim() === this.selectedCity;
      return regionOk && provinceOk && cityOk;
    });

    this.filteredBarangayList = [...new Set(base.map(d => d.barangay?.trim()).filter(Boolean) as string[])].sort();
    this.currentPage = 1;
    this.applyFilterAndSort();
    this.zoomMap();
  }

  onBarangayChange(): void {
    this.currentPage = 1;
    this.applyFilterAndSort();
    if (!this.mapViewer) return;
    if (this.selectedBarangay) {
      const row = this.filteredData.find(d =>
        d.barangay?.trim() === this.selectedBarangay &&
        (d as any).latitude && (d as any).longitude
      );
      if (row) {
        const lat = parseFloat((row as any).latitude);
        const lng = parseFloat((row as any).longitude);
        if (isFinite(lat) && isFinite(lng)) {
          this.mapViewer.flyTo([lat, lng], 14);
          return;
        }
      }
    }
    this.zoomMap();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm    ||
      this.selectedRegion   ||
      this.selectedProvince ||
      this.selectedCity     ||
      this.selectedBarangay
    );
  }

  clearFilters(): void {
    this.searchTerm       = '';
    this.selectedRegion   = '';
    this.selectedProvince = '';
    this.selectedCity     = '';
    this.selectedBarangay = '';
    this.filteredProvinceList = [...this.provinceList];
    this.filteredCityList     = [...this.cityList];
    this.filteredBarangayList = [...this.barangayList];
    this.currentPage = 1;
    this.applyFilterAndSort();

    this.kmlLayers.forEach(layer => {
      if (layer.enabled) { layer.enabled = false; this.mapViewer?.toggleLayer(layer); }
    });

    if (this.mapViewer) this.mapViewer.flyTo([12.8797, 121.7740], 6);
    this.mapViewer?.clearMarkers();
  }

  private applyFilterAndSort(): void {
    let result = [...this.allData];

    if (this.selectedRegion) {
      const allowed = REGION_PROVINCE_MAP[this.selectedRegion] ?? [];
      result = result.filter(d => allowed.includes(d.province?.trim() ?? ''));
    }
    if (this.selectedProvince) result = result.filter(d => d.province?.trim()         === this.selectedProvince);
    if (this.selectedCity)     result = result.filter(d => d.cityMunicipality?.trim() === this.selectedCity);
    if (this.selectedBarangay) result = result.filter(d => d.barangay?.trim()         === this.selectedBarangay);
    if (this.activeDate)       result = result.filter(d => d.validationDate?.trim()   === this.activeDate);
    if (this.activePeriod)     result = result.filter(d => this.extractPeriod(d.validationTime) === this.activePeriod);
    if (this.activeProvider)   result = result.filter(d => d.serviceProvider?.trim().toLowerCase() === this.activeProvider!.toLowerCase());

    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(d =>
        Object.values(d).some(val => String(val ?? '').toLowerCase().includes(term))
      );
    }

    if (this.sortColumn && this.sortDirection) {
      const col = this.sortColumn;
      const dir = this.sortDirection === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        if (col === 'id') return (Number(a.id) - Number(b.id)) * dir;
        const av = String(a[col] ?? '').trim();
        const bv = String(b[col] ?? '').trim();
        const an = parseFloat(av);
        const bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
        if (!av && bv) return 1;
        if (av && !bv) return -1;
        return av.localeCompare(bv) * dir;
      });
    }

    this.filteredData = result;
    this.applyPagination();
    this.computeStats();
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
    this.activeProviderIndex = (this.activeProviderIndex + 1) >= this.providerList.length
      ? -1 : this.activeProviderIndex + 1;
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  onValidationDateClick(): void {
    this.activeDateIndex = (this.activeDateIndex + 1) >= this.dateList.length
      ? -1 : this.activeDateIndex + 1;
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  onValidationTimeClick(): void {
    this.activePeriodIndex = (this.activePeriodIndex + 1) >= this.periodList.length
      ? -1 : this.activePeriodIndex + 1;
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  sortBy(column: keyof UpstreamData): void {
    if (column === 'serviceProvider') { this.onServiceProviderClick(); return; }
    if (column === 'validationDate')  { this.onValidationDateClick();  return; }
    if (column === 'validationTime')  { this.onValidationTimeClick();  return; }

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : null;
      if (!this.sortDirection) this.sortColumn = null;
    } else {
      this.sortColumn    = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  getColSort(column: keyof UpstreamData): 'asc' | 'desc' | null {
    if (column === 'serviceProvider') return this.activeProviderIndex >= 0 ? 'asc' : null;
    if (column === 'validationDate')  return this.activeDateIndex     >= 0 ? 'asc' : null;
    if (column === 'validationTime')  return this.activePeriodIndex   >= 0 ? 'asc' : null;
    return this.sortColumn === column ? this.sortDirection : null;
  }

  get dateHeaderLabel():     string { return this.activeDateIndex     >= 0 ? this.dateList[this.activeDateIndex]         : 'Validation Date'; }
  get timeHeaderLabel():     string { return this.activePeriodIndex   >= 0 ? this.periodList[this.activePeriodIndex]     : 'Validation Time'; }
  get providerHeaderLabel(): string { return this.activeProviderIndex >= 0 ? this.providerList[this.activeProviderIndex] : 'Service Provider'; }

  applyPagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredData.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const start    = (this.currentPage - 1) * this.pageSize;
    this.pagedData = this.filteredData.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyPagination();
  }

  onPageSizeChange(): void {
    this.pageSize    = Number(this.pageSize);
    this.currentPage = 1;
    this.applyPagination();
  }

  get pageStart(): number { return this.filteredData.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1; }
  get pageEnd():   number { return Math.min(this.currentPage * this.pageSize, this.filteredData.length); }

  get pageNumbers(): number[] {
    const total   = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  onSearch(): void { this.currentPage = 1; this.applyFilterAndSort(); }
  goBack():   void { this.router.navigate(['/connectivity-dashboard']); }

  openAddForm(): void {
    this.isEditMode       = false;
    this.selectedItem     = null;
    this.formData         = this.emptyFormData();
    this.formErrorMessage = '';
    this.showDetailForm   = true;
  }

  openEditForm(item: UpstreamData): void {
    this.isEditMode   = true;
    this.selectedItem = item;
    this.formData = {
      location:                    item.location                    ?? '',
      barangay:                    item.barangay                    ?? '',
      cityMunicipality:            item.cityMunicipality            ?? '',
      province:                    item.province                    ?? '',
      validationDate:              this.toInputDate(item.validationDate  ?? ''),
      validationTime:              this.toInputTime(item.validationTime  ?? ''),
      technology:                  item.technology                  ?? '',
      serviceProvider:             item.serviceProvider             ?? '',
      uptime:                      item.uptime                      ?? '',
      packetLoss:                  item.packetLoss                  ?? '',
      latency:                     item.latency                     ?? '',
      aggregatedOpticalSignalLoss: item.aggregatedOpticalSignalLoss ?? '',
      collectedBy:                 item.collectedBy                 ?? '',
    };
    this.formErrorMessage = '';
    this.showDetailForm   = true;
  }

  cancelForm(): void {
    this.showDetailForm   = false;
    this.formData         = this.emptyFormData();
    this.formErrorMessage = '';
    this.selectedItem     = null;
  }

  saveForm(): void {
    if (!this.formData.serviceProvider) {
      this.formErrorMessage = 'Service Provider is required.';
      return;
    }
    this.isSavingForm     = true;
    this.formErrorMessage = '';

    if (this.isEditMode && this.selectedItem) {
      const idx = this.allData.findIndex(d => d.id === this.selectedItem!.id);
      if (idx !== -1) {
        this.allData[idx] = {
          ...this.allData[idx],
          ...this.formData,
          validationDate: this.toDisplayDate(this.formData.validationDate),
          validationTime: this.toDisplayTime(this.formData.validationTime),
        };
      }
    } else {
      const newRecord: UpstreamData = {
        id:                          Date.now(),
        province:                    this.formData.province,
        cityMunicipality:            this.formData.cityMunicipality,
        barangay:                    this.formData.barangay,
        location:                    this.formData.location,
        validationDate:              this.toDisplayDate(this.formData.validationDate),
        validationTime:              this.toDisplayTime(this.formData.validationTime),
        technology:                  this.formData.technology,
        serviceProvider:             this.formData.serviceProvider,
        uptime:                      this.formData.uptime,
        packetLoss:                  this.formData.packetLoss,
        latency:                     this.formData.latency,
        aggregatedOpticalSignalLoss: this.formData.aggregatedOpticalSignalLoss,
        collectedBy:                 this.formData.collectedBy,
      };
      this.allData = [newRecord, ...this.allData];
    }

    this.refreshTable();
    this.isSavingForm   = false;
    this.showDetailForm = false;
    this.cdr.detectChanges();
  }
}