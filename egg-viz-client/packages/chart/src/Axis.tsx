import { useMemo } from "react";

function AxisTickLabel({ value }: { value: number }) {
  if (value < 10) return <tspan>{value}</tspan>;

  if (value.toString().length <= 4) {
    return <tspan>{value}</tspan>;
  }

  if (Math.log10(value) % 1 === 0) {
    const exp = Math.log10(value);

    return (
      <>
        <tspan>10</tspan>
        <tspan baselineShift="super">{exp}</tspan>
      </>
    );
  } else {
    const exponential = value.toExponential();
    const [pre, exp] = exponential.split("e");
    const normExp = exp?.startsWith("+") ? exp.substring(1) : exp;
    return (
      <>
        <tspan>{pre}×10</tspan>
        <tspan baselineShift="super">{normExp}</tspan>
      </>
    );
  }
}

export type d3Scale =
  | d3.ScaleLinear<number, number>
  | d3.ScaleLogarithmic<number, number>;

export function computeTicks(
  scale: d3Scale,
  density: number = 100,
  filter: (tick: number) => boolean = (_) => true,
): number[] {
  const actualWidth = Math.abs(
    (scale.range()[0] ?? 100) - (scale.range()[1] ?? 0),
  );

  const actualTicks = actualWidth / density;
  return scale.ticks(Math.max(2, actualTicks)).filter(filter);
}

export function XAxis({
  scale,
  label = "test",
  kind = "linear",
}: {
  scale: d3Scale;
  label?: string;
  kind: "linear" | "log";
}) {
  const ticks = useMemo(() => {
    return computeTicks(scale, 200, (tick) =>
      kind === "log" ? Math.log10(tick) % 1 === 0 : true,
    ).map((value) => ({
      value,
      offset: scale(value),
    }));
  }, [scale.domain().join("-"), scale.range().join("-"), kind]);

  const midPoint = useMemo(() => {
    const range = scale.range();
    if (range[0] === undefined || range[1] === undefined) return 0;
    return Math.abs(range[0] + range[1]) / 2;
  }, [scale.range().join("-")]);

  return (
    <svg
      overflow="visible"
      className="stroke-black dark:stroke-[#d4d0cf] fill-black dark:fill-[#d4d0cf]"
    >
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
      />
      {ticks.map(({ value, offset }) => (
        <g key={value} transform={`translate(${offset}, 0)`}>
          <line y2="6" />
          <text
            key={value}
            style={{
              fontSize: "11px",
              textAnchor: "middle",
              transform: "translateY(22px)",
            }}
            stroke="none"
          >
            <AxisTickLabel value={value} />
          </text>
        </g>
      ))}
      <text
        textAnchor="middle"
        fontWeight="bold"
        transform={`translate(${midPoint}, 40)`}
        stroke="none"
      >
        {label}
      </text>
    </svg>
  );
}

export function YAxis({
  scale,
  label = "test",
  kind = "linear",
}: {
  scale: d3Scale;
  label?: string;
  kind: "linear" | "log";
}) {
  const ticks = useMemo(() => {
    return computeTicks(scale, 100, (tick) =>
      kind === "log" ? Math.log10(tick) % 1 === 0 : true,
    ).map((value) => ({
      value,
      offset: scale(value),
    }));
  }, [scale.domain().join("-"), scale.range().join("-"), kind]);

  const midPoint = useMemo(() => {
    const range = scale.range();
    if (range[0] === undefined || range[1] === undefined) return 0;
    return Math.abs(range[0] + range[1]) / 2;
  }, [scale.range().join("-")]);

  return (
    <svg
      overflow="visible"
      className="stroke-black dark:stroke-[#d4d0cf] fill-black dark:fill-[#d4d0cf]"
    >
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
      />
      {ticks.map(({ value, offset }) => (
        <g key={value} transform={`translate(0, ${offset})`}>
          <line x2="-6" />
          <text
            key={value}
            style={{
              fontSize: "11px",
              textAnchor: "end",
              transform: "translate(-10px, 3px)",
            }}
            stroke="none"
          >
            <AxisTickLabel value={value} />
          </text>
        </g>
      ))}
      <text
        textAnchor="middle"
        fontWeight="bold"
        transform={`translate(-40, ${midPoint}), rotate(-90)`}
        stroke="none"
      >
        {label}
      </text>
    </svg>
  );
}
