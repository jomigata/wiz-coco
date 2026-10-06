import type { EgoOkScaleScore } from '@/lib/egoOkScoring';
import { EGO_ENERGY_DISPLAY_NAMES } from '@/lib/egogramEnergyStageComments';
import { plus243RecommendedRawRange } from '@/lib/egogram243Plus';
import { buildSelfHelpTherapyScalePlan } from '@/lib/egogramManualNineStage';

const SCALE_ORDER: EgoOkScaleScore['id'][] = ['CP', 'NP', 'A', 'FC', 'AC'];

const SECTION_LABELS: Record<string, string> = {
  '0': '안내',
  '1': 'CP · 비판적 부모',
  '2': 'NP · 양육적 부모',
  '3': 'A · 성인 자아',
  '4': 'FC · 자유로운 아이',
  '5': 'AC · 순응하는 아이',
};

function formatList(title: string, items: string[]): string {
  if (!items.length) return '';
  return `${title}\n${items.map((line) => `· ${line}`).join('\n')}`;
}

function scaleSection(scale: EgoOkScaleScore): string {
  const plan = buildSelfHelpTherapyScalePlan(scale);
  const name = EGO_ENERGY_DISPLAY_NAMES[scale.id];
  const header = `${scale.id} ${name} · ${plan.raw}점 · ${plan.tierLabel} · ${plan.trait}`;
  return [
    header,
    formatList('상담사가 할 일', plan.counselorTasks),
    formatList('내담자가 스스로 할 일 (자율치료)', plan.clientTasks),
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildSelfHelpTherapySections(egogram: EgoOkScaleScore[]): {
  sectionLabels: Record<string, string>;
  sections: Record<string, string>;
} {
  const { min, max } = plus243RecommendedRawRange();
  const byId = Object.fromEntries(egogram.map((s) => [s.id, s]));
  const sections: Record<string, string> = {
    '0': [
      '243+플러스 9단계(A9~C1) 기준으로, 각 이고그램 척도의 현재 단계에 맞는 상담 개입과 내담자 자율 실천을 정리했습니다.',
      `권장 에너지 구간은 4~6단계(${min}~${max}점)입니다. 1~3단계는 부족, 7~9단계는 과잉 구간으로, 이동 목표는 항상 인접 단계(±1)만 둡니다.`,
      '아래 「내담자가 스스로 할 일」은 원고(2020.04.02) 제3장 기법·태도를 바탕으로 하며, 상담사는 과제·점검·안전을 담당합니다.',
    ].join('\n\n'),
  };

  const map: Record<string, string> = { CP: '1', NP: '2', A: '3', FC: '4', AC: '5' };
  for (const id of SCALE_ORDER) {
    const s = byId[id];
    if (s) sections[map[id]] = scaleSection(s);
  }

  return { sectionLabels: SECTION_LABELS, sections };
}

export const SELF_HELP_THERAPY_SECTION_ORDER = ['0', '1', '2', '3', '4', '5'] as const;
