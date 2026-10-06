'use client';

import type { ReactNode } from 'react';
import type {
  EgoOkCompositeColumn,
  EgoOkGender,
  EgoOkReport,
  EgoOkScaleScore,
  EgoScaleId,
  LifePositionKind,
} from '@/lib/egoOkScoring';
import {
  EGO_SCALE_PATTERN_ORDER,
  plus243StageDigitColor,
  plus243TierToAscii,
  rawScoreToPlus243Tier,
  type Pattern243Plus,
  type Plus243ScaleEntry,
} from '@/lib/egogram243Plus';
import { buildEgogramPolarityRows } from '@/lib/egoOkEgogramPolarity';
import { buildCounselorPairAndAdultGuidance } from '@/lib/egogramManualNineStage';
import { INNER_MIND_ALIGNED_MAX, type InnerMindPair } from '@/lib/egoOkInnerMind';
import { formatEgogramEnergyHeadline } from '@/lib/egogramEnergyStageComments';
import type { ClientInfo } from '@/components/tests/MbtiProClientInfo';
import { egoOkGenderToLabel } from '@/lib/egoOkTestGender';
import { ValidityTable } from '@/components/tests/egoOk/EgoOkValiditySection';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

const RADAR_AXIS = ['A', 'FC', 'AC', 'CP', 'NP'] as const;

type OkBarRow = {
  name: string;
  score: number;
  label: string;
  fill: string;
  poleTag: string;
};

function SummaryShell({
  title,
  tabHint,
  children,
  className,
}: {
  title: string;
  tabHint: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 ${className ?? ''}`}
    >
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2">
        <h3 className="text-sm font-bold tracking-tight text-slate-800">{title}</h3>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 ring-1 ring-indigo-100">
          {tabHint}
        </span>
      </header>
      {children}
    </article>
  );
}

function Plus243PlusGlyph({ entry }: { entry: Plus243ScaleEntry }) {
  const label = plus243TierToAscii(entry.tier);
  return (
    <span
      className="font-mono text-sm font-bold tabular-nums"
      style={{ color: plus243StageDigitColor(entry.tier.stage) }}
    >
      {label}
    </span>
  );
}

function Pattern243Block({ patternCode, plus }: { patternCode: string; plus: Pattern243Plus }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="rounded-xl bg-indigo-50 px-4 py-2 ring-1 ring-indigo-100">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">243 패턴</p>
        <p className="font-mono text-xl font-extrabold tracking-[0.2em] text-indigo-900">{patternCode}</p>
      </div>
      <div className="rounded-xl bg-violet-50 px-4 py-2 ring-1 ring-violet-100">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500">243+ 플러스</p>
        <p className="mt-0.5 flex flex-wrap gap-0.5">
          {EGO_SCALE_PATTERN_ORDER.map((id) => (
            <Plus243PlusGlyph key={id} entry={plus.byScale[id]} />
          ))}
        </p>
      </div>
    </div>
  );
}

function ValidityTrafficBadge({ overall }: { overall: 'normal' | 'caution' | 'invalid' | undefined }) {
  const styles =
    overall === 'invalid'
      ? 'bg-rose-50 text-rose-800 ring-rose-200'
      : overall === 'caution'
        ? 'bg-amber-50 text-amber-900 ring-amber-200'
        : 'bg-emerald-50 text-emerald-800 ring-emerald-200';
  const label =
    overall === 'invalid' ? '주의 · 재검토' : overall === 'caution' ? '일부 주의' : '신뢰 가능';
  return (
    <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ring-1 ${styles}`}>{label}</span>
  );
}

function MiniEgogramRadar({ egogram, peakIds }: { egogram: EgoOkScaleScore[]; peakIds: EgoScaleId[] }) {
  const byId = Object.fromEntries(egogram.map((s) => [s.id, s]));
  const data = RADAR_AXIS.map((id) => ({
    scale: id,
    score: byId[id]?.raw ?? 0,
    fullMark: 50,
  }));

  return (
    <div className="h-[11rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
          <PolarGrid stroke="#e2e8f0" strokeOpacity={1} />
          <PolarAngleAxis
            dataKey="scale"
            tick={({ x, y, payload }) => {
              const id = String(payload?.value ?? '');
              const row = byId[id as EgoScaleId];
              const hi = peakIds.includes(id as EgoScaleId);
              return (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  fill={hi ? '#db2777' : '#64748b'}
                  fontSize={11}
                  fontWeight={hi ? 800 : 600}
                >
                  {id}
                  {row ? ` ${row.raw}` : ''}
                </text>
              );
            }}
          />
          <Radar
            name="이고"
            dataKey="score"
            stroke="#6366f1"
            fill="#818cf8"
            fillOpacity={0.35}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniKtaaColumns({ columns }: { columns: EgoOkCompositeColumn[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-1.5" style={{ height: '5.5rem' }}>
        {columns.map((col) => {
          const total = Math.max(col.egoTotal, 1);
          const posH = (col.egoPositive / total) * 100;
          const negH = (col.egoNegative / total) * 100;
          return (
            <div key={col.id} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-full w-full flex-col-reverse overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/80">
                <div className="w-full bg-gradient-to-t from-sky-500 to-sky-300" style={{ height: `${posH}%` }} />
                <div className="w-full bg-gradient-to-t from-rose-400 to-rose-200" style={{ height: `${negH}%` }} />
              </div>
              <span className="text-[10px] font-bold text-slate-600">{col.id}</span>
            </div>
          );
        })}
      </div>
      <p className="text-center text-[10px] text-slate-500">
        <span className="inline-block h-2 w-2 rounded-sm bg-sky-400 align-middle" /> 긍정 ·{' '}
        <span className="inline-block h-2 w-2 rounded-sm bg-rose-300 align-middle" /> 부정 (척도 내 비율)
      </p>
    </div>
  );
}

function MiniOkBars({ rows, kind }: { rows: OkBarRow[]; kind: LifePositionKind }) {
  const max = 50;
  return (
    <div className="space-y-2">
      <p className="text-center text-lg font-bold text-indigo-700">{kind}</p>
      <div className="grid grid-cols-4 gap-2">
        {rows.map((r) => (
          <div key={r.name} className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full opacity-90"
                style={{ width: `${(r.score / max) * 100}%`, backgroundColor: r.fill }}
              />
            </div>
            <p className="text-center text-[9px] font-semibold text-slate-600">{r.poleTag}</p>
            <p className="text-center font-mono text-[10px] tabular-nums text-slate-500">{r.score}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniInnerMindStrip({ pairs }: { pairs: InnerMindPair[] }) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {pairs.map((p) => {
        const aligned = Math.abs(p.okMinusEgo) <= INNER_MIND_ALIGNED_MAX;
        const diff = p.okMinusEgo;
        const barW = Math.min(100, (Math.abs(diff) / 20) * 100);
        return (
          <div
            key={p.egoId}
            className={`rounded-lg px-1 py-2 text-center ring-1 ${aligned ? 'bg-sky-50 ring-sky-100' : 'bg-amber-50 ring-amber-100'}`}
          >
            <p className="text-[10px] font-bold text-slate-700">{p.egoShort}</p>
            <div className="mx-auto mt-1 h-1.5 w-full max-w-[3rem] overflow-hidden rounded-full bg-white">
              <div
                className={`h-full ${diff >= 0 ? 'ml-auto bg-fuchsia-400' : 'mr-auto bg-sky-400'}`}
                style={{ width: `${Math.max(barW, 8)}%` }}
              />
            </div>
            <p className="mt-1 font-mono text-[9px] tabular-nums text-slate-600">
              {diff >= 0 ? '+' : ''}
              {diff}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function MiniPolarityStrip({ egogram }: { egogram: EgoOkScaleScore[] }) {
  const rows = buildEgogramPolarityRows(egogram);
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="space-y-0.5">
          <div className="flex justify-between text-[10px]">
            <span className="font-bold text-slate-700">{row.id}</span>
            <span className="tabular-nums text-slate-500">부정 {row.negativePct}%</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="bg-sky-400" style={{ width: `${row.positivePct}%` }} />
            <div className="bg-rose-300" style={{ width: `${row.negativePct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function firstParagraph(text: string): string {
  const p = text.split(/\n\n+/)[0]?.trim();
  return p && p.length > 220 ? `${p.slice(0, 217)}…` : p ?? '';
}

export default function EgoOkReportExecutiveSummary({
  report,
  clientInfo,
  displayGenderLine,
  chartGender,
  localTestMode,
  testGender,
  onTestGenderChange,
  peakEgograms,
  lowEgograms,
  formLabel,
  okBarData,
  okLifeHeading,
  okLifeBullets,
  innerMindPairs,
  plus243Section6,
}: {
  report: EgoOkReport;
  clientInfo: ClientInfo | null;
  displayGenderLine: string;
  chartGender?: string;
  localTestMode?: boolean;
  testGender?: EgoOkGender;
  onTestGenderChange?: (gender: EgoOkGender) => void;
  peakEgograms: EgoOkScaleScore[];
  lowEgograms: EgoOkScaleScore[];
  formLabel: string;
  okBarData: OkBarRow[];
  okLifeHeading: string;
  okLifeBullets: string[];
  innerMindPairs: InnerMindPair[];
  plus243Section6: string;
}) {
  const peakIds = peakEgograms.map((s) => s.id);
  const pairGuidance = buildCounselorPairAndAdultGuidance(report.egogram);
  const polarityRows = buildEgogramPolarityRows(report.egogram);
  const polarityAlert = polarityRows.filter((r) => r.band !== 'within40').length;

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-b from-slate-50/95 to-indigo-50/40 p-3 ring-1 ring-white/80 sm:p-4">
      <header className="rounded-2xl border border-white bg-white/90 px-5 py-4 shadow-sm ring-1 ring-slate-100">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-500">종합 요약</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">TA 이고-오케이그램 · 한눈에 보기</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          타당도부터 이고그램·243+·오케이·속마음·부정성까지 핵심만 모았습니다. 자세한 해석은 각 탭에서 이어집니다.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-400">내담자</p>
            <p className="text-lg font-semibold text-slate-900">{clientInfo?.name?.trim() || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-400">성별 · 출생</p>
            {localTestMode && onTestGenderChange && testGender ? (
              <span className="mt-1 inline-flex rounded-lg bg-slate-100 p-0.5 ring-1 ring-slate-200">
                {(['male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onTestGenderChange(g)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                      testGender === g ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {egoOkGenderToLabel(g)}
                  </button>
                ))}
              </span>
            ) : (
              <p className="font-medium text-slate-800">{displayGenderLine}</p>
            )}
          </div>
          <div className="ml-auto">
            <Pattern243Block patternCode={report.patternCode} plus={report.pattern243Plus} />
          </div>
        </div>
        {localTestMode ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-100">
            로컬 테스트 모드 — 저장·발송되지 않습니다.
          </p>
        ) : null}
      </header>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <SummaryShell title="타당도" tabHint="타당도 탭">
          <ValidityTrafficBadge overall={report.validity?.overall} />
          <p className="mt-2 text-sm font-semibold text-slate-800">{report.validity?.overallTitle ?? '—'}</p>
          {report.validity?.overallSummary ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{report.validity.overallSummary}</p>
          ) : null}
          {report.validity ? (
            <div className="mt-3 overflow-x-auto rounded-xl bg-slate-50/80 p-2 ring-1 ring-slate-100 [&_table]:text-slate-700 [&_th]:text-slate-500">
              <ValidityTable validity={report.validity} showScoreBands={false} />
            </div>
          ) : null}
        </SummaryShell>

        <SummaryShell title="KTAA 종합" tabHint="KTAA 탭">
          <MiniKtaaColumns columns={report.compositeChart} />
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            다섯 척도의 긍·부정 비율을 한 줄로 비교합니다. 세부 막대·오케이 선은 KTAA 탭 그래프에서 확인합니다.
          </p>
        </SummaryShell>

        <SummaryShell title="이고그램" tabHint="이고 탭">
          <MiniEgogramRadar egogram={report.egogram} peakIds={peakIds} />
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-pink-600">최고</span>{' '}
            {peakEgograms.map((s) => formatEgogramEnergyHeadline(s)).join(' · ')}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">최저</span>{' '}
            {lowEgograms.map((s) => formatEgogramEnergyHeadline(s)).join(' · ')}
          </p>
          {formLabel && formLabel !== '—' ? (
            <p className="mt-2 rounded-lg bg-indigo-50/80 px-2 py-1 text-[11px] text-indigo-900">{formLabel}</p>
          ) : null}
        </SummaryShell>

        <SummaryShell title="243+ Plus 해석" tabHint="243+ 탭" className="lg:col-span-2 xl:col-span-1">
          <p className="text-xs leading-relaxed text-slate-600">{firstParagraph(plus243Section6)}</p>
          <ul className="mt-3 space-y-1">
            {report.egogram.map((s) => (
              <li key={s.id} className="flex justify-between text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">{s.id}</span>
                <span>
                  {rawScoreToPlus243Tier(s.raw).stage}단계 · {plus243TierToAscii(rawScoreToPlus243Tier(s.raw))}
                </span>
              </li>
            ))}
          </ul>
        </SummaryShell>

        <SummaryShell title="자율치료 · 대책" tabHint="대책 탭">
          <p className="text-xs leading-relaxed text-slate-600">
            CP↔NP · FC↔AC 관계와 성인(A) 조율을 중심으로 상담합니다. 아래는 핵심 한 줄 요약입니다.
          </p>
          <ul className="mt-2 list-inside list-disc space-y-2 text-xs leading-relaxed text-slate-700">
            {pairGuidance.slice(0, 3).map((line) => (
              <li key={line.slice(0, 32)}>{line.length > 160 ? `${line.slice(0, 157)}…` : line}</li>
            ))}
          </ul>
        </SummaryShell>

        <SummaryShell title="오케이그램 · 인생태도" tabHint="오케이 탭">
          <MiniOkBars rows={okBarData} kind={report.lifePosition.kind} />
          <p className="mt-2 text-xs font-semibold text-slate-700">{okLifeHeading}</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-[11px] text-slate-600">
            {okLifeBullets.slice(0, 2).map((b) => (
              <li key={b.slice(0, 24)}>{b}</li>
            ))}
          </ul>
        </SummaryShell>

        <SummaryShell title="나의 속마음" tabHint="속마음 탭">
          <MiniInnerMindStrip pairs={innerMindPairs} />
          <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
            겉(이고)과 속(오케이) 차이 |4| 이하면 잘 맞음 · 5 이상이면 해당 탭에서 상세 해석
          </p>
        </SummaryShell>

        <SummaryShell title="이고그램-부정성" tabHint="부정성 탭">
          <MiniPolarityStrip egogram={report.egogram} />
          <p className="mt-2 text-[11px] text-slate-600">
            {polarityAlert === 0
              ? '다섯 척도 모두 부정 40% 이하 — 권장 구간입니다.'
              : `${polarityAlert}개 척도에서 부정 41% 이상 — 부정성 탭에서 구간별 대책을 확인하세요.`}
          </p>
        </SummaryShell>
      </div>

      <p className="text-center text-[10px] text-slate-500">
        성별 기준 그래프: {chartGender ?? '미입력'} · 상단 탭에서 전체 보고서로 이동
      </p>
    </div>
  );
}
