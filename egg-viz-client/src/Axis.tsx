import { useMemo } from "react";

export type d3Scale =
  | d3.ScaleLinear<number, number>
  | d3.ScaleLogarithmic<number, number>;

export function XAxis({ scale }: { scale: d3Scale }) {
  const ticks = useMemo(() => {
    const width = Math.abs(
      (scale.domain()[0] ?? 100) - (scale.domain()[1] ?? 0),
    );

    return scale.ticks(Math.trunc(Math.log10(width))).map((value) => ({
      value,
      offset: scale(value),
    }));
  }, [scale.domain().join("-"), scale.range().join("-")]);

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

export function YAxis({ scale }: { scale: d3Scale }) {
  const ticks = useMemo(() => {
    const width = Math.abs(
      (scale.domain()[0] ?? 100) - (scale.domain()[1] ?? 0),
    );
    return scale.ticks(Math.trunc(Math.log10(width))).map((value) => ({
      value,
      offset: scale(value),
    }));
  }, [scale.domain().join("-"), scale.range().join("-")]);

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
