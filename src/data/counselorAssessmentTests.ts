/**
 * 상담사가 상담코드 세트에 넣을 수 있는 검사 목록
 * 기본: 끝까지 되는 검사만 (readyTests) + 상담코드용 일반 문항
 */

import { getVisibleTestMenuItems } from './psychologyTestMenu';
import { isReadyTestId, testIdFromHref } from './readyTests';

export interface CounselorTestOption {
  testId: string;
  name: string;
}

const seen = new Set<string>();
const list: CounselorTestOption[] = [];

list.push({ testId: 'generic', name: '3분 마음 체크' });
seen.add('generic');

for (const cat of getVisibleTestMenuItems()) {
  for (const sub of cat.subcategories || []) {
    for (const item of sub.items || []) {
      const id = testIdFromHref(item.href);
      if (!id || seen.has(id) || !isReadyTestId(id)) continue;
      seen.add(id);
      list.push({ testId: id, name: item.name || id });
    }
  }
}

/** 상담사 상담코드 생성 시 선택 가능한 검사 목록 (testId, name) */
export const counselorAssessmentTestOptions: CounselorTestOption[] = list;
