import fs from 'fs';
const p = new URL('../src/app/login/page.tsx', import.meta.url);
let s = fs.readFileSync(p, 'utf8');
s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
s = s.replace(
  /from 'framer-motion';\s*import \{ useFirebaseAuth/,
  "from 'framer-motion';\nimport { useFirebaseAuth",
);
s = s.replace(/flex-col">\s*<div className="h-20"/, 'flex-col">\n    <div className="h-20"');
fs.writeFileSync(p, s);
console.log('fixed login page');
