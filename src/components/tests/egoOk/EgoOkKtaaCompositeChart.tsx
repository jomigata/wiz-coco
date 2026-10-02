'use client';

import { useCallback, useLayoutEffect, useState, type CSSProperties, type ReactNode } from 'react';
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
  Customized,
} from 'recharts';

const EGO_NEG_COLOR = '#e8954a';
const EGO_POS_COLOR = '#9cc9e8';
const EGO_TOTAL_BOX_STROKE = '#0284c7';
const OK_LINE_COLOR = '#d32f2f';
/** KTAA: 좌=남(청), 우=여(붉은) — C/B/A 구간 모두 성별 톤 (협회 안내서) */
/** C/B/A 구간 — 좌(남·청) / 우(여·붉은) 톤이 상·중·하 모두 이어지도록 (중간도 순백 제외) */
const GENDER_ZONE_COLORS = {
  male: { bottom: '#bdd8e8', middle: '#d4e8f2', top: '#d6e8f5' },
  female: { bottom: '#f5d6d6', middle: '#f2dede', top: '#ecd6d6' },
} as const;

const CHART_PLOT_HEIGHT_PX = Math.round(680 * (2 / 3) * 1.2);

const Y_TICKS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

const COLUMN_ORDER = ['CP', 'NP', 'A', 'FC', 'AC'] as const;

const Y_AXIS_WIDTH = 32;
/** 플롯 상·하 대칭 (이고 합계 라벨·척도명 간격) */
const CHART_EDGE_MARGIN = 8;
const CHART_MARGIN = {
  top: CHART_EDGE_MARGIN,
  right: 16,
  left: Y_AXIS_WIDTH,
  bottom: CHART_EDGE_MARGIN,
};

/** 상·하 척도명 ↔ 플롯 테두리 HTML 간격 (동일 px) */
const TRAIT_LABEL_PLOT_GAP_PX = 6;
const TRAIT_LABEL_PLOT_GAP_TOP = { paddingBottom: TRAIT_LABEL_PLOT_GAP_PX };
const TRAIT_LABEL_PLOT_GAP_BOTTOM = { paddingTop: TRAIT_LABEL_PLOT_GAP_PX };
const BOTTOM_TRAIT_TO_CODE_GAP = 'pt-2.5';

const COLUMN_TRAIT_TITLE_CLASS =
  'flex items-center justify-center px-0.5 text-center text-[10px] font-semibold leading-tight text-gray-700 sm:text-xs';

const COLUMN_DIVIDER_CLASS = 'border-r-2 border-slate-500/80';

type KtaaPlotBox = { left: number; width: number };

/** Recharts offset과 동일한 픽셀 박스로 5열 라벨 정렬 */
function KtaaPlotLabelColumns({
  plotBox,
  children,
  className = '',
  style,
}: {
  plotBox: KtaaPlotBox | null;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const fallbackLeft = CHART_MARGIN.left + Y_AXIS_WIDTH;
  const fallbackWidth = `calc(100% - ${fallbackLeft + CHART_MARGIN.right}px)`;
  const gridStyle = plotBox
    ? { marginLeft: plotBox.left, width: plotBox.width }
    : { marginLeft: fallbackLeft, width: fallbackWidth };

  return (
    <div className={`w-full ${className}`} style={style}>
      <div className="grid grid-cols-5 gap-0" style={gridStyle}>
        {children}
      </div>
    </div>
  );
}

function KtaaPlotLayoutReporter(props: {
  offset?: { left: number; top: number; width: number; height: number };
  xAxisMap?: Record<string, { scale: XBandScale }>;
  onPlotBox?: (box: KtaaPlotBox) => void;
}) {
  const { offset, xAxisMap, onPlotBox } = props;
  useLayoutEffect(() => {
    if (!offset?.width || !onPlotBox) return;
    const columns = getKtaaColumnLayouts(offset, xAxisMap);
    if (columns.length === 0) return;
    const first = columns[0];
    const last = columns[columns.length - 1];
    onPlotBox({ left: first.x, width: last.x + last.width - first.x });
  }, [offset, xAxisMap, onPlotBox]);
  return null;
}

const PLOT_FRAME_STROKE = '#64748b';

type YScale = ((v: number) => number) & { bandwidth?: () => number };
type XBandScale = ((v: string) => number) & { bandwidth?: () => number };

type KtaaColumnLayout = { code: (typeof COLUMN_ORDER)[number]; x: number; width: number };

function getKtaaColumnLayouts(
  offset: { left: number; top: number; width: number; height: number },
  xAxisMap?: Record<string, { scale: XBandScale }>,
): KtaaColumnLayout[] {
  const xScale = Object.values(xAxisMap ?? {})[0]?.scale;
  if (!xScale) {
    const colW = offset.width / COLUMN_ORDER.length;
    return COLUMN_ORDER.map((code, i) => ({
      code,
      x: offset.left + i * colW,
      width: colW,
    }));
  }

  const bandW = xScale.bandwidth?.();
  const firstX = xScale(COLUMN_ORDER[0]);
  if (typeof bandW === 'number' && bandW > 0 && typeof firstX === 'number' && !Number.isNaN(firstX)) {
    return COLUMN_ORDER.map((code) => ({
      code,
      x: offset.left + xScale(code),
      width: bandW,
    }));
  }

  const centers = COLUMN_ORDER.map((code) => offset.left + xScale(code));
  return COLUMN_ORDER.map((code, i) => {
    const leftEdge = i === 0 ? offset.left : (centers[i - 1] + centers[i]) / 2;
    const rightEdge =
      i === COLUMN_ORDER.length - 1
        ? offset.left + offset.width
        : (centers[i] + centers[i + 1]) / 2;
    return { code, x: leftEdge, width: rightEdge - leftEdge };
  });
}

function ktaaZoneRects(
  x: number,
  w: number,
  band: KtaaGraphZoneBounds,
  colors: (typeof GENDER_ZONE_COLORS)[keyof typeof GENDER_ZONE_COLORS],
  scale: YScale,
  keyPrefix: string,
) {
  const yBand = (from: number, to: number, fill: string, key: string) => {
    const y1 = scale(from);
    const y2 = scale(to);
    const y = Math.min(y1, y2);
    const h = Math.abs(y2 - y1);
    return <rect key={key} x={x} y={y} width={w} height={h} fill={fill} />;
  };
  return [
    yBand(0, band.redTop, colors.bottom, `${keyPrefix}-c`),
    yBand(band.redTop, band.whiteTop, colors.middle, `${keyPrefix}-b`),
    yBand(band.whiteTop, 50, colors.top, `${keyPrefix}-a`),
  ];
}

/** 플롯 사각형 안 배경·열 구분선 — X축 band 위치와 막대 열 정렬 */
function KtaaPlotBackground(props: {
  offset?: { left: number; top: number; width: number; height: number };
  xAxisMap?: Record<string, { scale: XBandScale }>;
  yAxisMap?: Record<string, { scale: YScale }>;
}) {
  const { offset, xAxisMap, yAxisMap } = props;
  if (!offset?.width || !yAxisMap) return null;
  const yScale = Object.values(yAxisMap)[0]?.scale;
  if (!yScale) return null;

  const { left, top, width, height } = offset;
  const columns = getKtaaColumnLayouts(offset, xAxisMap);
  const clipId = 'ktaa-plot-clip';

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={left} y={top} width={width} height={height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {columns.map(({ code, x: xCol, width: colW }) => {
          const halfW = colW / 2;
          return (
            <g key={code}>
              {ktaaZoneRects(
                xCol,
                halfW,
                KTAA_GRAPH_ZONES.male[code],
                GENDER_ZONE_COLORS.male,
                yScale,
                `${code}-m`,
              )}
              {ktaaZoneRects(
                xCol + halfW,
                halfW,
                KTAA_GRAPH_ZONES.female[code],
                GENDER_ZONE_COLORS.female,
                yScale,
                `${code}-f`,
              )}
              <line
                x1={xCol + halfW}
                y1={top}
                x2={xCol + halfW}
                y2={top + height}
                stroke={PLOT_FRAME_STROKE}
                strokeWidth={1}
                strokeOpacity={0.45}
              />
            </g>
          );
        })}
        {columns.slice(0, -1).map(({ code, x, width: colW }) => (
          <line
            key={`col-div-${code}`}
            x1={x + colW}
            y1={top}
            x2={x + colW}
            y2={top + height}
            stroke={PLOT_FRAME_STROKE}
            strokeWidth={2}
          />
        ))}
      </g>
    </g>
  );
}

function KtaaPlotFrameBorder(props: {
  offset?: { left: number; top: number; width: number; height: number };
}) {
  const { offset } = props;
  if (!offset?.width) return null;
  const { left, top, width, height } = offset;
  return (
    <rect
      x={left}
      y={top}
      width={width}
      height={height}
      fill="none"
      stroke={PLOT_FRAME_STROKE}
      strokeWidth={2}
    />
  );
}

type ChartRow = EgoOkCompositeColumn & {
  xLabel: string;
  /** CP·NP 구간만 (A 미연결) */
  okLineCpNp: number | null;
  /** FC·AC 구간만 */
  okLineFcAc: number | null;
};

const OK_LABEL_ABOVE_MIN_CY = 36;

function OkLineDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartRow;
  value?: number | null;
}) {
  const { cx, cy, payload } = props;
  const v =
    payload?.okLineCpNp != null
      ? payload.okLineCpNp
      : payload?.okLineFcAc != null
        ? payload.okLineFcAc
        : null;
  if (cx == null || cy == null || v == null) return null;
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
        rx={0}
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

function EgoTotalBoxLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  value?: number | string;
}) {
  const { x, y, width, value } = props;
  if (value == null || value === '' || value === 0 || x == null || y == null) return null;
  const text = String(value);
  const cx = x + (width ?? 0) / 2;
  const boxW = Math.max(26, text.length * 8 + 10);
  const boxH = 18;
  const boxY = y - boxH - 3;
  return (
    <g>
      <rect
        x={cx - boxW / 2}
        y={boxY}
        width={boxW}
        height={boxH}
        rx={0}
        fill="#fff"
        stroke={EGO_TOTAL_BOX_STROKE}
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={boxY + 13}
        textAnchor="middle"
        fill="#0c4a6e"
        fontSize={11}
        fontWeight={700}
      >
        {text}
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
  const [plotBox, setPlotBox] = useState<KtaaPlotBox | null>(null);
  const handlePlotBox = useCallback((box: KtaaPlotBox) => {
    setPlotBox((prev) =>
      prev && prev.left === box.left && prev.width === box.width ? prev : box,
    );
  }, []);
  const data: ChartRow[] = columns.map((col) => ({
    ...col,
    xLabel: col.codeLabel,
    okLineCpNp: col.id === 'CP' || col.id === 'NP' ? col.okLine : null,
    okLineFcAc: col.id === 'FC' || col.id === 'AC' ? col.okLine : null,
  }));

  return (
    <div className="overflow-hidden rounded-xl border border-sky-200 bg-white text-gray-900 shadow-inner">
      <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white px-4 py-3">
        <p className="text-sm font-bold text-sky-900">
          ◈ 이고-오케이 그램 (Ego-Ok Gram) 의 종합 결과 그래프
        </p>
      </div>

      <KtaaPlotLabelColumns plotBox={plotBox} style={TRAIT_LABEL_PLOT_GAP_TOP}>
        {columns.map((col, index) => (
          <div
            key={col.id}
            className={`${COLUMN_TRAIT_TITLE_CLASS} ${
              index < columns.length - 1 ? COLUMN_DIVIDER_CLASS : ''
            }`}
          >
            {col.topLabel}
          </div>
        ))}
      </KtaaPlotLabelColumns>

      <div className="relative w-full leading-none" style={{ height: CHART_PLOT_HEIGHT_PX }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={CHART_MARGIN}
            barCategoryGap={0}
            barGap={0}
            style={{ background: 'transparent' }}
          >
            <Customized component={KtaaPlotBackground} />
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
              allowDataOverflow
              padding={{ top: 0, bottom: 0 }}
              ticks={Y_TICKS}
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#94a3b8' }}
              width={Y_AXIS_WIDTH}
            />
            <XAxis
              dataKey="xLabel"
              scale="band"
              hide
              height={0}
              padding={{ left: 0, right: 0 }}
            />
            <Bar dataKey="egoNegative" stackId="ego" fill={EGO_NEG_COLOR} barSize={52} radius={[0, 0, 0, 0]}>
              <LabelList dataKey="egoNegative" content={<EgoSegmentLabel />} />
            </Bar>
            <Bar dataKey="egoPositive" stackId="ego" fill={EGO_POS_COLOR} barSize={52} radius={[2, 2, 0, 0]}>
              <LabelList dataKey="egoPositive" content={<EgoSegmentLabel />} />
              <LabelList dataKey="egoTotal" content={<EgoTotalBoxLabel />} />
            </Bar>
            <Line
              type="linear"
              dataKey="okLineCpNp"
              stroke={OK_LINE_COLOR}
              strokeWidth={3}
              dot={<OkLineDot />}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="okLineFcAc"
              stroke={OK_LINE_COLOR}
              strokeWidth={3}
              dot={<OkLineDot />}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Customized component={KtaaPlotFrameBorder} />
            <Customized
              component={(props: {
                offset?: { left: number; top: number; width: number; height: number };
                xAxisMap?: Record<string, { scale: XBandScale }>;
              }) => (
                <KtaaPlotLayoutReporter
                  offset={props.offset}
                  xAxisMap={props.xAxisMap}
                  onPlotBox={handlePlotBox}
                />
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <KtaaPlotLabelColumns plotBox={plotBox} style={TRAIT_LABEL_PLOT_GAP_BOTTOM}>
        {columns.map((col, index) => (
          <div
            key={`${col.id}-bottom`}
            className={`${COLUMN_TRAIT_TITLE_CLASS} ${
              index < columns.length - 1 ? COLUMN_DIVIDER_CLASS : ''
            }`}
          >
            {col.bottomLabel}
          </div>
        ))}
      </KtaaPlotLabelColumns>

      <KtaaPlotLabelColumns plotBox={plotBox} className={`pb-2 ${BOTTOM_TRAIT_TO_CODE_GAP}`}>
        {columns.map((col, index) => {
          const isA = col.id === 'A';
          return (
            <div
              key={`${col.id}-code`}
              className={`flex items-center justify-center ${
                index < columns.length - 1 ? COLUMN_DIVIDER_CLASS : ''
              }`}
            >
              <span
                className={`rounded border px-2 py-0.5 text-xs font-bold ${
                  isA ? 'border-sky-500 text-sky-700' : 'border-red-400 text-red-600'
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
      </KtaaPlotLabelColumns>

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
            표시합니다. <strong>CP→U−, NP→U+, FC→I+, AC→I−</strong>. 선은 <strong>CP–NP</strong>와{' '}
            <strong>FC–AC</strong>만 이어지고 <strong>A 열과는 연결하지 않습니다</strong>. 막대 꼭대기
            이고 합계(0~50)는 사각 테두리 안 숫자로 표시합니다.
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
