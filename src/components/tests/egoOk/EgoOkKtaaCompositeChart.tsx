'use client';

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
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
/** KTAA C(하)·B(중)·A(상) — 남/여 동일: 하단 하늘 · 중간 흰 · 상단 분홍 */
const ZONE_WHITE = '#ffffff';
const ZONE_SKY = '#d6e8f5';
const ZONE_PINK = '#f5d6d6';

const CHART_ZONE_COLORS = {
  bottom: ZONE_SKY,
  middle: ZONE_WHITE,
  top: ZONE_PINK,
} as const;

function isClientGenderProvided(genderInput: string | undefined): boolean {
  const g = (genderInput ?? '').trim();
  return g.length > 0 && g !== '—' && g !== '-';
}

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

type KtaaPlotBox = { left: number; top: number; width: number; height: number };

type YScale = ((v: number) => number) & { bandwidth?: () => number };

type PlotBackgroundProps = {
  offset?: { left: number; top: number; width: number; height: number };
  yAxisMap?: Record<string, { scale: YScale }>;
};

type EgogramDominance = 'positive' | 'negative' | 'even';

function columnDominance(col: EgoOkCompositeColumn): EgogramDominance {
  if (col.egoPositive > col.egoNegative) return 'positive';
  if (col.egoNegative > col.egoPositive) return 'negative';
  return 'even';
}

function createKtaaColumnHoverLayer(
  hoveredId: (typeof COLUMN_ORDER)[number] | null,
  columns: EgoOkCompositeColumn[],
) {
  return function KtaaColumnHoverLayer(props: PlotBackgroundProps) {
    const { offset } = props;
    if (!hoveredId || !offset?.width) return null;
    const colIndex = COLUMN_ORDER.indexOf(hoveredId);
    if (colIndex < 0) return null;
    const col = columns.find((c) => c.id === hoveredId);
    if (!col) return null;
    const { left, top, width, height } = offset;
    const colW = width / COLUMN_ORDER.length;
    const x = left + colIndex * colW;
    const dom = columnDominance(col);
    const gradId = `ktaa-hover-${hoveredId}`;
    const stops =
      dom === 'positive'
        ? (
            <>
              <stop offset="0%" stopColor={EGO_POS_COLOR} stopOpacity={0.45} />
              <stop offset="55%" stopColor="#ffffff" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </>
          )
        : dom === 'negative'
          ? (
              <>
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
                <stop offset="45%" stopColor="#ffffff" stopOpacity={0.06} />
                <stop offset="100%" stopColor={EGO_NEG_COLOR} stopOpacity={0.45} />
              </>
            )
          : (
              <>
                <stop offset="0%" stopColor={EGO_POS_COLOR} stopOpacity={0.22} />
                <stop offset="100%" stopColor={EGO_NEG_COLOR} stopOpacity={0.22} />
              </>
            );

    return (
      <g pointerEvents="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            {stops}
          </linearGradient>
        </defs>
        <rect x={x} y={top} width={colW} height={height} fill={`url(#${gradId})`} />
      </g>
    );
  };
}

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
  onPlotBox?: (box: KtaaPlotBox) => void;
}) {
  const { offset, onPlotBox } = props;
  useLayoutEffect(() => {
    if (offset?.width && onPlotBox) {
      onPlotBox({
        left: offset.left,
        top: offset.top,
        width: offset.width,
        height: offset.height,
      });
    }
  }, [offset?.left, offset?.top, offset?.width, offset?.height, onPlotBox]);
  return null;
}

const PLOT_FRAME_STROKE = '#64748b';

function ktaaZoneRects(
  x: number,
  w: number,
  band: KtaaGraphZoneBounds,
  colors: typeof CHART_ZONE_COLORS,
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

/** 내담자 성별 기준: 열 전체 동일 색·동일 C/B/A 구간 높이(남 또는 여 컷) */
function createKtaaPlotBackground(displayGender: EgoOkGender) {
  return function KtaaPlotBackground(props: PlotBackgroundProps) {
    const { offset, yAxisMap } = props;
    if (!offset?.width || !yAxisMap) return null;
    const scale = Object.values(yAxisMap)[0]?.scale;
    if (!scale) return null;

    const { left, top, width, height } = offset;
    const colW = width / COLUMN_ORDER.length;
    const clipId = 'ktaa-plot-clip';
    const zoneBands = KTAA_GRAPH_ZONES[displayGender];

    return (
      <g>
        <defs>
          <clipPath id={clipId}>
            <rect x={left} y={top} width={width} height={height} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {COLUMN_ORDER.map((code, i) => {
            const xCol = left + i * colW;
            return (
              <g key={code}>
                {ktaaZoneRects(
                  xCol,
                  colW,
                  zoneBands[code],
                  CHART_ZONE_COLORS,
                  scale,
                  `${code}-zones`,
                )}
              </g>
            );
          })}
        {[1, 2, 3, 4].map((k) => (
          <line
            key={`col-${k}`}
            x1={left + k * colW}
            y1={top}
            x2={left + k * colW}
            y2={top + height}
            stroke={PLOT_FRAME_STROKE}
            strokeWidth={2}
          />
        ))}
        </g>
      </g>
    );
  };
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

const OK_DOT_R = 7;
const SUM_LABEL_BOX_H = 18;
const SUM_LABEL_GAP = 4;

function sumLabelBoxWidth(value: number): number {
  return Math.max(26, String(value).length * 8 + 10);
}

type SumLabelRect = { x: number; y: number; w: number; textX: number };

function sumLabelAboveDot(cx: number, cy: number, boxW: number): SumLabelRect {
  return {
    x: cx - boxW / 2,
    y: cy - OK_DOT_R - SUM_LABEL_GAP - SUM_LABEL_BOX_H,
    w: boxW,
    textX: cx,
  };
}

function sumLabelBelowDot(cx: number, cy: number, boxW: number): SumLabelRect {
  return {
    x: cx - boxW / 2,
    y: cy + OK_DOT_R + SUM_LABEL_GAP,
    w: boxW,
    textX: cx,
  };
}

function sumLabelAboveBar(cx: number, cyBarTop: number, boxW: number): SumLabelRect {
  return {
    x: cx - boxW / 2,
    y: cyBarTop - SUM_LABEL_GAP - SUM_LABEL_BOX_H,
    w: boxW,
    textX: cx,
  };
}

function sumLabelRectsOverlapY(a: SumLabelRect, b: SumLabelRect): boolean {
  const aTop = a.y;
  const aBottom = a.y + SUM_LABEL_BOX_H;
  const bTop = b.y;
  const bBottom = b.y + SUM_LABEL_BOX_H;
  return aTop < bBottom && bTop < aBottom;
}

/** 이고 합계 박스 vs 오케이 합계 박스 · 점 · 라인(점 Y) */
function egoSumOverlapsOkObstacles(
  ego: SumLabelRect,
  cyOk: number,
  okRect: SumLabelRect,
): boolean {
  if (sumLabelRectsOverlapY(ego, okRect)) return true;
  const pad = SUM_LABEL_GAP;
  const blockTop = cyOk - OK_DOT_R - pad;
  const blockBottom = cyOk + OK_DOT_R + pad;
  const egoTop = ego.y;
  const egoBottom = ego.y + SUM_LABEL_BOX_H;
  return egoTop < blockBottom && blockTop < egoBottom;
}

const EGO_SUM_NUDGE_MAX_PX = 140;

function egoSumMinYWhenScoresEqual(okRect: SumLabelRect): number {
  return okRect.y + SUM_LABEL_BOX_H + SUM_LABEL_GAP;
}

function egoSumPlacementValid(
  ego: SumLabelRect,
  cyOk: number,
  okRect: SumLabelRect,
  scoresEqual: boolean,
): boolean {
  if (scoresEqual && ego.y < egoSumMinYWhenScoresEqual(okRect)) return false;
  return !egoSumOverlapsOkObstacles(ego, cyOk, okRect);
}

/** 겹치면 이고 합계만 위·아래로 이동(오케이 합계·점·선 위치는 유지) */
function nudgeEgoSumVertically(
  ego: SumLabelRect,
  cyOk: number,
  okRect: SumLabelRect,
  scoresEqual: boolean,
): SumLabelRect {
  if (egoSumPlacementValid(ego, cyOk, okRect, scoresEqual)) return ego;
  for (let d = 1; d <= EGO_SUM_NUDGE_MAX_PX; d++) {
    const up: SumLabelRect = { ...ego, y: ego.y - d };
    if (egoSumPlacementValid(up, cyOk, okRect, scoresEqual)) return up;
    const down: SumLabelRect = { ...ego, y: ego.y + d };
    if (egoSumPlacementValid(down, cyOk, okRect, scoresEqual)) return down;
  }
  if (scoresEqual) {
    const pinned: SumLabelRect = {
      ...ego,
      y: egoSumMinYWhenScoresEqual(okRect),
    };
    if (egoSumPlacementValid(pinned, cyOk, okRect, scoresEqual)) return pinned;
  }
  return ego;
}

/** 겹치지 않으면 이고=막대 위 · 오케이=점 근처(점수 큰 쪽 위). 동점이면 오케이 합계가 항상 위 */
function resolveOkEgoSumLabels(
  ok: number,
  ego: number,
  cx: number,
  cyOk: number,
  cyBarTop: number,
): { ok: SumLabelRect; ego: SumLabelRect } {
  const okW = sumLabelBoxWidth(ok);
  const egoW = sumLabelBoxWidth(ego);
  const scoresEqual = ok === ego;

  if (scoresEqual) {
    const okRect = sumLabelAboveDot(cx, cyOk, okW);
    const egoAboveBar = sumLabelAboveBar(cx, cyBarTop, egoW);
    const minEgoY = egoSumMinYWhenScoresEqual(okRect);
    if (egoAboveBar.y >= minEgoY && !sumLabelRectsOverlapY(egoAboveBar, okRect)) {
      return { ok: okRect, ego: egoAboveBar };
    }
    const egoBelowOk: SumLabelRect = {
      x: cx - egoW / 2,
      y: minEgoY,
      w: egoW,
      textX: cx,
    };
    return { ok: okRect, ego: egoBelowOk };
  }

  const egoAboveBar = sumLabelAboveBar(cx, cyBarTop, egoW);
  const okOnTop = ok > ego;
  const okPreferred = okOnTop
    ? sumLabelAboveDot(cx, cyOk, okW)
    : sumLabelBelowDot(cx, cyOk, okW);
  const okAlternate = okOnTop
    ? sumLabelBelowDot(cx, cyOk, okW)
    : sumLabelAboveDot(cx, cyOk, okW);

  if (!sumLabelRectsOverlapY(egoAboveBar, okPreferred)) {
    return { ok: okPreferred, ego: egoAboveBar };
  }
  if (!sumLabelRectsOverlapY(egoAboveBar, okAlternate)) {
    return { ok: okAlternate, ego: egoAboveBar };
  }

  if (ok > ego) {
    return {
      ok: sumLabelAboveDot(cx, cyOk, okW),
      ego: sumLabelBelowDot(cx, cyOk, egoW),
    };
  }
  return {
    ok: sumLabelBelowDot(cx, cyOk, okW),
    ego: sumLabelAboveDot(cx, cyOk, egoW),
  };
}

function SumLabelBox({
  rect,
  value,
  stroke,
  fill,
}: {
  rect: SumLabelRect;
  value: number;
  stroke: string;
  fill: string;
}) {
  return (
    <g>
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.w}
        height={SUM_LABEL_BOX_H}
        rx={0}
        fill="#fff"
        stroke={stroke}
        strokeWidth={stroke === OK_LINE_COLOR ? 1 : 1.5}
      />
      <text
        x={rect.textX}
        y={rect.y + 13}
        textAnchor="middle"
        fill={fill}
        fontSize={11}
        fontWeight={700}
      >
        {value}
      </text>
    </g>
  );
}

function createKtaaOkEgoSumLabels(chartData: ChartRow[]) {
  return function KtaaOkEgoSumLabels(props: PlotBackgroundProps) {
    const { offset, yAxisMap } = props;
    if (!offset?.width || !yAxisMap) return null;
    const yScale = Object.values(yAxisMap)[0]?.scale;
    if (!yScale) return null;

    const { left, width } = offset;
    const colW = width / COLUMN_ORDER.length;

    return (
      <g>
        {chartData.map((row) => {
          if (row.egoTotal <= 0) return null;
          const colIndex = COLUMN_ORDER.indexOf(row.id);
          if (colIndex < 0) return null;
          const cx = left + colIndex * colW + colW / 2;

          if (row.id === 'A') {
            const cyBarTop = yScale(row.egoTotal);
            const egoW = sumLabelBoxWidth(row.egoTotal);
            const egoRect = sumLabelAboveBar(cx, cyBarTop, egoW);
            return (
              <SumLabelBox
                key={`sums-${row.id}`}
                rect={egoRect}
                value={row.egoTotal}
                stroke={EGO_TOTAL_BOX_STROKE}
                fill="#0c4a6e"
              />
            );
          }

          const ok = row.okLineCpNp ?? row.okLineFcAc;
          if (ok == null) return null;
          const cyOk = yScale(ok);
          const cyBarTop = yScale(row.egoTotal);
          const { ok: okRect, ego: egoRectInitial } = resolveOkEgoSumLabels(
            ok,
            row.egoTotal,
            cx,
            cyOk,
            cyBarTop,
          );
          const scoresEqual = ok === row.egoTotal;
          const egoRect = nudgeEgoSumVertically(
            egoRectInitial,
            cyOk,
            okRect,
            scoresEqual,
          );
          return (
            <g key={`sums-${row.id}`}>
              <SumLabelBox
                rect={okRect}
                value={ok}
                stroke={OK_LINE_COLOR}
                fill={OK_LINE_COLOR}
              />
              <SumLabelBox
                rect={egoRect}
                value={row.egoTotal}
                stroke={EGO_TOTAL_BOX_STROKE}
                fill="#0c4a6e"
              />
            </g>
          );
        })}
      </g>
    );
  };
}

function OkLineDot(props: { cx?: number; cy?: number; payload?: ChartRow }) {
  const { cx, cy, payload } = props;
  const hasOk =
    payload?.okLineCpNp != null || payload?.okLineFcAc != null;
  if (cx == null || cy == null || !hasOk) return null;
  return (
    <circle cx={cx} cy={cy} r={OK_DOT_R} fill={OK_LINE_COLOR} stroke="#fff" strokeWidth={2} />
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
  /** 내담자 성별 — 배경 구간 높이(C/B/A 컷); 색상은 남/여 동일 */
  gender?: string;
}) {
  const genderProvided = isClientGenderProvided(genderInput);
  const backgroundGender: EgoOkGender = genderProvided
    ? normalizeEgoOkGender(genderInput)
    : 'male';

  const PlotBackgroundLayer = useMemo(
    () => createKtaaPlotBackground(backgroundGender),
    [backgroundGender],
  );

  const data: ChartRow[] = columns.map((col) => ({
    ...col,
    xLabel: col.codeLabel,
    okLineCpNp: col.id === 'CP' || col.id === 'NP' ? col.okLine : null,
    okLineFcAc: col.id === 'FC' || col.id === 'AC' ? col.okLine : null,
  }));

  const OkEgoSumLabelsLayer = useMemo(() => createKtaaOkEgoSumLabels(data), [data]);

  const [hoveredId, setHoveredId] = useState<(typeof COLUMN_ORDER)[number] | null>(null);
  const ColumnHoverLayer = useMemo(
    () => createKtaaColumnHoverLayer(hoveredId, columns),
    [hoveredId, columns],
  );

  const [plotBox, setPlotBox] = useState<KtaaPlotBox | null>(null);
  const handlePlotBox = useCallback((box: KtaaPlotBox) => {
    setPlotBox((prev) =>
      prev &&
      prev.left === box.left &&
      prev.top === box.top &&
      prev.width === box.width &&
      prev.height === box.height
        ? prev
        : box,
    );
  }, []);

  const bindColumnHover = (id: (typeof COLUMN_ORDER)[number]) => ({
    onMouseEnter: () => setHoveredId(id),
    onMouseLeave: () => setHoveredId((prev) => (prev === id ? null : prev)),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-sky-200 bg-white text-gray-900 shadow-inner">
      <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white px-4 py-3">
        <p className="text-sm font-bold text-sky-900">
          ◈ 이고-오케이 그램 (Ego-Ok Gram) 의 종합 결과 그래프
        </p>
      </div>

      <KtaaPlotLabelColumns plotBox={plotBox} style={TRAIT_LABEL_PLOT_GAP_TOP}>
        {columns.map((col, index) => {
          const hovered = hoveredId === col.id;
          const dom = columnDominance(col);
          const topStrong = hovered && (dom === 'positive' || dom === 'even');
          return (
            <div
              key={col.id}
              {...bindColumnHover(col.id)}
              className={`${COLUMN_TRAIT_TITLE_CLASS} ${
                index < columns.length - 1 ? COLUMN_DIVIDER_CLASS : ''
              } ${topStrong ? 'font-extrabold text-sky-900' : ''} ${hovered && dom === 'negative' ? 'text-gray-400' : ''}`}
            >
              {col.topLabel}
            </div>
          );
        })}
      </KtaaPlotLabelColumns>

      <div className="relative w-full leading-none" style={{ height: CHART_PLOT_HEIGHT_PX }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={CHART_MARGIN} style={{ background: 'transparent' }}>
            <Customized component={PlotBackgroundLayer} />
            <Customized component={ColumnHoverLayer} />
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
              hide
              height={0}
              padding={{ left: 0, right: 0 }}
            />
            <Bar dataKey="egoNegative" stackId="ego" fill={EGO_NEG_COLOR} barSize={52} radius={[0, 0, 0, 0]}>
              <LabelList dataKey="egoNegative" content={<EgoSegmentLabel />} />
            </Bar>
            <Bar dataKey="egoPositive" stackId="ego" fill={EGO_POS_COLOR} barSize={52} radius={[2, 2, 0, 0]}>
              <LabelList dataKey="egoPositive" content={<EgoSegmentLabel />} />
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
            <Customized component={OkEgoSumLabelsLayer} />
            <Customized
              component={(props: { offset?: { left: number; top: number; width: number; height: number } }) => (
                <KtaaPlotLayoutReporter offset={props.offset} onPlotBox={handlePlotBox} />
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>
        {plotBox ? (
          <div className="pointer-events-none absolute inset-0">
            {columns.map((col, index) => (
              <div
                key={`hit-${col.id}`}
                className="pointer-events-auto absolute top-0"
                style={{
                  top: plotBox.top,
                  left: plotBox.left + (index * plotBox.width) / COLUMN_ORDER.length,
                  width: plotBox.width / COLUMN_ORDER.length,
                  height: plotBox.height,
                }}
                {...bindColumnHover(col.id)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <KtaaPlotLabelColumns plotBox={plotBox} style={TRAIT_LABEL_PLOT_GAP_BOTTOM}>
        {columns.map((col, index) => {
          const hovered = hoveredId === col.id;
          const dom = columnDominance(col);
          const bottomStrong = hovered && (dom === 'negative' || dom === 'even');
          return (
            <div
              key={`${col.id}-bottom`}
              {...bindColumnHover(col.id)}
              className={`${COLUMN_TRAIT_TITLE_CLASS} ${
                index < columns.length - 1 ? COLUMN_DIVIDER_CLASS : ''
              } ${bottomStrong ? 'font-extrabold text-orange-800' : ''} ${hovered && dom === 'positive' ? 'text-gray-400' : ''}`}
            >
              {col.bottomLabel}
            </div>
          );
        })}
      </KtaaPlotLabelColumns>

      <KtaaPlotLabelColumns plotBox={plotBox} className={`pb-2 ${BOTTOM_TRAIT_TO_CODE_GAP}`}>
        {columns.map((col, index) => {
          const isA = col.id === 'A';
          const hovered = hoveredId === col.id;
          return (
            <div
              key={`${col.id}-code`}
              {...bindColumnHover(col.id)}
              className={`flex items-center justify-center ${
                index < columns.length - 1 ? COLUMN_DIVIDER_CLASS : ''
              }`}
            >
              <span
                className={`rounded border px-2 py-0.5 text-xs ${
                  hovered ? 'font-extrabold scale-105' : 'font-bold'
                } ${isA ? 'border-sky-500 text-sky-700' : 'border-red-400 text-red-600'}`}
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
            답하고, 채점 시 문항 <strong>1~5점</strong>으로 환산합니다(6→5, 5→4, 4→3.25, 3→2.75, 2→2,
            1→1). 척도 10문항 합은 <strong>10~50</strong>이며, 소수 합산 후 <strong>0.5 이상 반올림</strong>합니다.
          </li>
          <li>
            <strong>막대 = 이고그램(CP·NP·A·FC·AC)</strong>: 척도마다 긍정 문항 5개·부정 문항 5개(합 10문항,
            만점 50).{' '}
            <span className="inline-block h-2 w-3 rounded-sm align-middle" style={{ background: EGO_NEG_COLOR }} />{' '}
            <strong>주황(아래)</strong>은 부정 문항 합(0~25),{' '}
            <span className="inline-block h-2 w-3 rounded-sm align-middle" style={{ background: EGO_POS_COLOR }} />{' '}
            <strong>하늘(위)</strong>은 긍정 문항 합(0~25). 막대 안 숫자는 각 층 점수,{' '}
            <strong>막대 꼭대기 숫자</strong>는 두 층을 더한 <strong>이고그램 척도 총점(0~50)</strong>입니다.             CP·NP·FC·AC 열에서는 <strong>겹치지 않을 때</strong> 이고 합계는 막대 꼭대기 바로 위, 오케이 합계는
            오케이 점 근처(점수 큰 쪽 위)에 둡니다. <strong>점수가 같으면</strong> 오케이 합계가 이고 합계보다
            항상 위입니다. 배치 후에도 이고 합계가 오케이 <strong>선·점·합계</strong>와 겹치면{' '}
            <strong>이고 합계만</strong> 위·아래로 옮깁니다(동점일 때는 오케이 아래쪽만 허용).{' '}
            <strong>A 열</strong>은 이고 합계만 막대 위에 표시합니다.
          </li>
          <li>
            <strong>적색 선 = 오케이그램</strong>: U−·U+·I+·I− 척도 각 10문항 합(0~50)을 같은 열에
            표시합니다. <strong>CP→U−, NP→U+, FC→I+, AC→I−</strong>. 선은 <strong>CP–NP</strong>와{' '}
            <strong>FC–AC</strong>만 이어지고 <strong>A 열과는 연결하지 않습니다</strong>. 막대 꼭대기
            이고 합계(0~50)는 사각 테두리 안 숫자로 표시합니다.
          </li>
          <li>
            <strong>배경색(5열·남/여 동일)</strong>:{' '}
            <span
              className="inline-block h-2 w-3 rounded-sm border border-sky-200 align-middle"
              style={{ background: ZONE_SKY }}
            />{' '}
            하단(C)·{' '}
            <span className="inline-block h-2 w-3 rounded-sm border border-gray-200 align-middle bg-white" />{' '}
            중간(B)·{' '}
            <span
              className="inline-block h-2 w-3 rounded-sm border border-red-200 align-middle"
              style={{ background: ZONE_PINK }}
            />{' '}
            상단(A). 구간 <strong>높이</strong>는 내담자(또는 테스트) 성별 3단계 컷(척도마다 다름). 점선(12.5)은
            참고 기준선입니다.
            {!genderProvided ? (
              <span className="text-gray-600"> 테스트 성별: 새로고침 시 남/여 구간 높이 교대.</span>
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
