import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import {
  CardComponent,
  CardHeaderComponent,
  CardBodyComponent,
  ColComponent,
  RowComponent,
  ButtonDirective,
  BadgeComponent,
  TableDirective
} from '@coreui/angular';
import { Chart, registerables } from 'chart.js';
import { ConnectivityDashboardComponent } from '../connectivity-dashboard/connectivity-dashboard.component';

Chart.register(...registerables);

interface OJTData {
  name: string;
  hours: number;
  color: string;
}

@Component({
  selector: 'app-task3',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    ColComponent,
    RowComponent,
    ButtonDirective,
    BadgeComponent,
    TableDirective,
    ConnectivityDashboardComponent
  ],
  templateUrl: './task3.component.html',
  styleUrls: ['./task3.component.scss']
})
export class Task3Component implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('horizontalBarCanvas') horizontalBarCanvas!: ElementRef<HTMLCanvasElement>;

  currentView: string = 'dashboard';
  provinces: string[] = [
    'Albay', 'Camarines Norte', 'Camarines Sur',
    'Catanduanes', 'Masbate', 'Sorsogon'
  ];

  months: string[] = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  years: number[] = [2024, 2025, 2026];

  selectedProvince: string = '';
  selectedMonth: string = '';
  selectedYear: number | '' = '';

  ojtData: OJTData[] = [
    { name: 'Karl',      hours: 76, color: '#5856d6' },
    { name: 'Kenji',     hours: 62, color: '#9333ea' },
    { name: 'Lester',    hours: 54, color: '#39f'    },
    { name: 'Emmelie',   hours: 42, color: '#f9b115' },
    { name: 'Christian', hours: 42, color: '#e55353' },
    { name: 'Kent',      hours: 36, color: '#2eb85c' }
  ];

  totalHours: number = 0;
  private horizontalChart?: Chart;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.totalHours = this.ojtData.reduce((sum, item) => sum + item.hours, 0);
  }

  ngAfterViewInit(): void {
    if (this.currentView === 'dashboard') {
      setTimeout(() => this.createHorizontalBarChart(), 100);
    }
  }

  getPercentage(hours: number): string {
    return ((hours / this.totalHours) * 100).toFixed(1) + '%';
  }

  goToConnectivity(): void { this.router.navigate(['/connectivity-dashboard']); }
  goToCallSign(): void { this.router.navigate(['/call-sign']); }
  goToNonGovCallSign(): void { this.router.navigate(['/non-gov-call-sign']); }
  goToPrs(): void { this.router.navigate(['/prs']); }
  goToVl(): void { this.router.navigate(['/visitor-logbook']); }
  goToVl2(): void { this.router.navigate(['/visitor-logbook2']); }
  goToDtr(): void { this.router.navigate(['/daily-time-record']); }

  switchView(view: string): void {
    this.currentView = view;
    if (view === 'dashboard' && this.horizontalBarCanvas) {
      setTimeout(() => this.createHorizontalBarChart(), 100);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private createHorizontalBarChart(): void {
    const ctx = this.horizontalBarCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.horizontalChart) {
      this.horizontalChart.destroy();
    }

    this.horizontalChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.ojtData.map(item => item.name),
        datasets: [{
          data: this.ojtData.map(item => item.hours),
          backgroundColor: this.ojtData.map(item => item.color),
          borderRadius: 6,
          barThickness: 40
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Task #3: OJT Hours - Horizontal Bar Chart (Full Page)',
            font: { size: 18, weight: 'bold' },
            padding: { top: 10, bottom: 20 }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 80,
            ticks: { stepSize: 10 },
            title: {
              display: true,
              text: 'Total Hours Completed',
              font: { size: 14, weight: 'bold' }
            }
          },
          y: { grid: { display: false } }
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.horizontalChart) this.horizontalChart.destroy();
  }
}