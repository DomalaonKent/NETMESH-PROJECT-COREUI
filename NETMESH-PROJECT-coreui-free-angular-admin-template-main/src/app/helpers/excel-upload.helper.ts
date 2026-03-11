import * as XLSX from 'xlsx';

export async function readExcelFromUrl<T = Record<string, any>>(url: string): Promise<T[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not download the file. ${response.status}`);
  }

  const fileContent = await response.arrayBuffer();
  const workbook = XLSX.read(fileContent, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];
  const rows: T[] = XLSX.utils.sheet_to_json<T>(firstSheet, { defval: '' });

  return rows;
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
        const rows: T[] = XLSX.utils.sheet_to_json<T>(firstSheet, { defval: '' });

        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Something went wrong.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function pickExcelFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx,.xls';

    fileInput.onchange = () => {
      const selectedFile = fileInput.files?.[0] ?? null;
      resolve(selectedFile);
    };

    fileInput.oncancel = () => {
      resolve(null);
    };

    fileInput.click();
  });
}