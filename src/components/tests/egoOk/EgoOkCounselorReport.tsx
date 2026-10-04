'use client';

import { useId, useMemo } from 'react';
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
  buildPeakEgogramEnergyInsight,
  formatEgogramEnergyHeadline,
} from '@/lib/egogramEnergyStageComments';
import {
  EGO_SCALE_PATTERN_ORDER,
  plus243StageDigitColor,
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
import {
  buildOkLifeOverviewBlock,
  OK_BAR_DISPLAY_ORDER,
  OK_BAR_POLE_LABEL,
} from '@/lib/egoOkOkLifePosition';
import { resolveEgogramFormLabel } from '@/lib/egoOkFormPattern';
import EgoOkValiditySection from '@/components/tests/egoOk/EgoOkValiditySection';
import { OK_LABELS } from '@/lib/egoOkScoring';
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
import EgoOkEgogramPolarityPanel from '@/components/tests/egoOk/EgoOkEgogramPolarityPanel';
import {
  COVER_STAT_TONES,
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
  return scales.reduce((pick, s) => {
    if (mode === 'max') {
      if (s.raw > pick.raw) return s;
      if (s.raw === pick.raw && EGO_SCALE_RANK_ORDER.indexOf(s.id) < EGO_SCALE_RANK_ORDER.indexOf(pick.id)) {
        return s;
      }
      return pick;
    }
    if (s.raw < pick.raw) return s;
    if (s.raw === pick.raw && EGO_SCALE_RANK_ORDER.indexOf(s.id) > EGO_SCALE_RANK_ORDER.indexOf(pick.id)) {
      return s;
    }
    return pick;
  });
}

function Plus243PlusGlyph({ entry, className }: { entry: Plus243ScaleEntry; className?: string }) {
  const { tier, pattern243Letter } = entry;
  return (
    <span className={`inline-flex items-baseline ${className ?? ''}`}>
      <span className="font-mono text-sm font-semibold text-slate-200">{pattern243Letter}</span>
      <sup
        className="ml-px font-mono text-[0.55em] font-bold leading-none"
        style={{ color: plus243StageDigitColor(tier.stage) }}
      >
        {tier.stage}
      </sup>
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
  peakScale,
  patternCode,
  pattern243Plus,
  formLabel,
  missing,
}: {
  peakScale: EgoOkScaleScore;
  patternCode: string;
  pattern243Plus: Pattern243Plus;
  formLabel: string;
  missing: boolean;
}) {
  return (
    <div className="mt-1 space-y-1.5 text-sm">
      <p className="font-medium text-indigo-100">
        최고 사용 에너지 : {formatEgogramEnergyHeadline(peakScale)}
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

function EgogramEnergyInsightPanel({
  highScale,
  lowScale,
}: {
  highScale: EgoOkScaleScore;
  lowScale: EgoOkScaleScore;
}) {
  const high = buildPeakEgogramEnergyInsight(highScale);
  const low = buildLowEgogramEnergyInsight(lowScale);

  return (
    <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
      <article className="rounded-xl bg-fuchsia-500/10 p-4 ring-1 ring-fuchsia-400/20">
        <h3 className="text-sm font-semibold text-fuchsia-100">
          최고 사용에너지 · {formatEgogramEnergyHeadline(highScale)}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{high.comment}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">장점</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-slate-300">
              {high.strengths.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/90">주의·단점</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-slate-300">
              {high.cautions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </article>

      <article className="rounded-xl bg-sky-500/10 p-4 ring-1 ring-sky-400/20">
        <h3 className="text-sm font-semibold text-sky-100">
          부족한 사용에너지 · {formatEgogramEnergyHeadline(lowScale)}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{low.comment}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">장점(낮을 때)</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-slate-300">
              {low.strengths.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/90">보완·주의</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-slate-300">
              {low.cautions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </article>

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

const EGOGRAM_RADAR_SKY = '#7dd3fc';
const EGOGRAM_RADAR_PINK = '#f472b6';
const EGOGRAM_RADAR_OK_RED = '#ef4444';

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
  peakScaleId,
  textAnchor,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string | number; index?: number };
  index?: number;
  rows: EgogramRadarRow[];
  peakScaleId: EgoScaleId;
  textAnchor?: string;
}) {
  if (x == null || y == null) return null;
  const row = resolveEgogramRadarTickRow(rows, payload, tickIndex);
  if (!row) return null;
  const { scale, score } = row;
  const isHighlight = scale === peakScaleId;
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

function createEgogramOkRadarVertexDot(peakScaleId: EgoScaleId) {
  return function EgogramOkRadarVertexDot(props: { cx?: number; cy?: number; payload?: EgogramRadarRow }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload || payload.okScore == null) return null;
  if (payload.scale === peakScaleId) return null;
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
  peakScaleId,
}: {
  data: EgogramRadarRow[];
  peakScaleId: EgoScaleId;
}) {
  const gradientId = useId().replace(/:/g, '');
  const resolvedPeakId = useMemo(() => egogramRadarPeakScaleId(data, peakScaleId), [data, peakScaleId]);
  const OkRadarVertexDot = useMemo(
    () => createEgogramOkRadarVertexDot(resolvedPeakId),
    [resolvedPeakId],
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
        if (payload.scale === resolvedPeakId) {
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
    [resolvedPeakId],
  );

  const RadarVertexActiveDot = useMemo(
    () =>
      function EgogramRadarVertexActiveDot(props: { cx?: number; cy?: number; payload?: EgogramRadarRow }) {
        const { cx, cy, payload } = props;
        if (cx == null || cy == null || !payload) return null;
        if (payload.scale === resolvedPeakId) return null;
        return <circle cx={cx} cy={cy} r={6} fill="#ffffff" stroke="#a5b4fc" strokeWidth={2} />;
      },
    [resolvedPeakId],
  );

  const FillOpacityMaskDefs = useMemo(
    () =>
      function EgogramRadarFillOpacityMaskDefs() {
        return (
          <defs>
            <radialGradient
              id={gradientId}
              gradientUnits="objectBoundingBox"
              cx="0.5"
              cy="0.5"
              r="0.5"
              fx="0.5"
              fy="0.5"
            >
              <stop offset="0%" stopColor={EGOGRAM_RADAR_SKY} stopOpacity={0} />
              <stop offset="45%" stopColor={EGOGRAM_RADAR_SKY} stopOpacity={0.12} />
              <stop offset="100%" stopColor={EGOGRAM_RADAR_SKY} stopOpacity={0.52} />
            </radialGradient>
          </defs>
        );
      },
    [gradientId],
  );

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      className="[&_.recharts-surface]:overflow-visible [&_.recharts-wrapper]:!overflow-visible"
    >
      <RadarChart
        data={okRadarData}
        outerRadius="94%"
        cx="50%"
        cy="50%"
        margin={{ top: 10, right: 6, bottom: 2, left: 6 }}
      >
        <Customized component={FillOpacityMaskDefs} />
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
              peakScaleId={resolvedPeakId}
            />
          )}
        />
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
          fill={`url(#${gradientId})`}
          fillOpacity={1}
          strokeWidth={2.5}
          isAnimationActive={false}
          dot={<RadarVertexDot />}
          activeDot={<RadarVertexActiveDot />}
        />
        <Customized component={EgogramRadarCenterMark} />
        <Tooltip content={<EgogramRadarTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
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
  const lowEgogram = pickExtremeEgogramScale(report.egogram, 'min');
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
    () =>
      buildPlus243InterpretationSections(report.pattern243Plus, report.egogram, chartGender, {
        sections: report.pattern243.sections,
        sectionLabels: report.pattern243.sectionLabels,
      }),
    [report.pattern243Plus, report.egogram, chartGender, report.pattern243.sections, report.pattern243.sectionLabels],
  );
  const plus243SectionOrder = ['1', '2', '3', '4', '5', '6'] as const;

  const reportTabs = useMemo((): CounselorReportTab[] => {
    const tabs: CounselorReportTab[] = [
      {
        id: 'cover',
        label: '표지 · 개요',
        short: '표지',
        description: '검사 표지 · 내담자 · 243 · 요약',
        panel: (
          <div className="flex flex-col gap-3">
            <ReportInsightBlock tone="indigo" title="TA 이고-오케이그램 검사 · 전문가 해석">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-indigo-200/80">Counselor report</p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
                96문항(타당도 6문항 분산) · 243패턴 · KTAA · 이고/오케이 · 243+ 해석. 상단 탭을 클릭하거나 마우스를
                올린 뒤 아래 영역으로 이동하면 해당 결과가 고정됩니다.
              </p>
            </ReportInsightBlock>
            {localTestMode ? (
              <ReportInsightBlock tone="amber" compact title="로컬 테스트 모드">
                <p className="text-xs leading-relaxed text-amber-50/90">
                  저장·발송되지 않습니다. 성별 변경 시 243 구간·그래프 배경이 갱신됩니다.
                </p>
              </ReportInsightBlock>
            ) : null}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <ReportInsightBlock tone={COVER_STAT_TONES[0]} compact title="내담자">
                <p className="font-medium text-white">{clientInfo?.name?.trim() || '—'}</p>
              </ReportInsightBlock>
              <ReportInsightBlock tone={COVER_STAT_TONES[1]} compact title="성별 · 출생">
                <p className="font-medium text-white">
                  {localTestMode && onTestGenderChange && testGender ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-lg bg-black/20 p-0.5 ring-1 ring-white/10">
                        {(['male', 'female'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => onTestGenderChange(g)}
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                              testGender === g
                                ? g === 'male'
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-rose-600 text-white'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            {egoOkGenderToLabel(g)}
                          </button>
                        ))}
                      </span>
                      {clientInfo?.birthYear ? (
                        <span className="text-slate-400">· {clientInfo.birthYear}년</span>
                      ) : null}
                    </span>
                  ) : (
                    displayGenderLine
                  )}
                </p>
              </ReportInsightBlock>
              <ReportInsightBlock tone={COVER_STAT_TONES[2]} compact title="243 패턴 · 243+">
                <Pattern243AndPlusCode block patternCode={report.patternCode} plus={report.pattern243Plus} />
              </ReportInsightBlock>
              <ReportInsightBlock tone={COVER_STAT_TONES[3]} compact title="타당도">
                <p className="text-sm font-semibold text-white">{report.validity?.overallTitle ?? '—'}</p>
              </ReportInsightBlock>
              <ReportInsightBlock tone={COVER_STAT_TONES[4]} compact title="인생태도(명칭)">
                <p className="font-semibold text-indigo-100">{report.lifePosition.kind}</p>
              </ReportInsightBlock>
              <ReportInsightBlock tone={COVER_STAT_TONES[5]} compact title="최고 이고 척도">
                <p className="font-semibold text-white">
                  {peakEgogram.id} · {peakEgogram.raw}점
                </p>
                <p className="mt-1 text-xs text-slate-400">{peakEgogram.label}</p>
              </ReportInsightBlock>
              <ReportInsightBlock tone={COVER_STAT_TONES[6]} compact title="최저 이고 척도">
                <p className="font-semibold text-white">
                  {lowEgogram.id} · {lowEgogram.raw}점
                </p>
                <p className="mt-1 text-xs text-slate-400">{lowEgogram.label}</p>
              </ReportInsightBlock>
              <ReportInsightBlock tone={COVER_STAT_TONES[7]} compact title="형태명">
                <p className="font-semibold text-white">{formLabel && formLabel !== '—' ? formLabel : '—'}</p>
              </ReportInsightBlock>
              <ReportInsightBlock tone={COVER_STAT_TONES[8]} compact title="243패턴 문장">
                <p className="text-xs text-slate-300">
                  {report.pattern243.missing
                    ? '기준 문장 없음 — 코드만 참고'
                    : `보고서 ${report.pattern243.reportNo ?? '—'} · 탭「243+」「오케이」참고`}
                </p>
              </ReportInsightBlock>
            </div>
          </div>
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
                peakScale={peakEgogram}
                patternCode={report.patternCode}
                pattern243Plus={report.pattern243Plus}
                formLabel={formLabel}
                missing={report.pattern243.missing}
              />
            }
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:items-start">
              <div className="w-full xl:sticky xl:top-1/2 xl:z-10 xl:-translate-y-1/2 xl:self-start">
                <div className="h-[min(42vh,22rem)] w-full min-h-[16rem]">
                  <EgogramFiveScaleRadarChart data={radarData} peakScaleId={peakEgogram.id} />
                </div>
              </div>
              <div className="space-y-3">
                <EgogramEnergyInsightPanel highScale={peakEgogram} lowScale={lowEgogram} />
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
          <SectionCard compact title="243+Plus 종합 해석" subtitle={`9단계 · ${chartGender ?? '성별 미입력'} norms`}>
            <InterpretationArticles
              sectionOrder={plus243SectionOrder}
              sections={plus243Sections.sections}
              sectionLabels={plus243Sections.sectionLabels}
            />
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
    lowEgogram,
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
