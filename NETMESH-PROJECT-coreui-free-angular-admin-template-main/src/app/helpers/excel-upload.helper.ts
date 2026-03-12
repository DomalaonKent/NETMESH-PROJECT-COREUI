import * as XLSX from 'xlsx';

export interface UploadResult<T> {
  successRows: T[];
  failedRows: FailedRow[];
}

export interface FailedRow {
  rowNumber: number;
  reason: string;
  data: Record<string, any>;
}

function isRowCompletelyEmpty(row: Record<string, any>): boolean {
  return Object.values(row).every(
    val => val === undefined || val === null || String(val).trim() === ''
  );
}

export async function readExcelFromUrlWithSummary<T = Record<string, any>>(
  url: string
): Promise<UploadResult<T>> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not download the file. Status: ${response.status}`);
  }

  const fileContent = await response.arrayBuffer();
  return parseWorkbookWithSummary<T>(fileContent);
}

export function readExcelFileWithSummary<T = Record<string, any>>(
  file: File
): Promise<UploadResult<T>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const fileContent = event.target!.result as ArrayBuffer;
        resolve(parseWorkbookWithSummary<T>(fileContent));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Something went wrong while reading the file.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

function parseWorkbookWithSummary<T>(fileContent: ArrayBuffer): UploadResult<T> {
  const workbook = XLSX.read(fileContent, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: null });

  const successRows: T[] = [];
  const failedRows: FailedRow[] = [];

  rawRows.forEach((row, index) => {
    if (isRowCompletelyEmpty(row)) {
      failedRows.push({
        rowNumber: index + 2, 
        reason: 'Row is completely empty.',
        data: row,
      });
    } else {
      const cleaned: Record<string, any> = {};
      for (const key of Object.keys(row)) {
        cleaned[key] = row[key] ?? '';
      }
      successRows.push(cleaned as T);
    }
  });

  return { successRows, failedRows };
}

export async function readExcelFromUrl<T = Record<string, any>>(url: string): Promise<T[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download the file. ${response.status}`);
  const fileContent = await response.arrayBuffer();
  const workbook = XLSX.read(fileContent, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<T>(firstSheet, { defval: '' });
}

export function readExcelFile<T = Record<string, any>>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target!.result as ArrayBuffer;
        const workbook = XLSX.read(fileContent, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const firstSheet = workbook.Sheets[firstSheetName];
        resolve(XLSX.utils.sheet_to_json<T>(firstSheet, { defval: '' }));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Something went wrong.'));
    reader.readAsArrayBuffer(file);
  });
}

export function pickExcelFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx,.xls';
    fileInput.onchange = () => resolve(fileInput.files?.[0] ?? null);
    fileInput.oncancel = () => resolve(null);
    fileInput.click();
  });
}