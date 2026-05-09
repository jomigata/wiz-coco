/**
 * 루트 AppChrome에서 Navigation을 단일 렌더링하도록,
 * src/app 이하 페이지·레이아웃에 남아 있는 중복 Navigation import/JSX를 제거합니다.
 * (수동 검토: MBTI 페이지는 별도로 상단 네비 숨김 훅을 연결함)
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'src/app');

function walkTsx(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkTsx(p, acc);
    else if (/\.(tsx|jsx)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

const importReList = [
  /^\s*import\s+Navigation\s+from\s+['"]@\/components\/Navigation['"];\s*\r?\n?/gm,
  /^\s*import\s+Navigation\s+from\s+['"]\.\.\/\.\.\/components\/Navigation['"];\s*\r?\n?/gm,
  /^\s*import\s+Navigation\s+from\s+['"]\.\.\/components\/Navigation['"];\s*\r?\n?/gm,
];

function stripNavigationJsx(s) {
  let out = s;

  // { cond && <Navigation />}
  out = out.replace(/\{\s*[^\n{}]*&&\s*\n?\s*<Navigation\s*\/>\s*\}/g, '');

  // 단독 <Navigation />
  out = out.replace(/^\s*<Navigation\s*\/>\s*\r?\n?/gm, '');

  // fixed 래퍼 + Navigation (여러 클래스 변형)
  out = out.replace(
    /<div\s+className="fixed\s+[^"]*z-50[^"]*"[^>]*>\s*\r?\n\s*<Navigation\s*\/>\s*\r?\n\s*<\/div>\s*\r?\n?/g,
    '',
  );
  out = out.replace(
    /<div\s+className="fixed\s+left-0\s+right-0\s+top-0\s+z-50"[^>]*>\s*\r?\n\s*<Navigation\s*\/>\s*\r?\n\s*<\/div>\s*\r?\n?/g,
    '',
  );

  return out;
}

let changed = 0;
for (const file of walkTsx(root)) {
  const rel = path.relative(process.cwd(), file);
  if (rel.includes('strip-inline-navigation')) continue;

  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes('Navigation')) continue;

  let next = s;
  for (const re of importReList) {
    next = next.replace(re, '');
  }
  next = stripNavigationJsx(next);

  if (next !== s) {
    fs.writeFileSync(file, next, 'utf8');
    console.log('updated:', rel);
    changed++;
  }
}

console.log('done, files changed:', changed);
