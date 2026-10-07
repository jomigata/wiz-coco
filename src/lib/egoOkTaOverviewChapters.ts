/** 교류분석 요약정리.xls — 종합 요약·TA 참고 탭용 장 제목 (reference, 채점 무관) */
import chapterMeta from '../../docs/internal-materials/ta-overview/chapter-titles.json';

export type TaOverviewChapter = {
  no: number;
  title: string;
  /** xls 셀에 `제N장`으로 직접 적힌 제목 */
  xlsExplicit: boolean;
  /** 한 줄 개요 (요약정리 노트) */
  teaser: string;
};

const TEASERS: Record<number, string> = {
  1: '교류·스트로크·시간·게임·각본을 아우르는 성격·의사소통 이론.',
  2: '에릭 번과 후속 학자들 — 자아상태, 교류, 각본, 스트로크 경제.',
  3: 'P·A·C, 교류·스트로크·각본, 계약과 공개적 의사소통.',
  4: '고전·재결단·커넥시스 — 친교·친밀은 학파 목록에 넣지 않음.',
  5: '자기·타인·관계 이해, I\'m OK · You\'re OK.',
  6: '변화 가능한 가소성, 프로이트 모델과 관찰 가능한 PAC.',
  7: '구조·기능·교류·스트로크·인생태도·시간·게임·각본·자율.',
  8: 'P·A·C 구조 — 빌려온 나, 조율하는 A, 재연하는 C.',
  9: 'CP·NP·A·FC·AC — 대상에 따른 기능적 자아상태.',
  10: '저장·전략·경험·고전·현재 — 이차 구조와 에너지.',
  11: '오염·경계장애·망상·자아상태 병리.',
  12: '이고·오케이 패턴, 형태 이름, 자아 활성화 기법.',
  13: '상보·교차·이면, 의사소통 3규칙, 선택권(options).',
  14: '인정자극의 종류·질·양, 스트로크 경제 5법칙.',
  15: '언스트 OK목장 네 칸, 태도 개선 실천.',
  16: '폐쇄·의식·활동·잡담·게임·친교 — 검사 60문항 순서는 별도.',
  17: '게임 공식, 경품권, 드라마 삼각형, 중단 방법.',
  18: '각본 특성, 무대와 각본, 탈피와 자율 결단.',
  19: '수동성·Discounting — 문제·능력의 과소평가.',
  20: '현실을 각본에 맞게 재규정하는 과정.',
  21: '준거틀(지각의 틀)과 재규정·교류의 재규정.',
  22: '쉬프 — 둘 이상이 한 사람처럼 행동하는 관계.',
  23: '라켓감정·라켓·스탬프, 순수 감정(FC)과의 구분.',
  24: '번·굴딩 금지령, 드라이버 5+주의하라.',
  25: 'Impasse 3유형, Goulding 재결단 개관.',
  26: '승자·패자·평범한(non-winning) 각본.',
  27: '각본진단, 칼러 시간각본, miniscript·드라이버.',
  28: 'A\' 교육 — P 대체, C 혼란 해제, 자각.',
  29: 'Cure — 자각성·자발성·친밀성으로 자율 회복.',
};

export const TA_OVERVIEW_CHAPTERS: TaOverviewChapter[] = chapterMeta.chapters.map((c) => ({
  ...c,
  teaser: TEASERS[c.no] ?? '',
}));

export function formatTaOverviewChapterLabel(ch: TaOverviewChapter): string {
  return `제${ch.no}장 ${ch.title}`;
}

export function taOverviewChapterAnchor(no: number): string {
  return `ta-ch-${no}`;
}

/** 스트로크·시간구조화 — 별도 검사(25·60문항) 이론 요지 */
export const EGO_OK_STROKE_THEORY_SUMMARY = {
  heading: '스트로크 (인정자극)',
  lines: [
    '교류 속에서 존재를 인정한다는 신호 — 신체·언어, 긍정·부정, 조건·무조건.',
    '스트로크 경제 5법칙: 줄 것은 주고, 받을 것은 받고, 거절·자기인정도 허용.',
    'KTAA 스트로크 분석(25문항)은 이고-오케이 보고서 점수와 별도 검사다.',
  ],
};

export const EGO_OK_TIME_STRUCTURING_SUMMARY = {
  heading: '시간의 구조화',
  scales: ['폐쇄', '의식', '잡담', '활동', '게임', '친교'] as const,
  lines: [
    '구조기아를 채우는 여섯 방식 — 스트로크 밀도와 심리적 위험이 함께 변한다.',
    '이론 노트의 활동·잡담 순서·마름모는 설명용; 60문항 검사 척도 배정은 docs/time-structuring.',
  ],
};
