'use client';

import type { EgoOkReport } from '@/lib/egoOkScoring';
import type { ClientInfo } from '@/components/tests/MbtiProClientInfo';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

const LEVEL_STYLE: Record<string, string> = {
  A: 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/40',
  B: 'bg-sky-500/20 text-sky-200 ring-sky-400/40',
  C: 'bg-amber-500/20 text-amber-100 ring-amber-400/40',
  D: 'bg-orange-500/20 text-orange-100 ring-orange-400/40',
  E: 'bg-rose-500/20 text-rose-100 ring-rose-400/40',
};

function LevelBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-flex min-w-[2rem] items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold ring-1 ${LEVEL_STYLE[level] || 'bg-white/10 text-white ring-white/20'}`}
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
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-indigo-950/80 p-6 shadow-xl shadow-black/30">
      <header className="mb-5 border-b border-white/10 pb-4">
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

export default function EgoOkCounselorReport({
  report,
  clientInfo,
  localTestMode,
}: {
  report: EgoOkReport;
  clientInfo: ClientInfo | null;
  localTestMode?: boolean;
}) {
  const radarData = report.egogram.map((s) => ({
    scale: s.id,
    score: s.raw,
    fullMark: 50,
  }));

  const okBarData = report.okgram.map((s) => ({
    name: s.id,
    score: s.raw,
  }));

  const sectionOrder = ['1', '2', '3', '4'] as const;
  const barColors = ['#38bdf8', '#818cf8', '#34d399', '#f472b6'];

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-950 via-slate-950 to-[#070b14] p-8 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,rgba(99,102,241,0.25),transparent)]" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-300/80">Counselor report</p>
          <h1 className="mt-2 text-3xl font-bold text-white">TA 이고-오케이그램 검사 · 전문가 해석</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            2020.04.01 기준 90문항 · 5단계(A~E) · 243패턴(3단계) · 인생태도(NP−CP, FC−AC)를 종합한 상담
            참고 리포트입니다.
          </p>
          {localTestMode ? (
            <p className="mt-3 inline-block rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-100">
              로컬 테스트 모드 — 저장·발송되지 않습니다
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
                {[clientInfo?.gender, clientInfo?.birthYear ? `${clientInfo.birthYear}년` : '']
                  .filter(Boolean)
                  .join(' · ') || '—'}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="이고그램 5척도" subtitle="원점수 50 만점 · 5단계(A~E) · 243 구간(A/B/C)">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="rgba(148,163,184,0.25)" />
                <PolarAngleAxis dataKey="scale" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                <Radar
                  name="점수"
                  dataKey="score"
                  stroke="#818cf8"
                  fill="#6366f1"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 space-y-3">
            {report.egogram.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-3 rounded-xl bg-black/25 px-4 py-3 ring-1 ring-white/5"
              >
                <span className="w-8 font-mono text-sm font-bold text-indigo-300">{s.id}</span>
                <span className="min-w-0 flex-1 text-sm text-slate-200">{s.label}</span>
                <span className="font-mono text-sm text-white">
                  {s.raw}
                  <span className="text-slate-500">/50</span>
                </span>
                <LevelBadge level={s.fiveLevel} />
                <span className="text-xs text-slate-500">243:{s.threeLevel}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="오케이그램 · 인생태도" subtitle="문항 합계 및 TA 인생태도 축">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={okBarData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" domain={[0, 50]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={36} tick={{ fill: '#e2e8f0', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                />
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
            </div>
            <div className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
              <p className="text-xs text-slate-500">자기 축 (FC − AC)</p>
              <p className="mt-1 text-2xl font-semibold text-white">{report.lifePosition.iAxis}</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4">
            <p className="text-sm font-semibold text-indigo-100">인생태도: {report.lifePosition.kind}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{report.lifePosition.summary}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="text-slate-400">
              U+−U− 차이 등급: <LevelBadge level={report.okDifference.uGrade} />
            </span>
            <span className="text-slate-400">
              I+−I− 차이 등급: <LevelBadge level={report.okDifference.iGrade} />
            </span>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="243Plus 요약" subtitle="CP+NP · FC+AC 합산 구간 (243 수정 시트)">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <p className="text-xs uppercase tracking-wide text-slate-500">CP + NP</p>
            <p className="mt-2 text-3xl font-bold text-white">{report.plus243.cpNpSum}</p>
            <p className="mt-1 text-indigo-300">{report.plus243.cpNpLevel}</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <p className="text-xs uppercase tracking-wide text-slate-500">FC + AC</p>
            <p className="mt-2 text-3xl font-bold text-white">{report.plus243.fcAcSum}</p>
            <p className="mt-1 text-indigo-300">{report.plus243.fcAcLevel}</p>
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
            입니다. 상담 시 5단계 점수·인생태도·오케이그램 그래프를 함께 참고하세요.
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
