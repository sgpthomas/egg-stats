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

  // const lines: UseQueryResult<[number, DataPoint[]]>[] = useTables({
  //   select: useCallback(
  //     (table: PivotTable) => [
  //       table.file_id,
  //       points(table, ctrls.columns.x, ctrls.columns.y),
  //     ],
  //     [ctrls.columns.x, ctrls.columns.y],
  //   ),
  // });

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

  const highlight = useCallback((pt: DataPoint): boolean => {
    if (pt.id === undefined) return true;
    if (selectedRules.get(pt.id) === null) return true;

    return selectedRules.get(pt.id) == pt.rule;
  }, []);

  const highlightLine = useMemo(
    () =>
      d3
        .line<DataPoint>()
        .x((d) => xScale(d.pt.x))
        .y((d) => yScale(d.pt.y))
        .defined(
          (d) =>
            !(isNaN(xScale(d.pt.x)) || isNaN(yScale(d.pt.y))) && highlight(d),
        ),
    [xScale, yScale, selectedRules],
  );

  const line = useMemo(
    () =>
      d3
        .line<DataPoint>()
        .x((d) => xScale(d.pt.x))
        .y((d) => yScale(d.pt.y))
        .defined((d) => !(isNaN(xScale(d.pt.x)) || isNaN(yScale(d.pt.y)))),
    [xScale, yScale],
  );

  const renderedLines: UseQueryResult<[number, ReactElement]>[] = useTables({
    select: useCallback(
      (table: PivotTable) => {
        const data = points(table, ctrls.columns.x, ctrls.columns.y).filter(
          (d) => !(isNaN(d.pt.x) || isNaN(d.pt.y)),
        );

        const el = (
          <g key={`${table.file_id}-lines`}>
            <path
              fill="none"
              stroke={colors[table.file_id]}
              strokeWidth={
                selectedRules.get(table.file_id) !== null ? 1.0 : 2.0
              }
              d={line(data) ?? undefined}
            />
            <path
              fill="none"
              stroke={colors[table.file_id]}
              strokeWidth={5.0}
              d={
                selectedRules.get(table.file_id) !== null
                  ? (highlightLine(data) ?? undefined)
                  : undefined
              }
            />
          </g>
        );

        return [table.file_id, el];
      },
      [ctrls.columns.x, ctrls.columns.y, line, highlightLine, selectedRules],
    ),
  });

  const renderedPoints: UseQueryResult<[number, ReactElement, ReactElement]>[] =
    useTables({
      select: useCallback(
        (table: PivotTable) => {
          const data = points(table, ctrls.columns.x, ctrls.columns.y);
          const rawPts = (
            <g key={`raw-datapoints-${table.file_id}`}>
              {data.map((d, ptidx) => (
                <DataPoint
                  key={`raw-${table.file_id}-${ptidx}`}
                  fill={colors[table.file_id]}
                  point={{ x: xScale(d.pt.x), y: yScale(d.pt.y) }}
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
                          {d.rule && <span>rule: {d.rule}</span>}
                          <span>
                            {ctrls.columns.x}: {d.pt.x.toFixed(2)}{" "}
                            {ctrls.columns.y}: {d.pt.y.toFixed(2)}
                          </span>
                        </div>
                      ),
                    });
                  }}
                />
              ))}
            </g>
          );

          const dimPts = (
            <g key={`dim-datapoints-${table.file_id}`}>
              {data.map((d, ptidx) => (
                <DataPoint
                  key={`dim-${table.file_id}-${ptidx}`}
                  fill={colors[table.file_id]}
                  point={{ x: xScale(d.pt.x), y: yScale(d.pt.y) }}
                  highlight={true}
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
                          {d.rule && <span>rule: {d.rule}</span>}
                          <span>
                            x: {d.pt.x.toFixed(2)} y: {d.pt.y.toFixed(2)}
                          </span>
                        </div>
                      ),
                    });
                  }}
                />
              ))}
            </g>
          );

          return [table.file_id, rawPts, dimPts];
        },
        [ctrls.columns.x, ctrls.columns.y, xScale, yScale],
      ),
    });

  const tooltip = useTooltip();

  const selectedPoints: UseQueryResult<[number, ReactElement | undefined]>[] =
    useTables({
      select: useCallback(
        (table: PivotTable) => {
          const selRule = selectedRules.get(table.file_id);
          if (selRule === null) return [table.file_id, undefined];

          const data = points(table, ctrls.columns.x, ctrls.columns.y).filter(
            (dp) => dp.rule === selRule,
          );

          const el = (
            <g key={`selected-datapoints-${table.file_id}`}>
              {data.map((d, ptidx) => (
                <DataPoint
                  key={`selected-${table.file_id}-${ptidx}`}
                  fill={colors[table.file_id]}
                  point={{ x: xScale(d.pt.x), y: yScale(d.pt.y) }}
                  selected={true}
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
                          {d.rule && <span>rule: {d.rule}</span>}
                          <span>
                            x: {d.pt.x.toFixed(2)} y: {d.pt.y.toFixed(2)}
                          </span>
                        </div>
                      ),
                    });
                  }}
                />
              ))}
            </g>
          );

          return [table.file_id, el];
        },
        [ctrls.columns.x, ctrls.columns.y, selectedRules, xScale, yScale],
      ),
    });

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
          {ctrls.drawLine &&
            renderedLines
              .filter((q) => !!q.data)
              .map((q) => q.data)
              .filter(([id, _]) => selected.has(id))
              .map(([_, lines]) => lines)}
          {renderedPoints
            .filter((q) => !!q.data)
            .map((q) => q.data)
            .filter(([id, _]) => selected.has(id))
            .map(([id, rawPts, dimPts]) =>
              selectedRules.get(id) === null ? rawPts : dimPts,
            )}
          {selectedPoints
            .filter((q) => !!q.data)
            .map((q) => q.data)
            .filter(([id, el]) => selected.has(id) && el)
            .map(([_, el]) => el)}
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
