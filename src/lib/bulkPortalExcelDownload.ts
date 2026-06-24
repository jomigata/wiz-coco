import * as XLSX from 'xlsx';
import type { ClientPortalBulkRow } from '@/types/clientPortal';

function textCell(value: string): XLSX.CellObject {
  return { t: 's', v: value, z: '@' };
}

function linkCell(url: string): XLSX.CellObject {
  return {
    t: 's',
    v: url,
    l: { Target: url, Tooltip: '검사시작' },
  };
}

function formatPin(pin: string): string {
  const digits = String(pin || '').replace(/\D/g, '');
  return digits.padStart(4, '0').slice(-4);
}

function formatPhone(phone: string): string {
  const raw = String(phone || '').trim();
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) return digits;
  if (digits.length === 10 || digits.length === 11) return `0${digits}`;
  return raw;
}

function resolveMagicUrl(row: ClientPortalBulkRow): string {
  if (row.magicUrl?.startsWith('http')) return row.magicUrl;
  const base =
    typeof window !== 'undefined' ? window.location.origin : '';
  const path = (row.magicPath || '').trim();
  if (!path || !base) return '';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

/** 발급 결과 Excel — 비밀번호·휴대폰 앞자리 0 유지, 매직링크 클릭 가능 */
export function downloadBulkPortalExcel(
  rows: ClientPortalBulkRow[],
  joinAccessCode: string
): void {
  if (!rows.length) return;

  const ws: XLSX.WorkSheet = {};
  const headers = ['이름', '이메일', '휴대폰', '검사코드', '나의코드', '비밀번호', '매직링크'];
  headers.forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: 0, c })] = textCell(h);
  });

  rows.forEach((r, idx) => {
    const row = idx + 1;
    const magicUrl = resolveMagicUrl(r);
    const cells = [
      r.displayName || '',
      r.email || '',
      formatPhone(r.phone || ''),
      r.joinAccessCode || joinAccessCode || '',
      r.myCode || r.accessCode || '',
      formatPin(r.pin),
    ];
    cells.forEach((val, c) => {
      ws[XLSX.utils.encode_cell({ r: row, c })] = textCell(val);
    });
    ws[XLSX.utils.encode_cell({ r: row, c: 6 })] = magicUrl ? linkCell(magicUrl) : textCell('');
  });

  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: rows.length, c: headers.length - 1 },
  });
  ws['!cols'] = [
    { wch: 12 },
    { wch: 28 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 8 },
    { wch: 48 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '발송목록');
  XLSX.writeFile(wb, `wizcoco-group-${Date.now()}.xlsx`);
}
