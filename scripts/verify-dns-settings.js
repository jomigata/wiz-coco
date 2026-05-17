const dns = require('dns').promises;
const https = require('https');

const FIREBASE_A = new Set(['199.36.153.89', '199.36.153.90']);
const CLOUDFLARE_NS = new Set([
  'miles.ns.cloudflare.com',
  'jasmine.ns.cloudflare.com',
]);
const COM_WWW_CNAME_TARGET = 'wiz-coco.web.app';

async function resolveA(domain) {
  try {
    return await dns.resolve4(domain);
  } catch {
    return [];
  }
}

async function resolveCname(domain) {
  try {
    return await dns.resolveCname(domain);
  } catch {
    return [];
  }
}

async function resolveTxt(domain) {
  try {
    const records = await dns.resolveTxt(domain);
    return records.flat();
  } catch {
    return [];
  }
}

async function resolveNs(domain) {
  try {
    return await dns.resolveNs(domain);
  } catch {
    return [];
  }
}

function fetchHeaders(url, maxRedirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      { method: 'HEAD', timeout: 15000 },
      (res) => {
        resolve({
          statusCode: res.statusCode,
          location: res.headers.location,
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.end();
  });
}

function checkFirebaseA(domain, aRecords) {
  const hit = aRecords.some((ip) => FIREBASE_A.has(ip));
  if (hit) {
    console.log(`  ✅ ${domain} A → Firebase Hosting (${aRecords.join(', ')})`);
    return true;
  }
  if (aRecords.length === 0) {
    console.log(`  ℹ️  ${domain} A 레코드 없음`);
  } else {
    console.log(
      `  ⚠️  ${domain} A = ${aRecords.join(', ')} (Firebase ${[...FIREBASE_A].join('/')} 아님 — Cloudflare 프록시일 수 있음)`
    );
  }
  return false;
}

async function verifyKrNameservers() {
  console.log('📋 wizcoco.kr 네임서버 (DOMAINCLUB → Cloudflare 위임)');
  const ns = await resolveNs('wizcoco.kr');
  if (ns.length === 0) {
    console.log('  ❌ NS 조회 실패');
    return false;
  }
  const normalized = ns.map((n) => n.toLowerCase().replace(/\.$/, ''));
  const ok = normalized.every((n) => CLOUDFLARE_NS.has(n));
  console.log(`  ${ok ? '✅' : '⚠️ '} NS: ${normalized.join(', ')}`);
  if (!ok) {
    console.log(
      `  → DOMAINCLUB에서 miles.ns.cloudflare.com, jasmine.ns.cloudflare.com 로 설정하세요.`
    );
  }
  return ok;
}

async function verifyComHosting() {
  console.log('\n📋 wizcoco.com → Firebase Hosting');
  let ok = true;
  const comA = await resolveA('wizcoco.com');
  if (!checkFirebaseA('wizcoco.com', comA)) ok = false;

  const wwwCname = await resolveCname('www.wizcoco.com');
  if (wwwCname.some((c) => c.includes(COM_WWW_CNAME_TARGET))) {
    console.log(`  ✅ www.wizcoco.com CNAME → ${wwwCname.join(', ')}`);
  } else if (wwwCname.length) {
    console.log(`  ⚠️  www.wizcoco.com CNAME = ${wwwCname.join(', ')}`);
    ok = false;
  } else {
    const wwwA = await resolveA('www.wizcoco.com');
    checkFirebaseA('www.wizcoco.com', wwwA);
  }

  const txt = await resolveTxt('wizcoco.com');
  if (txt.some((t) => t.includes('firebase=') || t.includes('hosting-site='))) {
    console.log(`  ✅ TXT: ${txt.filter((t) => t.includes('firebase') || t.includes('hosting')).join('; ') || txt.join('; ')}`);
  } else if (txt.length) {
    console.log(`  ℹ️  TXT: ${txt.join('; ')}`);
  } else {
    console.log('  ℹ️  TXT: 없음 (Firebase 검증 TXT는 Cloudflare에 추가)');
  }

  return ok;
}

async function verifyKrRedirect() {
  console.log('\n📋 wizcoco.kr → wizcoco.com 리다이렉트 (301/308)');
  const hosts = ['https://wizcoco.kr', 'https://www.wizcoco.kr'];
  let ok = true;

  for (const url of hosts) {
    try {
      const { statusCode, location } = await fetchHeaders(url);
      const redirect = statusCode === 301 || statusCode === 302 || statusCode === 308;
      const toCom =
        location &&
        /^https:\/\/(www\.)?wizcoco\.com/i.test(location);
      if (redirect && toCom) {
        console.log(`  ✅ ${url} → ${statusCode} Location: ${location}`);
      } else if (redirect) {
        console.log(`  ⚠️  ${url} → ${statusCode} Location: ${location} (.com이 아님)`);
        ok = false;
      } else {
        console.log(
          `  ⚠️  ${url} → HTTP ${statusCode} (리다이렉트 없음 — Cloudflare Redirect Rule 설정 필요)`
        );
        ok = false;
      }
    } catch (err) {
      console.log(`  ❌ ${url}: ${err.message}`);
      ok = false;
    }
  }
  return ok;
}

async function verifyWebApp() {
  console.log('\n📋 wiz-coco.web.app');
  const a = await resolveA('wiz-coco.web.app');
  if (a.length) {
    console.log(`  ✅ A: ${a.join(', ')}`);
  } else {
    console.log('  ℹ️  A 없음 (CNAME만 사용 가능)');
  }
}

async function main() {
  console.log('🔍 DNS·리다이렉트 검증 (WizCoCo)\n');
  console.log('가이드: docs/domain-registrar-domainclub-kr.md\n');

  const nsOk = await verifyKrNameservers();
  const comOk = await verifyComHosting();
  const redirectOk = await verifyKrRedirect();
  await verifyWebApp();

  console.log('\n🎯 요약');
  console.log(`  NS (Cloudflare): ${nsOk ? 'OK' : '확인 필요'}`);
  console.log(`  wizcoco.com → Firebase: ${comOk ? 'OK' : 'Cloudflare DNS 점검'}`);
  console.log(`  wizcoco.kr → .com 리다이렉트: ${redirectOk ? 'OK' : 'Cloudflare Redirect Rule 점검'}`);

  if (!nsOk || !comOk || !redirectOk) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
