'use client';

import {
  KTAA_GRAPH_ZONES,
  normalizeEgoOkGender,
  type EgoOkCompositeColumn,
  type EgoOkGender,
  type KtaaGraphZoneBounds,
} from '@/lib/egoOkScoring';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
} from 'recharts';

const EGO_NEG_COLOR = '#e8954a';
const EGO_POS_COLOR = '#9cc9e8';
const OK_LINE_COLOR = '#d32f2f';
/** KTAA: 좌=남(청), 우=여(붉은) — C/B/A 구간 모두 성별 톤 (협회 안내서) */
const GENDER_ZONE_COLORS = {
  male: { bottom: '#bdd8e8', middle: '#eef6fb', top: '#d6e8f5' },
  female: { bottom: '#f5d6d6', middle: '#ffffff', top: '#ecd6d6' },
} as const;

const CHART_PLOT_HEIGHT_PX = Math.round(680 * (2 / 3) * 1.2);

const Y_TICKS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

const COLUMN_ORDER = ['CP', 'NP', 'A', 'FC', 'AC'] as const;

/** 플롯 영역(inset) — ComposedChart margin과 맞춤 */
const PLOT_INSET = { top: '7%', right: '3%', bottom: '4%', left: '7%' };

function KtaaZoneStack({ band, tint }: { band: KtaaGraphZoneBounds; tint: 'male' | 'female' }) {
  const redH = (band.redTop / 50) * 100;
  const whiteH = ((band.whiteTop - band.redTop) / 50) * 100;
  const blueH = ((50 - band.whiteTop) / 50) * 100;
  const colors = GENDER_ZONE_COLORS[tint];
  return (
    <>
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: `${redH}%`, backgroundColor: colors.bottom }}
      />
      <div
        className="absolute inset-x-0"
        style={{ bottom: `${redH}%`, height: `${whiteH}%`, backgroundColor: colors.middle }}
      />
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: `${blueH}%`, backgroundColor: colors.top }}
      />
    </>
  );
}

/** 열마다 좌(남)·우(여) 배경 구간 높이 — KTAA 종합 그래프 샘플과 동일 */
function KtaaColumnBackgrounds() {
  return (
    <div
      className="pointer-events-none absolute z-0 flex"
      style={{ top: PLOT_INSET.top, right: PLOT_INSET.right, bottom: PLOT_INSET.bottom, left: PLOT_INSET.left }}
    >
      {COLUMN_ORDER.map((code) => (
        <div key={code} className="relative flex h-full min-w-0 flex-1">
          <div className="relative h-full w-1/2 border-r border-slate-400/70">
            <KtaaZoneStack band={KTAA_GRAPH_ZONES.male[code]} tint="male" />
          </div>
          <div className="relative h-full w-1/2">
            <KtaaZoneStack band={KTAA_GRAPH_ZONES.female[code]} tint="female" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 5개 척도 열 구분선 (배경·차트 위) */
function KtaaColumnDividers() {
  return (
    <div
      className="pointer-events-none absolute z-[2] flex"
      style={{ top: PLOT_INSET.top, right: PLOT_INSET.right, bottom: PLOT_INSET.bottom, left: PLOT_INSET.left }}
    >
      {COLUMN_ORDER.map((code, index) => (
        <div
          key={`div-${code}`}
          className={`h-full min-w-0 flex-1 ${index < COLUMN_ORDER.length - 1 ? 'border-r-2 border-slate-500/75' : ''}`}
        />
      ))}
    </div>
  );
}

type ChartRow = EgoOkCompositeColumn & {
  xLabel: string;
  okLinePlot: number | null;
};

const OK_LABEL_ABOVE_MIN_CY = 36;

function OkLineDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartRow;
  value?: number | null;
}) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || payload?.okLinePlot == null) return null;
  const v = payload.okLinePlot;
  const labelAbove = cy >= OK_LABEL_ABOVE_MIN_CY;
  const rectY = labelAbove ? cy - 28 : cy + 10;
  const textY = labelAbove ? cy - 15 : cy + 23;
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill={OK_LINE_COLOR} stroke="#fff" strokeWidth={2} />
      <rect
        x={cx - 14}
        y={rectY}
        width={28}
        height={18}
        rx={2}
        fill="#fff"
        stroke={OK_LINE_COLOR}
        strokeWidth={1}
      />
      <text x={cx} y={textY} textAnchor="middle" fill={OK_LINE_COLOR} fontSize={11} fontWeight={700}>
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

export default function EgoOkKtaaCompositeChart({
  columns,
  gender: genderInput,
}: {
  columns: EgoOkCompositeColumn[];
  /** 내담자 성별 — 범례 표시용 (배경은 좌=남·우=여 항상 표시) */
  gender?: string;
}) {
  const subjectGender: EgoOkGender = normalizeEgoOkGender(genderInput);
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

      <div className="grid grid-cols-5 gap-0 border-b border-gray-200 px-2 pt-3 text-center text-[10px] leading-tight text-gray-700 sm:text-xs">
        {columns.map((col, index) => (
          <div
            key={col.id}
            className={`px-1 font-medium ${index < columns.length - 1 ? 'border-r-2 border-slate-400/60' : ''}`}
          >
            {col.topLabel}
          </div>
        ))}
      </div>

      <p className="px-3 pb-1 text-center text-[10px] text-gray-500 sm:text-xs">
        배경: 각 열 <span className="text-sky-700">← 남(청)</span> ·{' '}
        <span className="text-rose-600">여(붉은) →</span>
      </p>

      <div
        className="relative w-full overflow-hidden px-1 pt-1"
        style={{ height: CHART_PLOT_HEIGHT_PX }}
      >
        <KtaaColumnBackgrounds />
        <ResponsiveContainer width="100%" height="100%" className="relative z-[1]">
          <ComposedChart
            data={data}
            margin={{ top: 40, right: 16, left: 38, bottom: 12 }}
            style={{ background: 'transparent' }}
          >
            <ReferenceLine
              y={12.5}
              stroke="#e57373"
              strokeDasharray="4 4"
              strokeOpacity={0.55}
              ifOverflow="extendDomain"
            />
            <CartesianGrid stroke="#cbd5e1" strokeDasharray="0" vertical horizontal fillOpacity={0} />
            <YAxis
              domain={[0, 50]}
              ticks={Y_TICKS}
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#94a3b8' }}
              width={32}
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
              connectNulls
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <KtaaColumnDividers />
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

      <div className="mx-3 mb-4 space-y-3 rounded border border-sky-300 bg-sky-50/80 px-4 py-3 text-[11px] leading-relaxed text-gray-800 sm:text-xs">
        <p className="font-bold text-sky-900">점수가 그래프에 표시되는 방식</p>
        <ol className="list-decimal space-y-2 pl-4 text-gray-800">
          <li>
            <strong>응답 → 문항 점수</strong>: 각 문항은 6점 척도(1=매우 아니다 ~ 6=매우 그렇다)로
            답하고, 채점 시 <strong>0~5점</strong>으로 환산합니다(6→5, 5→4, …, 1→0).
          </li>
          <li>
            <strong>막대 = 이고그램(CP·NP·A·FC·AC)</strong>: 척도마다 긍정 문항 5개·부정 문항 5개(합 10문항,
            만점 50).{' '}
            <span className="inline-block h-2 w-3 rounded-sm align-middle" style={{ background: EGO_NEG_COLOR }} />{' '}
            <strong>주황(아래)</strong>은 부정 문항 합(0~25),{' '}
            <span className="inline-block h-2 w-3 rounded-sm align-middle" style={{ background: EGO_POS_COLOR }} />{' '}
            <strong>하늘(위)</strong>은 긍정 문항 합(0~25). 막대 안 숫자는 각 층 점수,{' '}
            <strong>막대 꼭대기 숫자</strong>는 두 층을 더한 <strong>이고그램 척도 총점(0~50)</strong>입니다.
          </li>
          <li>
            <strong>적색 선 = 오케이그램</strong>: U−·U+·I+·I− 척도 각 10문항 합(0~50)을 같은 열에
            표시합니다. <strong>CP→U−, NP→U+, FC→I+, AC→I−</strong>. 성인(A) 열에는 오케이 선이 없습니다.
            선 위 숫자가 해당 오케이 척도 원점수입니다.
          </li>
          <li>
            <strong>배경색(열·성별마다 다름)</strong>: KTAA 종합 그래프와 같이 각 열을{' '}
            <strong>왼쪽=남성(청)</strong>, <strong>오른쪽=여성(붉은)</strong> 기준으로 나누고, 하단 C · 중간 B ·
            상단 A 구간 높이가 척도·성별마다 다릅니다(3단계 컷 bMin/aMin과 동일).{' '}
            <span
              className="inline-block h-2 w-3 rounded-sm border border-sky-200 align-middle"
              style={{ background: GENDER_ZONE_COLORS.male.bottom }}
            />{' '}
            남 하단 ·{' '}
            <span
              className="inline-block h-2 w-3 rounded-sm border border-red-200 align-middle"
              style={{ background: GENDER_ZONE_COLORS.female.bottom }}
            />{' '}
            여 하단 · 상단도 각각 청/붉은 톤. 점선(12.5)은 참고 기준선입니다.
            {genderInput ? (
              <>
                {' '}
                내담자 기준: <strong>{subjectGender === 'female' ? '여성(열 오른쪽)' : '남성(열 왼쪽)'}</strong>.
              </>
            ) : null}
          </li>
        </ol>
        <p className="border-t border-sky-200 pt-2 text-gray-700">
          <span className="font-bold text-red-600">CP</span> (비판적·지배적 / 느슨함) ·{' '}
          <span className="font-bold text-red-600">NP</span> (과보호·헌신적 / 방임적) ·{' '}
          <span className="font-bold text-sky-700">A</span> (기계적·현실적 / 즉흥적) ·{' '}
          <span className="font-bold text-red-600">FC</span> (개구쟁이·개방적 / 폐쇄적) ·{' '}
          <span className="font-bold text-red-600">AC</span> (자기비하·의존적 / 독단적)
        </p>
      </div>
    </div>
  );
}
