import { useMemo, useState } from "react";
import { ChartSettings, useChartDimensions } from "./useChartDimensions";
import * as d3 from "d3";
import { PivotTable, setIntersect } from "./DataProcessing";
import usePersistState from "./usePersistState";

const chartSettings: ChartSettings = {
  marginLeft: 50,
  marginRight: 0,
};

export interface Point<T = number> {
  x: T;
  y: T;
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

function DataPoint({ point }: { point: Point }) {
  let [rad, setRad] = useState(2.0);

  if (isNaN(point.x) || isNaN(point.y)) return;

  return (
    <circle
      cx={point.x}
      cy={point.y}
      r={rad}
      onMouseOver={(_) => setRad(4.0)}
      onMouseOut={(_) => setRad(2.0)}
    />
  );
}

export class ChartOptions {
  scaleType: Point<"linear" | "log">;
  nTicks: Point<number>;
  drawLine: boolean;
  columns: Point<string>;

  constructor(other?: ChartOptions) {
    this.scaleType = other?.scaleType ?? { x: "linear", y: "linear" };
    this.nTicks = other?.nTicks ?? { x: 5, y: 5 };
    this.drawLine = other?.drawLine ?? true;
    this.columns = other?.columns ?? { x: "index", y: "cost" };
  }
}

function ButtonGroup<T>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  const rounded = (idx: number) => {
    if (idx === 0) {
      return "rounded-s-lg";
    } else if (idx === options.length - 1) {
      return "rounded-e-lg";
    } else {
      return "";
    }
  };

  return (
    <span className="inline-flex rounded-md shadow-sm">
      {options.map((opt, idx) => (
        <button
          key={idx}
          type="button"
          className={[
            "px-2",
            "py-[0.75px]",
            "text-sm",
            "font-medium",
            opt == value ? "text-gray-100" : "text-gray-900",
            "border",
            "border-gray-200",
            rounded(idx),
            "hover:bg-blue-500",
            "hover:text-gray-100",
            "hover:ring-1",
            "hover:ring-blue-700",
            "hover:z-10",
            opt === value ? "bg-blue-500" : "bg-white",
          ].join(" ")}
          onClick={(_) => onChange(opt)}
        >
          {opt as string}
        </button>
      ))}
    </span>
  );
}

export function ChartControls({
  onChange,
  columnValues,
}: {
  onChange: (x: ChartOptions) => void;
  columnValues: string[];
}) {
  const [ctrls, setCtrls] = usePersistState<ChartOptions>(
    new ChartOptions(),
    "chart-options",
  );

  return (
    <div className="space-y-2">
      <div
        id="control-scaleType"
        className="bg-gray-200 rounded p-2 space-y-[0.5px]"
      >
        <div>Scales:</div>
        <div className="space-x-2">
          <span className="inline-block w-4">X:</span>
          <ButtonGroup<"linear" | "log">
            options={["linear", "log"]}
            value={ctrls.scaleType.x}
            onChange={(v) => {
              const c = new ChartOptions(ctrls);
              c.scaleType.x = v;
              setCtrls(c);
              onChange(c);
            }}
          />
        </div>
        <div className="space-x-2">
          <span className="inline-block w-4">Y:</span>
          <ButtonGroup<"linear" | "log">
            options={["linear", "log"]}
            value={ctrls.scaleType.y}
            onChange={(v) => {
              const c = new ChartOptions(ctrls);
              c.scaleType.y = v;
              setCtrls(c);
              onChange(c);
            }}
          />
        </div>
      </div>

      <div
        id="control-columns"
        className="bg-gray-200 rounded p-2 space-y-[0.5px]"
      >
        <div>Column Type:</div>
        <div className="space-x-2">
          <span className="inline-block w-4">X:</span>
          <select
            onChange={(e) => {
              const c = new ChartOptions(ctrls);
              c.columns.x = e.target.value;
              setCtrls(c);
              onChange(c);
            }}
            value={ctrls.columns.x}
            className="rounded-lg px-2 py-[0.75px]"
          >
            <option value="index">Index</option>
            {columnValues.map((v) => (
              <option key={`x-${v}`} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="space-x-2">
          <span className="inline-block w-4">Y:</span>
          <select
            onChange={(e) => {
              const c = new ChartOptions(ctrls);
              c.columns.y = e.target.value;
              setCtrls(c);
              onChange(c);
            }}
            value={ctrls.columns.y}
            className="rounded-lg px-2 py-[0.75px]"
          >
            <option value="index">Index</option>
            {columnValues.map((v) => (
              <option key={`y-${v}`} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div id="control-drawLine" className="bg-gray-200 rounded p-2 space-x-2">
        <span>Draw Lines:</span>
        <button
          onClick={(_) => {
            const c = new ChartOptions(ctrls);
            c.drawLine = !ctrls.drawLine;
            setCtrls(c);
            onChange(c);
          }}
          className={[
            "rounded-lg",
            "px-2",
            "py-[0.75px]",
            "hover:bg-blue-500",
            "hover:text-gray-100",
            "hover:ring-1",
            "hover:ring-blue-700",
            "hover:z-10",
            ctrls.drawLine ? "bg-blue-500" : "bg-white",
            ctrls.drawLine ? "text-gray-100" : "text-black",
          ].join(" ")}
        >
          true
        </button>
      </div>
    </div>
  );
}

export function Chart({
  tables,
  ctrls,
}: {
  tables?: PivotTable[];
  ctrls: ChartOptions;
}) {
  const [ref, dms] = useChartDimensions(chartSettings);

  const lines: Point[][] = useMemo(
    () =>
      tables?.map((table) => points(table, ctrls.columns.x, ctrls.columns.y)) ??
      [],
    [tables, ctrls],
  );

  const [maxX, maxY] = useMemo(() => {
    if (!lines) return [100, 100];
    const maxX = Math.max(
      ...lines.map((line) => d3.max(line, (pt) => pt.x) ?? 100),
    );
    const maxY = Math.max(
      ...lines.map((line) => d3.max(line, (pt) => pt.y) ?? 100),
    );
    return [maxX, maxY];
  }, [lines]);

  const xScale = useMemo(
    () =>
      toD3Scale(ctrls.scaleType.x, [
        lowerBound(ctrls.scaleType.x),
        scaleBound(maxX),
      ]).range([0, dms.boundedWidth]),
    [dms.boundedWidth, ctrls.scaleType.x, maxX],
  );

  const yScale = useMemo(
    () =>
      toD3Scale(ctrls.scaleType.y, [
        scaleBound(maxY),
        lowerBound(ctrls.scaleType.y),
      ]).range([0, dms.boundedHeight]),
    [dms.boundedHeight, ctrls.scaleType.y, maxY],
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

  const colors = useMemo(() => d3.scaleOrdinal(d3.schemeAccent), []);

  return (
    <div ref={ref} className="h-full">
      <svg width="100%" height="100%">
        <g transform={`translate(${dms.marginLeft}, ${dms.marginTop})`}>
          <rect
            width={dms.boundedWidth}
            height={dms.boundedHeight}
            fill="lavender"
          />
          <YAxis scale={yScale} nTicks={5} />
          <g transform={`translate(0, ${dms.boundedHeight})`}>
            <XAxis scale={xScale} nTicks={ctrls.nTicks.y} />
          </g>
          <Grid
            xScale={xScale}
            yScale={yScale}
            xNTicks={ctrls.nTicks.x}
            yNTicks={ctrls.nTicks.y}
            width={dms.boundedWidth}
            height={dms.boundedHeight}
          />
          {lines?.map((child, idx) => (
            <g key={idx}>
              {ctrls.drawLine ? (
                <path
                  fill="none"
                  stroke={colors(`${idx}`)}
                  strokeWidth={2.0}
                  d={line(child) ?? undefined}
                />
              ) : null}

              {child.map((pt, ptidx) => (
                <DataPoint
                  key={`${idx}-${ptidx}`}
                  point={{ x: xScale(pt.x), y: yScale(pt.y) }}
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
    .map((row, idx) => ({ x: xSel(row, idx), y: ySel(row, idx) }));
}

type d3Scale =
  | d3.ScaleLinear<number, number>
  | d3.ScaleLogarithmic<number, number>;

export function XAxis({ scale, nTicks }: { scale: d3Scale; nTicks?: number }) {
  const ticks = useMemo(() => {
    return scale.ticks(nTicks).map((value) => ({
      value,
      offset: scale(value),
    }));
  }, [scale.domain().join("-"), scale.range().join("-"), nTicks]);

  return (
    <svg overflow="visible">
      <path
        d={[
          "M",
          scale.range()[0],
          6,
          "v",
          -6,
          "H",
          scale.range()[1],
          "v",
          6,
        ].join(" ")}
        fill="none"
        stroke="currentColor"
      />
      {ticks.map(({ value, offset }) => (
        <g key={value} transform={`translate(${offset}, 0)`}>
          <line y2="6" stroke="currentColor" />
          <text
            key={value}
            style={{
              fontSize: "10px",
              textAnchor: "middle",
              transform: "translateY(20px)",
            }}
          >
            {value}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function YAxis({ scale, nTicks }: { scale: d3Scale; nTicks?: number }) {
  const ticks = useMemo(() => {
    return scale.ticks(nTicks).map((value) => ({
      value,
      offset: scale(value),
    }));
  }, [scale.domain().join("-"), scale.range().join("-"), nTicks]);

  return (
    <svg overflow="visible">
      <path
        d={[
          "M",
          -6,
          scale.range()[1],
          "h",
          6,
          "V",
          scale.range()[0],
          "h",
          -6,
        ].join(" ")}
        fill="none"
        stroke="currentColor"
      />
      {ticks.map(({ value, offset }) => (
        <g key={value} transform={`translate(0, ${offset})`}>
          <line x2="-6" stroke="currentColor" />
          <text
            key={value}
            style={{
              fontSize: "10px",
              textAnchor: "end",
              transform: "translate(-10px, 3px)",
            }}
          >
            {value}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Grid({
  xScale,
  yScale,
  width,
  height,
  xNTicks,
  yNTicks,
  stroke = "lightGray",
}: {
  xScale: d3Scale;
  yScale: d3Scale;
  width: number;
  height: number;
  xNTicks?: number;
  yNTicks?: number;
  stroke?: string;
}) {
  const xTicks = useMemo(() => {
    return xScale.ticks(xNTicks).map((value) => xScale(value));
  }, [xScale.domain().join("-"), xScale.range().join("-"), xNTicks]);

  const yTicks = useMemo(() => {
    return yScale.ticks(yNTicks).map((value) => yScale(value));
  }, [yScale.domain().join("-"), yScale.range().join("-"), yNTicks]);

  return (
    <svg>
      {xTicks.map((offset, idx) => (
        <line
          key={`x-${idx}`}
          x1={offset}
          x2={offset}
          y1={0}
          y2={height}
          stroke={stroke}
        />
      ))}

      {yTicks.map((offset, idx) => (
        <line
          key={`y-${idx}`}
          x1={0}
          x2={width}
          y1={offset}
          y2={offset}
          stroke={stroke}
        />
      ))}
    </svg>
  );
}
