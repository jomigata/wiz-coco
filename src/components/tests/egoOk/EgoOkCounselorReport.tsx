'use client';

import { useMemo, useState } from 'react';
import type {
  EgoOkCompositeColumn,
  EgoOkGender,
  EgoOkReport,
  EgoOkScaleScore,
  EgoScaleId,
  LifePositionKind,
  OkScaleId,
} from '@/lib/egoOkScoring';
import {
  buildLowEgogramEnergyInsight,
  buildOffRangeEgogramComment,
  buildPeakEgogramEnergyInsight,
  formatEgogramEnergyHeadline,
} from '@/lib/egogramEnergyStageComments';
import {
  EGO_SCALE_PATTERN_ORDER,
  plus243RecommendedRawRange,
  plus243StageDigitColor,
  plus243TierToAscii,
  rawScoreToPlus243Tier,
  type Pattern243Plus,
  type Plus243ScaleEntry,
  type Plus243Stage,
} from '@/lib/egogram243Plus';
import {
  buildInnerMindPairs,
  INNER_MIND_ALIGNED_MAX,
  type InnerMindPair,
} from '@/lib/egoOkInnerMind';
import { buildPlus243InterpretationSections } from '@/lib/egoOkPlus243Interpretation';
import { EgoOkSelfHelpTherapyPanel } from '@/components/tests/egoOk/EgoOkSelfHelpTherapyPanel';
import {
  buildOkLifeOverviewBlock,
  OK_BAR_DISPLAY_ORDER,
  OK_BAR_POLE_LABEL,
} from '@/lib/egoOkOkLifePosition';
import { resolveEgogramFormLabel } from '@/lib/egoOkFormPattern';
import EgoOkValiditySection from '@/components/tests/egoOk/EgoOkValiditySection';
import { KTAA_GRAPH_ZONES, OK_LABELS, normalizeEgoOkGender } from '@/lib/egoOkScoring';
import { egoOkGenderToLabel } from '@/lib/egoOkTestGender';
import type { ClientInfo } from '@/components/tests/MbtiProClientInfo';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Customized,
  type TooltipProps,
} from 'recharts';
import EgoOkKtaaCompositeChart from '@/components/tests/egoOk/EgoOkKtaaCompositeChart';
import EgoOkCounselorReportTabShell, {
  type CounselorReportTab,
} from '@/components/tests/egoOk/EgoOkCounselorReportTabShell';
import EgoOkReportExecutiveSummary from '@/components/tests/egoOk/EgoOkReportExecutiveSummary';
import EgoOkEgogramPolarityPanel from '@/components/tests/egoOk/EgoOkEgogramPolarityPanel';
import {
  ReportInsightBlock,
  type ReportInsightTone,
} from '@/components/tests/egoOk/egoOkReportInsight';

const THREE_LEVEL_STYLE: Record<string, string> = {
  A: 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/40',
  B: 'bg-sky-500/20 text-sky-200 ring-sky-400/40',
  C: 'bg-amber-500/20 text-amber-100 ring-amber-400/40',
};

function ThreeLevelBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-flex min-w-[2rem] items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold ring-1 ${THREE_LEVEL_STYLE[level] || 'bg-white/10 text-white ring-white/20'}`}
    >
      {level}
    </span>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  compact,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  /** 탭 패널 안에서는 헤더 여백 축소 */
  compact?: boolean;
}) {
  return (
    <section
      className={
        compact ? 'space-y-3' : 'rounded-2xl border-2 border-white bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-indigo-950/80 p-6 shadow-xl shadow-black/30'
      }
    >
      <header className={compact ? 'border-b border-white/10 pb-2' : 'mb-5 border-b border-white pb-4'}>
        <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">{title}</h2>
        {subtitle ? <div className="mt-1 text-xs text-slate-400 sm:text-sm">{subtitle}</div> : null}
      </header>
      {children}
    </section>
  );
}

const INTERP_TONES: ReportInsightTone[] = ['indigo', 'fuchsia', 'sky', 'violet', 'emerald', 'amber'];

function InterpretationArticles({
  sectionOrder,
  sections,
  sectionLabels,
}: {
  sectionOrder: readonly string[];
  sections: Record<string, string>;
  sectionLabels: Record<string, string>;
  variant?: 'default' | 'pattern-cross';
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {sectionOrder.map((key, index) => {
        const text = sections[key];
        const label = sectionLabels[key] || `섹션 ${key}`;
        if (!text) return null;
        const tone = INTERP_TONES[index % INTERP_TONES.length];
        return (
          <ReportInsightBlock
            key={key}
            tone={tone}
            title={
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-[10px] font-bold">
                  {key}
                </span>
                {label}
              </span>
            }
          >
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300 sm:text-sm">
              {text}
            </p>
          </ReportInsightBlock>
        );
      })}
    </div>
  );
}

const EGO_SCALE_RANK_ORDER: EgoScaleId[] = ['CP', 'NP', 'A', 'FC', 'AC'];

function pickExtremeEgogramScale(scales: EgoOkScaleScore[], mode: 'max' | 'min'): EgoOkScaleScore {
  return pickTiedEgogramScales(scales, mode)[0];
}

function pickTiedEgogramScales(scales: EgoOkScaleScore[], mode: 'max' | 'min'): EgoOkScaleScore[] {
  if (scales.length === 0) return [];
  const extreme =
    mode === 'max' ? Math.max(...scales.map((s) => s.raw)) : Math.min(...scales.map((s) => s.raw));
  const tied = new Set(scales.filter((s) => s.raw === extreme).map((s) => s.id));
  return EGO_SCALE_RANK_ORDER.flatMap((id) => {
    const scale = scales.find((s) => s.id === id);
    return scale && tied.has(id) ? [scale] : [];
  });
}

function Plus243PlusGlyph({ entry, className }: { entry: Plus243ScaleEntry; className?: string }) {
  const { tier } = entry;
  const label = plus243TierToAscii(tier);
  return (
    <span
      className={`font-mono text-sm font-bold tabular-nums ${className ?? ''}`}
      style={{ color: plus243StageDigitColor(tier.stage) }}
    >
      {label}
    </span>
  );
}

function Pattern243PlusCode({ plus, className }: { plus: Pattern243Plus; className?: string }) {
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-0.5 font-mono tracking-wide ${className ?? ''}`}>
      {EGO_SCALE_PATTERN_ORDER.map((id) => (
        <Plus243PlusGlyph key={id} entry={plus.byScale[id]} />
      ))}
    </span>
  );
}

function Pattern243AndPlusCode({
  patternCode,
  plus,
  className,
  block,
}: {
  patternCode: string;
  plus: Pattern243Plus;
  className?: string;
  /** 카드 등 — 값 열을 넓혀 BBBBB / B⁴B⁵… 세로 중심 맞춤 */
  block?: boolean;
}) {
  return (
    <span
      className={`grid grid-cols-[minmax(4.5rem,auto)_1fr] items-center gap-x-2 gap-y-2 ${block ? 'w-full' : 'inline-grid min-w-[11rem]'} ${className ?? ''}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90">243 패턴</span>
      <span className="flex justify-center">
        <span className="rounded-lg bg-indigo-500/15 px-2.5 py-0.5 font-mono text-lg font-extrabold tracking-[0.22em] text-indigo-50 ring-1 ring-indigo-400/25">
          {patternCode}
        </span>
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">243+ 플러스</span>
      <span className="flex justify-center">
        <Pattern243PlusCode plus={plus} />
      </span>
    </span>
  );
}

function EgogramRadarSummarySubtitle({
  peakScales,
  patternCode,
  pattern243Plus,
  formLabel,
  missing,
}: {
  peakScales: EgoOkScaleScore[];
  patternCode: string;
  pattern243Plus: Pattern243Plus;
  formLabel: string;
  missing: boolean;
}) {
  return (
    <div className="mt-1 space-y-1.5 text-sm">
      <p className="font-medium text-indigo-100">
        최고 사용 에너지 : {peakScales.map((scale) => formatEgogramEnergyHeadline(scale)).join(' · ')}
      </p>
      <p className="text-slate-400">
        243패턴 :{' '}
        <span className="font-mono font-bold tracking-widest text-indigo-100">{patternCode}</span>
        {' · '}
        <Pattern243PlusCode plus={pattern243Plus} className="inline-flex align-middle" />
        <span className="text-slate-500"> (243+ 플러스)</span>
      </p>
      {formLabel && formLabel !== '—' ? <p className="text-slate-300">{formLabel}</p> : null}
      {missing ? <p className="text-amber-200/80">기준 보고서 문장 없음</p> : null}
    </div>
  );
}

function EgogramEnergyDetailCard({
  tone,
  title,
  comment,
  strengths,
  cautions,
  strengthLabel,
  cautionLabel,
}: {
  tone: 'high' | 'low';
  title: string;
  comment: string;
  strengths: string[];
  cautions: string[];
  strengthLabel: string;
  cautionLabel: string;
}) {
  const shell =
    tone === 'high'
      ? 'bg-fuchsia-500/10 ring-fuchsia-400/20'
      : 'bg-sky-500/10 ring-sky-400/20';
  const titleClass = tone === 'high' ? 'text-fuchsia-100' : 'text-sky-100';
  return (
    <article className={`rounded-xl p-4 ring-1 ${shell}`}>
      <h3 className={`text-sm font-semibold ${titleClass}`}>{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{comment}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">{strengthLabel}</p>
          <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-slate-300">
            {strengths.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/90">{cautionLabel}</p>
          <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-slate-300">
            {cautions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function EgogramEnergyInsightPanel({
  highScales,
  lowScales,
  offRangeNotes,
}: {
  highScales: EgoOkScaleScore[];
  lowScales: EgoOkScaleScore[];
  offRangeNotes: { id: EgoScaleId; title: string; text: string }[];
}) {
  const sameExtremes =
    highScales.length > 0 &&
    lowScales.length === highScales.length &&
    lowScales.every((scale) => highScales.some((high) => high.id === scale.id));
  const highTitle = sameExtremes ? '최고·최저 사용에너지' : '최고 사용에너지';
  const lowStart = highScales.length;

  return (
    <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
      {highScales.map((scale, index) => {
        const insight = buildPeakEgogramEnergyInsight(scale);
        return (
          <EgogramEnergyDetailCard
            key={`high-${scale.id}`}
            tone="high"
            title={`${index + 1}. ${highTitle} · ${formatEgogramEnergyHeadline(scale)}`}
            comment={insight.comment}
            strengths={insight.strengths}
            cautions={insight.cautions}
            strengthLabel="장점"
            cautionLabel="주의·단점"
          />
        );
      })}

      {sameExtremes
        ? null
        : lowScales.map((scale, index) => {
            const insight = buildLowEgogramEnergyInsight(scale);
            return (
              <EgogramEnergyDetailCard
                key={`low-${scale.id}`}
                tone="low"
                title={`${lowStart + index + 1}. 최저 사용에너지 · ${formatEgogramEnergyHeadline(scale)}`}
                comment={insight.comment}
                strengths={insight.strengths}
                cautions={insight.cautions}
                strengthLabel="장점"
                cautionLabel="주의·단점"
              />
            );
          })}

      {offRangeNotes.map((note) => (
        <article key={`off-${note.id}`} className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/10">
          <h3 className="text-sm font-semibold text-slate-100">권장 범위 밖 · {note.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{note.text}</p>
        </article>
      ))}
    </div>
  );
}

type EgogramRadarRow = {
  scale: string;
  score: number;
  fullMark: number;
  /** 오케이 4척도 합(10~50). A는 null — 빨간 꼭짓점 없음 */
  okScore: number | null;
  label: string;
  threeLevel: string;
  positive: number;
  negative: number;
  topTrait: string;
  bottomTrait: string;
};

const EGOGRAM_RADAR_PINK = '#f472b6';
const EGOGRAM_RADAR_OK_RED = '#ef4444';
/** 합계 눈금 0~50. 243+ 플러스 4~6단계(9단계 점수표 24~36점) */
const EGOGRAM_RADAR_SCORE_MAX = 50;
const EGOGRAM_PLUS_BAND_INNER = plus243RecommendedRawRange().min;
const EGOGRAM_PLUS_BAND_OUTER = plus243RecommendedRawRange().max;
const PATTERN_FILL = 'rgba(139, 92, 246, 0.5)';
const PLUS_FILL = 'rgba(250, 204, 21, 0.5)';
const PLUS_FILL_HOT = 'rgba(254, 240, 138, 0.9)';

/** 이고 척도 → 오케이 합계 척도 (KTAA·종합그래프와 동일) */
const EGO_TO_OK_SCORE: Record<EgoScaleId, OkScaleId | null> = {
  CP: 'U-',
  NP: 'U+',
  A: null,
  FC: 'I+',
  AC: 'I-',
};

/** 방사형 꼭짓점 순서(12시부터 시계): A 상단 · FC 우상 · AC 우하 · CP 좌하 · NP 좌상 */
const EGOGRAM_RADAR_AXIS_ORDER = ['A', 'FC', 'AC', 'CP', 'NP'] as const;

function egogramRadarPeakScaleId(rows: EgogramRadarRow[], peakId: EgoScaleId): EgoScaleId {
  if (rows.some((r) => r.scale === peakId)) return peakId;
  const first = rows[0]?.scale;
  if (first === 'CP' || first === 'NP' || first === 'A' || first === 'FC' || first === 'AC') return first;
  return peakId;
}

function resolveEgogramRadarTickRow(
  rows: EgogramRadarRow[],
  payload?: { value?: string | number; index?: number },
  tickIndex?: number,
): EgogramRadarRow | undefined {
  const idx = payload?.index ?? tickIndex;
  if (typeof idx === 'number' && rows[idx]) return rows[idx];
  const raw = payload?.value;
  if (raw == null) return undefined;
  const key = String(raw);
  return rows.find((r) => r.scale === key);
}

function EgogramRadarScaleTick({
  x,
  y,
  payload,
  index: tickIndex,
  rows,
  peakScaleIds,
  textAnchor,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string | number; index?: number };
  index?: number;
  rows: EgogramRadarRow[];
  peakScaleIds: EgoScaleId[];
  textAnchor?: string;
}) {
  if (x == null || y == null) return null;
  const row = resolveEgogramRadarTickRow(rows, payload, tickIndex);
  if (!row) return null;
  const { scale, score } = row;
  const isHighlight = peakScaleIds.includes(scale as EgoScaleId);
  const peakPink = EGOGRAM_RADAR_PINK;
  const titleFill = isHighlight ? peakPink : '#94a3b8';
  const scoreFill = isHighlight ? peakPink : '#64748b';
  const anchor = textAnchor as 'middle' | 'start' | 'end' | 'inherit' | undefined;
  /** 12시 A축 — SVG 상단 clip 방지(그래프 크기는 RadarChart margin·outerRadius로 유지) */
  const isTopAxis = scale === 'A';
  const labelY = isTopAxis ? y + 6 : y;
  const scoreY = isTopAxis ? y + 20 : y + 14;
  const titleBaseline = isTopAxis ? 'hanging' : 'alphabetic';

  return (
    <g style={{ pointerEvents: 'none' }}>
      <text
        x={x}
        y={labelY}
        textAnchor={anchor}
        dominantBaseline={titleBaseline}
        fill={titleFill}
        stroke="none"
        fontSize={12}
        fontWeight={isHighlight ? 800 : 600}
      >
        {scale}
      </text>
      <text
        x={x}
        y={scoreY}
        textAnchor={anchor}
        dominantBaseline={isTopAxis ? 'hanging' : 'alphabetic'}
        fill={scoreFill}
        stroke="none"
        fontSize={10}
        fontWeight={isHighlight ? 800 : 500}
      >
        {score}
      </text>
    </g>
  );
}

function createEgogramOkRadarVertexDot(peakScaleIds: EgoScaleId[]) {
  return function EgogramOkRadarVertexDot(props: { cx?: number; cy?: number; payload?: EgogramRadarRow }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload || payload.okScore == null) return null;
  if (peakScaleIds.includes(payload.scale as EgoScaleId)) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5.5}
      fill={EGOGRAM_RADAR_OK_RED}
      stroke="#ffffff"
      strokeWidth={2}
      pointerEvents="none"
    />
  );
  };
}

function egogramRadarTooltipLine(row: EgogramRadarRow): string {
  return `${row.scale} · ${row.label} · 합계 ${row.score}`;
}

function EgogramRadarTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as EgogramRadarRow;
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/90 px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-semibold text-slate-100">{egogramRadarTooltipLine(row)}</p>
    </div>
  );
}

function EgogramFiveScaleRadarChart({
  data,
  peakScaleIds,
  genderLabel,
}: {
  data: EgogramRadarRow[];
  peakScaleIds: EgoScaleId[];
  genderLabel?: string;
}) {
  const resolvedPeakIds = useMemo(() => {
    const present = peakScaleIds.filter((id) => data.some((row) => row.scale === id));
    if (present.length > 0) return present;
    return [egogramRadarPeakScaleId(data, peakScaleIds[0] ?? 'NP')];
  }, [data, peakScaleIds]);
  const gender = normalizeEgoOkGender(genderLabel);
  const [showPlusBand, setShowPlusBand] = useState(false);
  const RecommendedBand = useMemo(
    () => createEgogramRadarBands(data, gender, showPlusBand),
    [data, gender, showPlusBand],
  );
  const genderKo = gender === 'female' ? '여' : '남';
  const patternBands = EGO_SCALE_PATTERN_ORDER.map((id) => {
    const zone = KTAA_GRAPH_ZONES[gender][id];
    return { id, low: zone.redTop, high: zone.whiteTop };
  });
  const OkRadarVertexDot = useMemo(
    () => createEgogramOkRadarVertexDot(resolvedPeakIds),
    [resolvedPeakIds],
  );
  const okRadarData = useMemo(
    () => data.map((row) => ({ ...row, okRadarValue: row.okScore ?? row.score })),
    [data],
  );

  const RadarVertexDot = useMemo(
    () =>
      function EgogramRadarVertexDot(props: { cx?: number; cy?: number; payload?: EgogramRadarRow }) {
        const { cx, cy, payload } = props;
        if (cx == null || cy == null || !payload) return null;
        if (resolvedPeakIds.includes(payload.scale as EgoScaleId)) {
          return (
            <g pointerEvents="none">
              <circle cx={cx} cy={cy} r={9} fill={EGOGRAM_RADAR_PINK} fillOpacity={0.35} />
              <circle cx={cx} cy={cy} r={6.5} fill={EGOGRAM_RADAR_PINK} stroke="#ffffff" strokeWidth={2.5} />
            </g>
          );
        }
        return (
          <circle cx={cx} cy={cy} r={4} fill="#eef2ff" stroke="#818cf8" strokeWidth={2} />
        );
      },
    [resolvedPeakIds],
  );

  const RadarVertexActiveDot = useMemo(
    () =>
      function EgogramRadarVertexActiveDot(props: { cx?: number; cy?: number; payload?: EgogramRadarRow }) {
        const { cx, cy, payload } = props;
        if (cx == null || cy == null || !payload) return null;
        if (resolvedPeakIds.includes(payload.scale as EgoScaleId)) return null;
        return <circle cx={cx} cy={cy} r={6} fill="#ffffff" stroke="#a5b4fc" strokeWidth={2} />;
      },
    [resolvedPeakIds],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
    <p className="mb-1 shrink-0 text-center text-sm font-semibold tracking-normal text-slate-100">방사형 이고그램 5척도</p>
    <div className="min-h-0 w-full flex-1">
    <ResponsiveContainer
      width="100%"
      height="100%"
      className="[&_.recharts-surface]:overflow-visible [&_.recharts-wrapper]:!overflow-visible"
    >
      <RadarChart
        data={okRadarData}
        outerRadius="84%"
        cx="50%"
        cy="50%"
        margin={{ top: 36, right: 56, bottom: 28, left: 56 }}
      >
        <PolarGrid
          gridType="polygon"
          radialLines={false}
          stroke="#64748b"
          strokeOpacity={0.28}
          strokeWidth={1}
        />
        <PolarRadiusAxis domain={[0, 50]} angle={72} axisLine={false} tick={false} />
        <PolarAngleAxis
          dataKey="scale"
          tick={(tickProps) => (
            <EgogramRadarScaleTick
              x={tickProps.x}
              y={tickProps.y}
              payload={tickProps.payload}
              index={tickProps.index}
              textAnchor={tickProps.textAnchor}
              rows={data}
              peakScaleIds={resolvedPeakIds}
            />
          )}
        />
        <Customized component={RecommendedBand} />
        <Radar
          name="오케이"
          dataKey="okRadarValue"
          stroke="none"
          fill="none"
          isAnimationActive={false}
          dot={<OkRadarVertexDot />}
          activeDot={false}
          legendType="none"
        />
        <Radar
          name="점수"
          dataKey="score"
          stroke="#c7d2fe"
          fill="none"
          strokeWidth={2.5}
          isAnimationActive={false}
          dot={<RadarVertexDot />}
          activeDot={<RadarVertexActiveDot />}
        />
        <Customized component={EgogramRadarCenterMark} />
        <Tooltip content={<EgogramRadarTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
    </div>
    <div className="mt-2 shrink-0 rounded-xl border border-white/15 bg-[#101828]/95 px-3 py-2.5 text-center shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <span className="text-xs font-semibold tracking-[0.22em] text-slate-200">권장구간</span>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md px-1.5 py-1 text-sm text-slate-100"
          onMouseEnter={() => setShowPlusBand(false)}
          onFocus={() => setShowPlusBand(false)}
        >
          <span
            className="inline-block h-3.5 w-3.5 shrink-0 rounded-[3px] ring-1 ring-violet-200/80"
            style={{ backgroundColor: PATTERN_FILL }}
            aria-hidden
          />
          <span className="font-medium tracking-wide">243패턴</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md px-1.5 py-1 text-sm text-slate-100"
          onMouseEnter={() => setShowPlusBand(true)}
          onMouseLeave={() => setShowPlusBand(false)}
          onFocus={() => setShowPlusBand(true)}
          onBlur={() => setShowPlusBand(false)}
        >
          <span
            className={`inline-block shrink-0 rounded-[3px] ring-1 ring-yellow-200/80 transition-all duration-200 ${
              showPlusBand ? 'h-5 w-5' : 'h-3.5 w-3.5'
            }`}
            style={{ backgroundColor: showPlusBand ? PLUS_FILL_HOT : PLUS_FILL }}
            aria-hidden
          />
          <span
            className={`font-medium tracking-wide transition-all duration-200 ${
              showPlusBand ? 'text-base font-semibold text-yellow-100' : ''
            }`}
          >
            243+플러스(9단계)
          </span>
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-100">{genderKo}</span>
        {showPlusBand ? (
          <span className="rounded-md bg-yellow-300/15 px-3 py-1 text-sm font-semibold tabular-nums text-yellow-50 ring-1 ring-yellow-200/40">
            {EGOGRAM_PLUS_BAND_INNER}–{EGOGRAM_PLUS_BAND_OUTER}
          </span>
        ) : (
          patternBands.map((band) => (
            <span
              key={band.id}
              className="rounded-md bg-violet-400/15 px-2 py-1 text-sm font-medium tabular-nums text-violet-50 ring-1 ring-violet-200/35"
            >
              <span className="mr-1 text-violet-200/80">{band.id}</span>
              {band.low}–{band.high}
            </span>
          ))
        )}
      </div>
    </div>
    </div>
  );
}

function radarPolarPoint(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (-angleDeg * Math.PI) / 180;
  return {
    x: cx + Math.cos(rad) * radius,
    y: cy + Math.sin(rad) * radius,
  };
}

function polygonPath(points: { x: number; y: number }[]): string {
  return `${points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} Z`;
}

type RadarAxisGeometry = {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  scale?: (value: number) => number;
  ticks?: { coordinate?: number }[];
};

function bandRingPath(
  cx: number,
  cy: number,
  angles: number[],
  radiusAt: (score: number) => number,
  innerScores: number[],
  outerScores: number[],
): string {
  const outer = angles.map((angle, index) => radarPolarPoint(cx, cy, radiusAt(outerScores[index] ?? 0), angle));
  const inner = angles
    .map((angle, index) => radarPolarPoint(cx, cy, radiusAt(innerScores[index] ?? 0), angle))
    .reverse();
  return `${polygonPath(outer)} ${polygonPath(inner)}`;
}

/** 243패턴=KTAA 흰 구간(성별별) · 243+ = 4~6단계(24~36점) */
function createEgogramRadarBands(rows: EgogramRadarRow[], gender: EgoOkGender, showPlus: boolean) {
  return function EgogramRadarRecommendedBand(props: {
    angleAxisMap?: Record<string, RadarAxisGeometry>;
    radiusAxisMap?: Record<string, RadarAxisGeometry>;
  }) {
    const angleAxis = props.angleAxisMap ? Object.values(props.angleAxisMap)[0] : undefined;
    const radiusAxis = props.radiusAxisMap ? Object.values(props.radiusAxisMap)[0] : undefined;
    const cx = angleAxis?.cx;
    const cy = angleAxis?.cy;
    const outerRadius = angleAxis?.outerRadius;
    const innerRadius = angleAxis?.innerRadius ?? 0;
    if (cx == null || cy == null || outerRadius == null || outerRadius <= 0 || rows.length === 0) return null;

    const radiusAt = (score: number) => {
      const clamped = Math.min(EGOGRAM_RADAR_SCORE_MAX, Math.max(0, score));
      if (typeof radiusAxis?.scale === 'function') return radiusAxis.scale(clamped);
      return innerRadius + (clamped / EGOGRAM_RADAR_SCORE_MAX) * (outerRadius - innerRadius);
    };

    const tickAngles = angleAxis?.ticks
      ?.map((tick) => tick.coordinate)
      .filter((angle): angle is number => typeof angle === 'number');
    const angles =
      tickAngles && tickAngles.length === rows.length
        ? tickAngles
        : Array.from({ length: rows.length }, (_, index) => 90 - index * (360 / rows.length));

    const zones = KTAA_GRAPH_ZONES[gender];
    const patternInner = rows.map((row) => zones[row.scale as EgoScaleId].redTop);
    const patternOuter = rows.map((row) => zones[row.scale as EgoScaleId].whiteTop);
    const plusInner = rows.map(() => EGOGRAM_PLUS_BAND_INNER);
    const plusOuter = rows.map(() => EGOGRAM_PLUS_BAND_OUTER);
    const patternPath = bandRingPath(cx, cy, angles, radiusAt, patternInner, patternOuter);
    const plusPath = bandRingPath(cx, cy, angles, radiusAt, plusInner, plusOuter);

    if (showPlus) {
      return (
        <path
          d={plusPath}
          fill={PLUS_FILL}
          fillRule="evenodd"
          stroke="rgba(250, 204, 21, 0.95)"
          strokeWidth={1.5}
          pointerEvents="none"
        />
      );
    }

    return (
      <path
        d={patternPath}
        fill={PATTERN_FILL}
        fillRule="evenodd"
        stroke="rgba(167, 139, 250, 0.95)"
        strokeWidth={1.5}
        pointerEvents="none"
      />
    );
  };
}

function EgogramRadarCenterMark(props: { cx?: number; cy?: number }) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <g pointerEvents="none">
      <circle cx={cx} cy={cy} r={3.5} fill="#e0f2fe" stroke="#64748b" strokeOpacity={0.55} strokeWidth={1} />
    </g>
  );
}

function EgogramScaleRow({
  id,
  label,
  raw,
  threeLevel,
  plusStage,
}: {
  id: string;
  label: string;
  raw: number;
  threeLevel: string;
  plusStage: number;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl bg-black/25 px-4 py-3 ring-1 ring-white/5">
      <span className="w-8 font-mono text-sm font-bold text-indigo-300">{id}</span>
      <span className="min-w-0 flex-1 text-sm text-slate-200">{label}</span>
      <span className="font-mono text-sm text-white">{raw}</span>
      <ThreeLevelBadge level={threeLevel} />
      <span
        className="min-w-[2rem] text-center font-mono text-sm font-bold"
        style={{ color: plus243StageDigitColor(plusStage as Plus243Stage) }}
      >
        {plusStage}
      </span>
    </li>
  );
}

type OkBarRow = {
  name: OkScaleId;
  score: number;
  label: string;
};

type OkBarRowExt = OkBarRow & { fill: string; poleTag: string };

const OK_SCORE_AXIS_MAX = 55;

function okScoreToPct(score: number): number {
  return Math.min(100, Math.max(0, (score / OK_SCORE_AXIS_MAX) * 100));
}

/** 오케이 4척도 — 중앙 기준 양극 막대 + 인생태도 사분면 (U/I 축) */
function OkGramLifePositionChart({
  rows,
  kind,
  uAxis,
  iAxis,
}: {
  rows: OkBarRowExt[];
  kind: EgoOkReport['lifePosition']['kind'];
  uAxis: number;
  iAxis: number;
}) {
  const byId = Object.fromEntries(rows.map((r) => [r.name, r]));
  const uMinus = byId['U-']?.score ?? 0;
  const uPlus = byId['U+']?.score ?? 0;
  const iPlus = byId['I+']?.score ?? 0;
  const iMinus = byId['I-']?.score ?? 0;

  const uPos = uAxis >= 0;
  const iPos = iAxis >= 0;
  const shellTone =
    uPos && iPos
      ? 'ring-emerald-400/50 bg-emerald-500/15'
      : !uPos && !iPos
        ? 'ring-rose-400/50 bg-rose-500/15'
        : uPos && !iPos
          ? 'ring-indigo-400/50 bg-indigo-500/15'
          : 'ring-teal-400/50 bg-teal-500/15';

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-3 ring-1 ${shellTone}`}>
        <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">인생태도</p>
        <p className="mt-1 text-center text-base font-bold text-white">{kind}</p>
        <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px]">
          {(
            [
              { q: '타인긍 · 자기부', on: uPos && !iPos },
              { q: '타인긍 · 자기긍', on: uPos && iPos },
              { q: '타인부 · 자기부', on: !uPos && !iPos },
              { q: '타인부 · 자기긍', on: !uPos && iPos },
            ] as const
          ).map((cell) => (
            <div
              key={cell.q}
              className={`rounded-lg px-2 py-2 text-center leading-tight ${
                cell.on ? 'bg-white/15 font-semibold text-white ring-1 ring-white/25' : 'bg-black/20 text-slate-500'
              }`}
            >
              {cell.q}
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] tabular-nums text-slate-400">
          이고 축 차이 · 타인(NP−CP) {uAxis >= 0 ? '+' : ''}
          {uAxis} · 자기(FC−AC) {iAxis >= 0 ? '+' : ''}
          {iAxis}
        </p>
      </div>

      <OkDivergingAxisRow
        title="타인(U) 축"
        leftLabel="U− 타인부정"
        rightLabel="U+ 타인긍정"
        leftScore={uMinus}
        rightScore={uPlus}
        leftFill="#818cf8"
        rightFill="#6366f1"
        net={uAxis}
      />
      <OkDivergingAxisRow
        title="자기(I) 축"
        leftLabel="I− 자기부정"
        rightLabel="I+ 자기긍정"
        leftScore={iMinus}
        rightScore={iPlus}
        leftFill="#f43f5e"
        rightFill="#14b8a6"
        net={iAxis}
      />
    </div>
  );
}

function OkDivergingAxisRow({
  title,
  leftLabel,
  rightLabel,
  leftScore,
  rightScore,
  leftFill,
  rightFill,
  net,
}: {
  title: string;
  leftLabel: string;
  rightLabel: string;
  leftScore: number;
  rightScore: number;
  leftFill: string;
  rightFill: string;
  net: number;
}) {
  const leftPct = okScoreToPct(leftScore);
  const rightPct = okScoreToPct(rightScore);
  const netLabel = net >= 0 ? `→ ${rightLabel.split(' ')[1] ?? '긍정'}` : `→ ${leftLabel.split(' ')[1] ?? '부정'}`;

  return (
    <div className="rounded-xl bg-slate-950/40 p-3 ring-1 ring-white/10">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-slate-200">{title}</p>
        <p className="text-[10px] text-slate-500">
          {leftScore} vs {rightScore}
          <span className="ml-1 text-indigo-200/90">{netLabel}</span>
        </p>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-end gap-1">
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-[10px] tabular-nums text-slate-400">{leftScore}</span>
          <div className="flex h-8 w-full items-center justify-end">
            <div
              className="h-3 rounded-l-full opacity-90"
              style={{ width: `${leftPct}%`, minWidth: leftScore > 0 ? '4px' : 0, backgroundColor: leftFill }}
            />
          </div>
          <span className="text-[9px] text-slate-500">{leftLabel}</span>
        </div>
        <div className="mx-0.5 h-10 w-px shrink-0 bg-gradient-to-b from-transparent via-white/35 to-transparent" aria-hidden />
        <div className="flex flex-col items-start gap-1">
          <span className="font-mono text-[10px] tabular-nums text-slate-400">{rightScore}</span>
          <div className="flex h-8 w-full items-center justify-start">
            <div
              className="h-3 rounded-r-full opacity-90"
              style={{ width: `${rightPct}%`, minWidth: rightScore > 0 ? '4px' : 0, backgroundColor: rightFill }}
            />
          </div>
          <span className="text-[9px] text-slate-500">{rightLabel}</span>
        </div>
      </div>
    </div>
  );
}

const INNER_MIND_PLOT_MAX = 50;

function formatInnerMindDiff(okMinusEgo: number): string {
  return `${okMinusEgo >= 0 ? '+' : ''}${okMinusEgo}`;
}

function InnerMindDualBarChart({ pairs }: { pairs: InnerMindPair[] }) {
  const plotH = 160;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-gradient-to-t from-sky-700 to-sky-400" />
          겉마음 (이고)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-gradient-to-t from-fuchsia-700 to-fuchsia-400" />
          속마음 (오케이)
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {pairs.map((p) => {
          const egoH = Math.max(6, (p.egoScore / INNER_MIND_PLOT_MAX) * plotH);
          const okH = Math.max(6, (p.okScore / INNER_MIND_PLOT_MAX) * plotH);
          const aligned = Math.abs(p.okMinusEgo) <= INNER_MIND_ALIGNED_MAX;
          const diffLabel = formatInnerMindDiff(p.okMinusEgo);
          return (
            <article
              key={p.egoId}
              className={`rounded-xl p-3 ring-1 ${
                aligned ? 'bg-sky-500/10 ring-sky-400/20' : 'bg-amber-500/10 ring-amber-400/25'
              }`}
            >
              <p className="text-center font-mono text-xs font-bold text-white">{diffLabel}</p>
              <p className="mt-0.5 text-center text-[10px] text-slate-500">속 − 겉</p>
              <div
                className="relative mt-2 flex items-end justify-center gap-3 border-b border-white/15 pb-1"
                style={{ height: plotH + 8 }}
              >
                <div className="flex w-[2.35rem] flex-col items-center">
                  <span className="mb-1 font-mono text-[10px] tabular-nums text-sky-200">{p.egoScore}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-sky-700/90 to-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]"
                    style={{ height: egoH }}
                    title={`겉 ${p.egoShort}`}
                  />
                  <span className="mt-1.5 text-[10px] font-semibold text-sky-200/90">{p.egoShort}</span>
                  <span className="text-[9px] text-slate-500">겉</span>
                </div>
                <div className="flex w-[2.35rem] flex-col items-center">
                  <span className="mb-1 font-mono text-[10px] tabular-nums text-fuchsia-200">{p.okScore}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-fuchsia-800/90 to-fuchsia-400 shadow-[0_0_12px_rgba(232,121,249,0.2)]"
                    style={{ height: okH }}
                    title={`속 ${p.okShort}`}
                  />
                  <span className="mt-1.5 text-[10px] font-semibold text-fuchsia-200/90">{p.okShort}</span>
                  <span className="text-[9px] text-slate-500">속</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default function EgoOkCounselorReport({
  report,
  clientInfo,
  localTestMode,
  testGender,
  onTestGenderChange,
}: {
  report: EgoOkReport;
  clientInfo: ClientInfo | null;
  localTestMode?: boolean;
  testGender?: EgoOkGender;
  onTestGenderChange?: (gender: EgoOkGender) => void;
}) {
  const chartGender = localTestMode && testGender ? egoOkGenderToLabel(testGender) : clientInfo?.gender;
  const displayGenderLine =
    localTestMode && testGender
      ? egoOkGenderToLabel(testGender)
      : [clientInfo?.gender, clientInfo?.birthYear ? `${clientInfo.birthYear}년` : '']
          .filter(Boolean)
          .join(' · ') || '—';
  const compositeById = Object.fromEntries(report.compositeChart.map((c) => [c.id, c]));

  const egogramById = Object.fromEntries(report.egogram.map((s) => [s.id, s]));
  const okRawById = Object.fromEntries(report.okgram.map((s) => [s.id, s.raw]));
  const radarData: EgogramRadarRow[] = EGOGRAM_RADAR_AXIS_ORDER.flatMap((id) => {
    const s = egogramById[id];
    if (!s) return [];
    const col = compositeById[id];
    const okKey = EGO_TO_OK_SCORE[id];
    const okScore = okKey != null ? (okRawById[okKey] ?? null) : null;
    return [
      {
        scale: s.id,
        score: s.raw,
        fullMark: 50,
        okScore,
        label: s.label,
        threeLevel: s.threeLevel,
        positive: s.positiveRaw,
        negative: s.negativeRaw,
        topTrait: col?.topLabel ?? '—',
        bottomTrait: col?.bottomLabel ?? '—',
      },
    ];
  });

  const peakEgogram = pickExtremeEgogramScale(report.egogram, 'max');
  const peakEgograms = pickTiedEgogramScales(report.egogram, 'max');
  const lowEgograms = pickTiedEgogramScales(report.egogram, 'min');
  const extremeIds = new Set([...peakEgograms, ...lowEgograms].map((scale) => scale.id));
  const offRangeNotes = report.egogram.flatMap((scale) => {
    if (extremeIds.has(scale.id)) return [];
    const text = buildOffRangeEgogramComment(scale);
    return text ? [{ id: scale.id, title: formatEgogramEnergyHeadline(scale), text }] : [];
  });
  const okLifeOverview = buildOkLifeOverviewBlock(
    report.lifePosition.kind,
    report.lifePosition.uAxis,
    report.lifePosition.iAxis,
  );
  const formLabel = resolveEgogramFormLabel(
    report.egogram,
    peakEgogram,
    report.pattern243.basicPattern,
  );

  const OK_BAR_U = '#6366f1';
  const OK_BAR_I = '#0d9488';
  const okById = Object.fromEntries(report.okgram.map((s) => [s.id, s]));
  const okBarData: OkBarRowExt[] = OK_BAR_DISPLAY_ORDER.map((id) => {
    const s = okById[id];
    return {
      name: id,
      score: s?.raw ?? 0,
      label: OK_LABELS[id],
      fill: id.startsWith('U') ? OK_BAR_U : OK_BAR_I,
      poleTag: OK_BAR_POLE_LABEL[id],
    };
  });

  const innerMindPairs = useMemo(
    () => buildInnerMindPairs(report.egogram, report.okgram),
    [report.egogram, report.okgram],
  );
  const plus243Sections = useMemo(
    () => buildPlus243InterpretationSections(report.pattern243Plus, report.egogram, chartGender),
    [report.pattern243Plus, report.egogram, chartGender],
  );
  const plus243SectionOrder = ['1', '2', '3', '4', '5', '6'] as const;
  const reportTabs = useMemo((): CounselorReportTab[] => {
    const tabs: CounselorReportTab[] = [
      {
        id: 'cover',
        label: '종합 요약',
        short: '요약',
        description: '타당도~부정성 핵심 개요 · 미니 그래프',
        panel: (
          <EgoOkReportExecutiveSummary
            report={report}
            clientInfo={clientInfo}
            displayGenderLine={displayGenderLine}
            chartGender={chartGender}
            localTestMode={localTestMode}
            testGender={testGender}
            onTestGenderChange={onTestGenderChange}
            peakEgograms={peakEgograms}
            lowEgograms={lowEgograms}
            formLabel={formLabel}
            okBarData={okBarData}
            okLifeHeading={okLifeOverview.heading}
            okLifeBullets={okLifeOverview.bullets}
            innerMindPairs={innerMindPairs}
            plus243Section6={plus243Sections.sections['6'] ?? ''}
          />
        ),
      },
      {
        id: 'validity',
        label: '타당도',
        short: '타당도',
        panel: report.validity ? (
          <EgoOkValiditySection validity={report.validity} embedded />
        ) : (
          <p className="text-sm text-slate-400">타당도 프로파일 없음</p>
        ),
      },
      {
        id: 'ktaa',
        label: 'KTAA 종합 그래프',
        short: 'KTAA',
        panel: (
          <div className="max-h-[min(78vh,680px)] overflow-hidden rounded-xl">
            <EgoOkKtaaCompositeChart columns={report.compositeChart} gender={chartGender} />
          </div>
        ),
      },
      {
        id: 'egogram',
        label: '이고그램',
        short: '이고',
        panel: (
          <SectionCard
            compact
            title="이고그램"
            subtitle={
              <EgogramRadarSummarySubtitle
                peakScales={peakEgograms}
                patternCode={report.patternCode}
                pattern243Plus={report.pattern243Plus}
                formLabel={formLabel}
                missing={report.pattern243.missing}
              />
            }
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.9fr)] xl:items-start">
              <div className="order-2 flex w-full flex-col max-xl:static max-xl:min-h-0 max-xl:h-auto xl:order-1 xl:sticky xl:top-0 xl:z-10 xl:h-[calc(100svh-19.5rem)] xl:min-h-[24rem]">
                <div className="h-full w-full min-h-[18rem] max-xl:min-h-[16rem] xl:min-h-0">
                  <EgogramFiveScaleRadarChart
                    data={radarData}
                    peakScaleIds={peakEgograms.map((scale) => scale.id)}
                    genderLabel={chartGender}
                  />
                </div>
              </div>
              <div className="order-1 space-y-3 xl:order-2">
                <EgogramEnergyInsightPanel
                  highScales={peakEgograms}
                  lowScales={lowEgograms}
                  offRangeNotes={offRangeNotes}
                />
                <ul className="space-y-2">
                  <li className="flex gap-3 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <span className="w-8">척도</span>
                    <span className="flex-1">명칭</span>
                    <span className="w-8 text-right">합계</span>
                    <span className="w-10 text-center">243</span>
                    <span className="w-8 text-center">9단계</span>
                  </li>
                  {report.egogram.map((s) => (
                    <EgogramScaleRow
                      key={s.id}
                      id={s.id}
                      label={s.label}
                      raw={s.raw}
                      threeLevel={s.threeLevel}
                      plusStage={rawScoreToPlus243Tier(s.raw).stage}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>
        ),
      },
      {
        id: 'plus243',
        label: '243+ Plus 해석',
        short: '243+',
        panel: (
          <SectionCard compact title="243+Plus 종합 해석" subtitle={`9단계 A9~C1 · ${chartGender ?? '성별 미입력'}`}>
            <InterpretationArticles
              sectionOrder={plus243SectionOrder}
              sections={plus243Sections.sections}
              sectionLabels={plus243Sections.sectionLabels}
            />
          </SectionCard>
        ),
      },
      {
        id: 'self-help',
        label: '자율치료 및 대책',
        short: '대책',
        description: '상담사 개입 · 내담자 자율 실천 (9단계 기준)',
        panel: (
          <SectionCard compact title="자율치료 및 대책" subtitle="243+플러스 9단계 · 상담사용 (자율치료는 설명·과제로 전달)">
            <EgoOkSelfHelpTherapyPanel egogram={report.egogram} />
          </SectionCard>
        ),
      },
      {
        id: 'ok-life',
        label: '오케이그램 · 인생태도',
        short: '오케이',
        panel: (
          <SectionCard
            compact
            title="오케이그램 · 인생태도"
            subtitle={
              <span>
                인생태도: <strong className="text-indigo-200">{report.lifePosition.kind}</strong> —{' '}
                {report.lifePosition.summary}
              </span>
            }
          >
            <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
              <ReportInsightBlock tone="sky" title="오케이그램 · 인생태도 축">
                <OkGramLifePositionChart
                  rows={okBarData}
                  kind={report.lifePosition.kind}
                  uAxis={report.lifePosition.uAxis}
                  iAxis={report.lifePosition.iAxis}
                />
              </ReportInsightBlock>
              <ReportInsightBlock tone="indigo" title={okLifeOverview.heading}>
                <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-slate-300">
                  {okLifeOverview.bullets.map((line) => (
                    <li key={line.slice(0, 24)}>{line}</li>
                  ))}
                </ul>
              </ReportInsightBlock>
            </div>
          </SectionCard>
        ),
      },
      {
        id: 'inner',
        label: '나의 속마음',
        short: '속마음',
        panel: (
          <SectionCard
            compact
            title="나의 속마음"
            subtitle="겉마음(이고) vs 속마음(오케이) · |차이| 4 이하 동일 · 5 이상 상세"
          >
            <InnerMindDualBarChart pairs={innerMindPairs} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {innerMindPairs.map((pair) => {
                const aligned = Math.abs(pair.okMinusEgo) <= INNER_MIND_ALIGNED_MAX;
                return (
                  <ReportInsightBlock
                    key={pair.egoId}
                    tone={aligned ? 'sky' : 'amber'}
                    compact
                    title={`${pair.egoShort} · (속마음) = ${formatInnerMindDiff(pair.okMinusEgo)}`}
                  >
                    <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">{pair.summary}</p>
                    {!aligned && pair.caution ? (
                      <p className="mt-2 text-xs leading-relaxed text-amber-50/90 sm:text-sm">{pair.caution}</p>
                    ) : null}
                  </ReportInsightBlock>
                );
              })}
            </div>
          </SectionCard>
        ),
      },
      {
        id: 'polarity',
        label: '이고그램-부정성',
        short: '부정성',
        description: '긍정·부정 사용 비율 · 구간별 주의·대책',
        panel: (
          <SectionCard compact title="이고그램-부정성" subtitle="5척도 긍정·부정 합계 · 부정 40% 기준 · 6단계 구간 해석">
            <EgoOkEgogramPolarityPanel egogram={report.egogram} />
          </SectionCard>
        ),
      },
    ];
    return tabs;
  }, [
    chartGender,
    clientInfo,
    displayGenderLine,
    formLabel,
    innerMindPairs,
    localTestMode,
    lowEgograms,
    offRangeNotes,
    peakEgograms,
    okBarData,
    okLifeOverview.bullets,
    okLifeOverview.heading,
    onTestGenderChange,
    peakEgogram,
    plus243Sections.sectionLabels,
    plus243Sections.sections,
    radarData,
    report,
    testGender,
  ]);

  return (
    <div className="mx-auto w-full max-w-[min(100%,112rem)] pb-4">
      <EgoOkCounselorReportTabShell tabs={reportTabs} defaultTabId="cover" fixedTopClass="top-[6.25rem]" />

      <p className="relative z-30 mt-2 text-center text-[10px] text-slate-600">
        기준: docs/internal-materials/ego-ok (items-96, norms 2020-04-01, patterns-243-reports) · 타당도 15·30·47·63·77·90
        미포함
      </p>
    </div>
  );
}
