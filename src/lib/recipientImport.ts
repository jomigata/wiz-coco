import * as XLSX from 'xlsx';
import { formatPhoneDisplay, normalizeRecipientPhone } from '@/lib/phoneFormat';

export type RecipientRow = { displayName: string; phone: string; email: string };

function recipientPhoneFromRaw(raw: unknown): string {
  const normalized = normalizeRecipientPhone(raw);
  return normalized ? formatPhoneDisplay(normalized) : '';
}

function isLegacyEmailPhoneColumnOrder(firstCell: string, secondCell: string): boolean {
  const first = firstCell.trim();
  const second = secondCell.trim();
  if (first.includes('이메일') || second.includes('휴대') || second.includes('전화')) return false;
  if (second.includes('이메일') || second.toLowerCase().includes('email')) return true;
  return false;
}

function parseRowContacts(
  parts: unknown[],
  legacyEmailFirst: boolean,
): { phone: string; email: string } {
  if (legacyEmailFirst) {
    return {
      email: String(parts[1] ?? '').trim().toLowerCase(),
      phone: recipientPhoneFromRaw(parts[2]),
    };
  }
  return {
    phone: recipientPhoneFromRaw(parts[1]),
    email: String(parts[2] ?? '').trim().toLowerCase(),
  };
}

export function parseRecipientSheetRows(rows: unknown[][]): RecipientRow[] {
  if (!rows.length) return [];

  const firstCell = String(rows[0]?.[0] ?? '').trim();
  const secondCell = String(rows[0]?.[1] ?? '').trim();
  const hasHeader = firstCell.includes('이름') || firstCell.toLowerCase().includes('name');
  const startIdx = hasHeader ? 1 : 0;
  const legacyEmailFirst = hasHeader && isLegacyEmailPhoneColumnOrder(firstCell, secondCell);

  const parsed: RecipientRow[] = [];
  for (let i = startIdx; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row?.length) continue;
    const displayName = String(row[0] ?? '').trim();
    if (!displayName) continue;
    const { phone, email } = parseRowContacts(row, legacyEmailFirst);
    parsed.push({
      displayName,
      phone,
      email,
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
  const headerParts = lines[0].split(/[,;\t]/).map((p) => p.trim());
  const hasHeader =
    lines[0].includes('이름') || lines[0].toLowerCase().includes('name');
  const startIdx = hasHeader ? 1 : 0;
  const legacyEmailFirst =
    hasHeader &&
    isLegacyEmailPhoneColumnOrder(headerParts[0] || '', headerParts[1] || '');

  for (let i = startIdx; i < lines.length; i += 1) {
    const parts = lines[i].split(/[,;\t]/).map((p) => p.trim());
    if (!parts[0]) continue;
    const { phone, email } = parseRowContacts(parts, legacyEmailFirst);
    rows.push({
      displayName: parts[0],
      phone,
      email,
    });
  }
  return rows;
}

export function mergeRecipients(manual: RecipientRow[], fromFile: RecipientRow[]): RecipientRow[] {
  const combined = [...manual, ...fromFile].filter((r) => r.displayName.trim());
  const seen = new Set<string>();
  return combined.filter((r) => {
    const key = `${r.displayName}|${r.phone}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatRecipientRowsPreview(rows: RecipientRow[], maxRows = 50): string {
  const header = '이름\t휴대폰\t이메일';
  const lines = rows.slice(0, maxRows).map((row) =>
    [row.displayName, row.phone, row.email].filter(Boolean).join('\t'),
  );
  return [header, ...lines].join('\n');
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

const SAMPLE_ROWS: RecipientRow[] = [
  { displayName: '홍길동', phone: '010-1234-5678', email: 'hong@example.com' },
  { displayName: '김영희', phone: '010-9876-5432', email: '' },
];

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadRecipientSampleText(): void {
  const lines = [
    '이름,휴대폰,이메일',
    ...SAMPLE_ROWS.map((r) => `${r.displayName},${r.phone},${r.email}`),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  triggerBrowserDownload(blob, 'wizcoco-recipient-sample.csv');
}

export function downloadRecipientSampleExcel(): void {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['이름', '휴대폰', '이메일'],
    ...SAMPLE_ROWS.map((r) => [r.displayName, r.phone, r.email]),
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, '명단');
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBrowserDownload(blob, 'wizcoco-recipient-sample.xlsx');
}
