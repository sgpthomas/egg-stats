import { useCallback, useMemo } from "react";

export function useColors(): (i: number) => string {
  const colors = useMemo(
    () => [
      "#f64a86",
      "#ee7480",
      "#e9917c",
      "#e4a976",
      "#dfbe6f",
      "#d7d265",
      "#cee359",
      "#c6ed4d",
      "#c0f642",
      "#b8ff33",
      "#b0f950",
      "#a9f465",
      "#a3ef76",
      "#97e492",
      "#8fd7a8",
      "#85c9b9",
      "#75bcc5",
      "#58b0d8",
      "#11a3fa",
    ],
    [],
  );
  return useCallback((i: number) => colors[(i * 7) % (colors.length - 1)]!, []);
}
