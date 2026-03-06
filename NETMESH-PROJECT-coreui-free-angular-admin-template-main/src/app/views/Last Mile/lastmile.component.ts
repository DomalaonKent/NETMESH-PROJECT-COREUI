import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LastMileService, LastMileData } from './lastmile.service';

const REGION_PROVINCE_MAP: Record<string, string[]> = {
  'NCR - Metro Manila':              ['Metro Manila'],
  'CAR - Cordillera':                ['Abra', 'Apayao', 'Benguet', 'Ifugao', 'Kalinga', 'Mountain Province'],
  'Region I - Ilocos Region':        ['Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan'],
  'Region II - Cagayan Valley':      ['Batanes', 'Cagayan', 'Isabela', 'Nueva Vizcaya', 'Quirino'],
  'Region III - Central Luzon':      ['Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 'Pampanga', 'Tarlac', 'Zambales'],
  'Region IV-A - CALABARZON':        ['Batangas', 'Cavite', 'Laguna', 'Quezon', 'Rizal'],
  'Region IV-B - MIMAROPA':          ['Marinduque', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Romblon'],
  'Region V - Bicol Region':         ['Albay', 'Camarines Norte', 'Camarines Sur', 'Catanduanes', 'Masbate', 'Sorsogon'],
  'Region VI - Western Visayas':     ['Aklan', 'Antique', 'Capiz', 'Guimaras', 'Iloilo', 'Negros Occidental'],
  'Region VII - Central Visayas':    ['Bohol', 'Cebu', 'Negros Oriental', 'Siquijor'],
  'Region VIII - Eastern Visayas':   ['Biliran', 'Eastern Samar', 'Leyte', 'Northern Samar', 'Samar', 'Southern Leyte'],
  'Region IX - Zamboanga Peninsula': ['Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay'],
  'Region X - Northern Mindanao':    ['Bukidnon', 'Camiguin', 'Lanao del Norte', 'Misamis Occidental', 'Misamis Oriental'],
  'Region XI - Davao Region':        ['Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental', 'Davao Oriental'],
  'Region XII - SOCCSKSARGEN':       ['Cotabato', 'Sarangani', 'South Cotabato', 'Sultan Kudarat'],
  'Region XIII - Caraga':            ['Agusan del Norte', 'Agusan del Sur', 'Dinagat Islands', 'Surigao del Norte', 'Surigao del Sur'],
  'BARMM':                           ['Basilan', 'Lanao del Sur', 'Maguindanao del Norte', 'Maguindanao del Sur', 'Sulu', 'Tawi-Tawi'],
};

@Component({
  selector: 'app-last-mile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lastmile.component.html',
  styleUrls: ['./lastmile.component.scss']
})
export class LastMileComponent implements OnInit {

  allData: LastMileData[] = [];
  filteredData: LastMileData[] = [];
  pagedData: LastMileData[] = [];

  searchTerm = '';
  selectedRegion = '';
  selectedProvince = '';
  selectedCity = '';
  selectedBarangay = '';

  regionList: string[] = Object.keys(REGION_PROVINCE_MAP);
  provinceList: string[] = [];
  filteredProvinceList: string[] = [];
  cityList: string[] = [];
  filteredCityList: string[] = [];
  barangayList: string[] = [];
  filteredBarangayList: string[] = [];

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageSizeOptions = [10, 25, 50, 100];

  dateList: string[] = [];
  activeDateIndex = -1;
  get activeDate(): string | null { return this.activeDateIndex >= 0 ? this.dateList[this.activeDateIndex] : null; }

  periodList: string[] = ['AM', 'PM'];
  activePeriodIndex = -1;
  get activePeriod(): string | null { return this.activePeriodIndex >= 0 ? this.periodList[this.activePeriodIndex] : null; }

  providerList: string[] = [];
  activeProviderIndex = -1;
  get activeProvider(): string | null { return this.activeProviderIndex >= 0 ? this.providerList[this.activeProviderIndex] : null; }

  sortColumn: keyof LastMileData | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  constructor(private router: Router, private lastMileService: LastMileService) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.lastMileService.getData().subscribe({
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
    for (const item of this.allData) { if (item.validationDate?.trim()) seen.add(item.validationDate.trim()); }
    this.dateList = Array.from(seen).sort((a, b) => {
      const toMs = (s: string) => { const [m, d, y] = s.split('/'); return new Date(+y, +m - 1, +d).getTime(); };
      return toMs(a) - toMs(b);
    });
  }

  buildProviderList(): void {
    const seen = new Set<string>();
    for (const item of this.allData) { if (item.serviceProvider?.trim()) seen.add(item.serviceProvider.trim()); }
    const preferred = ['Smart', 'DITO', 'Globe'];
    const ordered: string[] = [];
    for (const p of preferred) {
      const found = Array.from(seen).find(s => s.toLowerCase() === p.toLowerCase());
      if (found) { ordered.push(found); seen.delete(found); }
    }
    for (const p of seen) ordered.push(p);
    this.providerList = ordered;
  }

  onRegionChange(): void {
    this.selectedProvince = '';
    this.selectedCity = '';
    this.selectedBarangay = '';
    this.filteredCityList = [];
    this.filteredBarangayList = [];

    if (this.selectedRegion) {
      const allowed = REGION_PROVINCE_MAP[this.selectedRegion] ?? [];
      this.filteredProvinceList = this.provinceList.filter(p => allowed.includes(p));
    } else {
      this.filteredProvinceList = [...this.provinceList];
      this.filteredCityList     = [...this.cityList];
      this.filteredBarangayList = [...this.barangayList];
    }
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  onProvinceChange(): void {
    this.selectedCity = '';
    this.selectedBarangay = '';
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
  }

  onCityChange(): void {
    this.selectedBarangay = '';
    const base = this.allData.filter(d => {
      const regionOk   = !this.selectedRegion   || (REGION_PROVINCE_MAP[this.selectedRegion] ?? []).includes(d.province?.trim() ?? '');
      const provinceOk = !this.selectedProvince || d.province?.trim()         === this.selectedProvince;
      const cityOk     = !this.selectedCity     || d.cityMunicipality?.trim() === this.selectedCity;
      return regionOk && provinceOk && cityOk;
    });
    this.filteredBarangayList = [...new Set(base.map(d => d.barangay?.trim()).filter(Boolean) as string[])].sort();
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  onBarangayChange(): void { this.currentPage = 1; this.applyFilterAndSort(); }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedRegion || this.selectedProvince || this.selectedCity || this.selectedBarangay);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRegion = '';
    this.selectedProvince = '';
    this.selectedCity = '';
    this.selectedBarangay = '';
    this.filteredProvinceList = [...this.provinceList];
    this.filteredCityList     = [...this.cityList];
    this.filteredBarangayList = [...this.barangayList];
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  private applyFilterAndSort(): void {
    let result = [...this.allData];

    if (this.selectedRegion) {
      const allowed = REGION_PROVINCE_MAP[this.selectedRegion] ?? [];
      result = result.filter(d => allowed.includes(d.province?.trim() ?? ''));
    }
    if (this.selectedProvince)  result = result.filter(d => d.province?.trim()         === this.selectedProvince);
    if (this.selectedCity)      result = result.filter(d => d.cityMunicipality?.trim() === this.selectedCity);
    if (this.selectedBarangay)  result = result.filter(d => d.barangay?.trim()         === this.selectedBarangay);
    if (this.activeDate)        result = result.filter(d => d.validationDate?.trim()   === this.activeDate);
    if (this.activePeriod)      result = result.filter(d => this.extractPeriod(d.validationTime) === this.activePeriod);
    if (this.activeProvider)    result = result.filter(d => d.serviceProvider?.trim().toLowerCase() === this.activeProvider!.toLowerCase());

    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(d =>
        String(d.id ?? '').toLowerCase().includes(term) ||
        (d.province ?? '').toLowerCase().includes(term) ||
        (d.cityMunicipality ?? '').toLowerCase().includes(term) ||
        (d.barangay ?? '').toLowerCase().includes(term) ||
        (d.location ?? '').toLowerCase().includes(term) ||
        (d.validationDate ?? '').toLowerCase().includes(term) ||
        (d.technology ?? '').toLowerCase().includes(term) ||
        (d.serviceProvider ?? '').toLowerCase().includes(term)
      );
    }

    if (this.sortColumn && this.sortDirection) {
      const col = this.sortColumn;
      const dir = this.sortDirection === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        if (col === 'id') return (Number(a.id) - Number(b.id)) * dir;
        const av = String(a[col] ?? '').trim();
        const bv = String(b[col] ?? '').trim();
        const an = parseFloat(av); const bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
        if (!av && bv) return 1; if (av && !bv) return -1;
        return av.localeCompare(bv) * dir;
      });
    }
    this.filteredData = result;
    this.applyPagination();
  }

  private extractPeriod(timeStr: string): string {
    if (!timeStr) return '';
    const m = timeStr.trim().toLowerCase().match(/\b(am|pm)$/);
    return m ? m[1].toUpperCase() : '';
  }

  formatTime(timeStr: string): { hour: string; minute: string; period: string } {
    if (!timeStr) return { hour: '--', minute: '--', period: '' };
    const m = timeStr.trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
    if (!m) return { hour: timeStr, minute: '', period: '' };
    return { hour: m[1], minute: m[2], period: m[3].toUpperCase() };
  }

  onServiceProviderClick(): void {
    this.activeProviderIndex = (this.activeProviderIndex + 1) >= this.providerList.length ? -1 : this.activeProviderIndex + 1;
    this.currentPage = 1; this.applyFilterAndSort();
  }
  onValidationDateClick(): void {
    this.activeDateIndex = (this.activeDateIndex + 1) >= this.dateList.length ? -1 : this.activeDateIndex + 1;
    this.currentPage = 1; this.applyFilterAndSort();
  }
  onValidationTimeClick(): void {
    this.activePeriodIndex = (this.activePeriodIndex + 1) >= this.periodList.length ? -1 : this.activePeriodIndex + 1;
    this.currentPage = 1; this.applyFilterAndSort();
  }

  sortBy(column: keyof LastMileData): void {
    if (column === 'serviceProvider') { this.onServiceProviderClick(); return; }
    if (column === 'validationDate')  { this.onValidationDateClick(); return; }
    if (column === 'validationTime')  { this.onValidationTimeClick(); return; }
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : null;
      if (!this.sortDirection) this.sortColumn = null;
    } else { this.sortColumn = column; this.sortDirection = 'asc'; }
    this.currentPage = 1; this.applyFilterAndSort();
  }

  getColSort(column: keyof LastMileData): 'asc' | 'desc' | null {
    if (column === 'serviceProvider') return this.activeProviderIndex >= 0 ? 'asc' : null;
    if (column === 'validationDate')  return this.activeDateIndex >= 0 ? 'asc' : null;
    if (column === 'validationTime')  return this.activePeriodIndex >= 0 ? 'asc' : null;
    return this.sortColumn === column ? this.sortDirection : null;
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
  goBack(): void { this.router.navigate(['/connectivity-dashboard']); }
  onAddNew(): void { console.log('Add New clicked'); }
}