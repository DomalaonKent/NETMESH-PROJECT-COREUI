import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface CwapuService {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
}

interface CitizenCharterService {
  id: number;
  name: string;
  details: string;
  open: boolean;
}

@Component({
  selector: 'app-visitor-logbook2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visitor-logbook2.component.html',
  styleUrls: ['./visitor-logbook2.component.scss']
})
export class VisitorLogbook2Component {
  String = String;

  checkedOffices: { [key: string]: boolean } = {
    ord: false, legal: false, cwapu: false, eod: false
  };

  eodMode: 'inquiry' | 'assessment' | null = null;

  get selectedCount(): number {
    return Object.values(this.checkedOffices).filter(v => v).length;
  }

  cwapuServices: CwapuService[] = [
    { id: 'complaints', name: 'Complaints', icon: 'assets/images/complaints.png', selected: false },
    { id: 'scam',       name: 'Scam',       icon: 'assets/images/scam.png',       selected: false },
    { id: 'unblocking', name: 'Unblocking', icon: 'assets/images/unblocking.png', selected: false },
    { id: 'blocking',   name: 'Blocking',   icon: 'assets/images/blocking.png',   selected: false }
  ];

  citizenCharterServices: CitizenCharterService[] = [
    { id: 1, name: 'Citizen Charter Service #1 : Radio Operator Examination',
      details: 'Requirements, fees, and processing time for Radio Operator Examination.', open: false },
    { id: 2, name: 'Citizen Charter Service #2 : Radio Operator Certificate',
      details: 'Requirements, fees, and processing time for Radio Operator Certificate.', open: false },
    { id: 3, name: 'Citizen Charter Service #3 : Certificates, Permits, and Licenses in the Amateur Service',
      details: 'Details for Certificates, Permits, and Licenses in the Amateur Service.', open: false },
    { id: 4, name: 'Citizen Charter Service #4 : Purchase/Possess, Aero, Aircraft',
      details: 'Details about Purchase/Possess, Aero, Aircraft licensing and permits.', open: false },
    { id: 5, name: 'Citizen Charter Service #5-7 : Maritime Service',
      details: 'Requirements, fees, and processing time for Maritime Service.', open: false },
    { id: 6, name: 'Citizen Charter Service #8 : Public Telecom Entities',
      details: 'Details about Public Telecom Entities certification and compliance.', open: false },
    { id: 7, name: 'Citizen Charter Service #9-12 : Government or Private RSL',
      details: 'Details about Government or Private RSL permits and requirements.', open: false },
    { id: 8, name: 'Citizen Charter Service #13 : Temporary Permit to Demonstrate and Propagate for RSL',
      details: 'Details about Temporary Permit to Demonstrate and Propagate for RSL.', open: false },
    { id: 9, name: 'Citizen Charter Service #14 : Radio Communication Equipment',
      details: 'Details about Radio Communication Equipment certification and compliance.', open: false }
  ];

  constructor(private router: Router) {}

  toggle(id: string): void {
    this.checkedOffices[id] = !this.checkedOffices[id];
    if (id === 'cwapu' && !this.checkedOffices['cwapu']) this.resetCwapu();
    if (id === 'eod'   && !this.checkedOffices['eod'])   this.resetEod();
  }

  setEodMode(mode: 'inquiry' | 'assessment'): void {
    this.eodMode = this.eodMode === mode ? null : mode;
    if (this.eodMode !== 'assessment') this.resetCharterList();
  }
  toggleCwapuService(svc: CwapuService): void {
    svc.selected = !svc.selected;
  }
  toggleCharter(charter: CitizenCharterService): void {
    charter.open = !charter.open;
  }
  resetCwapu(): void {
    this.cwapuServices.forEach(s => s.selected = false);
  }
  resetEod(): void {
    this.eodMode = null;
    this.resetCharterList();
  }
  resetCharterList(): void {
    this.citizenCharterServices.forEach(c => c.open = false);
  }
  expandAll(): void {
    this.citizenCharterServices.forEach(c => c.open = true);
  }
  collapseAll(): void {
    this.citizenCharterServices.forEach(c => c.open = false);
  }
  prevStep(): void {
    this.router.navigate(['/visitor-logbook']);
  }
  onSubmit(): void {
    const offices = Object.keys(this.checkedOffices).filter(k => this.checkedOffices[k]);
    console.log('Selected offices:', offices);
    this.router.navigate(['/visitor-logbook/confirm']);
  }
}