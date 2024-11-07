import { useMemo } from "react";
import { computeTicks, type d3Scale } from "./Axis";

export function Grid({
  xScale,
  yScale,
  width,
  height,
  xOffset,
  yOffset,
  xNTicks,
  yNTicks,
}: {
  xScale: d3Scale;
  yScale: d3Scale;
  width: number;
  height: number;
  xOffset: number;
  yOffset: number;
  xNTicks?: number;
  yNTicks?: number;
}) {
  const xTicks = useMemo(() => {
    return computeTicks(xScale, 100).map((value) => xScale(value));
  }, [xScale.domain().join("-"), xScale.range().join("-"), xNTicks]);

  const yTicks = useMemo(() => {
    return computeTicks(yScale, 100).map((value) => yScale(value));
  }, [yScale.domain().join("-"), yScale.range().join("-"), yNTicks]);

  return (
    <svg className="stroke-[#F0D4A8] dark:stroke-[#5d524c]">
      {xTicks.map((offset, idx) => (
        <line
          key={`x-${idx}`}
          x1={offset + xOffset}
          x2={offset + xOffset}
          y1={0}
          y2={height}
        />
      ))}

      {yTicks.map((offset, idx) => (
        <line
          key={`y-${idx}`}
          x1={0}
          x2={width}
          y1={offset + yOffset}
          y2={offset + yOffset}
          // stroke={stroke}
        />
      ))}
    </svg>
  );
}
