import { EGO_SCALE_PATTERN_ORDER } from '@/lib/egogram243Plus';
import type { EgoOkScaleScore, EgoScaleId } from '@/lib/egoOkScoring';

export type EgogramContourKind = 'N' | 'inverted-N' | 'V' | 'M' | 'flat' | 'mixed';

const ORDER: EgoScaleId[] = EGO_SCALE_PATTERN_ORDER;

function raws(egogram: EgoOkScaleScore[]): number[] {
  const byId = Object.fromEntries(egogram.map((s) => [s.id, s.raw])) as Record<EgoScaleId, number>;
  return ORDER.map((id) => byId[id] ?? 0);
}

export function classifyEgogramContour(egogram: EgoOkScaleScore[]): EgogramContourKind {
  const [cp, np, a, fc, ac] = raws(egogram);
  const spread = Math.max(cp, np, a, fc, ac) - Math.min(cp, np, a, fc, ac);
  if (spread <= 6) return 'flat';

  const left = (cp + np) / 2;
  const mid = a;
  const right = (fc + ac) / 2;

  if (mid >= left && mid >= right && mid - Math.min(left, right) >= 4) return 'M';
  if (left >= mid && left >= right && left - Math.max(mid, right) >= 3) return 'N';
  if (right >= mid && right >= left && right - Math.max(mid, left) >= 3) return 'inverted-N';
  if (left <= mid && mid <= right && fc + ac >= cp + np + 4) return 'V';
  if (right <= mid && mid <= left && cp + np >= fc + ac + 4) return 'V';

  return 'mixed';
}

const CONTOUR_LABEL: Record<EgogramContourKind, string> = {
  N: 'N형(부모·규범 쪽 상단)',
  'inverted-N': '역N형(아이·감정 쪽 상단)',
  V: 'V형(양 끝·중앙 성인)',
  M: 'M형(성인 A 중심)',
  flat: '평탄형(다섯 척도 고른 편)',
  mixed: '복합형(뚜렷한 단일 곡선보다는 척도별 차이)',
};

export function buildEgogramContourSummary(egogram: EgoOkScaleScore[]): string {
  const kind = classifyEgogramContour(egogram);
  const label = CONTOUR_LABEL[kind];
  const peak = [...egogram].sort((a, b) => b.raw - a.raw)[0]!;
  const low = [...egogram].sort((a, b) => a.raw - b.raw)[0]!;
  return `프로파일 곡선은 ${label}에 가깝습니다. 상대적으로 ${peak.id} 에너지가 두드러지고 ${low.id}는 여유가 있어, 일상에서는 ${peak.label} 쪽 행동이 먼저 드러나기 쉽습니다.`;
}
