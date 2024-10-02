import {
  ReactElement,
  useMemo,
  MouseEvent,
  useState,
  useEffect,
  useCallback,
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
import { XAxis, YAxis } from "./Axis";
import { Grid } from "./Grid";
import { ChartOptions } from "./ChartControls";
import { useTables } from "./Fetch";
import { UseQueryResult } from "@tanstack/react-query";

export interface Point<T = number> {
  x: T;
  y: T;
  rule?: string;
  id?: number;
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
  onHover = (_e, _b) => {},
}: {
  point: Point;
  fill?: string;
  selected?: boolean;
  onHover?: (e: MouseEvent, active: boolean) => void;
}) {
  let [smR, lgR] = [2.5, 4.0];
  let [rad, setRad] = useState(smR);

  if (isNaN(point.x) || isNaN(point.y)) return;

  return (
    <circle
      cx={point.x}
      cy={point.y}
      r={selected ? rad * 2 : rad}
      fill={fill}
      stroke="black"
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

  const lines: UseQueryResult<[number, Point[]]>[] = useTables({
    select: useCallback(
      (table: PivotTable) => [
        table.file_id,
        points(table, ctrls.columns.x, ctrls.columns.y),
      ],
      [ctrls.columns.x, ctrls.columns.y],
    ),
  });

  const [maxX, maxY]: [number, number] = useTables({
    select: useCallback(
      (table: PivotTable) => {
        if (!selected.has(table.file_id)) return [1, 1];
        const line = points(table, ctrls.columns.x, ctrls.columns.y);
        return [d3.max(line, (pt) => pt.x), d3.max(line, (pt) => pt.y)];
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

  const line = useMemo(
    () =>
      d3
        .line<Point>()
        .x((pt) => xScale(pt.x))
        .y((pt) => yScale(pt.y))
        .defined((pt) => !(isNaN(xScale(pt.x)) || isNaN(yScale(pt.y)))),
    [xScale, yScale],
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
          {lines
            .filter((q) => !!q.data)
            .map((q) => q.data)
            .filter(([id, _]) => selected.has(id))
            .map(([id, child], idx) => (
              <g key={idx}>
                {ctrls.drawLine ? (
                  <path
                    fill="none"
                    stroke={colors[id]}
                    strokeWidth={2.0}
                    d={line(child) ?? undefined}
                  />
                ) : null}

                {child.map((pt, ptidx) => (
                  <DataPoint
                    key={`${idx}-${ptidx}`}
                    fill={colors[id]}
                    point={{ x: xScale(pt.x), y: yScale(pt.y) }}
                    selected={selectedRules.get(id) == pt.rule}
                    onHover={(e, h) => {
                      if (!h) {
                        tooltip.set(undefined);
                        return;
                      }

                      tooltip.set({
                        pos: {
                          x: e.clientX,
                          y: e.clientY,
                        },
                        content: (
                          <div className="flex flex-col">
                            {pt.rule && <span>rule: {pt.rule}</span>}
                            <span>
                              x: {pt.x.toFixed(2)} y: {pt.y.toFixed(2)}
                            </span>
                          </div>
                        ),
                      });
                    }}
                  />
                ))}
              </g>
            ))}
        </g>
      </svg>
    </div>
  );
}

function points(
  table?: PivotTable,
  xCol: string = "index",
  yCol: string = "cost",
): Point[] {
  if (!table) return [];

  const sel = (col: string) => (row: any, idx: number) =>
    col === "index" ? idx : +row[col];

  const xSel = sel(xCol);
  const ySel = sel(yCol);

  return PivotTable.map(table, (row) => row)
    .filter((row) => row["when"] === "before_rewrite")
    .map((row, idx) => ({
      x: xSel(row, idx),
      y: ySel(row, idx),
      rule: row["rule"],
      id: table.file_id,
    }));
}
