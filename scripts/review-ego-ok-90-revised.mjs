/**
 * 개정 90문항 + 타당도 9 — 카테고리 내 중복·유사·쉼표·추천 문장 검토
 * node scripts/review-ego-ok-90-revised.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dir = path.join(root, 'docs/internal-materials/ego-ok');

const draft = JSON.parse(fs.readFileSync(path.join(dir, 'items-90-revised-draft.json'), 'utf8'));
const sourceLines = fs.readFileSync(path.join(dir, 'items-99-source.tsv'), 'utf8').trim().split(/\r?\n/);
const validityFromSource = sourceLines
  .map((line, i) => {
    const tab = line.indexOf('\t');
    const st = line.slice(0, tab);
    const text = line.slice(tab + 1);
    if (!st.startsWith('validity')) return null;
    return { no: i + 1, scaleType: st, text };
  })
  .filter(Boolean);

function plain(text) {
  return text.replace(/@/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function chargrams(text, n = 2) {
  const s = plain(text).replace(/[^\p{L}\p{N}]/gu, '');
  const set = new Set();
  for (let i = 0; i <= s.length - n; i += 1) set.add(s.slice(i, i + n));
  return set;
}

function jaccard(a, b) {
  const sa = chargrams(a);
  const sb = chargrams(b);
  if (!sa.size || !sb.size) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter += 1;
  return inter / (sa.size + sb.size - inter);
}

function stemTheme(text) {
  const t = plain(text);
  if (/간섭|챙기|관여|대신 해결|신경/.test(t)) return '과잉개입·챙김';
  if (/위축|주저|거절|따르|의지|맡기/.test(t)) return '의존·순응·거절곤란';
  if (/계획|차근|합리|객관|사실|이성|기준|수치/.test(t)) return '이성·계획·기준';
  if (/즉흥|충동|기분|감정에/.test(t)) return '충동·감정';
  if (/칭찬|격려|공감|배려|보살/.test(t)) return '양육·공감';
  if (/자신|확신|의심|가치|호감|위축/.test(t)) return '자기가치·확신';
  if (/엄격|비난|단점|잘못|따지/.test(t)) return '타인비판·엄격';
  if (/인정|존중|신뢰|수용/.test(t)) return '타인수용·신뢰';
  if (/밀어붙|주도|지적|원칙|고집/.test(t)) return '통제·원칙';
  return '기타';
}

/** 단일 쉼표 삽입 후보: 「…할 때」「…보다」 뒤 등 */
function suggestComma(text) {
  let s = plain(text);
  if (s.includes(',')) return s;
  const patterns = [
    [/^(.+?(?:할 때|하면|지만|보다|에서|이라도|더라도)) (.+)$/, '$1, $2'],
    [/^(.+?(?:편이다|한다|한다\.))$/, null],
  ];
  for (const [re, repl] of patterns) {
    const m = s.match(re);
    if (m && repl && m[1].length >= 8 && m[2].length >= 8) return s.replace(re, repl);
  }
  const mid = Math.floor(s.length / 2);
  const space = s.indexOf(' ', mid - 5);
  if (space > 10 && space < s.length - 10) {
    return `${s.slice(0, space)},${s.slice(space + 1)}`;
  }
  return s;
}

function simplifyHint(text, scaleType) {
  let note = [];
  if (/^나는 나는/.test(text)) note.push('중복 주어');
  if (scaleType.startsWith('i_plus') || scaleType === 'i_plus') {
    const n = (plain(text).match(/^나는 /g) || []).length;
    if (n) note.push('「나는」반복(10문항) — 3~4문항만 유지 권장');
  }
  if (scaleType === 'u_plus' && plain(text).startsWith('나는 ')) {
    note.push('「나는」 — 3문항 연속 시 어조 방어↑');
  }
  if (/대체로|늘 |항상 |무조건 /.test(text)) note.push('절대화 완화 검토');
  return note.join('; ');
}

const scaleOrder = [
  'a_negative', 'a_positive', 'ac_negative', 'ac_positive',
  'cp_negative', 'cp_positive', 'fc_negative', 'fc_positive',
  'i_minus', 'i_plus', 'np_negative', 'np_positive', 'u_minus', 'u_plus',
];

const byScale = {};
for (const it of draft.items) {
  (byScale[it.scaleType] ||= []).push(it);
}

const warnings = [];
for (const st of scaleOrder) {
  const list = byScale[st] || [];
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const sim = jaccard(list[i].text, list[j].text);
      if (plain(list[i].text) === plain(list[j].text)) {
        warnings.push({ st, type: '완전중복', i: i + 1, j: j + 1, sim: 1, a: list[i].text, b: list[j].text });
      } else if (sim >= 0.52) {
        warnings.push({ st, type: '고유사', i: i + 1, j: j + 1, sim, a: list[i].text, b: list[j].text });
      } else if (stemTheme(list[i].text) === stemTheme(list[j].text) && sim >= 0.42) {
        warnings.push({ st, type: '주제중복', i: i + 1, j: j + 1, sim, theme: stemTheme(list[i].text), a: list[i].text, b: list[j].text });
      }
    }
  }
}

const rows = [];
for (const st of scaleOrder) {
  const list = byScale[st] || [];
  list.forEach((it, idx) => {
    const relWarn = warnings.filter((w) => w.st === st && (w.i === idx + 1 || w.j === idx + 1));
    const warnStr = relWarn.map((w) => `${w.type}(#${w.i}↔#${w.j}, sim${(w.sim * 100).toFixed(0)}%)`).join(' · ');
    const recommended = suggestComma(it.text);
    rows.push({
      구분: '성격',
      척도코드: st,
      척도내순번: idx + 1,
      개정문항: plain(it.text),
      중복유사경고: warnStr || '—',
      추천문항: recommended,
      쉼표변경: plain(it.text) === recommended ? 'N' : 'Y',
      기타권고: simplifyHint(it.text, st),
    });
  });
}

for (const v of validityFromSource) {
  rows.push({
    구분: '타당도',
    척도코드: v.scaleType,
    척도내순번: v.no,
    개정문항: plain(v.text),
    중복유사경고: '—',
    추천문항: suggestComma(v.text),
    쉼표변경: plain(v.text) === suggestComma(v.text) ? 'N' : 'Y',
    기타권고: '타당도 — 의미·기대반응 유지, 표현만 다듬기',
  });
}

const header = Object.keys(rows[0]).join('\t');
const tsv = `${header}\n${rows.map((r) => Object.values(r).join('\t')).join('\n')}\n`;
const outTsv = path.join(dir, 'items-90-revised-review.tsv');
const outXlsx = path.join(dir, 'items-90-revised-review.xlsx');
fs.writeFileSync(outTsv, tsv, 'utf8');
const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '검토99');
XLSX.writeFile(wb, outXlsx);

const md = [];
md.push('# 이고-오케이 90문항 개정안 — 검토 요약 (2026-10)');
md.push('');
md.push('**원본 개정안:** [`items-90-revised-draft.json`](./items-90-revised-draft.json)');
md.push('**검토표(엑셀):** [`items-90-revised-review.tsv`](./items-90-revised-review.tsv)');
md.push('');
md.push('## 1. 카테고리 내 중복·유사');
md.push('');
if (!warnings.length) md.push('— 자동 검사: **완전 중복 없음**. 고유사(38%↑) 쌍은 아래.');
else {
  md.push(`— **${warnings.length}건** (완전중복 / 고유사≥38% / 주제+22%)`);
  md.push('');
  md.push('| 척도 | 유형 | # | 유사도 | 문항 A | 문항 B |');
  md.push('| --- | --- | --- | ---: | --- | --- |');
  for (const w of warnings) {
    md.push(`| ${w.st} | ${w.type} | ${w.i}↔${w.j} | ${(w.sim * 100).toFixed(0)}% | ${plain(w.a).slice(0, 36)}… | ${plain(w.b).slice(0, 36)}… |`);
  }
}
md.push('');
md.push('## 2. 해결 방향 (권장)');
md.push('');
md.push('1. **완전중복·고유사:** 같은 척도 안에서 **행동 장면**을 분리 (예: np− 「챙김」 vs 「대신 해결」 → 하나는 *가정*, 하나는 *직장*, 하나는 *거절 못하는 부탁*).');
md.push('2. **주제중복:** 소분류(5문항)마다 **다른 촉발 상황**을 배정 — `item-subscale-diagnosis-ko.json` 5슬롯과 1:1 맞추기.');
md.push('3. **i+ / u+ 「나는」 연속:** 10문항 중 **3~4문항만** 「나는」 유지, 나머지는 「대체로 ~하는 편이다」로 방어·사회적 바람직성 감소.');
md.push('4. **쉼표:** 의미 단위가 바뀌는 지점(대비·원인·양보절) 뒤 1개 — 화면 2줄 규칙(41자↑)과 맞추려면 `@` 또는 `,` 후 줄바꿈.');
md.push('5. **타당도 9:** 문장만 다듬고 **기대 반응·번호(9·15·26·38·48·58·68·78·88)** 유지.');
md.push('');
md.push('## 3. 척도별 주의 (수동 검토)');
md.push('');
md.push('| 척도 | 이슈 | 권장 |');
md.push('| --- | --- | --- |');
md.push('| **np_negative** | 5문항 모두 간섭·챙김·대신해줌 | ①가정 ②직장 ③정서적 걱정 ④해결 대행 ⑤거절 못하는 부탁 — **장면만** 다르게 |');
md.push('| **ac_negative** | 의존·순응·거절곤란·위축 | #2·#4·#5 통합 검토 — **결정 회피** vs **거절 회피** 분리 유지 |');
md.push('| **ac_positive** | #1·#4·#5 모두 양보·맞춤 | #3은 **타인 평가(온화)** #1은 **갈등** #2는 **협업** 으로 역할 고정 |');
md.push('| **a_negative** | #1·#2 모두 차분·무감정 | #1 **타인 인상** #2 **대화 방식** — 유지 가능, 「차분」어휘 한쪽만 사용 |');
md.push('| **a_positive** | #6·#10 모두 차분·합리 | #6 **위기** #10 **문제해결** — OK |');
md.push('| **fc_negative** | #1·#3·#4 충동·즉흥 | #3 **호기심** #1 **기분** #4 **솔직 표현** — #1·#3 유사도 낮추기 |');
md.push('| **i_minus** | #4·#10 결정 불안 | #4 **타인 의견 따름** #10 **결단 지연** — 하나는 **I−**, 하나는 **AC−** 성격에 가깝 → AC− 후보 검토 |');
md.push('| **u_minus** | #4 CP− 성격 혼입 | 「내 기준 우선」→ **cp_negative** 또는 문장을 **타인 평가 까다로움**으로 수정 |');
md.push('| **u_plus** | #5·#6 연속 「나는」+격려 | #5만 「나는」, #6은 「상대의 처지를 헤아리려 한다」 |');
md.push('');
md.push('## 4. 타당도 9문항 (현행 유지·미세 다듬기)');
md.push('');
for (const v of validityFromSource) {
  md.push(`- **${v.no}** \`${v.scaleType}\` — ${plain(v.text)}`);
}
md.push('');
md.push('## 5. 다음 단계');
md.push('');
md.push('1. `items-90-revised-review.tsv`에서 **추천문항** 열 검토 → 확정안을 `items-99-source.tsv` 90성격 슬롯에 반영');
md.push('2. `npm run build:ego-ok-items-99` → `export:ego-ok-items-99-excel`');
md.push('3. VRIN 5쌍(`validity-99-changelog-ko.md`) 문항 번호가 바뀌면 설정 동기화');
md.push('');

fs.writeFileSync(path.join(dir, 'items-90-revised-review-ko.md'), `${md.join('\n')}\n`, 'utf8');

console.log(`Warnings: ${warnings.length}`);
console.log(`Wrote ${outTsv} (${rows.length} rows incl. validity)`);
console.log(`Wrote ${outXlsx}`);
console.log(`Wrote ${path.join(dir, 'items-90-revised-review-ko.md')}`);
