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
  currentStep = 0;
  steps = [
    'Fill out your Name',
    'Fill out your Address',
    'Sex, Age & Mobile No.',
    'Purpose of Visit',
  ];

  stepTitles = [
    'Your Identity',
    'Your Location',
    'Your Profile',
    'Your Visit',
  ];

  sexOptions = [
    { label: 'Male',            value: 'Male',            symbol: '♂' },
    { label: 'Female',          value: 'Female',          symbol: '♀' },
    { label: 'Did Not Specify', value: 'Did Not Specify', symbol: '—' },
  ];

  priorityList = [
    { key: 'pwd', shortLabel: 'PWD',      label: 'Persons with Disabilities', img: 'assets/images/PWD.png' },
    { key: 'ij',  shortLabel: 'Injured',  label: 'Injuries / Specific Needs', img: 'assets/images/IJ.jpg'  },
    { key: 'sc',  shortLabel: 'Senior',   label: 'Senior Citizens',           img: 'assets/images/SC.png'  },
    { key: 'pw',  shortLabel: 'Pregnant', label: 'Pregnant Women',            img: 'assets/images/PW.jpg'  },
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

  private stepFields: string[][] = [
    ['fullName'],
    ['townProvince'],
    ['sex', 'age'],
    ['dateOfVisit', 'visitHour', 'visitMinute'],
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
      visitHour:     ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      visitMinute:   ['', [Validators.required, Validators.min(0), Validators.max(59)]],
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

  nextStep(): void {
    const fields = this.stepFields[this.currentStep];
    fields.forEach(f => this.visitorForm.get(f)?.markAsTouched());
    if (fields.every(f => this.visitorForm.get(f)?.valid)) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  onSubmit(): void {
    const fields = this.stepFields[this.currentStep];
    fields.forEach(f => this.visitorForm.get(f)?.markAsTouched());
    if (!fields.every(f => this.visitorForm.get(f)?.valid)) return;
    console.log('Submitted:', this.visitorForm.value, 'Priority:', this.selectedPriority);
    this.router.navigate(['/visitor-logbook2']);
  }
}