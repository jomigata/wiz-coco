/**
 * strip-inline-navigation 이후 남은 빈 fixed 네비 래퍼 div 제거
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

const patterns = [
  /\s*\{\/\*\s*상단 네비게이션\s*\*\/\}\s*\r?\n/g,
  /<div\s+className="fixed\s+top-0\s+left-0\s+right-0\s+z-50">\s*<\/div>\s*\r?\n?/g,
  /<div\s+className="fixed\s+left-0\s+right-0\s+top-0\s+z-50">\s*<\/div>\s*\r?\n?/g,
];

let changed = 0;
for (const file of walkTsx(root)) {
  let s = fs.readFileSync(file, 'utf8');
  let next = s;
  for (const re of patterns) {
    next = next.replace(re, '\n');
  }
  // 연속 빈 줄 정리 (과도하게 줄이지 않음)
  next = next.replace(/\n{4,}/g, '\n\n\n');
  if (next !== s) {
    fs.writeFileSync(file, next, 'utf8');
    console.log('cleaned:', path.relative(process.cwd(), file));
    changed++;
  }
}
console.log('done, files:', changed);
