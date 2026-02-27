import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-visitor-logbook2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visitor-logbook2.component.html',
  styleUrls: ['./visitor-logbook2.component.scss']
})
export class VisitorLogbook2Component {

  checkedOffices: { [key: string]: boolean } = {
    ord: false, legal: false, cwapu: false, eod: false
  };

  get selectedCount(): number {
    return Object.values(this.checkedOffices).filter(v => v).length;
  }

  constructor(private router: Router) {}

  toggle(id: string): void {
    this.checkedOffices[id] = !this.checkedOffices[id];
  }

  onSubmit(): void {
    this.router.navigate(['/visitor-logbook/confirm']);
  }
}