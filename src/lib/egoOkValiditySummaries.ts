import { EGO_OK_QUESTIONS } from '@/data/egoOkQuestions';

/** 타당도·VRIN 문항 — 지문 핵심어 요약 (99문항 은행) */
const VALIDITY_KEYWORDS_BY_NO: Record<number, string> = {
  4: '내 방식·밀어붙임',
  7: '순수·천진난만',
  81: '타인 의견·유연',
  9: '성향·마음가짐·짐작',
  38: '밀린 일·마무리·마음',
  68: '칭찬·격려·기분',
  26: '기쁨·분노·정서',
  58: '비교·타인·생각',
  78: '깜빡·착각·실수',
  15: '잘남·부러움',
  48: '밀림·피곤·쉼',
  88: '사람들·서운함·마음속',
};

function plainItemText(no: number): string {
  const q = EGO_OK_QUESTIONS.find((x) => x.no === no);
  return q?.text.replace(/\s+/g, ' ').trim() ?? '';
}

/** 문항 지문에서 짧은 핵심 구절 (타당도 외 성격·VRIN 쌍용) */
export function briefItemPhrase(no: number): string {
  const curated = VALIDITY_KEYWORDS_BY_NO[no];
  if (curated) return curated;
  const text = plainItemText(no);
  if (!text) return `${no}번`;
  const stripped = text
    .replace(/^나는?\s+/, '')
    .replace(/^매사에\s+/, '')
    .replace(/^다른\s+/, '');
  const comma = stripped.indexOf(',');
  const chunk = (comma > 8 ? stripped.slice(0, comma) : stripped.slice(0, 22)).trim();
  return chunk.length > 24 ? `${chunk.slice(0, 22)}…` : chunk;
}

export function formatItemRefs(nos: readonly number[]): string {
  return nos.map((no) => `${no}번(${briefItemPhrase(no)})`).join(', ');
}

export function formatVrinPairRef(aNo: number, bNo: number): string {
  return `${aNo}번(${briefItemPhrase(aNo)}) ↔ ${bNo}번(${briefItemPhrase(bNo)})`;
}
