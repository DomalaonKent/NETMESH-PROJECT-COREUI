import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// ✅ Import your service and interface from the service file
import { ConnectivityService, ConnectivityData } from './connectivity.service';

@Component({
  selector: 'app-connectivity-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],  // ← removed duplicate CommonModule
  templateUrl: './connectivity-dashboard.component.html',
  styleUrls: ['./connectivity-dashboard.component.scss']
})
export class ConnectivityDashboardComponent implements OnInit {

  allData: ConnectivityData[] = [];
  filteredData: ConnectivityData[] = [];
  searchTerm: string = '';
  selectedItems: number[] = [];
  selectAll: boolean = false;

  // ✅ Inject the SERVICE, not HttpClient directly
  constructor(private router: Router, private connectivityService: ConnectivityService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // ✅ Call the service method
    this.connectivityService.getData().subscribe({
      next: (data) => {
        this.allData = data;
        this.filteredData = [...this.allData];
      },
      error: (err) => {
        console.error('Failed to load data:', err);
      }
    });
  }

  goBack(): void { this.router.navigate(['/task3']); }

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