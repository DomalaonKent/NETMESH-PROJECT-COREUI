import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-visitor-logbook',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './visitor-logbook.component.html',
  styleUrls: ['./visitor-logbook.component.scss'],
})
export class VisitorLogbookComponent implements OnInit {

  visitorForm!: FormGroup;

  sexOptions = [
    { label: 'Male',            value: 'Male',            symbol: '♂' },
    { label: 'Female',          value: 'Female',          symbol: '♀' },
    { label: 'Did Not Specify', value: 'Did Not Specify', symbol: '—' },
  ];

  provinces: string[] = [
    'Abra', 'Agusan del Norte', 'Agusan del Sur', 'Aklan', 'Albay',
    'Antique', 'Apayao', 'Aurora', 'Basilan', 'Bataan',
    'Batanes', 'Batangas', 'Benguet', 'Biliran', 'Bohol',
    'Bukidnon', 'Bulacan', 'Cagayan', 'Camarines Norte', 'Camarines Sur',
    'Camiguin', 'Capiz', 'Catanduanes', 'Cavite', 'Cebu',
    'Cotabato', 'Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental',
  ];

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.visitorForm = this.fb.group({
      fullName:     ['', [Validators.required, Validators.minLength(2)]],
      sex:          ['', Validators.required],
      age:          ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      mobileNo:     ['', [Validators.pattern(/^09\d{9}$/)]],
      townProvince: ['', Validators.required],
      dateOfVisit:  ['', Validators.required],
    });
  }

  setSex(value: string): void {
    this.visitorForm.patchValue({ sex: value });
  }
}