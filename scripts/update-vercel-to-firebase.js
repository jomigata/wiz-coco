const fs = require('fs');
const path = require('path');

// 변경할 내용 정의
const replacements = [
  {
    from: 'https://generate-secret.vercel.app/32',
    to: 'https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk'
  },
  {
    from: 'vercel.app',
    to: 'web.app'
  },
  {
    from: 'vercel.com',
    to: 'firebase.google.com'
  }
];

// docs 폴더 내의 모든 .md 파일 찾기
function findMarkdownFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (item.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 파일 내용에서 문자열 교체
function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    for (const replacement of replacements) {
      if (content.includes(replacement.from)) {
        content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
        changed = true;
        console.log(`✅ ${filePath}: ${replacement.from} → ${replacement.to}`);
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ ${filePath} 처리 중 오류:`, error.message);
    return false;
  }
}

// 메인 실행 함수
function main() {
  console.log('🚀 Vercel → Firebase 링크 변경 시작...\n');
  
  const docsDir = path.join(__dirname, '..', 'docs');
  const markdownFiles = findMarkdownFiles(docsDir);
  
  console.log(`📁 발견된 마크다운 파일: ${markdownFiles.length}개\n`);
  
  let changedCount = 0;
  
  for (const file of markdownFiles) {
    if (replaceInFile(file)) {
      changedCount++;
    }
  }
  
  console.log(`\n🎉 완료! ${changedCount}개 파일이 변경되었습니다.`);
  
  // 추가로 확인해야 할 파일들
  const additionalFiles = [
    'env.local.example',
    'deploy-firebase.bat',
    '.github/workflows/deploy.yml',
    '.github/workflows/ci.yml'
  ];
  
  console.log('\n📋 추가 확인이 필요한 파일들:');
  for (const file of additionalFiles) {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`  - ${file}`);
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { main, replacements };
