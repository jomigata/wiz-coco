/**
 * 치료프로그램 카탈로그 — 상담사 케어 플랜 할당용 (T-2-02)
 */
import type {
  CareProgramCategory,
  CareProgramDefinition,
  CareProgramDifficulty,
  CareProgramSession,
  CareProgramSummary,
} from '@/types/careProgram';
import { CARE_PROGRAM_CATALOG_VERSION } from '@/types/careProgram';

const CATEGORY_LABELS: Record<CareProgramCategory, string> = {
  relaxation: '이완·호흡',
  cbt: '인지행동(CBT)',
  mindfulness: '마음챙김',
  journaling: '일기·기록',
  behavioral: '행동 활성화',
  psychoeducation: '심리교육',
};

const DIFFICULTY_LABELS: Record<CareProgramDifficulty, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '심화',
};

function session(
  id: string,
  week: number,
  title: string,
  instructions: string,
  opts?: Partial<CareProgramSession>,
): CareProgramSession {
  return {
    id,
    week,
    title,
    instructions,
    kind: 'exercise',
    ...opts,
  };
}

const PROGRAMS: CareProgramDefinition[] = [
  {
    programId: 'breathing_relaxation_v1',
    version: '1.0',
    title: '4주 호흡·이완 프로그램',
    subtitle: '복식호흡과 4-7-8 호흡으로 불안·긴장 완화',
    category: 'relaxation',
    categoryLabel: CATEGORY_LABELS.relaxation,
    description:
      '불안·스트레스 시 신체 긴장을 낮추기 위한 단계별 호흡·이완 연습입니다. 매 세션 10~15분, 주 3회 권장.',
    targetAudience: '불안·스트레스·수면 어려움 내담자',
    durationWeeks: 4,
    sessionsPerWeek: 3,
    totalSessions: 12,
    difficulty: 'beginner',
    difficultyLabel: DIFFICULTY_LABELS.beginner,
    tags: ['호흡', '이완', '불안', '수면'],
    evidenceBasis: '복식호흡·이완 훈련 — 불안 감소에 널리 사용되는 자기조절 기법',
    defaultDueDays: 28,
    isActive: true,
    sessions: [
      session('br_w1_d1', 1, '복식호흡 기초', '편안한 자세로 배에 손을 올리고 4초 들이마시기·6초 내쉬기를 10회 반복합니다.', {
        kind: 'practice',
        durationMinutes: 10,
        day: 1,
      }),
      session('br_w1_d3', 1, '4-7-8 호흡 입문', '4초 흡기·7초 정지·8초 호기를 4회 반복합니다. 어지러우면 횟수를 줄이세요.', {
        kind: 'practice',
        durationMinutes: 12,
        day: 3,
      }),
      session('br_w1_d5', 1, '긴장 부위 스캔', '호흡 전 어깨·턱·복부 긴장을 1~5점으로 기록하고 이완 후 다시 평가합니다.', {
        kind: 'check_in',
        durationMinutes: 15,
        day: 5,
        prompt: '오늘 가장 긴장된 신체 부위는 어디였나요?',
      }),
      session('br_w2_d1', 2, '호흡 + 시각화', '복식호흡 5회 후, 편안한 장소를 떠올리며 5분간 머무릅니다.', {
        kind: 'practice',
        durationMinutes: 15,
        day: 1,
      }),
      session('br_w2_d3', 2, '일상 호흡 연결', '하루 중 3번(아침·점심·저녁) 1분 호흡을 실천하고 기록합니다.', {
        kind: 'reflection',
        durationMinutes: 10,
        day: 3,
        prompt: '오늘 호흡 연습을 한 시간과 느낌을 적어 주세요.',
      }),
      session('br_w2_d5', 2, '스트레스 순간 대처', '스트레스 상황을 떠올리며 4-7-8 호흡 3회를 연습합니다.', {
        kind: 'practice',
        durationMinutes: 12,
        day: 5,
      }),
      session('br_w3_d1', 3, '이동 중 호흡', '걸으며 복식호흡 20보, 앉아서 4-7-8 호흡 4회를 합니다.', {
        kind: 'practice',
        durationMinutes: 12,
        day: 1,
      }),
      session('br_w3_d3', 3, '수면 전 루틴', '잠들기 30분 전 조명을 낮추고 4-7-8 호흡 6회를 반복합니다.', {
        kind: 'practice',
        durationMinutes: 10,
        day: 3,
      }),
      session('br_w3_d5', 3, '주간 점검', '이번 주 호흡 연습이 불안·수면에 미친 영향을 1~10점으로 평가합니다.', {
        kind: 'check_in',
        durationMinutes: 10,
        day: 5,
        prompt: '불안(1~10), 수면 만족(1~10)을 기록하고 변화를 적어 주세요.',
      }),
      session('br_w4_d1', 4, '자기 주도 연습', '지난 3주 중 가장 도움이 된 호흡법을 15분간 자유롭게 연습합니다.', {
        kind: 'practice',
        durationMinutes: 15,
        day: 1,
      }),
      session('br_w4_d3', 4, '위기 대응 카드', '힘들 때 사용할 호흡법·문장을 카드에 적고 한 번 따라 합니다.', {
        kind: 'reflection',
        durationMinutes: 15,
        day: 3,
        prompt: '“지금 힘들 때 나는 ___ 호흡을 ___회 한다.”',
      }),
      session('br_w4_d5', 4, '프로그램 마무리', '4주 동안의 변화와 앞으로 유지할 습관을 정리합니다.', {
        kind: 'check_in',
        durationMinutes: 15,
        day: 5,
        prompt: '가장 효과적이었던 연습과 앞으로의 계획을 적어 주세요.',
      }),
    ],
  },
  {
    programId: 'progressive_muscle_relaxation_v1',
    version: '1.0',
    title: '2주 점진적 근이완(PMR)',
    subtitle: '군부위 순차 이완으로 신체 긴장 완화',
    category: 'relaxation',
    categoryLabel: CATEGORY_LABELS.relaxation,
    description: '손·팔·어깨·얼굴·복부·다리 순으로 긴장 후 이완을 반복하는 PMR 프로그램입니다.',
    targetAudience: '만성 긴장·신체화 증상 내담자',
    durationWeeks: 2,
    sessionsPerWeek: 3,
    totalSessions: 6,
    difficulty: 'beginner',
    difficultyLabel: DIFFICULTY_LABELS.beginner,
    tags: ['PMR', '근이완', '긴장'],
    evidenceBasis: 'Jacobson PMR — 불안·긴장 완화에 효과가 보고된 표준 기법',
    defaultDueDays: 14,
    isActive: true,
    sessions: [
      session('pmr_w1_d1', 1, '상체 PMR', '주먹·팔·어깨·얼굴 순으로 5초 긴장·10초 이완을 반복합니다.', {
        kind: 'practice',
        durationMinutes: 15,
        day: 1,
      }),
      session('pmr_w1_d3', 1, '하체 PMR', '복부·허벅지·종아리·발 순으로 동일하게 연습합니다.', {
        kind: 'practice',
        durationMinutes: 15,
        day: 3,
      }),
      session('pmr_w1_d5', 1, '전신 PMR', '상·하체를 연결해 전신 1회 완주합니다.', {
        kind: 'practice',
        durationMinutes: 20,
        day: 5,
      }),
      session('pmr_w2_d1', 2, '짧은 버전(10분)', '어깨·턱·복부·손만 집중 이완합니다.', {
        kind: 'practice',
        durationMinutes: 10,
        day: 1,
      }),
      session('pmr_w2_d3', 2, '일상 적용', '회의·대화 전 2분 어깨·턱 이완을 실천하고 기록합니다.', {
        kind: 'reflection',
        durationMinutes: 10,
        day: 3,
        prompt: '오늘 PMR을 적용한 상황과 효과를 적어 주세요.',
      }),
      session('pmr_w2_d5', 2, '유지 계획', '앞으로 주 2회 이상 유지할 시간대를 정합니다.', {
        kind: 'check_in',
        durationMinutes: 10,
        day: 5,
        prompt: '유지할 요일·시간과 예상 장애 요인을 적어 주세요.',
      }),
    ],
  },
  {
    programId: 'cbt_thought_record_v1',
    version: '1.0',
    title: '4주 CBT 생각 기록',
    subtitle: '자동적 사고 포착·균형 잡힌 대안 사고',
    category: 'cbt',
    categoryLabel: CATEGORY_LABELS.cbt,
    description: '상황-생각-감정-행동을 기록하고 왜곡된 사고를 점검하는 인지행동 치료 핵심 과제입니다.',
    targetAudience: '우울·불안·부정적 사고 패턴 내담자',
    durationWeeks: 4,
    sessionsPerWeek: 2,
    totalSessions: 8,
    difficulty: 'intermediate',
    difficultyLabel: DIFFICULTY_LABELS.intermediate,
    tags: ['CBT', '인지', '사고기록'],
    evidenceBasis: 'Beck 인지치료 — 사고 기록은 CBT의 핵심 숙제(homework)',
    defaultDueDays: 28,
    isActive: true,
    sessions: [
      session('cbt_w1_d1', 1, '상황·감정 기록', '힘들었던 상황 1건과 그때 느낀 감정(0~100)을 기록합니다.', {
        kind: 'reflection',
        durationMinutes: 15,
        day: 1,
        prompt: '상황 / 감정 / 감정 강도(0~100)',
      }),
      session('cbt_w1_d4', 1, '자동적 사고 포착', '같은 상황에서 떠올랐던 첫 생각을 그대로 적습니다.', {
        kind: 'reflection',
        durationMinutes: 15,
        day: 4,
        prompt: '“나는 ___라고 생각했다.”',
      }),
      session('cbt_w2_d1', 2, '증거 찾기', '생각을 뒷받침하는·반박하는 증거를 각 2개씩 적습니다.', {
        kind: 'reflection',
        durationMinutes: 20,
        day: 1,
        prompt: '지지 증거 / 반박 증거',
      }),
      session('cbt_w2_d4', 2, '균형 잡힌 사고', '더 현실적인 대안 사고 1문장을 작성합니다.', {
        kind: 'reflection',
        durationMinutes: 20,
        day: 4,
        prompt: '대안 사고 / 대안 사고 후 감정 강도(0~100)',
      }),
      session('cbt_w3_d1', 3, '인지 왜곡 라벨링', '자주 쓰는 왜곡(전부아니화, 파국화 등)을 골라 표시합니다.', {
        kind: 'reflection',
        durationMinutes: 20,
        day: 1,
        prompt: '사고 / 해당 왜곡 유형',
      }),
      session('cbt_w3_d4', 3, '행동 실험 계획', '대안 사고를 검증할 작은 행동 1가지를 계획합니다.', {
        kind: 'practice',
        durationMinutes: 15,
        day: 4,
        prompt: '행동 실험 / 예상 결과 / 실제 결과(다음 세션에 기록)',
      }),
      session('cbt_w4_d1', 4, '패턴 정리', '2주간 반복된 상황·사고·감정 패턴을 요약합니다.', {
        kind: 'check_in',
        durationMinutes: 20,
        day: 1,
        prompt: '반복 패턴 3가지',
      }),
      session('cbt_w4_d4', 4, '유지·재발 방지', '앞으로 힘들 때 사용할 사고 점검 질문 3개를 만듭니다.', {
        kind: 'reflection',
        durationMinutes: 15,
        day: 4,
        prompt: '자주 쓸 자기 질문 3개',
      }),
    ],
  },
  {
    programId: 'mood_diary_v1',
    version: '1.0',
    title: '2주 기분 일기',
    subtitle: '매일 기분·에너지·수면 추적',
    category: 'journaling',
    categoryLabel: CATEGORY_LABELS.journaling,
    description: '짧은 일일 기록으로 기분 변화 패턴을 파악합니다. 하루 5~10분.',
    targetAudience: '기분 변동·우울 경향 모니터링 내담자',
    durationWeeks: 2,
    sessionsPerWeek: 7,
    totalSessions: 14,
    difficulty: 'beginner',
    difficultyLabel: DIFFICULTY_LABELS.beginner,
    tags: ['일기', '기분', '모니터링'],
    defaultDueDays: 14,
    isActive: true,
    sessions: Array.from({ length: 14 }, (_, i) => {
      const week = Math.floor(i / 7) + 1;
      const day = (i % 7) + 1;
      return session(`md_w${week}_d${day}`, week, `Day ${i + 1} 기분 기록`, '오늘의 기분·에너지·수면·한 줄 메모를 기록합니다.', {
        kind: 'reflection',
        durationMinutes: 8,
        day,
        prompt: '기분(1~10) / 에너지(1~10) / 수면 시간 / 한 줄 메모',
      });
    }),
  },
  {
    programId: 'mindfulness_breath_v1',
    version: '1.0',
    title: '3주 마음챙김 호흡',
    subtitle: '호흡에 주의를 두는 10분 명상',
    category: 'mindfulness',
    categoryLabel: CATEGORY_LABELS.mindfulness,
    description: '호흡 감각에 집중하며 떠오르는 생각을 관찰하는 마음챙김 입문 프로그램입니다.',
    targetAudience: '산만함·반추·스트레스 내담자',
    durationWeeks: 3,
    sessionsPerWeek: 3,
    totalSessions: 9,
    difficulty: 'beginner',
    difficultyLabel: DIFFICULTY_LABELS.beginner,
    tags: ['마음챙김', '명상', '호흡'],
    defaultDueDays: 21,
    isActive: true,
    sessions: [
      session('mf_w1_d1', 1, '호흡 감각 5분', '코·배의 호흡 감각에 5분간 주의를 둡니다.', {
        kind: 'practice',
        durationMinutes: 10,
        day: 1,
      }),
      session('mf_w1_d3', 1, '생각 내려놓기', '떠오른 생각에 이름을 붙이고 호흡으로 돌아옵니다.', {
        kind: 'practice',
        durationMinutes: 10,
        day: 3,
      }),
      session('mf_w1_d5', 1, '바디 스캔 입문', '발끝부터 머리까지 5분 스캔합니다.', {
        kind: 'practice',
        durationMinutes: 12,
        day: 5,
      }),
      session('mf_w2_d1', 2, '10분 호흡 명상', '호흡에 10분 집중, 산만해져도 판단 없이 복귀합니다.', {
        kind: 'practice',
        durationMinutes: 12,
        day: 1,
      }),
      session('mf_w2_d3', 2, '걷기 명상', '느린 걸음 5분, 발바닥 감각에 주의를 둡니다.', {
        kind: 'practice',
        durationMinutes: 12,
        day: 3,
      }),
      session('mf_w2_d5', 2, '일상 마음챙김', '식사·양치 1가지를 천천히 하며 감각을 기록합니다.', {
        kind: 'reflection',
        durationMinutes: 10,
        day: 5,
        prompt: '어떤 활동을 마음챙김으로 했고 어떤 감각이 느껴졌나요?',
      }),
      session('mf_w3_d1', 3, '15분 통합 연습', '호흡 10분 + 바디 스캔 5분을 연결합니다.', {
        kind: 'practice',
        durationMinutes: 18,
        day: 1,
      }),
      session('mf_w3_d3', 3, '스트레스 순간 STOP', 'Stop-Take a breath-Observe-Proceed 1회 실천합니다.', {
        kind: 'practice',
        durationMinutes: 10,
        day: 3,
      }),
      session('mf_w3_d5', 3, '유지 루틴 설계', '주 3회 고정 시간을 정하고 한 주 계획을 적습니다.', {
        kind: 'check_in',
        durationMinutes: 10,
        day: 5,
        prompt: '명상 요일·시간 / 방해 요인 대처',
      }),
    ],
  },
  {
    programId: 'behavioral_activation_v1',
    version: '1.0',
    title: '4주 행동 활성화',
    subtitle: '작은 활동 계획으로 기분·에너지 회복',
    category: 'behavioral',
    categoryLabel: CATEGORY_LABELS.behavioral,
    description: '즐거움·성취 활동을 계획·실행하며 우울 악순환을 끊는 행동 활성화 프로그램입니다.',
    targetAudience: '우울·무기력·회피 패턴 내담자',
    durationWeeks: 4,
    sessionsPerWeek: 2,
    totalSessions: 8,
    difficulty: 'intermediate',
    difficultyLabel: DIFFICULTY_LABELS.intermediate,
    tags: ['행동활성화', '우울', '활동계획'],
    evidenceBasis: '행동 활성화 — 우울 치료에서 효과가 입증된 핵심 개입',
    defaultDueDays: 28,
    isActive: true,
    sessions: [
      session('ba_w1_d1', 1, '활동 모니터링', '하루 활동과 기분(0~10)을 시간대별로 기록합니다.', {
        kind: 'reflection',
        durationMinutes: 15,
        day: 1,
        prompt: '시간 / 활동 / 기분(0~10)',
      }),
      session('ba_w1_d4', 1, '즐거움·성취 목록', '즐거움 5개·성취 5개 활동을 적습니다.', {
        kind: 'reflection',
        durationMinutes: 20,
        day: 4,
      }),
      session('ba_w2_d1', 2, '주간 활동 계획', '이번 주 작은 활동 3개를 날짜·시간과 함께 계획합니다.', {
        kind: 'practice',
        durationMinutes: 15,
        day: 1,
        prompt: '활동 / 예정일 / 예상 난이도(1~5)',
      }),
      session('ba_w2_d4', 2, '실행·기록', '계획한 활동 중 1개 이상 실행하고 기분 변화를 기록합니다.', {
        kind: 'check_in',
        durationMinutes: 15,
        day: 4,
        prompt: '실행한 활동 / 실행 전·후 기분(0~10)',
      }),
      session('ba_w3_d1', 3, '장애 요인 분석', '실행하지 못한 활동의 이유와 대안을 적습니다.', {
        kind: 'reflection',
        durationMinutes: 15,
        day: 1,
      }),
      session('ba_w3_d4', 3, '난이도 조정', '활동을 더 작은 단계로 쪼개 다시 계획합니다.', {
        kind: 'practice',
        durationMinutes: 15,
        day: 4,
      }),
      session('ba_w4_d1', 4, '루틴 고정', '매주 반복할 활동 2개를 고정 시간에 배치합니다.', {
        kind: 'practice',
        durationMinutes: 15,
        day: 1,
      }),
      session('ba_w4_d4', 4, '4주 회고', '가장 도움이 된 활동과 유지 계획을 정리합니다.', {
        kind: 'check_in',
        durationMinutes: 15,
        day: 4,
        prompt: '효과적 활동 / 유지 계획',
      }),
    ],
  },
  {
    programId: 'sleep_hygiene_v1',
    version: '1.0',
    title: '2주 수면 위생',
    subtitle: '취침 루틴·자극 조절로 수면 질 개선',
    category: 'psychoeducation',
    categoryLabel: CATEGORY_LABELS.psychoeducation,
    description: '수면 일기와 위생 규칙 적용으로 수면 패턴을 개선합니다.',
    targetAudience: '불면·수면 리듬 불규칙 내담자',
    durationWeeks: 2,
    sessionsPerWeek: 3,
    totalSessions: 6,
    difficulty: 'beginner',
    difficultyLabel: DIFFICULTY_LABELS.beginner,
    tags: ['수면', '불면', '위생'],
    defaultDueDays: 14,
    isActive: true,
    sessions: [
      session('sh_w1_d1', 1, '수면 일기 시작', '취침·기상·중간 깸·낮 졸림을 기록합니다.', {
        kind: 'reflection',
        durationMinutes: 10,
        day: 1,
        prompt: '취침 / 기상 / 총 수면 / 낮 졸림(0~10)',
      }),
      session('sh_w1_d3', 1, '자극 조절 규칙', '침대는 수면·성관계만, 20분 못 자면 일어나기 등 3가지를 실천합니다.', {
        kind: 'practice',
        durationMinutes: 10,
        day: 3,
      }),
      session('sh_w1_d5', 1, '카페인·화면 점검', '오후 2시 이후 카페인·취침 1시간 전 화면 끄기를 기록합니다.', {
        kind: 'check_in',
        durationMinutes: 10,
        day: 5,
      }),
      session('sh_w2_d1', 2, '취침 루틴 30분', '같은 시간에 조명·활동을 줄이는 루틴을 설계합니다.', {
        kind: 'practice',
        durationMinutes: 15,
        day: 1,
        prompt: '취침 30분 전 루틴 3단계',
      }),
      session('sh_w2_d3', 2, '기상 시간 고정', '주말 포함 기상 시간 ±30분 이내로 유지합니다.', {
        kind: 'practice',
        durationMinutes: 10,
        day: 3,
      }),
      session('sh_w2_d5', 2, '2주 수면 요약', '수면 시간·만족도 변화를 정리합니다.', {
        kind: 'check_in',
        durationMinutes: 15,
        day: 5,
        prompt: '평균 수면 시간 / 수면 만족(1~10) 변화',
      }),
    ],
  },
  {
    programId: 'gratitude_journal_v1',
    version: '1.0',
    title: '2주 감사 일기',
    subtitle: '매일 감사한 일 3가지 기록',
    category: 'journaling',
    categoryLabel: CATEGORY_LABELS.journaling,
    description: '긍정 경험에 주의를 기울이는 짧은 일기 프로그램입니다.',
    targetAudience: '우울·부정적 시각 개선 내담자',
    durationWeeks: 2,
    sessionsPerWeek: 7,
    totalSessions: 14,
    difficulty: 'beginner',
    difficultyLabel: DIFFICULTY_LABELS.beginner,
    tags: ['감사', '일기', '긍정'],
    defaultDueDays: 14,
    isActive: true,
    sessions: Array.from({ length: 14 }, (_, i) => {
      const week = Math.floor(i / 7) + 1;
      const day = (i % 7) + 1;
      return session(`gj_w${week}_d${day}`, week, `Day ${i + 1} 감사 기록`, '오늘 감사한 일 3가지와 그 이유를 적습니다.', {
        kind: 'reflection',
        durationMinutes: 8,
        day,
        prompt: '감사 1 / 감사 2 / 감사 3 / 오늘 기분(1~10)',
      });
    }),
  },
];

const PROGRAM_MAP = new Map(PROGRAMS.map((p) => [p.programId, p]));

export function getCareProgramCategoryLabel(category: CareProgramCategory): string {
  return CATEGORY_LABELS[category];
}

export function getCareProgramDifficultyLabel(difficulty: CareProgramDifficulty): string {
  return DIFFICULTY_LABELS[difficulty];
}

export function getAllCarePrograms(activeOnly = true): CareProgramDefinition[] {
  if (!activeOnly) return [...PROGRAMS];
  return PROGRAMS.filter((p) => p.isActive);
}

export function getCareProgramById(programId: string): CareProgramDefinition | undefined {
  return PROGRAM_MAP.get(programId.trim());
}

export function isValidCareProgramId(programId: string): boolean {
  const p = getCareProgramById(programId);
  return Boolean(p?.isActive);
}

export function toCareProgramSummary(program: CareProgramDefinition): CareProgramSummary {
  const { sessions, ...rest } = program;
  return {
    ...rest,
    sessionPreview: sessions.slice(0, 3).map((s) => ({
      id: s.id,
      title: s.title,
      week: s.week,
    })),
  };
}

export function listCareProgramSummaries(opts?: {
  category?: CareProgramCategory;
  activeOnly?: boolean;
}): CareProgramSummary[] {
  let items = getAllCarePrograms(opts?.activeOnly !== false);
  if (opts?.category) {
    items = items.filter((p) => p.category === opts.category);
  }
  return items.map(toCareProgramSummary);
}

export function getCareProgramCatalogMeta() {
  const programs = listCareProgramSummaries();
  const categoryCounts = new Map<CareProgramCategory, number>();
  for (const p of programs) {
    categoryCounts.set(p.category, (categoryCounts.get(p.category) || 0) + 1);
  }
  return {
    catalogVersion: CARE_PROGRAM_CATALOG_VERSION,
    programs,
    categories: (Object.keys(CATEGORY_LABELS) as CareProgramCategory[]).map((id) => ({
      id,
      label: CATEGORY_LABELS[id],
      count: categoryCounts.get(id) || 0,
    })).filter((c) => c.count > 0),
  };
}

export { CARE_PROGRAM_CATALOG_VERSION, CATEGORY_LABELS, DIFFICULTY_LABELS };
