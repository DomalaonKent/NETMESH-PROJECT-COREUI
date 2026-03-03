import { Injectable } from '@angular/core';
import dtrData from '../../../assets/data/dtr.json';

export interface DtrRecord {
  ID: number;
  DTRYEAR: number;
  DTRMONTH: number;
  DTRDAY: number;
  FullName: string;
  In: string;
  Break: string;
  Resume: string;
  Out: string;
  Remark: string;
}

@Injectable({
  providedIn: 'root'
})
export class DailyTimeRecordService {

  private allRecords: DtrRecord[] = dtrData as DtrRecord[];

  getPersonnelList(): string[] {
    return [...new Set(this.allRecords.map(r => r.FullName))].sort();
  }
  getYearList(): number[] {
    return [...new Set(this.allRecords.map(r => r.DTRYEAR))].sort();
  }
  getMonthlyRecords(personnel: string, year: number, month: number): DtrRecord[] {
    const daysInMonth = new Date(year, month, 0).getDate();
    const recordMap = new Map<number, DtrRecord>();
    this.allRecords
      .filter(r =>
        (!personnel || r.FullName === personnel) &&
        r.DTRYEAR  === year &&
        r.DTRMONTH === month
      )
      .forEach(r => recordMap.set(r.DTRDAY, r));

    const result: DtrRecord[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      if (recordMap.has(day)) {
        result.push(recordMap.get(day)!);
      } else {
        const dow    = new Date(year, month - 1, day).getDay();
        const remark = dow === 0 ? 'Sunday' : dow === 6 ? 'Saturday' : '';
        result.push({
          ID: 0,
          DTRYEAR: year,
          DTRMONTH: month,
          DTRDAY: day,
          FullName: personnel,
          In: 'NULL', Break: 'NULL', Resume: 'NULL', Out: 'NULL',
          Remark: remark
        });
      }
    }

    return result;
  }
  getFirstMonth(personnel: string, year: number): number {
    const record = this.allRecords.find(
      r => r.FullName === personnel && r.DTRYEAR === year
    );
    return record ? record.DTRMONTH : 1;
  }
}