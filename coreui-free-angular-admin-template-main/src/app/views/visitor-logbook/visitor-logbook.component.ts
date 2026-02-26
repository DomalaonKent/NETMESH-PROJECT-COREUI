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

  priorityList = [
    { key: 'pwd', label: 'Persons with Disabilities (PWDs)', img: 'assets/images/PWD.png' },
    { key: 'ij',  label: 'People with Injuries or Specific Needs', img: 'assets/images/IJ.jpg' },
    { key: 'sc',  label: 'Senior Citizens',  img: 'assets/images/SC.png' },
    { key: 'pw',  label: 'Pregnant Women',   img: 'assets/images/PW.jpg' },
  ];

  selectedPriority: string | null = null;

  provinces: string[] = [
    'Abra','Agusan del Norte','Agusan del Sur','Aklan','Albay','Antique','Apayao','Aurora',
    'Basilan','Bataan','Batanes','Batangas','Benguet','Biliran','Bohol','Bukidnon','Bulacan',
    'Cagayan','Camarines Norte','Camarines Sur','Camiguin','Capiz','Catanduanes','Cavite','Cebu',
    'Cotabato','Davao de Oro','Davao del Norte','Davao del Sur','Davao Occidental','Davao Oriental',
    'Dinagat Islands','Eastern Samar','Guimaras','Ifugao','Ilocos Norte','Ilocos Sur','Iloilo',
    'Isabela','Kalinga','La Union','Laguna','Lanao del Norte','Lanao del Sur','Leyte','Maguindanao',
    'Marinduque','Masbate','Metro Manila','Misamis Occidental','Misamis Oriental','Mountain Province',
    'Negros Occidental','Negros Oriental','Northern Samar','Nueva Ecija','Nueva Vizcaya',
    'Occidental Mindoro','Oriental Mindoro','Palawan','Pampanga','Pangasinan','Quezon','Quirino',
    'Rizal','Romblon','Samar','Sarangani','Siquijor','Sorsogon','South Cotabato','Southern Leyte',
    'Sultan Kudarat','Sulu','Surigao del Norte','Surigao del Sur','Tarlac','Tawi-Tawi','Zambales',
    'Zamboanga del Norte','Zamboanga del Sur','Zamboanga Sibugay',
  ];

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.visitorForm = this.fb.group({
      fullName:      ['', [Validators.required, Validators.minLength(2)]],
      applicantName: [''],
      sex:           ['', Validators.required],
      age:           ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      mobileNo:      ['', [Validators.pattern(/^09\d{9}$/)]],
      townProvince:  ['', Validators.required],

      
      dateOfVisit:   ['', Validators.required],
      visitHour:     ['', [Validators.required, Validators.min(1),  Validators.max(12)]],
      visitMinute:   ['', [Validators.required, Validators.min(0),  Validators.max(59)]],
      visitAmPm:     ['AM', Validators.required],
    });
  }

  setSex(value: string): void {
    this.visitorForm.patchValue({ sex: value });
    this.visitorForm.get('sex')?.markAsTouched();
  }

  selectPriority(key: string): void {
    this.selectedPriority = this.selectedPriority === key ? null : key;
  }

  onNext(): void {
    if (this.visitorForm.invalid) {
      this.visitorForm.markAllAsTouched();
      return;
    }
    this.router.navigate(['/visitor-logbook/step-2']);
  }
}