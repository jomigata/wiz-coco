'use client';

import type { EgoOkScaleScore } from '@/lib/egoOkScoring';
import { EGO_ENERGY_DISPLAY_NAMES } from '@/lib/egogramEnergyStageComments';
import {
  buildCounselorPairAndAdultGuidance,
  buildSelfHelpTherapyScalePlan,
  formatClientTasksForCounselor,
  type SelfHelpTherapyScalePlan,
} from '@/lib/egogramManualNineStage';

const SCALE_ORDER: EgoOkScaleScore['id'][] = ['CP', 'NP', 'A', 'FC', 'AC'];

function guidanceTone(line: string): string {
  if (line.includes('주의:')) return 'text-amber-100/90';
  if (line.includes('권장:')) return 'text-emerald-100/85';
  return 'text-slate-300';
}

function CounselorScaleBlock({ index, plan }: { index: number; plan: SelfHelpTherapyScalePlan }) {
  const name = EGO_ENERGY_DISPLAY_NAMES[plan.scaleId];
  const clientExplain = formatClientTasksForCounselor(plan.scaleId, plan.clientTasks);

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-5 shadow-sm ring-1 ring-white/5">
      <header className="border-b border-white/10 pb-4">
        <h4 className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-lg font-bold tracking-tight text-white sm:text-xl">
          <span className="font-mono text-base font-extrabold text-violet-300 tabular-nums">{index}.</span>
          <span>
            {plan.scaleId} · {name}
          </span>
        </h4>
        <p className="mt-2 text-sm font-medium leading-snug text-slate-200">{plan.stageLeadIn}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">{plan.tierLabel}</p>
      </header>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-violet-300/80">상담 관찰 · 설명</p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{plan.summary}</p>

      {plan.guidanceLines.length > 0 ? (
        <ul className="mt-4 space-y-2.5 border-t border-white/10 pt-4">
          {plan.guidanceLines.map((line) => (
            <li key={line} className={`text-sm leading-relaxed ${guidanceTone(line)}`}>
              {line}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-violet-300/80">상담사가 할 일</p>
      <ul className="mt-2 space-y-2">
        {plan.counselorTasks.map((line) => (
          <li
            key={line}
            className="flex gap-2 text-sm leading-relaxed text-slate-300 before:mt-2 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-violet-400/80 before:content-['']"
          >
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {clientExplain.length > 0 ? (
        <>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-teal-300/80">
            내담자 자율치료 — 상담사 설명·과제 전달
          </p>
          <ul className="mt-2 space-y-2">
            {clientExplain.map((line) => (
              <li
                key={line}
                className="flex gap-2 text-sm leading-relaxed text-slate-300 before:mt-2 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-teal-400/70 before:content-['']"
              >
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </article>
  );
}

export function EgoOkSelfHelpTherapyPanel({ egogram }: { egogram: EgoOkScaleScore[] }) {
  const byId = Object.fromEntries(egogram.map((s) => [s.id, s]));
  const plans = SCALE_ORDER.flatMap((id) => {
    const s = byId[id];
    return s ? [buildSelfHelpTherapyScalePlan(s)] : [];
  });
  const pairNotes = buildCounselorPairAndAdultGuidance(egogram);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-indigo-950/40 px-5 py-4">
        <p className="text-sm leading-relaxed text-slate-300">
          <span className="font-semibold text-white">상담사용</span> 대책 안내입니다. 243+플러스 9단계(A9~C1) 기준,
          권장은 <span className="font-semibold text-emerald-200/90">4~6단계</span>입니다. 내담자 자율치료는 아래처럼{' '}
          <span className="text-slate-200">설명하고 과제로 정하는 방식</span>으로 적었습니다.
        </p>
      </div>

      {pairNotes.length > 0 ? (
        <section className="rounded-2xl border border-indigo-500/30 bg-indigo-950/25 p-5">
          <h3 className="text-base font-semibold text-indigo-100">척도 관계 · A 조율 (상담 설명용)</h3>
          <ul className="mt-3 space-y-3">
            {pairNotes.map((line) => (
              <li key={line} className="text-sm leading-relaxed text-slate-300">
                {line}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col gap-5">
        {plans.map((plan, index) => (
          <CounselorScaleBlock key={plan.scaleId} index={index + 1} plan={plan} />
        ))}
      </div>
    </div>
  );
}
