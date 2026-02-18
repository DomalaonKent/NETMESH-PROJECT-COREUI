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
  searchTerm: string = '';
  selectedItems: number[] = [];
  selectAll: boolean = false;

  smartStats: ProviderStats = this.emptyStats();
  globeStats: ProviderStats = this.emptyStats(); 

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
  }
  

  private calcStats(rows: ConnectivityData[]): ProviderStats {
    if (!rows.length) return this.emptyStats();

    const totalTests  = rows.length;
    const toNum = (v: any) => parseFloat(v) || 0;
    const avgUpload   = rows.reduce((s, r) => s + toNum(r.upload),   0) / totalTests;
    const avgDownload = rows.reduce((s, r) => s + toNum(r.download), 0) / totalTests;
    const noSignalBarangays = new Set(
      rows.filter(r => !r.signalStrength || Number(r.signalStrength) === 0)
          .map(r => r.barangay)
    );

    const weakBarangays = new Set(
      rows.filter(r => toNum(r.upload) < 1 || toNum(r.download) < 5)
          .map(r => r.barangay)
    );

    return {
      totalTests,
      avgUpload,
      avgDownload,
      noSignal:   noSignalBarangays.size,
      weakSignal: weakBarangays.size
    };
  }

  goBack(): void { this.router.navigate(['/task3']); }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredData = !term
      ? [...this.allData]
      : this.allData.filter(item =>
          item.province.toLowerCase().includes(term) ||
          item.cityMunicipality.toLowerCase().includes(term) ||
          item.barangay.toLowerCase().includes(term) ||
          item.id.toString().includes(term)
        );
  }

  toggleSelection(id: number): void {
    const index = this.selectedItems.indexOf(id);
    if (index > -1) { this.selectedItems.splice(index, 1); }
    else { this.selectedItems.push(id); }
    this.updateSelectAll();
  }

  isSelected(id: number): boolean { return this.selectedItems.includes(id); }

  onSelectAll(): void {
    this.selectedItems = this.selectAll ? this.filteredData.map(item => item.id) : [];
  }

  updateSelectAll(): void {
    this.selectAll = this.filteredData.length > 0 &&
      this.filteredData.every(item => this.selectedItems.includes(item.id));
  }

  onAddNew(): void { console.log('Add New clicked'); }
  onFilter(): void { console.log('Filters clicked'); }
}