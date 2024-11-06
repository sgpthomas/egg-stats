import React, {
  memo,
  ReactElement,
  useMemo,
  MouseEvent,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { ChartSettings, useChartDimensions } from "./useChartDimensions";
import * as d3 from "d3";
import { PivotTable2 } from "./DataProcessing";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { d3Scale, XAxis, YAxis } from "./Axis";
import { Grid } from "./Grid";
import { useTables } from "./Fetch";
import { useDeferredRender } from "./hooks";
import {
  ChartDispatchContext,
  ChartOptionsContext,
  ChartOptions,
} from "./ChartOptions";
import { lowerBound, roundUpperBound } from "./ChartControls";
import { UseQueryResult } from "@tanstack/react-query";
import { useColors } from "./colors";

export interface Point<T = number> {
  x: T;
  y: T;
}

function point_dist(p1: Point<number>, p2: Point<number>) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

interface DataPoint {
  pt: Point<number>;
  rule: string;
  id: number;
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

interface Tooltip {
  pos: Point;
  content: ReactElement;
}

function usePointTooltip() {
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
    set: useCallback((tt: Tooltip | undefined) => {
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
    }, []),
  };
}

function DataPointSvg({
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
      stroke={!highlight || selected ? "#5d524c" : "none"}
      strokeWidth={0.75}
      strokeOpacity={0.2}
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

const Points = memo(function Points({
  columns,
  scales,
  selected,
  setTooltip,
  selectedRules,
  minDist,
}: {
  columns: Point<string>;
  scales: Point<d3Scale>;
  selected: Set<number>;
  setTooltip: (tooltip?: Tooltip) => void;
  selectedRules: Map<number, string | null>;
  minDist: number;
}) {
  const colors = useColors();
  const query: [number, DataPoint[]][] = useTables({
    select: useCallback(
      (table: PivotTable2) => {
        const data = points(table, columns.x, columns.y);
        return [table.file_id, data] as [number, DataPoint[]];
      },
      [columns.x, columns.y],
    ),
    combine: useCallback(
      (results: UseQueryResult<[number, DataPoint[]]>[]) => {
        return results.filter((q) => !!q.data).map((q) => q.data);
      },
      [columns.x, columns.y], // TODO: seems like I shouldn't need this here. I expect it to change on data update. but it isn't
    ),
  });

  const highlightedPoints: [number, DataPoint[]][] = useMemo(
    () =>
      query.map(([id, data]) => {
        const selRule = selectedRules.get(id);
        return [id, data.filter((dp) => dp.rule === selRule)] as [
          number,
          DataPoint[],
        ];
      }),
    [selectedRules, query],
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
            {d.rule && (
              <span>
                <b>rule: </b>
                {d.rule}
              </span>
            )}
            <span>
              <b>{columns.x}: </b>
              {d.pt.x.toFixed(2)}
            </span>
            <span>
              <b>{columns.y}: </b>
              {d.pt.y.toFixed(2)}
            </span>
          </div>
        ),
      });
    },
    [columns.x, columns.y],
  );

  const rendered = useDeferredRender<[number, ReactElement, ReactElement][]>(
    () =>
      query.map(([file_id, data]) => {
        if (!selected.has(file_id))
          return [
            file_id,
            <tspan key={`${file_id}-blank`}></tspan>,
            <tspan key={`${file_id}-blank2`}></tspan>,
          ];
        const el = (
          <g key={`point-group-${file_id}`}>
            {filterPoints(data, minDist, scales).map((d, ptidx) => (
              <DataPointSvg
                key={`point-${file_id}-${ptidx}`}
                fill={colors(file_id)}
                point={{ x: scales.x(d.pt.x), y: scales.y(d.pt.y) }}
                onHover={onHover(d)}
              />
            ))}
          </g>
        );
        const dimEl = (
          <g key={`dim-point-group-${file_id}`}>
            {data.map((d, ptidx) => (
              <DataPointSvg
                key={`dim-${file_id}-${ptidx}`}
                fill={colors(file_id)}
                point={{ x: scales.x(d.pt.x), y: scales.y(d.pt.y) }}
                highlight={true}
              />
            ))}
          </g>
        );
        return [file_id, el, dimEl] as [number, ReactElement, ReactElement];
      }),
    [],
    [query, scales.x, scales.y, colors, selected, minDist],
  );

  const highlightedRender = highlightedPoints.map(([file_id, data]) => {
    const el = (
      <g key={`point-group-${file_id}`}>
        {data.map((d, ptidx) => (
          <DataPointSvg
            key={`point-${file_id}-${ptidx}`}
            fill={colors(file_id)}
            point={{ x: scales.x(d.pt.x), y: scales.y(d.pt.y) }}
            onHover={onHover(d)}
            selected={true}
          />
        ))}
      </g>
    );
    return [file_id, el] as [number, ReactElement];
  });

  return rendered
    .map(([id, el, dimEl]) => [id, selectedRules.get(id) !== null ? dimEl : el])
    .concat(highlightedRender)
    .filter(([id, _]) => selected.has(id as number));
});

const Lines = memo(function Lines({
  columns,
  scales,
  selected,
  selectedRules,
  drawLine,
}: {
  columns: Point<string>;
  scales: Point<d3Scale>;
  selected: Set<number>;
  selectedRules: Map<number, string | null>;
  drawLine: boolean;
}) {
  const colors = useColors();
  const highlight = useCallback(
    (pt: DataPoint): boolean => {
      if (pt.id === undefined) return true;
      if (selectedRules.get(pt.id) === null) return true;

      return selectedRules.get(pt.id) === pt.rule;
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

  const query: [number, DataPoint[], DataPoint[]][] = useTables({
    select: useCallback(
      (table: PivotTable2) => {
        const data = points(table, columns.x, columns.y);
        const filtered = data.filter((d) => d.pt.x && d.pt.y);
        return [table.file_id, data, filtered] as [
          number,
          DataPoint[],
          DataPoint[],
        ];
      },
      [columns.x, columns.y],
    ),
    combine: useCallback(
      (results: UseQueryResult<[number, DataPoint[], DataPoint[]]>[]) =>
        results.filter((q) => !!q.data).map((q) => q.data),
      [columns.x, columns.y],
    ),
  });

  const lines = useDeferredRender(
    () =>
      query.map(([id, data, filtered]) => {
        if (!selected.has(id)) return [];
        return [
          id,
          <path
            fill="none"
            stroke={colors(id)}
            strokeWidth={selectedRules.get(id) !== null ? 1.0 : 2.0}
            d={line(filtered) ?? undefined}
          />,
          <path
            fill="none"
            stroke={colors(id)}
            strokeWidth={5.0}
            d={highlightLine(data) ?? undefined}
          />,
        ] as [number, ReactElement, ReactElement];
      }),
    [],
    [
      selected,
      selectedRules,
      scales.x,
      scales.y,
      columns.x,
      columns.y,
      line,
      highlightLine,
      query,
    ],
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
});

export function Chart({
  selected,
  marginLeft,
  selectedRules = new Map(),
}: {
  selected: Set<number>;
  marginLeft: number;
  selectedRules?: Map<number, string | null>;
}) {
  const chartSettings: ChartSettings = {
    marginLeft: marginLeft,
    marginRight: 20,
    marginBottom: 50,
  };

  const ctrls = useContext(ChartOptionsContext);
  const setCtrls = useContext(ChartDispatchContext);

  const [ref, dms] = useChartDimensions(chartSettings);

  const [min, max]: [Point<number>, Point<number>] = useTables({
    select: useCallback(
      (table: PivotTable2) => {
        if (!selected.has(table.file_id))
          return [
            { x: 1, y: 1 },
            { x: 1, y: 1 },
          ] as [Point<number>, Point<number>];
        const line = points(table, ctrls.columns.x, ctrls.columns.y);
        return [
          {
            x: d3.min(line, (d) => d.pt.x),
            y: d3.min(line, (d) => d.pt.y),
          },
          {
            x: d3.max(line, (d) => d.pt.x),
            y: d3.max(line, (d) => d.pt.y),
          },
        ] as [Point<number>, Point<number>];
      },
      [ctrls.columns.x, ctrls.columns.y, selected],
    ),
    combine: (queries: UseQueryResult<[Point<number>, Point<number>]>[]) => {
      const ranges = queries.filter((q) => !!q.data).map((q) => q.data);
      return [
        {
          x: d3.min(ranges, (m) => m[0]?.x) ?? 0,
          y: d3.min(ranges, (m) => m[0]?.y) ?? 0,
        },
        {
          x: d3.max(ranges, (m) => m[1]?.x) ?? 100,
          y: d3.max(ranges, (m) => m[1]?.y) ?? 100,
        },
      ] as [Point<number>, Point<number>];
    },
  });

  useEffect(() => {
    ctrls.computedRange.x = [min.x, max.x];
    ctrls.computedRange.y = [min.y, max.y];
    setCtrls(new ChartOptions(ctrls));
  }, [min, max]);

  const xScale = useMemo(() => {
    return toD3Scale(ctrls.scaleType.x, [
      lowerBound(ctrls.scaleType.x, ChartOptions.range(ctrls).x[0]),
      roundUpperBound(ChartOptions.range(ctrls).x[1]),
    ]).range([0, dms.boundedWidth]);
  }, [
    dms.boundedWidth,
    ctrls.scaleType.x,
    ChartOptions.range(ctrls).x[0],
    ChartOptions.range(ctrls).x[1],
  ]);

  const yScale = useMemo(
    () =>
      toD3Scale(ctrls.scaleType.y, [
        roundUpperBound(ChartOptions.range(ctrls).y[1]),
        lowerBound(ctrls.scaleType.y, ChartOptions.range(ctrls).y[0]),
      ]).range([0, dms.boundedHeight]),
    [
      dms.boundedHeight,
      ctrls.scaleType.y,
      ChartOptions.range(ctrls).y[0],
      ChartOptions.range(ctrls).y[1],
    ],
  );

  const scales = useMemo(
    () => ({
      x: xScale,
      y: yScale,
    }),
    [xScale, yScale],
  );

  const tooltip = usePointTooltip();

  return (
    <div ref={ref} className="h-screen bg-egg dark:bg-mixed-20">
      <div
        ref={tooltip.floatingRef}
        style={{ ...tooltip.floatingStyles, visibility: tooltip.visibility }}
        className={[
          "fixed",
          "block",
          "bg-white dark:bg-mixed-40",
          "text-black dark:text-white",
          "rounded-md",
          "border-[1px]",
          "border-egg-900 dark:border-mixed-60",
          "drop-shadow-lg",
          "px-1",
          "top-0",
          "left-0",
        ].join(" ")}
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
          yOffset={dms.marginTop}
        />
        <g transform={`translate(${dms.marginLeft}, ${dms.marginTop})`}>
          <YAxis
            scale={yScale}
            label={ctrls.columns.y}
            kind={ctrls.scaleType.y}
          />
          <g transform={`translate(0, ${dms.boundedHeight})`}>
            <XAxis
              scale={xScale}
              label={ctrls.columns.x}
              kind={ctrls.scaleType.x}
            />
          </g>
          {
            <Lines
              columns={ctrls.columns}
              scales={scales}
              selected={selected}
              selectedRules={selectedRules}
              drawLine={ctrls.drawLine}
            />
          }
          <Points
            columns={ctrls.columns}
            scales={scales}
            selected={selected}
            setTooltip={tooltip.set}
            selectedRules={selectedRules}
            minDist={ctrls.minDist}
          />
        </g>
      </svg>
    </div>
  );
}

function points(
  table?: PivotTable2,
  xCol: string = "enodes",
  yCol: string = "cost",
): DataPoint[] {
  if (!table) return [];

  const sel = (col: string) => (row: any, idx: number) =>
    col === "index" ? idx : +row[col];

  const colNames = [
    xCol === "index" ? "" : xCol,
    yCol == "index" ? "" : yCol,
  ].filter((x) => x !== "");

  const xSel = sel(xCol);
  const ySel = sel(yCol);

  let relevantTable = table.data.select(["rule_name", ...colNames]);

  if (colNames.length === 2) {
    relevantTable = relevantTable.dedupe(colNames);
  }

  return [...relevantTable].map((data: any, idx) => {
    return {
      pt: {
        x: xSel(data, idx),
        y: ySel(data, idx),
      },
      rule: data["rule_name"],
      id: table.file_id,
    };
  });
}

function filterPoints(
  data: DataPoint[],
  limit: number,
  scales: Point<d3Scale>,
) {
  if (limit <= 0) {
    return data;
  }

  const [_, res] = data.reduce(
    ([d, acc], data) => {
      const scaled = { x: scales.x(data.pt.x), y: scales.y(data.pt.y) };
      if (point_dist(d, scaled) > limit) {
        acc.push(data);
        return [scaled, acc];
      } else {
        return [d, acc];
      }
    },
    [{ x: Infinity, y: Infinity }, []] as [Point<number>, DataPoint[]],
  );
  return res;
}
