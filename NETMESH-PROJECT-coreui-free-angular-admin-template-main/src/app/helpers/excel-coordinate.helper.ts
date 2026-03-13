import * as XLSX from 'xlsx';

export interface CoordinatePoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface ExcelCoordResult {
  points:    CoordinatePoint[];
  latCol:    string;
  lngCol:    string;
  totalRows: number;
  skipped:   number;
  labelCol?: string;
}

export interface ExcelCoordError {
  type: 'no_file' | 'no_columns' | 'parse_error';
  message: string;
}

const LAT_PATTERNS = [
  /^lat(itude)?$/i,
  /^y$/i,
  /^lat[_\- ]?(col|column)?$/i,
  /latitude/i,
];

const LNG_PATTERNS = [
  /^lon(gitude)?$/i,
  /^lng$/i,
  /^long$/i,
  /^x$/i,
  /^lon[_\- ]?(col|column)?$/i,
  /longitude/i,
];

const LABEL_PATTERNS = [
  /^(name|label|title|location|place|address|site|store|branch|outlet|description)$/i,
];

function matchesAny(col: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(col.trim()));
}

function detectColumns(headers: string[]): {
  latCol: string | null;
  lngCol: string | null;
  labelCol: string | null;
} {
  let latCol:   string | null = null;
  let lngCol:   string | null = null;
  let labelCol: string | null = null;

  for (const h of headers) {
    if (!latCol   && matchesAny(h, LAT_PATTERNS))   latCol   = h;
    if (!lngCol   && matchesAny(h, LNG_PATTERNS))   lngCol   = h;
    if (!labelCol && matchesAny(h, LABEL_PATTERNS)) labelCol = h;
  }

  return { latCol, lngCol, labelCol };
}

export function parseExcelForCoordinates(
  file: File
): Promise<ExcelCoordResult | ExcelCoordError> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data     = e.target!.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
          defval: null,
          raw:    false, 
        });

        if (!rows.length) {
          resolve({ type: 'parse_error', message: 'The Excel file is empty.' });
          return;
        }

        const headers = Object.keys(rows[0]);
        const { latCol, lngCol, labelCol } = detectColumns(headers);

        if (!latCol || !lngCol) {
          resolve({
            type:    'no_columns',
            message: `Could not find latitude/longitude columns.\n` +
                     `Detected headers: ${headers.join(', ')}\n\n` +
                     `Expected column names like: lat, latitude, lng, lon, longitude, x, y`,
          });
          return;
        }

        const points:    CoordinatePoint[] = [];
        let   skipped = 0;

        for (const row of rows) {
          const rawLat = row[latCol];
          const rawLng = row[lngCol];

          if (rawLat === null || rawLat === undefined ||
              rawLng === null || rawLng === undefined) {
            skipped++;
            continue;
          }

          const lat = parseFloat(String(rawLat).trim());
          const lng = parseFloat(String(rawLng).trim());

          if (isNaN(lat) || isNaN(lng) ||
              lat < -90  || lat > 90   ||
              lng < -180 || lng > 180) {
            skipped++;
            continue;
          }

          const label = labelCol && row[labelCol]
            ? String(row[labelCol]).trim()
            : undefined;

          points.push({ lat, lng, label });
        }

        resolve({
          points,
          latCol,
          lngCol,
          labelCol:  labelCol ?? undefined,
          totalRows: rows.length,
          skipped,
        });

      } catch (err) {
        resolve({
          type:    'parse_error',
          message: `Failed to read Excel file: ${(err as Error).message}`,
        });
      }
    };

    reader.onerror = () =>
      resolve({ type: 'parse_error', message: 'Failed to read the file.' });

    reader.readAsArrayBuffer(file);
  });
}

export function isCoordError(
  result: ExcelCoordResult | ExcelCoordError
): result is ExcelCoordError {
  return 'type' in result;
}