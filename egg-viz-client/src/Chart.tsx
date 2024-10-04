import React, {
  ReactElement,
  useMemo,
  MouseEvent,
  useState,
  useEffect,
  useCallback,
  useDeferredValue,
  startTransition,
} from "react";
import { ChartSettings, useChartDimensions } from "./useChartDimensions";
import * as d3 from "d3";
import { PivotTable } from "./DataProcessing";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { d3Scale, XAxis, YAxis } from "./Axis";
import { Grid } from "./Grid";
import { ChartOptions } from "./ChartControls";
import { useTables } from "./Fetch";
import { UseQueryResult } from "@tanstack/react-query";
import { timeFn, useDeferredRender } from "./hooks";

export interface Point<T = number> {
  x: T;
  y: T;
}

interface DataPoint {
  pt: Point<number>;
  rule: string;
  id: number;
}

function scaleBound(input: number): number {
  const nZeros = Math.floor(Math.log10(input));
  if (nZeros === 0) {
    return 10;
  }

  return (Math.floor(input / Math.pow(10, nZeros)) + 1) * Math.pow(10, nZeros);
}

function toD3Scale(typ: "linear" | "log", domain: [number, number]) {
  if (typ === "linear") {
    return d3.scaleLinear().domain(domain);
  } else if (typ === "log") {
    return d3.scaleLog().domain(domain);
  } else {
    return d3.scaleLinear().domain(domain);
  }
}

function lowerBound(typ: "linear" | "log"): number {
  if (typ === "linear") {
    return 0;
  } else if (typ === "log") {
    return 1;
  } else {
    return 0;
  }
}

interface Tooltip {
  pos: Point;
  content: ReactElement;
}

function useTooltip() {
  const [tooltip, setTooltip] = useState<Tooltip | undefined>(undefined);
  const { refs, floatingStyles } = useFloating({
    placement: "top",
    middleware: [offset(5), flip(), shift()],
    transform: true,
    whileElementsMounted: autoUpdate,
  });

  return {
    floatingRef: refs.setFloating,
    floatingStyles: floatingStyles,
    pos: tooltip?.pos,
    content: tooltip?.content,
    visibility: (!!tooltip ? "visible" : "hidden") as "visible" | "hidden",
    set: (tt: Tooltip | undefined) => {
      setTooltip(tt);
      if (!tt) return;
      refs.setPositionReference({
        getBoundingClientRect() {
          return {
            width: 2,
            height: 4,
            x: tt.pos.x,
            y: tt.pos.y,
            top: tt.pos.y,
            left: tt.pos.x,
            right: tt.pos.x,
            bottom: tt.pos.y,
          };
        },
      });
    },
  };
}

function DataPoint({
  point,
  fill = "currentColor",
  selected = false,
  highlight = false,
  onHover = (_e, _b) => {},
}: {
  point: Point;
  fill?: string;
  selected?: boolean;
  highlight?: boolean;
  onHover?: (e: MouseEvent, active: boolean) => void;
}) {
  let [smR, lgR] = [2.5, 4.0];
  let [rad, setRad] = useState(smR);

  if (isNaN(point.x) || isNaN(point.y)) return;

  let opacity = "1";
  if (highlight && !selected) {
    opacity = "0.05";
  }

  return (
    <circle
      cx={point.x}
      cy={point.y}
      r={selected ? rad * 2 : rad}
      fill={fill}
      stroke={!highlight || selected ? "black" : "none"}
      strokeWidth={0.75}
      opacity={opacity}
      onMouseOver={(e) => {
        setRad(lgR);
        onHover(e, true);
      }}
      onMouseOut={(e) => {
        setRad(smR);
        onHover(e, false);
      }}
    />
  );
}

function Points({
  columns,
  scales,
  colors,
  selected,
  setTooltip,
  selectedRules,
}: {
  columns: Point<string>;
  scales: Point<d3Scale>;
  colors: readonly string[];
  selected: Set<number>;
  setTooltip: (tooltip?: Tooltip) => void;
  selectedRules: Map<number, string | null>;
}) {
  const query: [number, DataPoint[]][] = useTables({
    select: useCallback(
      (table: PivotTable) => {
        const data = points(table, columns.x, columns.y);
        return [table.file_id, data] as [number, DataPoint[]];
      },
      [columns.x, columns.y, scales.x, scales.y],
    ),
    combine: (results) => results.filter((q) => !!q.data).map((q) => q.data),
  });

  const highlightedPoints: [number, DataPoint[]][] = useMemo(
    () =>
      query.map(([id, data]) => {
        const selRule = selectedRules.get(id);
        return [id, data.filter((dp) => dp.rule == selRule)] as [
          number,
          DataPoint[],
        ];
      }),
    [query, selectedRules],
  );

  const onHover = useCallback(
    (d: DataPoint) => (e: MouseEvent, h: boolean) => {
      if (!h) {
        setTooltip(undefined);
        return;
      }

      setTooltip({
        pos: {
          x: e.clientX,
          y: e.clientY,
        },
        content: (
          <div className="flex flex-col">
            {d.rule && <span>rule: {d.rule}</span>}
            <span>
              {columns.x}: {d.pt.x.toFixed(2)} {columns.y}: {d.pt.y.toFixed(2)}
            </span>
          </div>
        ),
      });
    },
    [],
  );

  const rendered = useDeferredRender<[number, ReactElement, ReactElement][]>(
    () =>
      query.map(([file_id, data]) => {
        const el = (
          <g key={`point-group-${file_id}`}>
            {data.map((d, ptidx) => (
              <DataPoint
                key={`point-${file_id}-${ptidx}`}
                fill={colors[file_id]}
                point={{ x: scales.x(d.pt.x), y: scales.y(d.pt.y) }}
                onHover={onHover(d)}
              />
            ))}
          </g>
        );
        const dimEl = (
          <g key={`dim-point-group-${file_id}`}>
            {data.map((d, ptidx) => (
              <DataPoint
                key={`dim-${file_id}-${ptidx}`}
                fill={colors[file_id]}
                point={{ x: scales.x(d.pt.x), y: scales.y(d.pt.y) }}
                onHover={onHover(d)}
                highlight={true}
              />
            ))}
          </g>
        );
        return [file_id, el, dimEl] as [number, ReactElement, ReactElement];
      }),
    [],
    [scales.x, scales.y, columns.x, columns.y, colors, query],
  );

  const highlightedRender = useDeferredRender<[number, ReactElement][]>(
    () =>
      highlightedPoints.map(([file_id, data]) => {
        const el = (
          <g key={`point-group-${file_id}`}>
            {data.map((d, ptidx) => (
              <DataPoint
                key={`point-${file_id}-${ptidx}`}
                fill={colors[file_id]}
                point={{ x: scales.x(d.pt.x), y: scales.y(d.pt.y) }}
                onHover={onHover(d)}
                selected={true}
              />
            ))}
          </g>
        );
        return [file_id, el] as [number, ReactElement];
      }),
    [],
    [highlightedPoints, scales.x, scales.y, columns.x, columns.y, colors],
  );

  return rendered
    .map(([id, el, dimEl]) => [id, selectedRules.get(id) !== null ? dimEl : el])
    .concat(highlightedRender)
    .filter(([id, _]) => selected.has(id as number));
}

function Lines({
  columns,
  scales,
  colors,
  selected,
  selectedRules,
  drawLine,
}: {
  columns: Point<string>;
  scales: Point<d3Scale>;
  colors: readonly string[];
  selected: Set<number>;
  selectedRules: Map<number, string | null>;
  drawLine: boolean;
}) {
  const highlight = useCallback(
    (pt: DataPoint): boolean => {
      if (pt.id === undefined) return true;
      if (selectedRules.get(pt.id) === null) return true;

      return selectedRules.get(pt.id) == pt.rule;
    },
    [selectedRules],
  );

  const highlightLine = useMemo(
    () =>
      d3
        .line<DataPoint>()
        .x((d) => scales.x(d.pt.x))
        .y((d) => scales.y(d.pt.y))
        .defined(
          (d) =>
            !(isNaN(scales.x(d.pt.x)) || isNaN(scales.y(d.pt.y))) &&
            highlight(d),
        ),
    [scales.x, scales.y, selectedRules],
  );

  const line = useMemo(
    () =>
      d3
        .line<DataPoint>()
        .x((d) => scales.x(d.pt.x))
        .y((d) => scales.y(d.pt.y))
        .defined((d) => !(isNaN(scales.x(d.pt.x)) || isNaN(scales.y(d.pt.y)))),
    [scales.x, scales.y],
  );

  const query: [number, DataPoint[]][] = useTables({
    select: useCallback(
      (table: PivotTable) => {
        const data = points(table, columns.x, columns.y);
        return [table.file_id, data] as [number, DataPoint[]];
      },
      [columns.x, columns.y, scales.x, scales.y],
    ),
    combine: (results) => results.filter((q) => !!q.data).map((q) => q.data),
  });

  const lines = useDeferredRender(
    () =>
      query.map(([id, data]) => {
        return [
          id,
          <path
            fill="none"
            stroke={colors[id]}
            strokeWidth={selectedRules.get(id) !== null ? 1.0 : 2.0}
            d={line(data) ?? undefined}
          />,
          <path
            fill="none"
            stroke={colors[id]}
            strokeWidth={5.0}
            d={highlightLine(data) ?? undefined}
          />,
        ] as [number, ReactElement, ReactElement];
      }),
    [],
    [
      query,
      selected,
      selectedRules,
      scales.x,
      scales.y,
      columns.x,
      columns.y,
      line,
      highlightLine,
    ],
    "rendering lines",
  );

  if (!drawLine) return;
  return lines
    ?.filter(([id, _]) => selected.has(id))
    .map(([id, line, hlLine]) => (
      <g key={`line-${id}`}>
        {line}
        {selectedRules.get(id) !== null && hlLine}
      </g>
    ));
}

export function Chart({
  selected,
  ctrls,
  setCtrls,
  marginLeft,
  colors = d3.schemeAccent,
  selectedRules = new Map(),
}: {
  selected: Set<number>;
  ctrls: ChartOptions;
  setCtrls: (x: ChartOptions) => void;
  marginLeft: number;
  colors?: readonly string[];
  selectedRules?: Map<number, string | null>;
}) {
  const chartSettings: ChartSettings = {
    marginLeft: marginLeft,
    marginRight: 0,
  };

  const [ref, dms] = useChartDimensions(chartSettings);

  const [maxX, maxY]: [number, number] = useTables({
    select: useCallback(
      (table: PivotTable) => {
        if (!selected.has(table.file_id)) return [1, 1];
        const line = points(table, ctrls.columns.x, ctrls.columns.y);
        return [d3.max(line, (d) => d.pt.x), d3.max(line, (d) => d.pt.y)];
      },
      [ctrls.columns.x, ctrls.columns.y, selected],
    ),
    combine: (queries) => {
      const maxes = queries.filter((q) => !!q.data).map((q) => q.data);
      return [
        d3.max(maxes, (m) => m[0]) ?? 100,
        d3.max(maxes, (m) => m[1]) ?? 100,
      ];
    },
  });

  useEffect(() => {
    ctrls.computedRange.x[1] = scaleBound(maxX);
    ctrls.computedRange.y[1] = scaleBound(maxY);
    setCtrls(new ChartOptions(ctrls));
  }, [maxX, maxY]);

  const xScale = useMemo(() => {
    return toD3Scale(ctrls.scaleType.x, [
      lowerBound(ctrls.scaleType.x),
      scaleBound(ChartOptions.range(ctrls).x[1]),
    ]).range([0, dms.boundedWidth]);
  }, [dms.boundedWidth, ctrls.scaleType.x, ChartOptions.range(ctrls).x[1]]);

  const yScale = useMemo(
    () =>
      toD3Scale(ctrls.scaleType.y, [
        scaleBound(ChartOptions.range(ctrls).y[1]),
        lowerBound(ctrls.scaleType.y),
      ]).range([0, dms.boundedHeight]),
    [dms.boundedHeight, ctrls.scaleType.y, ChartOptions.range(ctrls).y[1]],
  );

  const tooltip = useTooltip();

  return (
    <div ref={ref} className="h-screen bg-egg">
      <div
        ref={tooltip.floatingRef}
        style={{ ...tooltip.floatingStyles, visibility: tooltip.visibility }}
        className="fixed block bg-white rounded-md border-[1px] border-egg-900 drop-shadow-lg px-1 top-0 left-0"
      >
        {tooltip.content}
      </div>
      <svg width="100%" height="100%">
        <Grid
          xScale={xScale}
          yScale={yScale}
          xNTicks={ctrls.nTicks.x}
          yNTicks={ctrls.nTicks.y}
          width={dms.width}
          height={dms.height}
          xOffset={dms.marginLeft}
          yOffset={dms.marginRight}
          stroke="hsl(37, 70%, 80%)"
        />
        <g transform={`translate(${dms.marginLeft}, ${dms.marginTop})`}>
          <YAxis scale={yScale} label={ctrls.columns.y} />
          <g transform={`translate(0, ${dms.boundedHeight})`}>
            <XAxis scale={xScale} label={ctrls.columns.x} />
          </g>
          {
            <Lines
              columns={ctrls.columns}
              scales={{ x: xScale, y: yScale }}
              colors={colors}
              selected={selected}
              selectedRules={selectedRules}
              drawLine={ctrls.drawLine}
            />
          }
          <Points
            columns={ctrls.columns}
            scales={{ x: xScale, y: yScale }}
            colors={colors}
            selected={selected}
            setTooltip={tooltip.set}
            selectedRules={selectedRules}
          />
        </g>
      </svg>
    </div>
  );
}

function points(
  table?: PivotTable,
  xCol: string = "index",
  yCol: string = "cost",
): DataPoint[] {
  if (!table) return [];

  const sel = (col: string) => (row: any, idx: number) =>
    col === "index" ? idx : +row[col];

  const xSel = sel(xCol);
  const ySel = sel(yCol);

  return PivotTable.map(table, (row) => row).map((row, idx) => ({
    pt: {
      x: xSel(row, idx),
      y: ySel(row, idx),
    },
    rule: row["rule"],
    id: table.file_id,
  }));
}
