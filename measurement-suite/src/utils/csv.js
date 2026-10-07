import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

function escapeCsvValue(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function writeCsv(filePath, rows) {
  mkdirSync(dirname(filePath), { recursive: true });
  if (rows.length === 0) {
    writeFileSync(filePath, '', 'utf-8');
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvValue(row[h])).join(','));
  }
  writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
}

export function writeJson(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
