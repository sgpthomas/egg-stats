import {
  createContext,
  Dispatch,
  PropsWithChildren,
  useEffect,
  useReducer,
} from "react";
import { Point } from "./Chart";
import { useMediaQuery } from "./hooks";

export type DarkModeOpts = "system" | "light" | "dark";

export class ChartOptions {
  scaleType: Point<"linear" | "log">;
  nTicks: Point<number>;
  drawLine: boolean;
  columns: Point<string>;
  locked: boolean;
  userRange: Point<[number?, number?]>;
  computedRange: Point<[number, number]>;
  minDist: number;
  darkMode: DarkModeOpts;

  constructor(other?: ChartOptions) {
    this.scaleType = other?.scaleType ?? { x: "linear", y: "linear" };
    this.nTicks = other?.nTicks ?? { x: 100, y: 100 };
    this.drawLine = other?.drawLine ?? true;
    this.columns = other?.columns ?? { x: "index", y: "cost" };
    this.locked = other?.locked ?? false;
    this.userRange = other?.userRange ?? {
      x: [undefined, undefined],
      y: [undefined, undefined],
    };
    this.computedRange = other?.computedRange ?? {
      x: [0, 100],
      y: [0, 100],
    };
    this.minDist = other?.minDist ?? 5;
    this.darkMode = other?.darkMode ?? "system";
  }

  static range(self: ChartOptions): Point<[number, number]> {
    if (self.locked) {
      return {
        x: [
          self.userRange.x[0] ?? self.computedRange.x[0],
          self.userRange.x[1] ?? self.computedRange.x[1],
        ],
        y: [
          self.userRange.y[0] ?? self.computedRange.y[0],
          self.userRange.y[1] ?? self.computedRange.y[1],
        ],
      };
    } else {
      return self.computedRange;
    }
  }

  static lockRange(self: ChartOptions, locked: boolean) {
    self.locked = locked;
    if (!locked) {
      self.userRange = structuredClone(self.computedRange);
    }
  }

  static isDark(self: ChartOptions) {
    if (self.darkMode === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      return self.darkMode === "dark";
    }
  }
}

export const ChartOptionsContext = createContext<ChartOptions>(
  new ChartOptions(),
);
export const ChartDispatchContext = createContext<Dispatch<ChartOptions>>(
  (_) => {},
);

export function ChartOptionsProvider({ children }: PropsWithChildren<{}>) {
  const savedChartOptions = localStorage.getItem("chart-options");
  let loadedOptions = new ChartOptions();
  if (savedChartOptions) {
    loadedOptions = new ChartOptions(JSON.parse(savedChartOptions));
  }

  const [options, dispatch] = useReducer(optionsReducer, loadedOptions);

  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  useEffect(() => {
    switch (options.darkMode) {
      case "system":
        if (systemDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        return;
      case "light":
        document.documentElement.classList.remove("dark");
        return;
      case "dark":
        document.documentElement.classList.add("dark");
        return;
    }
  }, [options.darkMode, systemDark]);

  return (
    <ChartOptionsContext.Provider value={options}>
      <ChartDispatchContext.Provider value={dispatch}>
        {children}
      </ChartDispatchContext.Provider>
    </ChartOptionsContext.Provider>
  );
}

function optionsReducer(
  _oldOptions: ChartOptions,
  newOptions: ChartOptions,
): ChartOptions {
  localStorage.setItem("chart-options", JSON.stringify(newOptions));
  return newOptions;
}
