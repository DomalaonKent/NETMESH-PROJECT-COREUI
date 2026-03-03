import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyTimeRecordService } from './DailyTimeRecord.service';

@Component({
  selector: 'app-daily-time-record',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './DailyTimeRecord.component.html',
  styleUrls: ['./DailyTimeRecord.component.scss']
})
export class DailyTimeRecordComponent{


}