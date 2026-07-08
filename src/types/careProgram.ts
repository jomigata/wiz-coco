/**
 * 치료프로그램 카탈로그 타입 (T-2-02)
 * careAssignments.programId 가 이 카탈로그의 programId 를 참조합니다.
 */

export const CARE_PROGRAM_CATALOG_VERSION = 1;

export type CareProgramCategory =
  | 'relaxation'
  | 'cbt'
  | 'mindfulness'
  | 'journaling'
  | 'behavioral'
  | 'psychoeducation';

export type CareProgramDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type CareProgramSessionKind = 'exercise' | 'reflection' | 'practice' | 'check_in';

export type CareProgramSession = {
  id: string;
  week: number;
  day?: number;
  title: string;
  kind: CareProgramSessionKind;
  durationMinutes?: number;
  instructions: string;
  /** 일기·성찰형 세션용 질문 */
  prompt?: string;
};

export type CareProgramDefinition = {
  programId: string;
  version: string;
  title: string;
  subtitle?: string;
  category: CareProgramCategory;
  categoryLabel: string;
  description: string;
  targetAudience?: string;
  durationWeeks: number;
  sessionsPerWeek?: number;
  totalSessions: number;
  difficulty: CareProgramDifficulty;
  difficultyLabel: string;
  tags: string[];
  evidenceBasis?: string;
  sessions: CareProgramSession[];
  /** 할당 시 기본 마감일(일) */
  defaultDueDays?: number;
  isActive: boolean;
};

/** 목록 API용 요약 (세션 본문 제외) */
export type CareProgramSummary = Omit<CareProgramDefinition, 'sessions'> & {
  sessionPreview?: Pick<CareProgramSession, 'id' | 'title' | 'week'>[];
};

export type CareProgramCatalogResult = {
  catalogVersion: number;
  programs: CareProgramSummary[];
  categories: Array<{ id: CareProgramCategory; label: string; count: number }>;
};

export type CareProgramDetailResult = {
  catalogVersion: number;
  program: CareProgramDefinition;
};
