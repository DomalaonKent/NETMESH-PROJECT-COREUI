import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DailyTimeRecordService, DtrRecord } from './DailyTimeRecord.service';

@Component({
  selector: 'app-daily-time-record',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './DailyTimeRecord.component.html',
  styleUrls: ['./DailyTimeRecord.component.scss']
})
export class DailyTimeRecordComponent implements OnInit {

  filteredRecords: DtrRecord[] = [];

  personnelList: string[] = [];
  yearList: number[] = [];
  monthList = [
    { value: 1,  label: 'January'   },
    { value: 2,  label: 'February'  },
    { value: 3,  label: 'March'     },
    { value: 4,  label: 'April'     },
    { value: 5,  label: 'May'       },
    { value: 6,  label: 'June'      },
    { value: 7,  label: 'July'      },
    { value: 8,  label: 'August'    },
    { value: 9,  label: 'September' },
    { value: 10, label: 'October'   },
    { value: 11, label: 'November'  },
    { value: 12, label: 'December'  },
  ];

  selectedPersonnel: string = '';
  selectedYear: number | string = '';
  selectedMonth: number | string = '';

  editingDay: number | null = null;
  editingRemark: string = '';

  constructor(private dtrService: DailyTimeRecordService) {}

  ngOnInit(): void {
    this.personnelList = this.dtrService.getPersonnelList();
    this.yearList      = this.dtrService.getYearList();
    this.selectedPersonnel = this.personnelList[0] ?? '';
    this.selectedYear      = this.yearList[0] ?? '';
    this.selectedMonth     = this.dtrService.getFirstMonth(
      this.selectedPersonnel,
      Number(this.selectedYear)
    );
    this.buildTable();
  }

  onFilterChange(): void {
    this.cancelEdit();
    this.buildTable();
  }

  buildTable(): void {
    const year  = Number(this.selectedYear);
    const month = Number(this.selectedMonth);

    if (!year || !month) {
      this.filteredRecords = Array.from({ length: 31 }, (_, i) => ({
        ID: 0,
        DTRYEAR: year || new Date().getFullYear(),
        DTRMONTH: month || 1,
        DTRDAY: i + 1,
        FullName: '',
        In: 'NULL', Break: 'NULL', Resume: 'NULL', Out: 'NULL',
        Remark: ''
      }));
      return;
    }

    this.filteredRecords = this.dtrService.getMonthlyRecords(
      this.selectedPersonnel,
      year,
      month
    );
  }

  startEdit(rec: DtrRecord): void {
    this.editingDay    = rec.DTRDAY;
    this.editingRemark = rec.Remark ?? '';
  }

  saveRemark(rec: DtrRecord): void {
    this.dtrService.updateRemark(
      rec.ID,
      rec.DTRYEAR,
      rec.DTRMONTH,
      rec.DTRDAY,
      rec.FullName,
      this.editingRemark
    );
    rec.Remark      = this.editingRemark;
    this.editingDay = null;
  }

  cancelEdit(): void {
    this.editingDay = null;
  }

  isWeekend(rec: DtrRecord): boolean {
    if (rec.Remark === 'Saturday' || rec.Remark === 'Sunday') return true;
    if (!rec.DTRYEAR || !rec.DTRMONTH) return false;
    const dow = new Date(rec.DTRYEAR, rec.DTRMONTH - 1, rec.DTRDAY).getDay();
    return dow === 0 || dow === 6;
  }
  hasValue(val: string): boolean {
    return !!val && val !== 'NULL' && val !== '';
  }
  getMonthName(month: number | string): string {
    return this.monthList.find(x => x.value === Number(month))?.label ?? '';
  }
}