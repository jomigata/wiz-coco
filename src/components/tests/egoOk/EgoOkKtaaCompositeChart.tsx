'use client';

import type { EgoOkCompositeColumn } from '@/lib/egoOkScoring';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
  LabelList,
} from 'recharts';

const EGO_NEG_COLOR = '#e8954a';
const EGO_POS_COLOR = '#9cc9e8';
const OK_LINE_COLOR = '#d32f2f';
const ZONE_LOW = '#fde8e8';
const ZONE_MID = '#e3f2fd';
const Y_TICKS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

type ChartRow = EgoOkCompositeColumn & {
  xLabel: string;
  okLinePlot: number | null;
};

function OkLineDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartRow;
  value?: number | null;
}) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || payload?.okLinePlot == null) return null;
  const v = payload.okLinePlot;
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill={OK_LINE_COLOR} stroke="#fff" strokeWidth={2} />
      <rect
        x={cx - 14}
        y={cy - 28}
        width={28}
        height={18}
        rx={2}
        fill="#fff"
        stroke={OK_LINE_COLOR}
        strokeWidth={1}
      />
      <text x={cx} y={cy - 15} textAnchor="middle" fill={OK_LINE_COLOR} fontSize={11} fontWeight={700}>
        {v}
      </text>
    </g>
  );
}

function EgoSegmentLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
}) {
  const { x, y, width, height, value } = props;
  if (value == null || value === 0 || x == null || y == null || !height || height < 12) return null;
  return (
    <text
      x={x + (width ?? 0) / 2}
      y={y + height / 2 + 4}
      textAnchor="middle"
      fill="#fff"
      fontSize={11}
      fontWeight={600}
      stroke="#00000033"
      strokeWidth={0.4}
      paintOrder="stroke"
    >
      {value}
    </text>
  );
}

export default function EgoOkKtaaCompositeChart({ columns }: { columns: EgoOkCompositeColumn[] }) {
  const data: ChartRow[] = columns.map((col) => ({
    ...col,
    xLabel: col.codeLabel,
    okLinePlot: col.okLine,
  }));

  return (
    <div className="overflow-hidden rounded-xl border border-sky-200 bg-white text-gray-900 shadow-inner">
      <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white px-4 py-3">
        <p className="text-sm font-bold text-sky-900">
          ◈ 이고-오케이 그램 (Ego-Ok Gram) 의 종합 결과 그래프
        </p>
      </div>

      <div className="grid grid-cols-5 gap-0 border-b border-gray-100 px-2 pt-3 text-center text-[10px] leading-tight text-gray-700 sm:text-xs">
        {columns.map((col) => (
          <div key={col.id} className="px-1 font-medium">
            {col.topLabel}
          </div>
        ))}
      </div>

      <div className="h-[340px] w-full px-1 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 24, right: 12, left: 4, bottom: 8 }}>
            <ReferenceArea y1={0} y2={12.5} fill={ZONE_LOW} fillOpacity={0.85} ifOverflow="extendDomain" />
            <ReferenceArea y1={12.5} y2={37.5} fill={ZONE_MID} fillOpacity={0.85} ifOverflow="extendDomain" />
            <ReferenceArea y1={37.5} y2={50} fill={ZONE_LOW} fillOpacity={0.85} ifOverflow="extendDomain" />
            <CartesianGrid stroke="#cbd5e1" strokeDasharray="0" vertical={true} horizontal={true} />
            <YAxis
              domain={[0, 50]}
              ticks={Y_TICKS}
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#94a3b8' }}
              width={28}
            />
            <XAxis
              dataKey="xLabel"
              tick={{ fill: 'transparent', fontSize: 1 }}
              axisLine={{ stroke: '#94a3b8' }}
              tickLine={false}
            />
            <Bar dataKey="egoNegative" stackId="ego" fill={EGO_NEG_COLOR} barSize={52} radius={[0, 0, 0, 0]}>
              <LabelList dataKey="egoNegative" content={<EgoSegmentLabel />} />
            </Bar>
            <Bar dataKey="egoPositive" stackId="ego" fill={EGO_POS_COLOR} barSize={52} radius={[2, 2, 0, 0]}>
              <LabelList dataKey="egoPositive" content={<EgoSegmentLabel />} />
              <LabelList
                dataKey="egoTotal"
                position="top"
                formatter={(v: number) => (v > 0 ? String(v) : '')}
                className="fill-gray-700 text-[11px] font-bold"
              />
            </Bar>
            <Line
              type="linear"
              dataKey="okLinePlot"
              stroke={OK_LINE_COLOR}
              strokeWidth={3}
              dot={<OkLineDot />}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-5 gap-0 border-t border-gray-100 px-2 py-2 text-center text-[10px] text-gray-600 sm:text-xs">
        {columns.map((col) => (
          <div key={`${col.id}-bottom`}>{col.bottomLabel}</div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1 px-2 pb-3">
        {columns.map((col) => {
          const isA = col.id === 'A';
          return (
            <div key={`${col.id}-code`} className="flex justify-center">
              <span
                className={`rounded border px-2 py-0.5 text-xs font-bold ${
                  isA
                    ? 'border-sky-500 text-sky-700'
                    : 'border-red-400 text-red-600'
                }`}
              >
                {col.codeLabel}
                {col.okTag ? (
                  <span className="ml-0.5 text-[10px] font-semibold">({col.okTag})</span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mx-3 mb-4 rounded border border-sky-300 bg-sky-50/80 px-3 py-2 text-[11px] leading-relaxed text-gray-800 sm:text-xs">
        <span className="font-bold text-red-600">CP</span> : (비판적, 지배적, 느슨함) ·{' '}
        <span className="font-bold text-red-600">NP</span> : (과보호, 헌신적, 방임적) ·{' '}
        <span className="font-bold text-sky-700">A</span> : (기계적, 현실적, 즉흥적) ·{' '}
        <span className="font-bold text-red-600">FC</span> : (개구쟁이, 개방적, 폐쇄적) ·{' '}
        <span className="font-bold text-red-600">AC</span> : (자기비하, 의존적, 독단적)
        <p className="mt-1 text-gray-600">
          <span className="inline-block h-2 w-3 rounded-sm align-middle" style={{ background: EGO_NEG_COLOR }} />{' '}
          이고그램(부정·하단) +{' '}
          <span className="inline-block h-2 w-3 rounded-sm align-middle" style={{ background: EGO_POS_COLOR }} />{' '}
          이고그램(긍정·상단) ·{' '}
          <span className="font-bold text-red-600">—</span> 오케이그램(적색 선, A열 제외)
        </p>
      </div>
    </div>
  );
}
