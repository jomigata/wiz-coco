/**
 * 상담사가 참여 코드 패키지에 넣을 수 있는 검사 목록
 * psychologyTestMenu에서 href 기준 testId 추출 (중복 제거)
 */

import { testSubMenuItems } from './psychologyTestMenu';

export interface CounselorTestOption {
  testId: string;
  name: string;
}

function testIdFromHref(href: string): string {
  const match = (href || '').match(/\/tests\/(.+)$/);
  return match ? match[1].trim() : '';
}

const seen = new Set<string>();
const list: CounselorTestOption[] = [];

// 일반 참여코드용 문항 (genericJoinQuestions 사용)
list.push({ testId: 'generic', name: '일반 심리 문항 (참여코드용)' });
seen.add('generic');

for (const cat of testSubMenuItems) {
  for (const sub of cat.subcategories || []) {
    for (const item of sub.items || []) {
      const id = testIdFromHref(item.href);
      if (id && !seen.has(id)) {
        seen.add(id);
        list.push({ testId: id, name: item.name || id });
      }
    }
  }
}

/** 상담사 패키지 생성 시 선택 가능한 검사 목록 (testId, name) */
export const counselorAssessmentTestOptions: CounselorTestOption[] = list;
