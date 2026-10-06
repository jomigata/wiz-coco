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
const CHART_PLOT_HEIGHT_COMPACT_PX = 168;

const Y_TICKS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
const Y_TICKS_COMPACT = [0, 10, 20, 30, 40, 50];

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

const EGO_SUM_NUDGE_MAX_PX = 220;

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

const SEG_LABEL_TEXT_H = 14;
/** 합계 박스·점과의 여유 (층 숫자를 더 멀리 밀기) */
const SEG_LABEL_OBSTACLE_RECT_INFLATE_Y = 8;
const SEG_LABEL_OBSTACLE_DOT_EXTRA_R = 10;

type SegmentLabelObstacle =
  | { kind: 'rect'; rect: SumLabelRect }
  | { kind: 'dot'; cx: number; cy: number; r: number };

function segmentLabelBounds(centerY: number, cx: number, value: number) {
  const halfW = Math.max(9, String(value).length * 4.5);
  const halfH = SEG_LABEL_TEXT_H / 2;
  return {
    left: cx - halfW,
    right: cx + halfW,
    top: centerY - halfH,
    bottom: centerY + halfH,
  };
}

function boundsOverlap(
  a: { left: number; right: number; top: number; bottom: number },
  b: { left: number; right: number; top: number; bottom: number },
): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

function segmentLabelOverlapsObstacles(
  centerY: number,
  cx: number,
  value: number,
  obstacles: SegmentLabelObstacle[],
): boolean {
  const box = segmentLabelBounds(centerY, cx, value);
  for (const o of obstacles) {
    if (o.kind === 'dot') {
      const r = o.r + SEG_LABEL_OBSTACLE_DOT_EXTRA_R;
      const closestX = Math.max(box.left, Math.min(o.cx, box.right));
      const closestY = Math.max(box.top, Math.min(o.cy, box.bottom));
      const dx = o.cx - closestX;
      const dy = o.cy - closestY;
      if (dx * dx + dy * dy < r * r) return true;
    } else {
      const r = o.rect;
      if (
        boundsOverlap(box, {
          left: r.x,
          right: r.x + r.w,
          top: r.y - SEG_LABEL_OBSTACLE_RECT_INFLATE_Y,
          bottom: r.y + SUM_LABEL_BOX_H + SEG_LABEL_OBSTACLE_RECT_INFLATE_Y,
        })
      ) {
        return true;
      }
    }
  }
  return false;
}

function findSegmentLabelY(
  preferredY: number,
  searchMinY: number,
  searchMaxY: number,
  cx: number,
  value: number,
  obstacles: SegmentLabelObstacle[],
): number {
  const lo = Math.min(searchMinY, searchMaxY);
  const hi = Math.max(searchMinY, searchMaxY);
  if (lo >= hi) return preferredY;

  const pref = Math.min(hi, Math.max(lo, preferredY));
  if (!segmentLabelOverlapsObstacles(pref, cx, value, obstacles)) return pref;

  for (let d = 1; d <= hi - lo; d++) {
    const up = pref - d;
    if (up >= lo && !segmentLabelOverlapsObstacles(up, cx, value, obstacles)) return up;
    const down = pref + d;
    if (down <= hi && !segmentLabelOverlapsObstacles(down, cx, value, obstacles)) return down;
  }

  let bestY = pref;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let y = Math.ceil(lo); y <= Math.floor(hi); y++) {
    if (segmentLabelOverlapsObstacles(y, cx, value, obstacles)) continue;
    const dist = Math.abs(y - pref);
    if (dist < bestDist) {
      bestDist = dist;
      bestY = y;
    }
  }
  return bestY;
}

function computeColumnSumLayout(
  row: ChartRow,
  cx: number,
  yScale: YScale,
): { cyOk: number | null; okRect: SumLabelRect | null; egoRect: SumLabelRect } | null {
  if (row.egoTotal <= 0) return null;
  const cyBarTop = yScale(row.egoTotal);
  const egoW = sumLabelBoxWidth(row.egoTotal);

  if (row.id === 'A') {
    return {
      cyOk: null,
      okRect: null,
      egoRect: sumLabelAboveBar(cx, cyBarTop, egoW),
    };
  }

  const ok = row.okLineCpNp ?? row.okLineFcAc;
  if (ok == null) return null;
  const cyOk = yScale(ok);
  const { ok: okRect, ego: egoRectInitial } = resolveOkEgoSumLabels(
    ok,
    row.egoTotal,
    cx,
    cyOk,
    cyBarTop,
  );
  const scoresEqual = ok === row.egoTotal;
  const egoRect = nudgeEgoSumVertically(egoRectInitial, cyOk, okRect, scoresEqual);
  return { cyOk, okRect, egoRect };
}

function segmentObstaclesFromLayout(
  cx: number,
  layout: { cyOk: number | null; okRect: SumLabelRect | null; egoRect: SumLabelRect },
): SegmentLabelObstacle[] {
  const obstacles: SegmentLabelObstacle[] = [{ kind: 'rect', rect: layout.egoRect }];
  if (layout.okRect) obstacles.push({ kind: 'rect', rect: layout.okRect });
  if (layout.cyOk != null) {
    obstacles.push({ kind: 'dot', cx, cy: layout.cyOk, r: OK_DOT_R });
  }
  return obstacles;
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
          const colIndex = COLUMN_ORDER.indexOf(row.id);
          if (colIndex < 0) return null;
          const cx = left + colIndex * colW + colW / 2;
          const layout = computeColumnSumLayout(row, cx, yScale);
          if (!layout) return null;

          if (row.id === 'A') {
            return (
              <SumLabelBox
                key={`sums-${row.id}`}
                rect={layout.egoRect}
                value={row.egoTotal}
                stroke={EGO_TOTAL_BOX_STROKE}
                fill="#0c4a6e"
              />
            );
          }

          const ok = row.okLineCpNp ?? row.okLineFcAc;
          if (ok == null || layout.okRect == null) return null;
          return (
            <g key={`sums-${row.id}`}>
              <SumLabelBox
                rect={layout.okRect}
                value={ok}
                stroke={OK_LINE_COLOR}
                fill={OK_LINE_COLOR}
              />
              <SumLabelBox
                rect={layout.egoRect}
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

function createKtaaEgoSegmentLabels(chartData: ChartRow[]) {
  return function KtaaEgoSegmentLabels(props: PlotBackgroundProps) {
    const { offset, yAxisMap } = props;
    if (!offset?.width || !yAxisMap) return null;
    const yScale = Object.values(yAxisMap)[0]?.scale;
    if (!yScale) return null;

    const { left, width } = offset;
    const colW = width / COLUMN_ORDER.length;

    return (
      <g>
        {chartData.map((row) => {
          const colIndex = COLUMN_ORDER.indexOf(row.id);
          if (colIndex < 0) return null;
          const cx = left + colIndex * colW + colW / 2;
          const layout = computeColumnSumLayout(row, cx, yScale);
          const obstacles = layout ? segmentObstaclesFromLayout(cx, layout) : [];

          const y0 = yScale(0);
          const yNeg = yScale(row.egoNegative);
          const yTotal = yScale(row.egoTotal);
          const segments: { key: string; value: number; segTop: number; segBottom: number }[] = [];
          if (row.egoNegative > 0 && y0 - yNeg >= 12) {
            segments.push({
              key: 'neg',
              value: row.egoNegative,
              segTop: yNeg,
              segBottom: y0,
            });
          }
          if (row.egoPositive > 0 && yNeg - yTotal >= 12) {
            segments.push({
              key: 'pos',
              value: row.egoPositive,
              segTop: yTotal,
              segBottom: yNeg,
            });
          }

          const barTop = Math.min(yTotal, yNeg, y0);
          const barBottom = Math.max(yTotal, yNeg, y0);
          const searchMinY = barTop + SEG_LABEL_TEXT_H / 2 + 4;
          const searchMaxY = barBottom - SEG_LABEL_TEXT_H / 2 - 4;

          return segments.map((seg) => {
            const preferred = (seg.segTop + seg.segBottom) / 2 + 4;
            const labelY =
              obstacles.length > 0
                ? findSegmentLabelY(preferred, searchMinY, searchMaxY, cx, seg.value, obstacles)
                : preferred;

            return (
              <text
                key={`${row.id}-${seg.key}`}
                x={cx}
                y={labelY}
                textAnchor="middle"
                fill="#fff"
                fontSize={11}
                fontWeight={600}
                stroke="#00000033"
                strokeWidth={0.4}
                paintOrder="stroke"
              >
                {seg.value}
              </text>
            );
          });
        })}
      </g>
    );
  };
}

export default function EgoOkKtaaCompositeChart({
  columns,
  gender: genderInput,
  compact = false,
}: {
  columns: EgoOkCompositeColumn[];
  /** 내담자 성별 — 배경 구간 높이(C/B/A 컷); 색상은 남/여 동일 */
  gender?: string;
  /** 종합 요약 등 — 축소 KTAA 종합 그래프 */
  compact?: boolean;
}) {
  const plotHeightPx = compact ? CHART_PLOT_HEIGHT_COMPACT_PX : CHART_PLOT_HEIGHT_PX;
  const yAxisWidth = compact ? 22 : Y_AXIS_WIDTH;
  const chartMargin = compact
    ? { top: 4, right: 6, left: yAxisWidth, bottom: 4 }
    : CHART_MARGIN;
  const barSize = compact ? 20 : 52;
  const yTicks = compact ? Y_TICKS_COMPACT : Y_TICKS;
  const columnDividerClass = compact ? 'border-r border-slate-400/70' : COLUMN_DIVIDER_CLASS;
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
  const EgoSegmentLabelsLayer = useMemo(() => createKtaaEgoSegmentLabels(data), [data]);

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

  return (
    <div
      className={
        compact
          ? 'overflow-hidden rounded-lg bg-white text-gray-900 ring-1 ring-slate-200/80'
          : 'overflow-hidden rounded-xl border border-sky-200 bg-white text-gray-900 shadow-inner'
      }
    >
      {!compact ? (
        <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white px-4 py-3">
          <p className="text-sm font-bold text-sky-900">
            ◈ 이고-오케이 그램 (Ego-Ok Gram) 의 종합 결과 그래프
          </p>
        </div>
      ) : null}

      {!compact ? (
        <KtaaPlotLabelColumns plotBox={plotBox} style={TRAIT_LABEL_PLOT_GAP_TOP}>
          {columns.map((col, index) => (
            <div
              key={col.id}
              className={`${COLUMN_TRAIT_TITLE_CLASS} ${index < columns.length - 1 ? COLUMN_DIVIDER_CLASS : ''}`}
            >
              {col.topLabel}
            </div>
          ))}
        </KtaaPlotLabelColumns>
      ) : null}

      <div className="relative w-full leading-none" style={{ height: plotHeightPx }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={chartMargin} style={{ background: 'transparent' }}>
            <Customized component={PlotBackgroundLayer} />
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
              ticks={yTicks}
              tick={{ fill: '#64748b', fontSize: compact ? 8 : 10 }}
              axisLine={{ stroke: '#94a3b8' }}
              width={yAxisWidth}
            />
            <XAxis
              dataKey="xLabel"
              hide
              height={0}
              padding={{ left: 0, right: 0 }}
            />
            <Bar dataKey="egoNegative" stackId="ego" fill={EGO_NEG_COLOR} barSize={barSize} radius={[0, 0, 0, 0]} />
            <Bar dataKey="egoPositive" stackId="ego" fill={EGO_POS_COLOR} barSize={barSize} radius={[2, 2, 0, 0]} />
            <Line
              type="linear"
              dataKey="okLineCpNp"
              stroke={OK_LINE_COLOR}
              strokeWidth={compact ? 2 : 3}
              dot={<OkLineDot />}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="okLineFcAc"
              stroke={OK_LINE_COLOR}
              strokeWidth={compact ? 2 : 3}
              dot={<OkLineDot />}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Customized component={KtaaPlotFrameBorder} />
            <Customized component={OkEgoSumLabelsLayer} />
            <Customized component={EgoSegmentLabelsLayer} />
            <Customized
              component={(props: { offset?: { left: number; top: number; width: number; height: number } }) => (
                <KtaaPlotLayoutReporter offset={props.offset} onPlotBox={handlePlotBox} />
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {!compact ? (
        <KtaaPlotLabelColumns plotBox={plotBox} style={TRAIT_LABEL_PLOT_GAP_BOTTOM}>
          {columns.map((col, index) => (
            <div
              key={`${col.id}-bottom`}
              className={`${COLUMN_TRAIT_TITLE_CLASS} ${index < columns.length - 1 ? COLUMN_DIVIDER_CLASS : ''}`}
            >
              {col.bottomLabel}
            </div>
          ))}
        </KtaaPlotLabelColumns>
      ) : null}

      <KtaaPlotLabelColumns
        plotBox={plotBox}
        className={compact ? 'px-0.5 pb-1 pt-0.5' : `pb-2 ${BOTTOM_TRAIT_TO_CODE_GAP}`}
      >
        {columns.map((col, index) => {
          const isA = col.id === 'A';
          return (
            <div
              key={`${col.id}-code`}
              className={`flex items-center justify-center ${
                index < columns.length - 1 ? columnDividerClass : ''
              }`}
            >
              <span
                className={`rounded border font-bold ${
                  compact
                    ? `px-1 py-px text-[9px] ${isA ? 'border-sky-500 text-sky-700' : 'border-red-400 text-red-600'}`
                    : `px-2 py-0.5 text-xs ${isA ? 'border-sky-500 text-sky-700' : 'border-red-400 text-red-600'}`
                }`}
              >
                {col.codeLabel}
                {col.okTag ? (
                  <span className={`ml-0.5 font-semibold ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
                    ({col.okTag})
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </KtaaPlotLabelColumns>

      {!compact ? (
      <div className="mx-3 mb-4 space-y-3 rounded border border-sky-300 bg-sky-50/80 px-4 py-3 text-[11px] leading-relaxed text-gray-800 sm:text-xs">
        <p className="font-bold text-sky-900">점수가 그래프에 표시되는 방식</p>
        <ol className="list-decimal space-y-2 pl-4 text-gray-800">
          <li>
            <strong>응답 → 문항 점수</strong>: 각 문항은 5점 척도(1=전혀 그렇지 않다 ~ 5=매우 그렇다 · 상황에 따라 다르다=3)로
            답하고, 채점 시 문항 <strong>1~5점</strong>으로 환산합니다(6→5, 5→4, 4→3.25, 3→2.75, 2→2,
            1→1). 척도 10문항 합은 <strong>10~50</strong>이며, 소수 합산 후 <strong>0.5 이상 반올림</strong>합니다.
          </li>
          <li>
            <strong>막대 = 이고그램(CP·NP·A·FC·AC)</strong>: 척도마다 긍정 문항 5개·부정 문항 5개(합 10문항,
            만점 50).{' '}
            <span className="inline-block h-2 w-3 rounded-sm align-middle" style={{ background: EGO_NEG_COLOR }} />{' '}
            <strong>주황(아래)</strong>은 부정 문항 합(0~25),{' '}
            <span className="inline-block h-2 w-3 rounded-sm align-middle" style={{ background: EGO_POS_COLOR }} />{' '}
            <strong>하늘(위)</strong>은 긍정 문항 합(0~25).
          </li>
          <li>
            <strong>배경색:</strong>{' '}
            <span
              className="inline-block h-2 w-3 rounded-sm border border-sky-200 align-middle"
              style={{ background: ZONE_SKY }}
            />{' '}
            ·{' '}
            <span className="inline-block h-2 w-3 rounded-sm border border-gray-200 align-middle bg-white" />{' '}
            ·{' '}
            <span
              className="inline-block h-2 w-3 rounded-sm border border-red-200 align-middle"
              style={{ background: ZONE_PINK }}
            />
            . 배경색은 243패턴을 기준으로 각 에너지 사용을 A (높음), B (보통), C (낮음) 3단계로 구분하였다.
            빨간점선(12.5)은 부정성의 참고 (중간)기준선입니다.
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
      ) : null}
    </div>
  );
}
