const dns = require('dns').promises;

async function verifyDNSSettings() {
  console.log('🔍 DNS 설정 검증 시작...\n');

  const domains = [
    'wizcoco.com',
    'www.wizcoco.com',
    'wiz-coco.web.app'
  ];

  for (const domain of domains) {
    try {
      console.log(`📋 ${domain} 검증 중...`);
      
      // A 레코드 확인
      const aRecords = await dns.resolve4(domain);
      console.log(`  ✅ A 레코드: ${aRecords.join(', ')}`);
      
      // CNAME 레코드 확인 (가능한 경우)
      try {
        const cnameRecords = await dns.resolveCname(domain);
        console.log(`  ✅ CNAME 레코드: ${cnameRecords.join(', ')}`);
      } catch (error) {
        console.log(`  ℹ️  CNAME 레코드: 없음 (정상)`);
      }
      
      // TXT 레코드 확인
      try {
        const txtRecords = await dns.resolveTxt(domain);
        console.log(`  ✅ TXT 레코드: ${txtRecords.flat().join(', ')}`);
      } catch (error) {
        console.log(`  ℹ️  TXT 레코드: 없음`);
      }
      
    } catch (error) {
      console.log(`  ❌ 오류: ${error.message}`);
    }
    console.log('');
  }

  console.log('🎯 Firebase Hosting 연결 확인:');
  console.log('  - wizcoco.com이 199.36.153.89 또는 199.36.153.90으로 연결되어야 함');
  console.log('  - www.wizcoco.com이 wiz-coco.web.app으로 연결되어야 함');
  console.log('  - wiz-coco.web.app이 Firebase Hosting으로 연결되어야 함');
}

verifyDNSSettings().catch(console.error);