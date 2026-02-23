import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CallSignService, CallSignData } from './call-sign.service';

interface AllStats {
  totalRegistered: number;
  withFrequency: number;
  withoutFrequency: number;
  uniqueLocations: number;
}

interface LicenseeStats {
  lguUnits: number;
  municipalities: number;
  uniqueLocations: number;
}

interface ProvinceStats {
  name: string;
  count: number;
}

interface TabDef {
  key: string;
  label: string;
}

@Component({
  selector: 'app-call-sign',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './call-sign.component.html',
  styleUrls: ['./call-sign.component.scss']
})
export class CallSignComponent implements OnInit {
  tabs: TabDef[] = [
    { key: 'portable',  label: 'Portable Govt',},
    { key: 'fb',        label: 'FB Govt'},
    { key: 'mobile',    label: 'Mobile Govt'},
    { key: 'fx',        label: 'FX Govt'},
    { key: 'repeater',  label: 'Repeater'},
  ];
  activeTab: string = 'fb';
  tabIndex: number = 1;

  private allDataByTab: Record<string, CallSignData[]> = {
    portable: [],
    fb: [],
    mobile: [],
    fx: [],
    repeater: [],
  };

  allData: CallSignData[] = [];
  filteredData: CallSignData[] = [];
  pagedData: CallSignData[] = [];

  searchTerm: string = '';

  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  pageSizeOptions: number[] = [10, 25, 50, 100];

  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  allStats: AllStats = { totalRegistered: 0, withFrequency: 0, withoutFrequency: 0, uniqueLocations: 0 };
  provinceStats: ProvinceStats[] = [];
  licenseeStats: LicenseeStats = { lguUnits: 0, municipalities: 0, uniqueLocations: 0 };

  private readonly PROVINCES: string[] = [
    'Albay',
    'Camarines Norte',
    'Camarines Sur',
    'Catanduanes',
    'Masbate',
    'Sorsogon'
  ];

  constructor(private router: Router, private callSignService: CallSignService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.tabs.forEach(tab => {
      this.callSignService.getDataByType(tab.key).subscribe({
        next: (data: CallSignData[]) => {
          this.allDataByTab[tab.key] = data;
          if (tab.key === this.activeTab) {
            this.allData = data;
            this.applyFilterAndSort();
          }
        },
        error: (err: unknown) => {
          console.warn(`No data found for tab "${tab.key}":`, err);
          this.allDataByTab[tab.key] = [];
          if (tab.key === this.activeTab) {
            this.allData = [];
            this.applyFilterAndSort();
          }
        }
      });
    });
  }

  onTabChange(tabKey: string): void {
    this.activeTab = tabKey;
    this.allData = this.allDataByTab[tabKey] ?? [];
    this.searchTerm = '';
    this.currentPage = 1;
    this.sortColumn = null;
    this.sortDirection = null;
    this.applyFilterAndSort();
  }

  private computeStats(): void {
    const data = this.filteredData;

    const withFreq = data.filter(d => d.txFreq && d.txFreq.trim() !== '');
    const withoutFreq = data.filter(d => !d.txFreq || d.txFreq.trim() === '');
    const uniqueLocs = new Set(data.map(d => d.location).filter(Boolean));

    this.allStats = {
      totalRegistered: data.length,
      withFrequency: withFreq.length,
      withoutFrequency: withoutFreq.length,
      uniqueLocations: uniqueLocs.size
    };

    this.provinceStats = this.PROVINCES.map(province => ({
      name: province,
      count: this.filteredData.filter(d =>
        (d.location ?? '').toLowerCase().includes(province.toLowerCase())
      ).length
    }));

    const lguRows = data.filter(d => d.licensee?.toLowerCase().startsWith('lgu'));
    const munRows = data.filter(d => d.licensee?.toLowerCase().startsWith('municipality'));
    this.licenseeStats = {
      lguUnits: lguRows.length,
      municipalities: munRows.length,
      uniqueLocations: uniqueLocs.size
    };
  }

  private applyFilterAndSort(): void {
    let result = [...this.allData];
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(item =>
        String(item.id ?? '').toLowerCase().includes(term) ||
        (item.callSign ?? '').toLowerCase().includes(term) ||
        (item.licensee ?? '').toLowerCase().includes(term) ||
        (item.txFreq ?? '').toLowerCase().includes(term) ||
        (item.rxFreq ?? '').toLowerCase().includes(term) ||
        (item.location ?? '').toLowerCase().includes(term) ||
        (item.serviceArea ?? '').toLowerCase().includes(term) ||
        (item.equipment ?? '').toLowerCase().includes(term) ||
        (item.serialNumber ?? '').toLowerCase().includes(term) ||
        (item.issued ?? '').toLowerCase().includes(term)
      );
    }

    if (this.sortColumn && this.sortDirection) {
      const col = this.sortColumn;
      const dir = this.sortDirection === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        if (col === 'id') return (Number(a.id) - Number(b.id)) * dir;
        const aVal = String((a as any)[col] ?? '').trim();
        const bVal = String((b as any)[col] ?? '').trim();
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
    this.computeStats();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else {
        this.sortColumn = null;
        this.sortDirection = null;
      }
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.applyFilterAndSort();
  }

  getColSort(column: string): 'asc' | 'desc' | null {
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
    const total = this.totalPages;
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

  getEquipmentClass(equipment: string | null): string {
    const eq = equipment?.toLowerCase() ?? '';
    if (eq.includes('icom')) return 'equip-icom';
    if (eq.includes('kenwood')) return 'equip-kenwood';
    return '';
  }

  prevTab(): void {
    if (this.tabIndex > 0) {
      this.tabIndex--;
      this.onTabChange(this.tabs[this.tabIndex].key);
    }
  }

  nextTab(): void {
    if (this.tabIndex < this.tabs.length - 1) {
      this.tabIndex++;
      this.onTabChange(this.tabs[this.tabIndex].key);
    }
  }

  goToTab(index: number): void {
    this.tabIndex = index;
    this.onTabChange(this.tabs[index].key);
  }

  goBack(): void { this.router.navigate(['/task3']); }
}