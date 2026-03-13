import {
  Component,
  Output,
  EventEmitter,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  parseExcelForCoordinates,
  isCoordError,
} from '../../helpers/excel-coordinate.helper';

export interface PlotResult {
  points: { lat: number; lng: number; label?: string }[];
  meta: { latCol: string; lngCol: string; totalRows: number };
}

@Component({
  selector: 'app-excel-coord-upload',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './excel-coord-upload.component.html',
  styleUrls: ['./excel-coord-upload.component.scss'],
})
export class ExcelCoordUploadComponent {
  @Output() plotPoints  = new EventEmitter<PlotResult>();
  @Output() clearPoints = new EventEmitter<void>();

  dragging   = signal(false);
  loading    = signal(false);
  lastResult = signal<PlotResult | null>(null);
  errorMsg   = signal<string | null>(null);

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(): void {
    this.dragging.set(false);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  browseFile(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) this.processFile(f);
    };
    input.click();
  }

  onFileInputChange(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.processFile(f);
  }

  private async processFile(file: File): Promise<void> {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.lastResult.set(null);

    try {
      const result = await parseExcelForCoordinates(file);

      if (isCoordError(result)) {
        this.errorMsg.set(result.message);
        return;
      }

      const plotResult: PlotResult = {
        points: result.points,
        meta: {
          latCol:    result.latCol,
          lngCol:    result.lngCol,
          totalRows: result.totalRows,
        },
      };
      this.lastResult.set(plotResult);
      this.plotPoints.emit(plotResult);

    } catch (err: any) {
      this.errorMsg.set(err?.message ?? 'Failed to read file.');
    } finally {
      this.loading.set(false);
    }
  }

  onClear(e: Event): void {
    e.stopPropagation();
    this.lastResult.set(null);
    this.errorMsg.set(null);
    this.clearPoints.emit();
  }
}