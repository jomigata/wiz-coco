import type { EgoOkGender, EgoOkScaleScore } from '@/lib/egoOkScoring';
import { normalizeEgoOkGender } from '@/lib/egoOkScoring';
import {
  plus243StageBand,
  type Pattern243Plus,
  type Plus243Stage,
  type Plus243Tier,
} from '@/lib/egogram243Plus';

const SECTION_LABELS: Record<string, string> = {
  '1': '부모·타인 영역 (CP+NP)',
  '2': '성인 자아 (A)',
  '3': '아이·감정 영역 (FC+AC)',
  '4': '5척도 세부 (9단계 기준)',
};

function genderTone(gender: EgoOkGender): string {
  return gender === 'female' ? '여성' : '남성';
}

function stageNarrative(stage: Plus243Stage, context: string, gender: EgoOkGender): string {
  const band = plus243StageBand(stage);
  const g = genderTone(gender);
  const bandKo =
    band === 'deficit' ? '에너지 사용이 적은 편(1~3단계)' : band === 'normal' ? '균형·권장(4~6단계)' : '에너지 사용이 많은 편(7~9단계)';
  return (
    `${context} — ${g} 기준 9단계 중 ${stage}단계(${bandKo})입니다. ` +
    (band === 'deficit'
      ? '필요할 때 에너지를 키우는 연습·역할 분담을 검토하세요.'
      : band === 'normal'
        ? '일상·관계에서 무리 없이 기능을 쓰기 좋은 구간입니다.'
        : '과한 사용·소진·주변 부담을 점검하고 강도를 낮추는 것이 좋습니다.')
  );
}

function tierLine(label: string, sum: number, tier: Plus243Tier, gender: EgoOkGender): string {
  return `${label} 합계 ${sum}점 · ${stageNarrative(tier.stage, `${label} 그룹`, gender)}`;
}

function scaleLine(s: EgoOkScaleScore, tier: Plus243Tier, gender: EgoOkGender): string {
  return `${s.id} ${s.label} — 합계 ${s.raw}점 · ${stageNarrative(tier.stage, s.label, gender)}`;
}

export function buildPlus243InterpretationSections(
  pattern243Plus: Pattern243Plus,
  egogram: EgoOkScaleScore[],
  genderInput: string | undefined,
): { sectionLabels: Record<string, string>; sections: Record<string, string> } {
  const gender = normalizeEgoOkGender(genderInput);
  const byId = Object.fromEntries(egogram.map((s) => [s.id, s]));
  const sections: Record<string, string> = {
    '1': [
      tierLine('CP+NP', pattern243Plus.groups.cpNp.sum, pattern243Plus.groups.cpNp.tier, gender),
      byId.CP ? scaleLine(byId.CP, pattern243Plus.byScale.CP.tier, gender) : '',
      byId.NP ? scaleLine(byId.NP, pattern243Plus.byScale.NP.tier, gender) : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
    '2': byId.A
      ? scaleLine(byId.A, pattern243Plus.byScale.A.tier, gender)
      : 'A(성인) 데이터 없음',
    '3': [
      tierLine('FC+AC', pattern243Plus.groups.fcAc.sum, pattern243Plus.groups.fcAc.tier, gender),
      byId.FC ? scaleLine(byId.FC, pattern243Plus.byScale.FC.tier, gender) : '',
      byId.AC ? scaleLine(byId.AC, pattern243Plus.byScale.AC.tier, gender) : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
    '4': egogram
      .map((s) => scaleLine(s, pattern243Plus.byScale[s.id].tier, gender))
      .join('\n\n'),
  };
  return { sectionLabels: SECTION_LABELS, sections };
}
