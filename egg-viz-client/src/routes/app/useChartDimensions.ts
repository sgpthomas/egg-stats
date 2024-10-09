import { ResizeObserver } from "@juggle/resize-observer";
import { MutableRefObject, useEffect, useRef, useState } from "react";

export interface ChartSettings {
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export interface ChartDimensions {
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  height: number;
  width: number;
  boundedHeight: number;
  boundedWidth: number;
}

function defaultChartSettings(settings: ChartSettings): {
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
} {
  return {
    marginTop: settings.marginTop || 10,
    marginRight: settings.marginRight || 10,
    marginBottom: settings.marginBottom || 40,
    marginLeft: settings.marginLeft || 75,
  };
}

export function useChartDimensions(
  passedSettings: ChartSettings,
): [MutableRefObject<null>, ChartDimensions] {
  const ref = useRef(null);
  const dimensions = defaultChartSettings(passedSettings);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = ref.current;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!Array.isArray(entries)) return;
      if (!entries.length) return;
      const entry = entries[0];
      if (entry && width !== entry.contentRect.width)
        setWidth(entry.contentRect.width);
      if (entry && height !== entry.contentRect.height)
        setHeight(entry.contentRect.height);
    });

    if (element) {
      resizeObserver.observe(element);
      return () => resizeObserver.unobserve(element);
    }
  }, [width, height]);

  const newSettings = {
    ...dimensions,
    width,
    height,
    boundedWidth: Math.max(
      width - dimensions.marginLeft - dimensions.marginRight,
      0,
    ),
    boundedHeight: Math.max(
      height - dimensions.marginTop - dimensions.marginBottom,
      0,
    ),
  };
  return [ref, newSettings];
}
