import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface ConnectivityData {
  id: number;
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
  signalStrength: string | null;
}

@Component({
  selector: 'app-connectivity-dashboard',
  standalone: true,
  imports: [CommonModule, 
    FormsModule,
    CommonModule,
],
  templateUrl: './connectivity-dashboard.component.html',
  styleUrls: ['./connectivity-dashboard.component.scss']
})
export class ConnectivityDashboardComponent implements OnInit {

  allData: ConnectivityData[] = [];
  filteredData: ConnectivityData[] = [];
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedItems: number[] = [];
  selectAll: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    
  }

  goBack(): void {
    this.router.navigate(['/task3']);
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredData = [...this.allData];
    } else {
      this.filteredData = this.allData.filter(item =>
        item.province.toLowerCase().includes(term) ||
        item.cityMunicipality.toLowerCase().includes(term) ||
        item.barangay.toLowerCase().includes(term) ||
        item.id.toString().includes(term)
      );
    }
  }

  toggleSelection(id: number): void {
    const index = this.selectedItems.indexOf(id);
    if (index > -1) { this.selectedItems.splice(index, 1); }
    else { this.selectedItems.push(id); }
    this.updateSelectAll();
  }

  isSelected(id: number): boolean {
    return this.selectedItems.includes(id);
  }

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