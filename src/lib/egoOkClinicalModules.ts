import type { EgoOkReport } from '@/lib/egoOkScoring';
import type { EgoOkScaleScore } from '@/lib/egoOkScoring';
import type { OkScaleId } from '@/lib/egoOkScoring';
import { rawScoreToPlus243Tier } from '@/lib/egogram243Plus';
import {
  CLINICAL_MODULE_QUICK_TIP,
  CLINICAL_MODULES_30,
  CLINICAL_MODULE_PART_LABELS,
  type ClinicalModuleDef,
  type ClinicalModuleScaleId,
} from '@/lib/egoOkClinicalModulesCatalog';

const EGO_MAX = 50;
const OK_MAX = 50;

export type ClinicalModuleResult = {
  def: ClinicalModuleDef;
  /** 0–100 참고 지수 (가중 척도·파생식) */
  indexPct: number;
  personalized: string;
  levelLabel: '낮음' | '보통' | '높음';
};

function normEgo(raw: number): number {
  return Math.max(0, Math.min(100, (raw / EGO_MAX) * 100));
}

function normOk(raw: number): number {
  return Math.max(0, Math.min(100, (raw / OK_MAX) * 100));
}

function scaleValue(
  report: EgoOkReport,
  id: ClinicalModuleScaleId,
  invertSet: Set<ClinicalModuleScaleId>,
): number {
  const ego = report.egogram.find((s) => s.id === id);
  if (ego) {
    const n = normEgo(ego.raw);
    return invertSet.has(id) ? 100 - n : n;
  }
  const ok = report.okgram.find((s) => s.id === (id as OkScaleId));
  if (ok) {
    const n = normOk(ok.raw);
    return invertSet.has(id) ? 100 - n : n;
  }
  return 50;
}

function weightedIndex(def: ClinicalModuleDef, report: EgoOkReport): number {
  const invertSet = new Set(def.invert ?? []);
  const entries = Object.entries(def.weights) as [ClinicalModuleScaleId, number][];
  let sumW = 0;
  let sum = 0;
  for (const [id, w] of entries) {
    if (w <= 0) continue;
    sum += scaleValue(report, id, invertSet) * w;
    sumW += w;
  }
  if (sumW <= 0) return 50;
  return Math.round(sum / sumW);
}

function energySumIndex(report: EgoOkReport): number {
  const total = report.egogram.reduce((a, s) => a + s.raw, 0);
  const maxTotal = EGO_MAX * 5;
  return Math.round(Math.max(0, Math.min(100, (total / maxTotal) * 100)));
}

function ratioCpNp(report: EgoOkReport): number {
  const cp = report.egogram.find((s) => s.id === 'CP')!.raw;
  const np = report.egogram.find((s) => s.id === 'NP')!.raw;
  const denom = cp + np || 1;
  return Math.round((cp / denom) * 100);
}

function ratioFcAc(report: EgoOkReport): number {
  const fc = report.egogram.find((s) => s.id === 'FC')!.raw;
  const ac = report.egogram.find((s) => s.id === 'AC')!.raw;
  const denom = fc + ac || 1;
  return Math.round((fc / denom) * 100);
}

function burnoutRisk(report: EgoOkReport): number {
  const cp = normEgo(report.egogram.find((s) => s.id === 'CP')!.raw);
  const ac = normEgo(report.egogram.find((s) => s.id === 'AC')!.raw);
  const fc = normEgo(report.egogram.find((s) => s.id === 'FC')!.raw);
  const np = normEgo(report.egogram.find((s) => s.id === 'NP')!.raw);
  const risk = cp * 0.3 + ac * 0.3 + (100 - fc) * 0.2 + (100 - np) * 0.2;
  return Math.round(risk);
}

function strongHurry(report: EgoOkReport): number {
  const cp = normEgo(report.egogram.find((s) => s.id === 'CP')!.raw);
  const a = normEgo(report.egogram.find((s) => s.id === 'A')!.raw);
  const fc = normEgo(report.egogram.find((s) => s.id === 'FC')!.raw);
  return Math.round(cp * 0.35 + a * 0.35 + (100 - fc) * 0.3);
}

function computeIndex(def: ClinicalModuleDef, report: EgoOkReport): number {
  switch (def.compute) {
    case 'energy_sum':
      return energySumIndex(report);
    case 'ratio_cp_np':
      return ratioCpNp(report);
    case 'ratio_fc_ac':
      return ratioFcAc(report);
    case 'burnout_risk':
      return burnoutRisk(report);
    case 'strong_hurry':
      return strongHurry(report);
    case 'life_position':
      return weightedIndex(def, report);
    case 'weighted':
    default:
      return weightedIndex(def, report);
  }
}

function levelFromIndex(indexPct: number, polarity: ClinicalModuleDef['polarity']): ClinicalModuleResult['levelLabel'] {
  if (polarity === 'neutral') {
    if (indexPct >= 62) return '높음';
    if (indexPct <= 38) return '낮음';
    return '보통';
  }
  if (polarity === 'strength') {
    if (indexPct >= 62) return '높음';
    if (indexPct <= 38) return '낮음';
    return '보통';
  }
  if (indexPct >= 62) return '높음';
  if (indexPct <= 38) return '낮음';
  return '보통';
}

function personalize(def: ClinicalModuleDef, report: EgoOkReport, indexPct: number): string {
  const lp = report.lifePosition;
  switch (def.id) {
    case 1:
      return `243+ ${report.pattern243Plus.codeLabel || report.pattern243Plus.codeAscii} · 이고그램 최고·최저 척도와 함께 프로파일 형태(V·N 등)를 대조하세요.`;
    case 2:
      return `인생태도 ${lp.kind} — ${lp.summary}`;
    case 3:
      return `5척도 합 ${report.egogram.reduce((a, s) => a + s.raw, 0)}/250 → 활력 참고 ${indexPct}%`;
    case 4:
      return `CP ${report.egogram.find((s) => s.id === 'CP')!.raw} · NP ${report.egogram.find((s) => s.id === 'NP')!.raw} → CP 비중 ${indexPct}%`;
    case 5:
      return `FC ${report.egogram.find((s) => s.id === 'FC')!.raw} · AC ${report.egogram.find((s) => s.id === 'AC')!.raw} → FC 비중 ${indexPct}%`;
    case 6: {
      const a = report.egogram.find((s) => s.id === 'A')!;
      const stage = rawScoreToPlus243Tier(a.raw).stage;
      return `A 합계 ${a.raw} · 9단계 ${stage}단계 — 계약·구조화 상담 기반 ${indexPct}%`;
    }
    default:
      return `이고·오케이 가중 참고 지수 ${indexPct}% (모듈 신뢰도 참고 ${def.accuracyPct}%)`;
  }
}

export function buildClinicalModuleResults(report: EgoOkReport): ClinicalModuleResult[] {
  return CLINICAL_MODULES_30.map((def) => {
    const indexPct = computeIndex(def, report);
    return {
      def,
      indexPct,
      personalized: personalize(def, report, indexPct),
      levelLabel: levelFromIndex(indexPct, def.polarity),
    };
  });
}

export function buildClinicalModulesOverviewSection(report: EgoOkReport): string {
  const results = buildClinicalModuleResults(report);
  const topRisk = [...results]
    .filter((r) => r.def.polarity === 'risk')
    .sort((a, b) => b.indexPct - a.indexPct)
    .slice(0, 3);
  const topStrength = [...results]
    .filter((r) => r.def.polarity === 'strength')
    .sort((a, b) => b.indexPct - a.indexPct)
    .slice(0, 3);

  const riskLines = topRisk.map((r) => `· ${r.def.id}. ${r.def.titleKo} — 참고 ${r.indexPct}% (${r.levelLabel})`).join('\n');
  const strengthLines = topStrength
    .map((r) => `· ${r.def.id}. ${r.def.titleKo} — 참고 ${r.indexPct}% (${r.levelLabel})`)
    .join('\n');

  const energy = results.find((r) => r.def.id === 3)!;
  const yesBut = results.find((r) => r.def.id === 22)!;
  const ulterior = results.find((r) => r.def.id === 15)!;

  return [
    '30가지 임상·상담 진단 모듈은 이고·오케이 96문항(이고 50+오케이 40+타당도 6) 점수를 가중·파생한 참고 지수입니다. 임상 진단을 대체하지 않습니다.',
    `Quick Tip — 스크리닝: ${CLINICAL_MODULE_QUICK_TIP.screening}. 저항: ${CLINICAL_MODULE_QUICK_TIP.resistance}.`,
    `현재 활력(3): ${energy.indexPct}% (${energy.levelLabel}). 「예, 하지만」(22): ${yesBut.indexPct}%. 이면교류(15): ${ulterior.indexPct}%.`,
    `주의·개입 후보(리스크 지수 상위):\n${riskLines || '· 해당 없음'}`,
    `자원·강점 후보(역량 지수 상위):\n${strengthLines || '· 해당 없음'}`,
    '아래 카드에서 30모듈 전체(특징·장단점·내담자 맞춤 한 줄)를 확인하세요. 상세 기준은 docs/internal-materials/ta-clinical-modules 를 참고합니다.',
  ].join('\n\n');
}

export { CLINICAL_MODULE_PART_LABELS, CLINICAL_MODULES_30 };

export function formatEgogramSnapshot(egogram: EgoOkScaleScore[]): string {
  return egogram.map((s) => `${s.id} ${s.raw}`).join(' · ');
}
