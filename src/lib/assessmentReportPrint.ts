/**
 * 상담사용 검사 결과 PDF/인쇄 리포트 v2
 */

export type AssessmentReportSection = {
  heading: string;
  lines: string[];
};

export type AssessmentReportInput = {
  title: string;
  subtitle?: string;
  generatedAt?: string;
  clientLabel?: string;
  testName?: string;
  accessCode?: string;
  status?: string;
  sections?: AssessmentReportSection[];
  footerNote?: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReportHtml(input: AssessmentReportInput): string {
  const generatedAt =
    input.generatedAt ||
    new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const metaRows = [
    ['내담자', input.clientLabel || '—'],
    ['검사', input.testName || '—'],
    ['코드', input.accessCode || '—'],
    ['상태', input.status || 'completed'],
    ['발행', generatedAt],
  ];

  const metaTable = metaRows
    .map(
      ([k, v]) =>
        `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`,
    )
    .join('');

  const sections = (input.sections || [])
    .map(
      (sec) => `
      <section class="block">
        <h2>${escapeHtml(sec.heading)}</h2>
        <ul>${sec.lines.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>
      </section>`,
    )
    .join('');

  const footer = input.footerNote
    ? `<p class="footer">${escapeHtml(input.footerNote)}</p>`
    : `<p class="footer">본 리포트는 참고 자료이며 진단 또는 치료를 대체하지 않습니다. WizCoCo · 협회 인증 플랫폼</p>`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(input.title)}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; color: #1e293b; font-size: 11pt; line-height: 1.55; }
    .brand { font-size: 9pt; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; }
    h1 { font-size: 20pt; margin: 0 0 4px; color: #0f172a; }
    .subtitle { color: #475569; margin-bottom: 20px; font-size: 10pt; }
    table.meta { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    table.meta th, table.meta td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    table.meta th { width: 22%; background: #f1f5f9; font-weight: 600; }
    .block { margin-bottom: 18px; page-break-inside: avoid; }
    .block h2 { font-size: 12pt; color: #1d4ed8; border-bottom: 2px solid #bfdbfe; padding-bottom: 4px; margin: 0 0 8px; }
    .block ul { margin: 0; padding-left: 18px; }
    .block li { margin-bottom: 4px; }
    .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #64748b; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="brand">WizCoCo Assessment Report</div>
  <h1>${escapeHtml(input.title)}</h1>
  ${input.subtitle ? `<p class="subtitle">${escapeHtml(input.subtitle)}</p>` : ''}
  <table class="meta">${metaTable}</table>
  ${sections || '<section class="block"><h2>요약</h2><p>상세 결과는 검사 화면에서 확인하세요.</p></section>'}
  ${footer}
</body>
</html>`;
}

function printHtmlViaIframe(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  const win = iframe.contentWindow;
  if (!win) {
    document.body.removeChild(iframe);
    return;
  }

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) document.body.removeChild(iframe);
    }, 500);
  };

  win.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(() => {
    win.focus();
    win.print();
    setTimeout(cleanup, 60_000);
  }, 300);
}

/** Premium 스타일 A4 인쇄/PDF 저장 (브라우저 인쇄 → PDF) */
export function printAssessmentReport(input: AssessmentReportInput): void {
  if (typeof window === 'undefined') return;
  printHtmlViaIframe(buildReportHtml(input));
}

export function buildDefaultResultSections(row: {
  testType?: string;
  email?: string | null;
  uid?: string;
}): AssessmentReportSection[] {
  return [
    {
      heading: '검사 개요',
      lines: [
        `검사 유형: ${row.testType || '미상'}`,
        `참여자 식별: ${row.email || row.uid || '익명 코드'}`,
        '본 결과는 상담·해석 목적의 참고 자료입니다.',
      ],
    },
    {
      heading: '후속 권장',
      lines: [
        '전문 상담사와 결과 해석 상담을 권장합니다.',
        '고위험 징후가 있는 경우 즉시 대면 상담·의료 기관 연계를 검토하세요.',
      ],
    },
  ];
}
