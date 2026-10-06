'use client';

import type { ReactNode } from 'react';
import type { EgoOkScaleScore } from '@/lib/egoOkScoring';
import { EGO_ENERGY_DISPLAY_NAMES } from '@/lib/egogramEnergyStageComments';
import { plus243RecommendedRawRange } from '@/lib/egogram243Plus';
import {
  buildSelfHelpTherapyScalePlan,
  type SelfHelpTherapyScalePlan,
} from '@/lib/egogramManualNineStage';

const SCALE_ORDER: EgoOkScaleScore['id'][] = ['CP', 'NP', 'A', 'FC', 'AC'];

function ScaleBlock({
  plan,
  variant,
}: {
  plan: SelfHelpTherapyScalePlan;
  variant: 'counselor' | 'client';
}) {
  const name = EGO_ENERGY_DISPLAY_NAMES[plan.scaleId];
  const items = variant === 'counselor' ? plan.counselorTasks : plan.clientTasks;

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-sm ring-1 ring-white/5">
      <header className="border-b border-white/10 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {plan.scaleId} · {name}
        </p>
        <p className="mt-1 text-sm font-medium leading-snug text-slate-100">{plan.stageLeadIn}</p>
        <p className="mt-1 text-xs tabular-nums text-slate-400">
          {plan.tierLabel} · {plan.raw}점
        </p>
      </header>
      {variant === 'counselor' ? (
        <p className="mt-3 text-xs leading-relaxed text-slate-400">{plan.summary}</p>
      ) : null}
      {plan.adjacentHints.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-white/5 pt-3 text-xs text-slate-400">
          {plan.adjacentHints.map((line) => (
            <li key={line} className="leading-relaxed">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="mt-3 space-y-2">
        {items.map((line) => (
          <li
            key={line}
            className="flex gap-2 text-sm leading-relaxed text-slate-300 before:mt-2 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-violet-400/80 before:content-['']"
          >
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function ColumnShell({
  title,
  subtitle,
  toneClass,
  children,
}: {
  title: string;
  subtitle: string;
  toneClass: string;
  children: ReactNode;
}) {
  return (
    <section className={`flex flex-col rounded-2xl border p-5 ${toneClass}`}>
      <header className="mb-4 border-b border-white/10 pb-4">
        <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">{subtitle}</p>
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function EgoOkSelfHelpTherapyPanel({ egogram }: { egogram: EgoOkScaleScore[] }) {
  const { min, max } = plus243RecommendedRawRange();
  const byId = Object.fromEntries(egogram.map((s) => [s.id, s]));
  const plans = SCALE_ORDER.flatMap((id) => {
    const s = byId[id];
    return s ? [buildSelfHelpTherapyScalePlan(s)] : [];
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-indigo-950/40 px-5 py-4">
        <p className="text-sm leading-relaxed text-slate-300">
          243+플러스 9단계(A9~C1) 기준입니다. 권장 에너지는{' '}
          <span className="font-semibold text-emerald-200/90">4~6단계({min}~{max}점)</span>
          이고, 1~3은 부족·7~9는 과잉입니다. 단계 이동 목표는{' '}
          <span className="text-slate-200">인접 단계(±1)만</span> 둡니다.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <ColumnShell
          title="상담사용"
          subtitle="관찰 · psychoeducation · 과제 · 점검 · 안전"
          toneClass="border-violet-500/25 bg-violet-950/20"
        >
          {plans.map((plan) => (
            <ScaleBlock key={`c-${plan.scaleId}`} plan={plan} variant="counselor" />
          ))}
        </ColumnShell>

        <ColumnShell
          title="내담자용"
          subtitle="자율치료 · 일상 실천 (원고 제3장 기법·태도)"
          toneClass="border-teal-500/25 bg-teal-950/15"
        >
          {plans.map((plan) => (
            <ScaleBlock key={`p-${plan.scaleId}`} plan={plan} variant="client" />
          ))}
        </ColumnShell>
      </div>
    </div>
  );
}
