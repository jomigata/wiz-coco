'use client';

import { useId, useMemo } from 'react';
import type {
  EgoOkCompositeColumn,
  EgoOkGender,
  EgoOkReport,
  EgoOkScaleScore,
  EgoScaleId,
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LabelList,
  Tooltip,
  Cell,
  Customized,
  type TooltipProps,
} from 'recharts';
import EgoOkKtaaCompositeChart from '@/components/tests/egoOk/EgoOkKtaaCompositeChart';

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
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-indigo-950/80 p-6 shadow-xl shadow-black/30">
      <header className="mb-5 border-b border-white/10 pb-4">
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        {subtitle ? <div className="mt-1 text-sm text-slate-400">{subtitle}</div> : null}
      </header>
      {children}
    </section>
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

function OkBarEndLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
  index?: number;
  payload?: OkBarRowExt;
  rows?: OkBarRowExt[];
}) {
  const { x, y, width, height, value, index, payload, rows } = props;
  if (value == null || x == null || y == null || width == null || height == null) return null;
  const row =
    payload?.name != null
      ? payload
      : index != null && rows?.[index]
        ? rows[index]
        : undefined;
  const tag = row?.poleTag ?? (row?.name ? OK_BAR_POLE_LABEL[row.name] : '');
  return (
    <text x={x + width + 8} y={y + height / 2 + 4} fill="#e2e8f0" fontSize={12} fontWeight={600}>
      {value} ({tag})
    </text>
  );
}

function InnerMindDualBarChart({ pairs }: { pairs: InnerMindPair[] }) {
  const plotH = 176;
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
      {pairs.map((p) => {
        const egoH = Math.max(4, (p.egoScore / 50) * plotH);
        const okH = Math.max(4, (p.okScore / 50) * plotH);
        const diffLabel = `${p.okMinusEgo >= 0 ? '+' : ''}${p.okMinusEgo}`;
        return (
          <div key={p.egoId} className="flex flex-col items-center">
            <p className="mb-1 text-center font-mono text-xs font-semibold text-indigo-100">{diffLabel}</p>
            <div
              className="relative w-full max-w-[5rem] rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2"
              style={{ height: plotH + 16 }}
            >
              <div className="absolute inset-x-3 bottom-2 top-2">
                <div
                  className="absolute bottom-0 left-1/2 w-9 -translate-x-1/2 rounded-t-md bg-gradient-to-t from-sky-600 to-sky-400 shadow-inner"
                  style={{ height: egoH }}
                />
                <div
                  className="absolute bottom-0 left-1/2 w-4 -translate-x-1/2 rounded-t-md bg-gradient-to-t from-pink-600 to-pink-400 shadow-md"
                  style={{ height: okH }}
                />
              </div>
            </div>
            <p className="mt-2 text-sm font-bold tracking-wide text-sky-200">{p.egoShort}</p>
          </div>
        );
      })}
    </div>
  );
}

function formatInnerMindDiff(okMinusEgo: number): string {
  return `${okMinusEgo >= 0 ? '+' : ''}${okMinusEgo}`;
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
  /** Recharts vertical: 배열 첫 행=차트 하단 → 위→아래 U−…I− 는 역순으로 feed */
  const okBarData: OkBarRowExt[] = [...OK_BAR_DISPLAY_ORDER].reverse().map((id) => {
    const s = okById[id];
    return {
      name: id,
      score: s?.raw ?? 0,
      label: OK_LABELS[id],
      fill: id.startsWith('U') ? OK_BAR_U : OK_BAR_I,
      poleTag: OK_BAR_POLE_LABEL[id],
    };
  });

  const sectionOrder = ['1', '2', '3', '4'] as const;
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

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-950 via-slate-950 to-[#070b14] p-8 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,rgba(99,102,241,0.25),transparent)]" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-300/80">Counselor report</p>
          <h1 className="mt-2 text-3xl font-bold text-white">TA 이고-오케이그램 검사 · 전문가 해석</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            96문항(타당도 6문항 분산) · 243패턴 · 인생태도 · 타당도 프로파일을 종합한 상담 참고 리포트입니다.
          </p>
          {localTestMode ? (
            <p className="mt-3 max-w-2xl rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100">
              로컬 테스트 모드 — 저장·발송되지 않습니다. 상단 <strong>성별</strong>에서 남/여를 바꾸면
              243 구간·그래프 배경이 즉시 갱신됩니다. 페이지 새로고침(F5) 시 성별 기준이 남↔여로 교대됩니다.
            </p>
          ) : null}
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10">
              <dt className="text-xs text-slate-500">내담자</dt>
              <dd className="mt-1 font-medium text-white">{clientInfo?.name?.trim() || '—'}</dd>
            </div>
            <div className="rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10">
              <dt className="text-xs text-slate-500">성별 · 출생</dt>
              <dd className="mt-1 font-medium text-white">
                {localTestMode && onTestGenderChange && testGender ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-lg border border-white/15 bg-white/5 p-0.5">
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
                  </div>
                ) : (
                  displayGenderLine
                )}
              </dd>
            </div>
            <div className="rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10">
              <dt className="sr-only">243 패턴 · 243+ 플러스</dt>
              <dd className="text-base">
                <Pattern243AndPlusCode
                  block
                  patternCode={report.patternCode}
                  plus={report.pattern243Plus}
                />
              </dd>
            </div>
            <div className="rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10">
              <dt className="text-xs text-slate-500">타당도</dt>
              <dd className="mt-1 text-sm font-semibold text-white">
                {report.validity?.overallTitle ?? '—'}
              </dd>
            </div>
          </dl>
          {formLabel && formLabel !== '—' ? (
            <p className="mt-4 text-sm font-medium text-indigo-200/90">형태명: {formLabel}</p>
          ) : null}
        </div>
      </div>

      {report.validity ? <EgoOkValiditySection validity={report.validity} /> : null}

      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-xl sm:p-6">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-white">이고-오케이그램 (Ego-Ok) 진단 결과 그래프</h2>
          <p className="mt-1 text-sm text-slate-400">
            96문항 중 성격 문항(90) 채점 결과를 KTAA 종합 그래프 형식으로 표시합니다.
          </p>
        </header>
        <EgoOkKtaaCompositeChart columns={report.compositeChart} gender={chartGender} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <SectionCard
          title="이고그램 5척도"
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
          <div className="min-h-[22rem] w-full overflow-visible px-0.5 py-1">
            <div className="h-[22rem] w-full overflow-visible">
              <EgogramFiveScaleRadarChart data={radarData} peakScaleId={peakEgogram.id} />
            </div>
          </div>
          <EgogramEnergyInsightPanel highScale={peakEgogram} lowScale={lowEgogram} />
          <ul className="mt-4 space-y-3">
            <li className="flex gap-3 px-4 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
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
        </SectionCard>

        <div className="flex flex-col gap-6">
          <SectionCard
            title="오케이그램 · 인생태도"
            subtitle={
              <span>
                인생태도: <strong className="text-indigo-200">{report.lifePosition.kind}</strong> —{' '}
                {report.lifePosition.summary}
              </span>
            }
          >
            <div className="h-56 w-full rounded-xl border border-white/5 bg-slate-900/40 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={okBarData} layout="vertical" margin={{ left: 8, right: 96 }}>
                  <XAxis type="number" domain={[0, 55]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={40}
                    tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 600 }}
                    axisLine={false}
                  />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={22}>
                    {okBarData.map((row) => (
                      <Cell key={row.name} fill={row.fill} />
                    ))}
                    <LabelList dataKey="score" content={<OkBarEndLabel rows={okBarData} />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
              <p className="font-semibold text-indigo-100">{okLifeOverview.heading}</p>
              <ul className="list-inside list-disc space-y-2 text-slate-300">
                {okLifeOverview.bullets.map((line) => (
                  <li key={line.slice(0, 24)}>{line}</li>
                ))}
              </ul>
            </div>
          </SectionCard>

          <SectionCard
            title="나의 속마음"
            subtitle="겉마음(이고) vs 속마음(오케이) · |차이| 4 이하 동일 수준 · 5 이상 상세 해석"
          >
            <InnerMindDualBarChart pairs={innerMindPairs} />
            <div className="mt-6 space-y-4">
              {innerMindPairs.map((pair) => {
                const aligned = Math.abs(pair.okMinusEgo) <= INNER_MIND_ALIGNED_MAX;
                return (
                  <article key={pair.egoId} className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
                    {aligned ? (
                      <>
                        <p className="font-mono text-sm text-sky-200">
                          {pair.egoShort} · (속마음) = {formatInnerMindDiff(pair.okMinusEgo)}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-300">{pair.summary}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-mono text-sm text-sky-200">
                          {pair.egoShort} · (속마음) = {formatInnerMindDiff(pair.okMinusEgo)}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-300">{pair.summary}</p>
                        {pair.caution ? (
                          <p className="mt-2 text-sm leading-relaxed text-amber-100/90">{pair.caution}</p>
                        ) : null}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="243+Plus 종합 해석"
        subtitle={`9단계 기준 · ${chartGender ?? '성별 미입력'} norms`}
      >
        <div className="space-y-6">
          {plus243SectionOrder.map((key) => {
            const text = plus243Sections.sections[key];
            const label = plus243Sections.sectionLabels[key] || `섹션 ${key}`;
            if (!text) return null;
            return (
              <article key={key} className="rounded-xl border border-white/5 bg-black/20 p-5">
                <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-xs text-indigo-200">
                    {key}
                  </span>
                  {label}
                </h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{text}</p>
              </article>
            );
          })}
        </div>
      </SectionCard>

      {!report.pattern243.missing ? (
        <SectionCard
          title="243+ 플러스 종합 해석 (243패턴 교차)"
          subtitle={`243패턴 ${report.patternCode} · 9단계 + 패턴 문장`}
        >
          <div className="space-y-6">
            {sectionOrder.map((key) => {
              const text = report.pattern243.sections[key];
              const label = report.pattern243.sectionLabels[key] || `섹션 ${key}`;
              if (!text) return null;
              return (
                <article key={`plus-x-${key}`} className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-5">
                  <h3 className="text-sm font-semibold text-indigo-100">{label} (243패턴 참고)</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{text}</p>
                </article>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="243패턴 종합 해석"
        subtitle={
          report.pattern243.missing
            ? '해당 코드의 보고서 문장이 기준 자료에 없습니다 (41개 결손 코드 중 하나일 수 있음).'
            : `보고서 번호 ${report.pattern243.reportNo ?? '—'} · 코드 ${report.patternCode}`
        }
      >
        {report.pattern243.missing ? (
          <p className="text-sm leading-relaxed text-slate-400">
            척도별 243 구간(A/B/C) 조합은 <strong className="text-slate-200">{report.patternCode}</strong>
            입니다. 상담 시 KTAA 그래프·인생태도·오케이그램 막대를 함께 참고하세요.
          </p>
        ) : (
          <div className="space-y-6">
            {sectionOrder.map((key) => {
              const text = report.pattern243.sections[key];
              const label = report.pattern243.sectionLabels[key] || `섹션 ${key}`;
              if (!text) return null;
              return (
                <article key={key} className="rounded-xl border border-white/5 bg-black/20 p-5">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-xs text-indigo-200">
                      {key}
                    </span>
                    {label}
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{text}</p>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>

      <p className="text-center text-xs text-slate-600">
        기준: docs/internal-materials/ego-ok (items-96, norms 2020-04-01, patterns-243-reports) · 타당도 15·30·47·63·77·90
        미포함
      </p>
    </div>
  );
}
