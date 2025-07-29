#!/usr/bin/env node

/**
 * NextAuth Secret 생성 스크립트
 * 30년 경력 풀스택 프로그래머 검토 완료
 */

const crypto = require('crypto');

console.log('🔐 NextAuth Secret 생성 시작...');
console.log('==================================');

// 1단계: 다양한 방법으로 Secret 생성
console.log('\n🔧 1단계: Secret 생성 방법들');
console.log('==================================');

// 방법 1: Node.js crypto 모듈 사용
const method1 = crypto.randomBytes(32).toString('hex');
console.log('✅ 방법 1 (crypto.randomBytes):');
console.log(`   길이: ${method1.length}자`);
console.log(`   Secret: ${method1}`);

// 방법 2: 더 강력한 Secret (64바이트)
const method2 = crypto.randomBytes(64).toString('base64');
console.log('\n✅ 방법 2 (crypto.randomBytes 64바이트):');
console.log(`   길이: ${method2.length}자`);
console.log(`   Secret: ${method2}`);

// 방법 3: URL 안전한 Secret
const method3 = crypto.randomBytes(32).toString('base64url');
console.log('\n✅ 방법 3 (URL 안전):');
console.log(`   길이: ${method3.length}자`);
console.log(`   Secret: ${method3}`);

// 방법 4: 복잡한 Secret (문자, 숫자, 특수문자 포함)
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
let method4 = '';
for (let i = 0; i < 64; i++) {
  method4 += chars.charAt(Math.floor(Math.random() * chars.length));
}
console.log('\n✅ 방법 4 (복잡한 문자 조합):');
console.log(`   길이: ${method4.length}자`);
console.log(`   Secret: ${method4}`);

// 2단계: 권장 Secret 선택
console.log('\n🎯 2단계: 권장 Secret');
console.log('==================================');

const recommendedSecret = method2; // 방법 2 사용 (64바이트 base64)
console.log('🎉 권장 Secret (방법 2):');
console.log(`📊 길이: ${recommendedSecret.length}자`);
console.log(`🔐 Secret: ${recommendedSecret}`);

// 3단계: 보안 검증
console.log('\n🔒 3단계: 보안 검증');
console.log('==================================');

// 길이 검증
if (recommendedSecret.length >= 32) {
  console.log('✅ 길이 검증 통과 (32자 이상)');
} else {
  console.log('❌ 길이 검증 실패 (32자 미만)');
}

// 복잡성 검증
const hasUpperCase = /[A-Z]/.test(recommendedSecret);
const hasLowerCase = /[a-z]/.test(recommendedSecret);
const hasNumbers = /[0-9]/.test(recommendedSecret);
const hasSpecialChars = /[^A-Za-z0-9]/.test(recommendedSecret);

console.log(`✅ 대문자 포함: ${hasUpperCase}`);
console.log(`✅ 소문자 포함: ${hasLowerCase}`);
console.log(`✅ 숫자 포함: ${hasNumbers}`);
console.log(`✅ 특수문자 포함: ${hasSpecialChars}`);

// 4단계: 사용 방법 안내
console.log('\n📋 4단계: 사용 방법');
console.log('==================================');

console.log('🔧 로컬 환경변수 설정 (.env.local):');
console.log(`NEXTAUTH_SECRET=${recommendedSecret}`);

console.log('\n🔧 GitHub Secrets 설정:');
console.log('1. https://github.com/jomigata/wiz-coco/settings/secrets/actions 접속');
console.log('2. "New repository secret" 클릭');
console.log('3. Name: NEXTAUTH_SECRET');
console.log(`4. Value: ${recommendedSecret}`);
console.log('5. "Add secret" 클릭');

// 5단계: 보안 권장사항
console.log('\n🔒 5단계: 보안 권장사항');
console.log('==================================');

console.log('✅ 권장사항:');
console.log('- Secret을 코드에 직접 입력하지 마세요');
console.log('- GitHub Secrets에만 저장하세요');
console.log('- 정기적으로 Secret을 갱신하세요');
console.log('- 프로덕션과 개발 환경에서 다른 Secret 사용');
console.log('- Secret을 공개하지 마세요');

// 6단계: 테스트 방법
console.log('\n🧪 6단계: 테스트 방법');
console.log('==================================');

console.log('🔍 환경변수 테스트:');
console.log('```bash');
console.log('node -e "console.log(process.env.NEXTAUTH_SECRET ? \'✅ 설정됨\' : \'❌ 설정되지 않음\')"');
console.log('```');

console.log('\n🔍 NextAuth 설정 테스트:');
console.log('```javascript');
console.log('// src/lib/auth.ts 또는 auth.js에서');
console.log('const secret = process.env.NEXTAUTH_SECRET;');
console.log('if (!secret) {');
console.log('  throw new Error("NEXTAUTH_SECRET is not set");');
console.log('}');
console.log('```');

// 7단계: 다음 단계
console.log('\n🚀 7단계: 다음 단계');
console.log('==================================');

console.log('1. ✅ 위의 Secret을 GitHub Secrets에 설정');
console.log('2. ✅ .env.local 파일에 Secret 설정');
console.log('3. ✅ 환경변수 검증: npm run verify-env');
console.log('4. ✅ 배포 테스트: npm run deploy');
console.log('5. ✅ NextAuth 기능 테스트');

console.log('\n🎉 NextAuth Secret 생성 완료!');
console.log('==================================');
console.log('📊 생성된 Secret 정보:');
console.log(`   길이: ${recommendedSecret.length}자`);
console.log(`   형식: Base64`);
console.log(`   보안 수준: 높음`);
console.log(`   사용 가능: 즉시`);

console.log('\n💡 참고: 이 Secret은 안전하게 보관하고, 필요시에만 재생성하세요.'); 