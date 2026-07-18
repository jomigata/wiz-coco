import * as XLSX from 'xlsx';
import { formatPhoneDisplay, normalizeRecipientPhone } from '@/lib/phoneFormat';

export type RecipientRow = { displayName: string; email: string; phone: string };

function recipientPhoneFromRaw(raw: unknown): string {
  const normalized = normalizeRecipientPhone(raw);
  return normalized ? formatPhoneDisplay(normalized) : '';
}

export function parseRecipientSheetRows(rows: unknown[][]): RecipientRow[] {
  if (!rows.length) return [];

  const firstCell = String(rows[0]?.[0] ?? '').trim();
  const hasHeader = firstCell.includes('이름') || firstCell.toLowerCase().includes('name');
  const startIdx = hasHeader ? 1 : 0;

  const parsed: RecipientRow[] = [];
  for (let i = startIdx; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row?.length) continue;
    const displayName = String(row[0] ?? '').trim();
    if (!displayName) continue;
    parsed.push({
      displayName,
      email: String(row[1] ?? '').trim(),
      phone: recipientPhoneFromRaw(row[2]),
    });
  }
  return parsed;
}

export function parseRecipientText(text: string): RecipientRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const rows: RecipientRow[] = [];
  const startIdx =
    lines[0].includes('이름') || lines[0].toLowerCase().includes('name') ? 1 : 0;

  for (let i = startIdx; i < lines.length; i += 1) {
    const parts = lines[i].split(/[,;\t]/).map((p) => p.trim());
    if (!parts[0]) continue;
    rows.push({
      displayName: parts[0],
      email: parts[1] || '',
      phone: recipientPhoneFromRaw(parts[2] || ''),
    });
  }
  return rows;
}

export function mergeRecipients(manual: RecipientRow[], fromFile: RecipientRow[]): RecipientRow[] {
  const combined = [...manual, ...fromFile].filter((r) => r.displayName.trim());
  const seen = new Set<string>();
  return combined.filter((r) => {
    const key = `${r.displayName}|${r.email}|${r.phone}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function parseRecipientFile(file: File): Promise<RecipientRow[]> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
    return parseRecipientSheetRows(rows);
  }

  const text = await file.text();
  return parseRecipientText(text);
}
