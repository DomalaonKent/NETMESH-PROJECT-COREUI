import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConnectivityService, ConnectivityData } from './connectivity.service';

interface ProviderStats {
  totalTests: number;
  avgUpload: number;
  avgDownload: number;
  noSignal: number;
  weakSignal: number;
}

@Component({
  selector: 'app-connectivity-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './connectivity-dashboard.component.html',
  styleUrls: ['./connectivity-dashboard.component.scss']
})
export class ConnectivityDashboardComponent implements OnInit {

  allData: ConnectivityData[] = [];
  filteredData: ConnectivityData[] = [];
  pagedData: ConnectivityData[] = [];

  searchTerm: string = '';
  selectedItems: number[] = [];
  selectAll: boolean = false;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  pageSizeOptions: number[] = [10, 25, 50, 100];

  smartStats: ProviderStats = this.emptyStats();
  globeStats: ProviderStats = this.emptyStats();
  ditoStats:  ProviderStats = this.emptyStats();
  allStats:   ProviderStats = this.emptyStats();

  constructor(private router: Router, private connectivityService: ConnectivityService) {}

  ngOnInit(): void {
    this.loadData();
  }

  emptyStats(): ProviderStats {
    return { totalTests: 0, avgUpload: 0, avgDownload: 0, noSignal: 0, weakSignal: 0 };
  }

  loadData(): void {
    this.connectivityService.getData().subscribe({
      next: (data: ConnectivityData[]) => {
        this.allData = data;
        this.filteredData = [...this.allData];
        this.computeStats();
        this.applyPagination();
      },
      error: (err: unknown) => {
        console.error('Failed to load data:', err);
      }
    });
  }

  computeStats(): void {
    const smartRows = this.allData.filter(d => d.serviceProvider?.toLowerCase().trim() === 'smart');
    this.smartStats = this.calcStats(smartRows);
    const globeRows = this.allData.filter(d => d.serviceProvider?.toLowerCase().trim() === 'globe');
    this.globeStats = this.calcStats(globeRows);
    const ditoRows  = this.allData.filter(d => d.serviceProvider?.toLowerCase().trim() === 'dito');
    this.ditoStats  = this.calcStats(ditoRows);
    this.allStats   = this.calcStats(this.allData);
  }

  private calcStats(rows: ConnectivityData[]): ProviderStats {
    if (!rows.length) return this.emptyStats();
    const totalTests  = rows.length;
    const toNum = (v: any) => parseFloat(v) || 0;
    const avgUpload   = rows.reduce((s, r) => s + toNum(r.upload),   0) / totalTests;
    const avgDownload = rows.reduce((s, r) => s + toNum(r.download), 0) / totalTests;
    const noSignalBarangays = new Set(
      rows.filter(r => !r.signalStrength || Number(r.signalStrength) === 0).map(r => r.barangay)
    );
    const weakBarangays = new Set(
      rows.filter(r => toNum(r.upload) < 1 || toNum(r.download) < 5).map(r => r.barangay)
    );
    return { totalTests, avgUpload, avgDownload, noSignal: noSignalBarangays.size, weakSignal: weakBarangays.size };
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredData = !term
      ? [...this.allData]
      : this.allData.filter(item =>
          (item.province         ?? '').toLowerCase().includes(term) ||
          (item.cityMunicipality ?? '').toLowerCase().includes(term) ||
          (item.barangay         ?? '').toLowerCase().includes(term) ||
          (item.serviceProvider  ?? '').toLowerCase().includes(term) ||
          (item.technology       ?? '').toLowerCase().includes(term) ||
          String(item.id ?? '').includes(term)
        );
    this.currentPage = 1;
    this.applyPagination();
  }

  applyPagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredData.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedData = this.filteredData.slice(start, start + this.pageSize);
    this.updateSelectAll();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyPagination();
  }

  onPageSizeChange(): void {
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

  toggleSelection(id: number): void {
    const index = this.selectedItems.indexOf(id);
    if (index > -1) { this.selectedItems.splice(index, 1); }
    else { this.selectedItems.push(id); }
    this.updateSelectAll();
  }

  isSelected(id: number): boolean { return this.selectedItems.includes(id); }

  onSelectAll(): void {
    this.selectedItems = this.selectAll ? this.pagedData.map(item => item.id) : [];
  }

  updateSelectAll(): void {
    this.selectAll = this.pagedData.length > 0 &&
      this.pagedData.every(item => this.selectedItems.includes(item.id));
  }

  goBack(): void { this.router.navigate(['/task3']); }
  onAddNew(): void { console.log('Add New clicked'); }
  onFilter(): void { console.log('Filters clicked'); }
}