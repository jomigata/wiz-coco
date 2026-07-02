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

function formatNotifyDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('ko-KR');
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

/** 선택 내담자 검사 현황 인쇄 (미리보기 탭 없이 인쇄 대화상자만) */
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
      <td class="col-no"><span class="cell-1">${i + 1}</span></td>
      <td class="col-name"><span class="cell-1">${escapeHtml(r.displayName || '—')}</span></td>
      <td class="col-email"><span class="cell-2">${escapeHtml(r.email || '—')}</span></td>
      <td class="col-phone"><span class="cell-1">${escapeHtml(formatPhoneDisplay(r.phone || '') || '—')}</span></td>
      <td class="col-code"><span class="cell-1">${escapeHtml(r.myCode || '—')}</span></td>
      <td class="col-date"><span class="cell-1">${escapeHtml(formatNotifyDate(r.notifyAt) || '—')}</span></td>
      <td class="col-status"><span class="cell-1">${escapeHtml(testStatusText(r))}</span></td>
      <td class="col-remarks"><span class="cell-remarks">&nbsp;</span></td>
    </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>검사 현황</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Malgun Gothic', sans-serif; font-size: 11px; padding: 12px; color: #111; }
    h1 { font-size: 15px; margin: 0 0 6px; }
    .meta { margin-bottom: 10px; color: #444; line-height: 1.5; font-size: 11px; }
    table { border-collapse: collapse; width: 100%; table-layout: fixed; }
    th, td {
      border: 1px solid #666;
      padding: 4px 5px;
      text-align: left;
      vertical-align: middle;
      overflow: hidden;
    }
    th { background: #f0f0f0; font-size: 10px; font-weight: 600; white-space: nowrap; }
    th.col-no, td.col-no { text-align: center; }
    .cell-1 {
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.35;
    }
    .cell-2 {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      word-break: break-all;
      line-height: 1.35;
      max-height: 2.7em;
    }
    .cell-remarks {
      display: block;
      min-height: 1.35em;
      line-height: 1.35;
    }
    td.col-remarks, th.col-remarks {
      border: 1px solid #666;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 12mm; }
      th, td { border-color: #333; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <h1>검사 현황</h1>
  <div class="meta">
    ${meta.cohortName ? `<div>기관/단체/그룹명: ${escapeHtml(meta.cohortName)}</div>` : ''}
    <div>검사코드: ${escapeHtml(joinCode)}</div>
    <div>검사명: ${escapeHtml(meta.title || '—')}</div>
    <div>출력: ${escapeHtml(new Date().toLocaleString('ko-KR'))} · ${recipients.length}명</div>
  </div>
  <table>
    <colgroup>
      <col style="width:4%" />
      <col style="width:9%" />
      <col style="width:24%" />
      <col style="width:12%" />
      <col style="width:9%" />
      <col style="width:11%" />
      <col style="width:11%" />
      <col style="width:8%" />
    </colgroup>
    <thead>
      <tr>
        <th class="col-no">No.</th>
        <th class="col-name">이름</th>
        <th class="col-email">이메일</th>
        <th class="col-phone">휴대폰</th>
        <th class="col-code">나의코드</th>
        <th class="col-date">발송일</th>
        <th class="col-status">검사현황</th>
        <th class="col-remarks">비고</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  printHtmlViaIframe(html);
}

function printHtmlViaIframe(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', '검사 현황 인쇄');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
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

  const cleanup = () => {
    if (iframe.parentNode) iframe.remove();
  };

  win.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(cleanup, 120_000);

  const triggerPrint = () => {
    win.focus();
    win.print();
  };

  if (doc.readyState === 'complete') {
    triggerPrint();
  } else {
    win.addEventListener('load', triggerPrint, { once: true });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
