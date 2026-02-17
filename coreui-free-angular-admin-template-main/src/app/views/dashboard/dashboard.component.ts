import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  CardComponent, 
  CardHeaderComponent, 
  CardBodyComponent,
  ColComponent,
  RowComponent,
  TableDirective,
  BadgeComponent,
  ButtonDirective
} from '@coreui/angular';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface OJTData {
  name: string;
  hours: number;
  color: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    ColComponent,
    RowComponent,
    TableDirective,
    BadgeComponent,
    ButtonDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  @ViewChild('horizontalBarCanvas') horizontalBarCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('gaugeCanvas') gaugeCanvas!: ElementRef<HTMLCanvasElement>;

  // OJT Data from Google Sheets
  ojtData: OJTData[] = [
    { name: 'Karl', hours: 76, color: '#5856d6', status: 'Excellent' },
    { name: 'Kenji', hours: 62, color: '#9333ea', status: 'Good' },
    { name: 'Lester', hours: 54, color: '#39f', status: 'Good' },
    { name: 'Emmelie', hours: 42, color: '#f9b115', status: 'Fair' },
    { name: 'Christian', hours: 42, color: '#e55353', status: 'Fair' },
    { name: 'Kent', hours: 36, color: '#2eb85c', status: 'Fair' }
  ];

  totalHours: number = 0;
  averageHours: number = 0;

  private horizontalChart?: Chart;
  private pieChart?: Chart;
  private lineChart?: Chart;
  private gaugeChart?: Chart;

  ngOnInit(): void {
    this.totalHours = this.ojtData.reduce((sum, item) => sum + item.hours, 0);
    this.averageHours = Math.round(this.totalHours / this.ojtData.length);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createHorizontalBarChart();
      this.createPieChart();
      this.createLineChart();
      this.createGaugeChart();
    }, 100);
  }

  private createHorizontalBarChart(): void {
    const ctx = this.horizontalBarCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const names = this.ojtData.map(item => item.name);
    const hours = this.ojtData.map(item => item.hours);
    const colors = this.ojtData.map(item => item.color);

    this.horizontalChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: names,
        datasets: [{
          label: 'Hours Completed',
          data: hours,
          backgroundColor: colors,
          borderRadius: 4
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
            text: 'Horizontal Bar Chart',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 80,
            title: { display: true, text: 'Hours' }
          }
        }
      }
    });
  }

  private createPieChart(): void {
    const ctx = this.pieChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const names = this.ojtData.map(item => item.name);
    const hours = this.ojtData.map(item => item.hours);
    const colors = this.ojtData.map(item => item.color);

    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: names,
        datasets: [{
          data: hours,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: {
            display: true,
            text: 'Pie Chart',
            font: { size: 16, weight: 'bold' }
          }
        }
      }
    });
  }

  private createLineChart(): void {
    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const names = this.ojtData.map(item => item.name);
    const hours = this.ojtData.map(item => item.hours);

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: names,
        datasets: [{
          label: 'Hours',
          data: hours,
          borderColor: '#5856d6',
          backgroundColor: 'rgba(88, 86, 214, 0.1)',
          borderWidth: 3,
          pointRadius: 6,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          title: {
            display: true,
            text: 'Line Chart',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 80,
            title: { display: true, text: 'Hours' }
          }
        }
      }
    });
  }

  private createGaugeChart(): void {
    const ctx = this.gaugeCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const maxHours = 80 * this.ojtData.length;
    const percentage = (this.totalHours / maxHours) * 100;

    this.gaugeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [percentage, 100 - percentage],
          backgroundColor: ['#2eb85c', '#e0e0e0'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: { enabled: false }
        }
      },
      plugins: [{
        id: 'gaugeText',
        afterDatasetsDraw: (chart) => {
          const ctx = chart.ctx;
          const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
          const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2 + 60;

          ctx.save();
          ctx.font = 'bold 56px Arial';
          ctx.fillStyle = '#2eb85c';
          ctx.textAlign = 'center';
          ctx.fillText(`${percentage.toFixed(1)}%`, centerX, centerY);
          
          ctx.font = '18px Arial';
          ctx.fillStyle = '#999';
          ctx.fillText('Overall Progress', centerX, centerY + 50);
          ctx.restore();
        }
      }]
    });
  }

  ngOnDestroy(): void {
    if (this.horizontalChart) this.horizontalChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
    if (this.lineChart) this.lineChart.destroy();
    if (this.gaugeChart) this.gaugeChart.destroy();
  }
}