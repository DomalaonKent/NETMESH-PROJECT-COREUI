import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LastMileService, LastMileData } from './lastmile.service';

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

  searchTerm: string = '';
  selectedProvince: string = '';
  selectedCity: string = '';
  selectedBarangay: string = '';

  provinceList: string[] = [];
  cityList: string[] = [];
  barangayList: string[] = [];

  filteredCityList: string[] = [];
  filteredBarangayList: string[] = [];

  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  pageSizeOptions: number[] = [10, 25, 50, 100];

  sortColumn: keyof LastMileData | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  constructor(private router: Router, private lastMileService: LastMileService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.lastMileService.getData().subscribe({
      next: (data: LastMileData[]) => {
        this.allData = data;
        this.buildDropdownLists();
        this.applyFilterAndSort();
      },
      error: (err: unknown) => {
        console.error('Failed to load data:', err);
      }
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

    this.provinceList = Array.from(provinces).sort();
    this.cityList     = Array.from(cities).sort();
    this.barangayList = Array.from(barangays).sort();

    this.filteredCityList     = [...this.cityList];
    this.filteredBarangayList = [...this.barangayList];
  }

  onProvinceChange(): void {
    this.selectedCity     = '';
    this.selectedBarangay = '';

    if (this.selectedProvince) {
      const inProvince = this.allData.filter(d => d.province?.trim() === this.selectedProvince);
      this.filteredCityList = [...new Set(
        inProvince.map(d => d.cityMunicipality?.trim()).filter(Boolean) as string[]
      )].sort();
      this.filteredBarangayList = [...new Set(
        inProvince.map(d => d.barangay?.trim()).filter(Boolean) as string[]
      )].sort();
    } else {
      this.filteredCityList     = [...this.cityList];
      this.filteredBarangayList = [...this.barangayList];
    }
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  onCityChange(): void {
    this.selectedBarangay = '';
    const base = this.allData.filter(d => {
      const provinceOk = !this.selectedProvince || d.province?.trim() === this.selectedProvince;
      const cityOk     = !this.selectedCity     || d.cityMunicipality?.trim() === this.selectedCity;
      return provinceOk && cityOk;
    });
    this.filteredBarangayList = [...new Set(
      base.map(d => d.barangay?.trim()).filter(Boolean) as string[]
    )].sort();
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  onBarangayChange(): void {
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedProvince || this.selectedCity || this.selectedBarangay || this.searchTerm);
  }

  clearFilters(): void {
    this.selectedProvince     = '';
    this.selectedCity         = '';
    this.selectedBarangay     = '';
    this.searchTerm           = '';
    this.filteredCityList     = [...this.cityList];
    this.filteredBarangayList = [...this.barangayList];
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  private applyFilterAndSort(): void {
    let result = [...this.allData];

    if (this.selectedProvince) {
      result = result.filter(item => item.province?.trim() === this.selectedProvince);
    }
    if (this.selectedCity) {
      result = result.filter(item => item.cityMunicipality?.trim() === this.selectedCity);
    }
    if (this.selectedBarangay) {
      result = result.filter(item => item.barangay?.trim() === this.selectedBarangay);
    }

    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(item =>
        String(item.id                  ?? '').toLowerCase().includes(term) ||
        (item.province                  ?? '').toLowerCase().includes(term) ||
        (item.cityMunicipality          ?? '').toLowerCase().includes(term) ||
        (item.barangay                  ?? '').toLowerCase().includes(term) ||
        (item.location                  ?? '').toLowerCase().includes(term) ||
        String(item.averageDownloadSpeed ?? '').toLowerCase().includes(term) ||
        String(item.averageUploadSpeed   ?? '').toLowerCase().includes(term) ||
        String(item.latency              ?? '').toLowerCase().includes(term) ||
        String(item.packetLoss           ?? '').toLowerCase().includes(term) ||
        String(item.jitter               ?? '').toLowerCase().includes(term) ||
        String(item.serviceAvailability  ?? '').toLowerCase().includes(term) ||
        String(item.serviceUptime        ?? '').toLowerCase().includes(term)
      );
    }

    if (this.sortColumn && this.sortDirection) {
      const col = this.sortColumn;
      const dir = this.sortDirection === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        if (col === 'id') return (Number(a.id) - Number(b.id)) * dir;
        const aVal = String(a[col] ?? '').trim();
        const bVal = String(b[col] ?? '').trim();
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) return (aNum - bNum) * dir;
        if (!aVal && bVal) return 1;
        if (aVal && !bVal) return -1;
        return aVal.localeCompare(bVal) * dir;
      });
    }

    this.filteredData = result;
    this.applyPagination();
  }

  sortBy(column: keyof LastMileData): void {
    if (this.sortColumn === column) {
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else {
        this.sortColumn    = null;
        this.sortDirection = null;
      }
    } else {
      this.sortColumn    = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  getColSort(column: keyof LastMileData): 'asc' | 'desc' | null {
    return this.sortColumn === column ? this.sortDirection : null;
  }

  applyPagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredData.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedData = this.filteredData.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyPagination();
  }

  onPageSizeChange(): void {
    this.pageSize = Number(this.pageSize);
    this.currentPage = 1;
    this.applyPagination();
  }

  get pageStart(): number {
    return this.filteredData.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }
  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredData.length);
  }

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

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  goBack(): void { this.router.navigate(['/login1']); }
  onAddNew(): void { console.log('Add New clicked'); }
}