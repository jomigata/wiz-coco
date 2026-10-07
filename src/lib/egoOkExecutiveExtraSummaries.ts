import {
  isPlus243RecommendedStage,
  plus243TierToAscii,
  rawScoreToPlus243Tier,
} from '@/lib/egogram243Plus';
import { formatEgogramEnergyHeadline } from '@/lib/egogramEnergyStageComments';
import { buildEgogramPolarityRows } from '@/lib/egoOkEgogramPolarity';
import { INNER_MIND_ALIGNED_MAX, type InnerMindPair } from '@/lib/egoOkInnerMind';
import type { EgoOkReport, EgoOkScaleScore } from '@/lib/egoOkScoring';

export type ExecutiveExtraAudience = 'counselor' | 'client' | 'both';

export type ExecutiveExtraSummary = {
  id: string;
  title: string;
  body: string;
  audience: ExecutiveExtraAudience;
  relatedTabId?: string;
};

function byId(scales: EgoOkScaleScore[]) {
  return Object.fromEntries(scales.map((s) => [s.id, s])) as Record<
    EgoOkScaleScore['id'],
    EgoOkScaleScore
  >;
}

function stageLine(s: EgoOkScaleScore): string {
  const tier = rawScoreToPlus243Tier(s.raw);
  const rec = isPlus243RecommendedStage(tier.stage) ? '권장 구간' : '조절·보완 참고';
  return `${s.id} ${tier.stage}단계(${plus243TierToAscii(tier)}, ${rec})`;
}

export function buildExecutiveExtraSummaries(
  report: EgoOkReport,
  peakEgograms: EgoOkScaleScore[],
  lowEgograms: EgoOkScaleScore[],
  innerMindPairs: InnerMindPair[],
  formLabel: string,
): ExecutiveExtraSummary[] {
  const ego = byId(report.egogram);
  const cp = ego.CP!;
  const np = ego.NP!;
  const fc = ego.FC!;
  const ac = ego.AC!;
  const a = ego.A!;

  const patternLine = report.pattern243.basicPattern?.trim();
  const summaries: ExecutiveExtraSummary[] = [
    {
      id: 'pattern-243',
      title: '243 패턴 · 기본형',
      audience: 'both',
      relatedTabId: 'egogram',
      body: patternLine
        ? `243 패턴 ${report.patternCode} — ${patternLine} 형에 가깝습니다. 에너지 사용의 큰 그림을 이해할 때 참고하세요.`
        : `243 패턴 ${report.patternCode}입니다. 이고그램·243+ 탭에서 척도별 단계와 함께 보시면 해석이 수월합니다.`,
    },
    {
      id: 'life-position',
      title: '인생태도 · 관계 태도',
      audience: 'client',
      relatedTabId: 'ok-life',
      body: `인생태도 「${report.lifePosition.kind}」 — ${report.lifePosition.summary} (타인 축 ${report.lifePosition.uAxis >= 0 ? '+' : ''}${report.lifePosition.uAxis}, 자기 축 ${report.lifePosition.iAxis >= 0 ? '+' : ''}${report.lifePosition.iAxis})`,
    },
    {
      id: 'strength-energy',
      title: '나의 강점 에너지',
      audience: 'client',
      relatedTabId: 'egogram',
      body: `지금 가장 많이 쓰는 에너지는 ${peakEgograms.map((s) => formatEgogramEnergyHeadline(s)).join(' · ')}입니다. 잘 되는 상황·역할에 이 힘을 의도적으로 쓰면 자신감이 유지되기 쉽습니다.`,
    },
    {
      id: 'growth-energy',
      title: '채워볼 에너지',
      audience: 'client',
      relatedTabId: 'self-help',
      body: `상대적으로 약한 쪽은 ${lowEgograms.map((s) => formatEgogramEnergyHeadline(s)).join(' · ')}입니다. 한 번에 다 바꾸기보다 ${lowEgograms.map((s) => s.id).join('·')} 중 하나만 「한 단계」 실천해 보는 것을 권합니다.`,
    },
    {
      id: 'parent-child-balance',
      title: '부모(CP·NP) · 아이(FC·AC) 균형',
      audience: 'both',
      relatedTabId: 'plus243',
      body: `부모 쪽 CP ${cp.raw} vs NP ${np.raw} (${cp.raw > np.raw ? 'CP가 더 높음 · 기준·비판 쪽' : cp.raw < np.raw ? 'NP가 더 높음 · 돌봄·지지 쪽' : '비슷함'}) · 아이 쪽 FC ${fc.raw} vs AC ${ac.raw} (${fc.raw > ac.raw ? 'FC(표현·자유) 우세' : fc.raw < ac.raw ? 'AC(배려·순응) 우세' : '비슷함'}). 한쪽만 키우면 반대쪽이 줄어 보일 수 있습니다.`,
    },
    {
      id: 'adult-a',
      title: '생각·판단(A) 한 줄',
      audience: 'both',
      relatedTabId: 'self-help',
      body: `${stageLine(a)}. 다른 에너지를 조절하기 전에 「지금 문제가 무엇인지」「한 가지만 바꾸면 뭐가 좋아질지」를 글로 적는 연습이 도움이 됩니다.`,
    },
    {
      id: 'inner-gap',
      title: '겉과 속이 다른 부분',
      audience: 'client',
      relatedTabId: 'inner',
      body: (() => {
        const gaps = innerMindPairs.filter((p) => Math.abs(p.okMinusEgo) > INNER_MIND_ALIGNED_MAX);
        if (gaps.length === 0) {
          return '겉(이고)과 속(오케이) 차이가 큰 척도는 없습니다. 말·행동과 속마음이 비교적 잘 맞는 편입니다.';
        }
        return `차이가 큰 곳: ${gaps.map((p) => `${p.egoShort}(겉 ${p.egoScore}) vs ${p.okShort}(속 ${p.okScore})`).join(' · ')}. 피로·찜찜함이 있다면 이 축부터 대화해 보세요.`;
      })(),
    },
    {
      id: 'polarity-focus',
      title: '부정 표현 · 주의 척도',
      audience: 'both',
      relatedTabId: 'polarity',
      body: (() => {
        const rows = buildEgogramPolarityRows(report.egogram);
        const worst = [...rows].sort((x, y) => y.negativePct - x.negativePct)[0];
        if (!worst || worst.band === 'within40') {
          return '다섯 척도 모두 부정 표현 비율이 40% 이하입니다. 지금의 긍정 사용 리듬을 유지하는 것이 좋습니다.';
        }
        return `부정 비율이 가장 높은 척도는 ${worst.id}(${worst.negativePct}%, ${worst.bandLabel}). 말하기·자기대화에서 부정 표현을 한 단계 줄이는 연습을 함께 정합니다.`;
      })(),
    },
    {
      id: 'validity-counselor',
      title: '상담사 · 응답 신뢰도',
      audience: 'counselor',
      relatedTabId: 'validity',
      body: report.validity
        ? `${report.validity.overallTitle} — ${report.validity.overallSummary} (응답 ${report.answeredCount}문항 기준)`
        : `타당도 프로파일 없음 · 응답 ${report.answeredCount}문항. 타당도 탭에서 세부 지표를 확인하세요.`,
    },
    {
      id: 'opening-question',
      title: '대화 시작 질문 제안',
      audience: 'counselor',
      relatedTabId: 'cover',
      body: (() => {
        const peakId = peakEgograms[0]?.id ?? 'NP';
        const lowId = lowEgograms[0]?.id ?? 'A';
        const form = formLabel && formLabel !== '—' ? ` (${formLabel})` : '';
        return `「${report.lifePosition.kind}」 인생태도${form}를 염두에 두고, 「${peakId} 에너지가 잘 드러난 최근 상황」과 「${lowId}이(가) 부족했다고 느낀 순간」을 각각 하나씩 이야기해 주실 수 있을까요?」로 시작하면 흐름 잡기 쉽습니다.`;
      })(),
    },
  ];

  return summaries;
}
