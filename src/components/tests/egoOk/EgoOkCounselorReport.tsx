'use client';

import { useId, useMemo, useState } from 'react';
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
import { OK_LABELS, OK_SCALE_HINTS } from '@/lib/egoOkScoring';
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

function EgogramRadarSummarySubtitle({
  peakScale,
  patternCode,
  basicPattern,
  missing,
}: {
  peakScale: EgoOkScaleScore;
  patternCode: string;
  basicPattern: string;
  missing: boolean;
}) {
  return (
    <div className="mt-1 space-y-1.5 text-sm">
      <p className="font-medium text-indigo-100">
        최고 이고그램 에너지 : {formatEgogramEnergyHeadline(peakScale)}
      </p>
      <p className="text-slate-400">
        243 패턴{' '}
        <span className="font-mono font-semibold tracking-wide text-indigo-200">{patternCode}</span>
        {basicPattern ? (
          <>
            {' '}
            · <span className="text-slate-300">{basicPattern}</span>
          </>
        ) : null}
        {missing ? <span className="text-amber-200/80"> · 기준 보고서 문장 없음</span> : null}
      </p>
    </div>
  );
}

function EgogramEnergyInsightPanel({
  highScale,
  lowScale,
  highCol,
  lowCol,
  patternSnippet,
}: {
  highScale: EgoOkScaleScore;
  lowScale: EgoOkScaleScore;
  highCol: EgoOkCompositeColumn;
  lowCol: EgoOkCompositeColumn;
  patternSnippet: string | null;
}) {
  const high = buildPeakEgogramEnergyInsight(highScale, highCol);
  const low = buildLowEgogramEnergyInsight(lowScale, lowCol);

  return (
    <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
      <p className="text-xs text-slate-500">
        코멘트 기준: 척도 합계 10~50점을 7등분(1~2 부족 · 3~5 안전성 · 6~7 과함), 단계별 강도 적용
      </p>
      <article className="rounded-xl bg-fuchsia-500/10 p-4 ring-1 ring-fuchsia-400/20">
        <h3 className="text-sm font-semibold text-fuchsia-100">
          최고 사용에너지 · {formatEgogramEnergyHeadline(highScale)}
        </h3>
        <p className="mt-1 text-xs font-medium text-fuchsia-200/80">{high.stageLabel}</p>
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
        <p className="mt-1 text-xs font-medium text-sky-200/80">{low.stageLabel}</p>
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

      {patternSnippet ? (
        <p className="text-xs leading-relaxed text-slate-500">
          <span className="font-medium text-slate-400">243 패턴 참고 · </span>
          {patternSnippet}
        </p>
      ) : null}
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

/** 1·2위 합계(서로 다른 점수 상위 2개 — 동점 척도 포함) */
function egogramRadarHighlightScores(rows: EgogramRadarRow[]): Set<number> {
  const ranked = Array.from(new Set(rows.map((r) => r.score)))
    .filter((s) => s > 0)
    .sort((a, b) => b - a);
  const set = new Set<number>();
  if (ranked[0] != null) set.add(ranked[0]);
  if (ranked[1] != null) set.add(ranked[1]);
  return set;
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

function egogramRadarTooltipLine(row: EgogramRadarRow): string {
  const name = row.label.replace(/\s*\([A-Za-z+]+\)\s*$/, '').replace(/\s+/g, '');
  const line = `${row.scale}.${name}`;
  return line.length > 24 ? `${line.slice(0, 22)}…` : line;
}

function EgogramRadarScaleTick({
  x,
  y,
  payload,
  index: tickIndex,
  rows,
  highlightScores,
  textAnchor,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string | number; index?: number };
  index?: number;
  rows: EgogramRadarRow[];
  highlightScores: Set<number>;
  textAnchor?: string;
}) {
  if (x == null || y == null) return null;
  const row = resolveEgogramRadarTickRow(rows, payload, tickIndex);
  if (!row) return null;
  const { scale, score } = row;
  const isHighlight = highlightScores.has(score);
  const peakPink = EGOGRAM_RADAR_PINK;
  const titleFill = isHighlight ? peakPink : '#94a3b8';
  const scoreFill = isHighlight ? peakPink : '#64748b';
  const anchor = textAnchor as 'middle' | 'start' | 'end' | 'inherit' | undefined;

  return (
    <g style={{ pointerEvents: 'none' }}>
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        fill={titleFill}
        stroke="none"
        fontSize={12}
        fontWeight={isHighlight ? 800 : 600}
      >
        {scale}
      </text>
      <text
        x={x}
        y={y + 14}
        textAnchor={anchor}
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

function EgogramOkRadarVertexDot(props: { cx?: number; cy?: number; payload?: EgogramRadarRow }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload || payload.okScore == null) return null;
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
}

function EgogramFiveScaleRadarChart({ data }: { data: EgogramRadarRow[] }) {
  const gradientId = useId().replace(/:/g, '');
  const highlightScores = useMemo(() => egogramRadarHighlightScores(data), [data]);
  const okRadarData = useMemo(
    () => data.map((row) => ({ ...row, okRadarValue: row.okScore ?? row.score })),
    [data],
  );

  const RadarVertexDot = useMemo(
    () =>
      function EgogramRadarVertexDot(props: { cx?: number; cy?: number; payload?: EgogramRadarRow }) {
        const { cx, cy, payload } = props;
        if (cx == null || cy == null || !payload) return null;
        if (highlightScores.has(payload.score)) {
          return (
            <g pointerEvents="all">
              <circle cx={cx} cy={cy} r={9} fill={EGOGRAM_RADAR_PINK} fillOpacity={0.35} pointerEvents="none" />
              <circle
                cx={cx}
                cy={cy}
                r={6.5}
                fill={EGOGRAM_RADAR_PINK}
                stroke="#ffffff"
                strokeWidth={2.5}
                pointerEvents="none"
              />
              <circle cx={cx} cy={cy} r={10} fill="transparent" stroke="none" />
            </g>
          );
        }
        return (
          <circle cx={cx} cy={cy} r={4} fill="#eef2ff" stroke="#818cf8" strokeWidth={2} />
        );
      },
    [highlightScores],
  );

  const RadarVertexActiveDot = useMemo(
    () =>
      function EgogramRadarVertexActiveDot(props: { cx?: number; cy?: number; payload?: EgogramRadarRow }) {
        const { cx, cy, payload } = props;
        if (cx == null || cy == null || !payload) return null;
        if (highlightScores.has(payload.score)) {
          return null;
        }
        return (
          <circle cx={cx} cy={cy} r={6} fill="#ffffff" stroke="#a5b4fc" strokeWidth={2} />
        );
      },
    [highlightScores],
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
    <ResponsiveContainer width="100%" height="100%" className="[&_.recharts-wrapper]:!overflow-visible">
      <RadarChart
        data={okRadarData}
        outerRadius="92%"
        cx="50%"
        cy="50%"
        margin={{ top: 0, right: 6, bottom: 0, left: 6 }}
      >
        <Customized component={FillOpacityMaskDefs} />
        <PolarGrid
          gridType="polygon"
          radialLines
          stroke="#64748b"
          strokeOpacity={0.28}
          strokeWidth={1}
        />
        <PolarRadiusAxis
          domain={[0, 50]}
          angle={72}
          axisLine={false}
          tickCount={6}
          tick={{ fill: '#64748b', fontSize: 8 }}
        />
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
              highlightScores={highlightScores}
            />
          )}
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
        <Radar
          name="오케이"
          dataKey="okRadarValue"
          stroke="none"
          fill="none"
          isAnimationActive={false}
          dot={<EgogramOkRadarVertexDot />}
          activeDot={false}
          legendType="none"
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
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize={8} fontWeight={600}>
        0
      </text>
    </g>
  );
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

function EgogramScaleRow({
  id,
  label,
  raw,
  threeLevel,
}: {
  id: string;
  label: string;
  raw: number;
  threeLevel: string;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl bg-black/25 px-4 py-3 ring-1 ring-white/5">
      <span className="w-8 font-mono text-sm font-bold text-indigo-300">{id}</span>
      <span className="min-w-0 flex-1 text-sm text-slate-200">{label}</span>
      <span className="font-mono text-sm text-white">
        {raw}
        <span className="text-slate-500">/50</span>
      </span>
      <ThreeLevelBadge level={threeLevel} />
    </li>
  );
}

type OkBarRow = {
  name: OkScaleId;
  score: number;
  label: string;
  hint: string;
};

function OkBarTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as OkBarRow;
  return (
    <div className="max-w-xs rounded-lg border border-white/10 bg-slate-950/95 px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-white">{row.label}</p>
      <p className="mt-1 text-sky-200">
        점수 {row.score}
        <span className="text-slate-500"> /50</span>
      </p>
      <p className="mt-1 leading-relaxed text-slate-400">{row.hint}</p>
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

  const okBarData: OkBarRow[] = report.okgram.map((s) => ({
    name: s.id,
    score: s.raw,
    label: OK_LABELS[s.id],
    hint: OK_SCALE_HINTS[s.id],
  }));

  const sectionOrder = ['1', '2', '3', '4'] as const;
  const barColors = ['#38bdf8', '#818cf8', '#34d399', '#f472b6'];

  const peakEgogram = pickExtremeEgogramScale(report.egogram, 'max');
  const lowEgogram = pickExtremeEgogramScale(report.egogram, 'min');
  const peakComposite = compositeById[peakEgogram.id];
  const lowComposite = compositeById[lowEgogram.id];
  const patternSnippetRaw = report.pattern243.sections['1']?.trim();
  const patternSnippet =
    !report.pattern243.missing && patternSnippetRaw
      ? patternSnippetRaw.length > 300
        ? `${patternSnippetRaw.slice(0, 298)}…`
        : patternSnippetRaw
      : null;

  const [lifeHover, setLifeHover] = useState(false);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-950 via-slate-950 to-[#070b14] p-8 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,rgba(99,102,241,0.25),transparent)]" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-300/80">Counselor report</p>
          <h1 className="mt-2 text-3xl font-bold text-white">TA 이고-오케이그램 검사 · 전문가 해석</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            2020.04.01 기준 90문항 · 243패턴(척도별 A/B/C) · 인생태도(NP−CP, FC−AC)를 종합한 상담 참고
            리포트입니다.
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
              <dt className="text-xs text-slate-500">243 패턴 코드</dt>
              <dd className="mt-1 font-mono text-lg font-bold tracking-widest text-indigo-200">
                {report.patternCode}
              </dd>
            </div>
            <div className="rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10">
              <dt className="text-xs text-slate-500">성실도(비연속성)</dt>
              <dd className="mt-1 text-lg font-semibold text-white">{report.nonContinuityPercent}%</dd>
            </div>
          </dl>
          {report.pattern243.basicPattern ? (
            <p className="mt-4 text-sm font-medium text-indigo-200/90">
              형태명: {report.pattern243.basicPattern}
            </p>
          ) : null}
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-xl sm:p-6">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-white">이고-오케이그램 (Ego-Ok) 진단 결과 그래프</h2>
          <p className="mt-1 text-sm text-slate-400">
            90문항 채점 결과를 KTAA 종합 그래프 형식으로 표시합니다. 열에 마우스를 올리면 많이 사용하는
            자아 상태 쪽으로 배경 그라데이션이 표시됩니다.
          </p>
        </header>
        <EgoOkKtaaCompositeChart columns={report.compositeChart} gender={chartGender} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="이고그램 5척도"
          subtitle={
            <EgogramRadarSummarySubtitle
              peakScale={peakEgogram}
              patternCode={report.patternCode}
              basicPattern={report.pattern243.basicPattern}
              missing={report.pattern243.missing}
            />
          }
        >
          <div className="min-h-[22rem] w-full px-0.5 py-1">
            <div className="h-[22rem] w-full">
              <EgogramFiveScaleRadarChart data={radarData} />
            </div>
          </div>
          {peakComposite && lowComposite ? (
            <EgogramEnergyInsightPanel
              highScale={peakEgogram}
              lowScale={lowEgogram}
              highCol={peakComposite}
              lowCol={lowComposite}
              patternSnippet={patternSnippet}
            />
          ) : null}
          <ul className="mt-4 space-y-3">
            {report.egogram.map((s) => (
              <EgogramScaleRow
                key={s.id}
                id={s.id}
                label={s.label}
                raw={s.raw}
                threeLevel={s.threeLevel}
              />
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="오케이그램 · 인생태도" subtitle="막대에 마우스를 올리면 축 설명이 표시됩니다">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={okBarData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" domain={[0, 50]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={36} tick={{ fill: '#e2e8f0', fontSize: 12 }} />
                <Tooltip content={<OkBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.06)' }} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {okBarData.map((_, i) => (
                    <Cell key={okBarData[i].name} fill={barColors[i % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
              <p className="text-xs text-slate-500">타인 축 (NP − CP)</p>
              <p className="mt-1 text-2xl font-semibold text-white">{report.lifePosition.uAxis}</p>
              <p className="mt-1 text-xs text-slate-500">U+−U− 차이 {report.okDifference.uDiff}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
              <p className="text-xs text-slate-500">자기 축 (FC − AC)</p>
              <p className="mt-1 text-2xl font-semibold text-white">{report.lifePosition.iAxis}</p>
              <p className="mt-1 text-xs text-slate-500">I+−I− 차이 {report.okDifference.iDiff}</p>
            </div>
          </div>
          <div
            className="mt-4 rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4 transition-colors hover:border-indigo-300/40 hover:bg-indigo-500/15"
            onMouseEnter={() => setLifeHover(true)}
            onMouseLeave={() => setLifeHover(false)}
          >
            <p className="text-sm font-semibold text-indigo-100">인생태도: {report.lifePosition.kind}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{report.lifePosition.summary}</p>
            {lifeHover ? (
              <p className="mt-3 border-t border-indigo-400/20 pt-3 text-xs leading-relaxed text-indigo-200/90">
                TA 인생태도는 이고그램 CP·NP·FC·AC 점수로 계산한 <strong>타인 축</strong>(NP−CP)과{' '}
                <strong>자기 축</strong>(FC−AC)의 부호·크기로 분류합니다. 오케이그램 U+/U−/I+/I− 합과는
                별도로, 자아(Ego) 상태의 상대적 강도를 나타냅니다.
              </p>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="243Plus 요약" subtitle="CP+NP · FC+AC 합산 (243 보조 지표)">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <p className="text-xs uppercase tracking-wide text-slate-500">CP + NP</p>
            <p className="mt-2 text-3xl font-bold text-white">{report.plus243.cpNpSum}</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <p className="text-xs uppercase tracking-wide text-slate-500">FC + AC</p>
            <p className="mt-2 text-3xl font-bold text-white">{report.plus243.fcAcSum}</p>
          </div>
        </div>
      </SectionCard>

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
        기준: docs/internal-materials/ego-ok (items-90, norms 2020-04-01, patterns-243-reports) · 페이크·청소년 문항
        미포함
      </p>
    </div>
  );
}
