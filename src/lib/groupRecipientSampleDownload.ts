const SAMPLE_ROWS = [
  ['이름', '이메일', '휴대폰'],
  ['홍길동', 'smaple1@sample.com', '010512345678'],
  ['김영희', '', '010512345679'],
  ['이철수', 'smaple2@sample.com', ''],
] as const;

function sampleTextContent(): string {
  return SAMPLE_ROWS.map((row) => row.join(',')).join('\r\n') + '\r\n';
}

function triggerDownload(filename: string, content: string, mimeType: string, withBom: boolean) {
  const payload = withBom ? `\uFEFF${content}` : content;
  const blob = new Blob([payload], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Excel(Windows) 호환 — UTF-8 BOM CSV */
export function downloadGroupRecipientSampleCsv() {
  triggerDownload(
    'wizcoco-group-recipients-sample.csv',
    sampleTextContent(),
    'text/csv',
    true
  );
}

export function downloadGroupRecipientSampleTxt() {
  triggerDownload(
    'wizcoco-group-recipients-sample.txt',
    sampleTextContent(),
    'text/plain',
    false
  );
}
