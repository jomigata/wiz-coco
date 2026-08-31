import * as XLSX from 'xlsx';
import type { CounselorAssessment } from '@/lib/assessmentApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';
import { resultStatusCounts } from '@/lib/counselorAssessmentResultDisplay';
import { formatCounselorIssueDate } from '@/lib/counselorListTableStyles';

function textCell(value: string): XLSX.CellObject {
  return { t: 's', v: value, z: '@' };
}

function formatUsageEndDate(iso: string | undefined): string {
  const s = (iso || '').trim();
  if (!s) return '무기한';
  try {
    const d = new Date(`${s}T00:00:00`);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('ko-KR');
  } catch {
    return s;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function assessmentRows(items: CounselorAssessment[]) {
  return items.map((a) => {
    const { dispatchTotal, testComplete } = resultStatusCounts(a);
    return {
      createdAt: formatCounselorIssueDate(a.createdAt),
      accessCode: formatAccessCodeDisplay(a.accessCode),
      org: getAssessmentOrgLabel(a),
      title: (a.title || '—').trim(),
      progress: `${testComplete}/${dispatchTotal}`,
      usageEndDate: formatUsageEndDate(a.usageEndDate),
    };
  });
}

export function exportCounselorAssessments(
  items: CounselorAssessment[],
  mode: 'download' | 'print',
): void {
  if (!items.length) return;
  const rows = assessmentRows(items);

  if (mode === 'download') {
    const ws: XLSX.WorkSheet = {};
    const headers = ['발급일', '상담코드', '그룹명', '소속', '검사완료/전체', '사용 종료일'];
    headers.forEach((h, c) => {
      ws[XLSX.utils.encode_cell({ r: 0, c })] = textCell(h);
    });
    rows.forEach((row, idx) => {
      const r = idx + 1;
      const cells = [
        row.createdAt,
        row.accessCode,
        row.org,
        row.title,
        row.progress,
        row.usageEndDate,
      ];
      cells.forEach((cell, c) => {
        ws[XLSX.utils.encode_cell({ r, c })] = textCell(cell);
      });
    });
    ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 24 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '상담코드');
    XLSX.writeFile(wb, `wizcoco-assessments-${Date.now()}.xlsx`);
    return;
  }

  if (typeof window === 'undefined') return;

  const body = rows
    .map(
      (row, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(row.createdAt)}</td>
      <td>${escapeHtml(row.accessCode)}</td>
      <td>${escapeHtml(row.org)}</td>
      <td>${escapeHtml(row.title)}</td>
      <td>${escapeHtml(row.progress)}</td>
      <td>${escapeHtml(row.usageEndDate)}</td>
    </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>상담코드 목록</title>
  <style>
    body { font-family: 'Malgun Gothic', sans-serif; font-size: 11px; padding: 12px; color: #111; }
    h1 { font-size: 15px; margin: 0 0 10px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #666; padding: 4px 6px; text-align: left; }
    th { background: #f0f0f0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>상담코드 목록 (${items.length}건)</h1>
  <table>
    <thead>
      <tr>
        <th>No.</th>
        <th>발급일</th>
        <th>상담코드</th>
        <th>그룹명</th>
        <th>소속</th>
        <th>검사완료/전체</th>
        <th>사용 종료일</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();
  window.setTimeout(() => iframe.remove(), 1000);
}

export type DeletedAssessmentExportRow = {
  id: string;
  accessCode: string;
  title: string;
  cohortName: string;
  usageEndDate?: string;
  archivedAt?: string | null;
  permanentlyDeletedAt?: string | null;
  testCompleteCount?: number;
  testIncompleteCount?: number;
};

function deletedAssessmentRows(
  items: DeletedAssessmentExportRow[],
  dateField: 'archivedAt' | 'permanentlyDeletedAt',
) {
  return items.map((a) => {
    const testComplete = a.testCompleteCount ?? 0;
    const testIncomplete = a.testIncompleteCount ?? 0;
    const dispatchTotal = testComplete + testIncomplete;
    const deletedAtRaw = dateField === 'archivedAt' ? a.archivedAt : a.permanentlyDeletedAt;
    return {
      deletedAt: formatCounselorIssueDate(deletedAtRaw ?? null),
      accessCode: formatAccessCodeDisplay(a.accessCode),
      org: getAssessmentOrgLabel(a),
      title: (a.title || '—').trim(),
      progress: `${testComplete}/${dispatchTotal}`,
      usageEndDate: formatUsageEndDate(a.usageEndDate),
    };
  });
}

export function exportDeletedAssessments(
  items: DeletedAssessmentExportRow[],
  mode: 'download' | 'print',
  options: {
    dateColumnLabel: '삭제일' | '영구삭제일';
    dateField: 'archivedAt' | 'permanentlyDeletedAt';
    sheetTitle?: string;
    printTitle?: string;
  },
): void {
  if (!items.length) return;
  const rows = deletedAssessmentRows(items, options.dateField);
  const sheetTitle = options.sheetTitle ?? '상담코드';
  const printTitle = options.printTitle ?? '상담코드 목록';

  if (mode === 'download') {
    const ws: XLSX.WorkSheet = {};
    const headers = [
      options.dateColumnLabel,
      '상담코드',
      '그룹명',
      '소속',
      '검사완료/전체',
      '사용 종료일',
    ];
    headers.forEach((h, c) => {
      ws[XLSX.utils.encode_cell({ r: 0, c })] = textCell(h);
    });
    rows.forEach((row, idx) => {
      const r = idx + 1;
      const cells = [
        row.deletedAt,
        row.accessCode,
        row.org,
        row.title,
        row.progress,
        row.usageEndDate,
      ];
      cells.forEach((cell, c) => {
        ws[XLSX.utils.encode_cell({ r, c })] = textCell(cell);
      });
    });
    ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 24 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
    XLSX.writeFile(wb, `wizcoco-${sheetTitle}-${Date.now()}.xlsx`);
    return;
  }

  if (typeof window === 'undefined') return;

  const body = rows
    .map(
      (row, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(row.deletedAt)}</td>
      <td>${escapeHtml(row.accessCode)}</td>
      <td>${escapeHtml(row.org)}</td>
      <td>${escapeHtml(row.title)}</td>
      <td>${escapeHtml(row.progress)}</td>
      <td>${escapeHtml(row.usageEndDate)}</td>
    </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(printTitle)}</title>
  <style>
    body { font-family: 'Malgun Gothic', sans-serif; font-size: 11px; padding: 12px; color: #111; }
    h1 { font-size: 15px; margin: 0 0 10px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #666; padding: 4px 6px; text-align: left; }
    th { background: #f0f0f0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(printTitle)} (${items.length}건)</h1>
  <table>
    <thead>
      <tr>
        <th>No.</th>
        <th>${escapeHtml(options.dateColumnLabel)}</th>
        <th>상담코드</th>
        <th>그룹명</th>
        <th>소속</th>
        <th>검사완료/전체</th>
        <th>사용 종료일</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();
  window.setTimeout(() => iframe.remove(), 1000);
}
