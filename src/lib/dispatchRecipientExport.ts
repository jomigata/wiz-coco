import * as XLSX from 'xlsx';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { formatPhoneDisplay } from '@/lib/phoneFormat';
import type { DispatchRecipient } from '@/lib/clientPortalApi';

function textCell(value: string): XLSX.CellObject {
  return { t: 's', v: value, z: '@' };
}

function notifyStatusText(r: DispatchRecipient): string {
  const status = r.notifyStatus || 'not_sent';
  if (status === 'sent') return '발송 성공';
  if (status === 'failed') return '발송 실패';
  if (status === 'skipped') return '발송 생략';
  if (status === 'pending') return '발송 대기';
  if (status === 'not_sent') return '미발송';
  return status;
}

function testStatusText(r: DispatchRecipient): string {
  if (r.testStatus === 'completed') return '검사 완료';
  if (r.testStatus === 'in_progress') return `${r.completedCount}/${r.requiredCount}`;
  return '미실시';
}

function formatNotifyAt(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return String(iso);
  }
}

export type DispatchExportMeta = {
  title: string;
  cohortName: string;
  joinAccessCode: string;
};

/** 선택 내담자 발송·검사 현황 Excel 다운로드 */
export function downloadDispatchRecipientsExcel(
  recipients: DispatchRecipient[],
  meta: DispatchExportMeta,
): void {
  if (!recipients.length) return;

  const ws: XLSX.WorkSheet = {};
  const headers = [
    '이름',
    '이메일',
    '휴대폰',
    '나의코드',
    '검사코드',
    '발송일시',
    '발송',
    '검사',
  ];
  headers.forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: 0, c })] = textCell(h);
  });

  recipients.forEach((r, idx) => {
    const row = idx + 1;
    const cells = [
      r.displayName || '',
      r.email || '',
      formatPhoneDisplay(r.phone || ''),
      r.myCode || '',
      formatAccessCodeDisplay(r.joinAccessCode || meta.joinAccessCode),
      formatNotifyAt(r.notifyAt),
      notifyStatusText(r),
      testStatusText(r),
    ];
    cells.forEach((val, c) => {
      ws[XLSX.utils.encode_cell({ r: row, c })] = textCell(val);
    });
  });

  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: recipients.length, c: headers.length - 1 },
  });
  ws['!cols'] = [
    { wch: 12 },
    { wch: 28 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '발송검사현황');
  const code = formatAccessCodeDisplay(meta.joinAccessCode).replace(/\s/g, '');
  XLSX.writeFile(wb, `wizcoco-dispatch-${code || 'list'}-${Date.now()}.xlsx`);
}

/** 선택 내담자 발송·검사 현황 인쇄 */
export function printDispatchRecipients(
  recipients: DispatchRecipient[],
  meta: DispatchExportMeta,
): void {
  if (!recipients.length || typeof window === 'undefined') return;

  const joinCode = formatAccessCodeDisplay(meta.joinAccessCode);
  const rows = recipients
    .map(
      (r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(r.displayName || '—')}</td>
      <td>${escapeHtml(r.email || '—')}</td>
      <td>${escapeHtml(formatPhoneDisplay(r.phone || '') || '—')}</td>
      <td>${escapeHtml(r.myCode || '—')}</td>
      <td>${escapeHtml(formatNotifyAt(r.notifyAt) || '—')}</td>
      <td>${escapeHtml(notifyStatusText(r))}</td>
      <td>${escapeHtml(testStatusText(r))}</td>
    </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>발송 및 검사 현황</title>
  <style>
    body { font-family: 'Malgun Gothic', sans-serif; font-size: 12px; padding: 16px; color: #111; }
    h1 { font-size: 16px; margin: 0 0 8px; }
    .meta { margin-bottom: 16px; color: #444; line-height: 1.6; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #f0f0f0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>발송 및 검사 현황</h1>
  <div class="meta">
    ${meta.cohortName ? `<div>기관/단체/그룹명: ${escapeHtml(meta.cohortName)}</div>` : ''}
    <div>검사코드: ${escapeHtml(joinCode)}</div>
    <div>검사명: ${escapeHtml(meta.title || '—')}</div>
    <div>출력: ${escapeHtml(new Date().toLocaleString('ko-KR'))} · ${recipients.length}명</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>No.</th><th>이름</th><th>이메일</th><th>휴대폰</th><th>나의코드</th>
        <th>발송일시</th><th>발송</th><th>검사</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  printHtmlDocument(html);
}

function printHtmlDocument(html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    printHtmlViaIframe(html);
    return;
  }

  const revoke = () => URL.revokeObjectURL(url);
  const triggerPrint = () => {
    try {
      win.focus();
      win.print();
    } catch {
      /* ignore */
    }
  };

  win.addEventListener('load', triggerPrint, { once: true });
  win.addEventListener('beforeunload', revoke, { once: true });
  setTimeout(revoke, 120_000);
}

function printHtmlViaIframe(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', '발송 및 검사 현황 인쇄');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const win = iframe.contentWindow;
  if (!win) {
    iframe.remove();
    return;
  }

  const cleanup = () => iframe.remove();
  win.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(cleanup, 120_000);
  win.focus();
  win.print();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
