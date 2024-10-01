import { Point } from "./Chart";
import * as fa6 from "react-icons/fa6";
import {
  FloatingPortal,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { useCallback, useState } from "react";
import { useTables } from "./Fetch";
import { PivotTable, setIntersect } from "./DataProcessing";
import { UseQueryResult } from "@tanstack/react-query";

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
      return "rounded-s-md";
    } else if (idx === options.length - 1) {
      return "rounded-e-md";
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
            opt == value ? "text-gray-700" : "text-gray-900",
            rounded(idx),
            "hover:bg-eggshell-hover",
            "hover:text-white",
            "hover:shadow-lg",
            "hover:ring-1",
            "hover:ring-eggshell-700",
            "hover:z-10",
            opt === value ? "bg-eggshell-active" : "bg-white",
          ].join(" ")}
          onClick={(_) => onChange(opt)}
        >
          {opt as string}
        </button>
      ))}
    </span>
  );
}

function RangeSelect({
  label,
  range,
  computed,
  onChange = (_) => {},
}: {
  label: string;
  range: [number?, number?];
  computed: [number, number];
  onChange?: (r: [number?, number?]) => void;
}) {
  const inputClasses = [
    "max-w-16",
    "bg-egg-300",
    "border-b-[1.5px]",
    "border-black",
    "h-5",
    "text-md",
    "appearance-none",
  ];
  return (
    <span className="space-x-1 text-md flex items-center">
      <input
        value={range[0] ?? computed[0]}
        type="number"
        className={inputClasses.concat(["text-end"]).join(" ")}
        onChange={(e) => {
          onChange([
            e.target.value === "" ? computed[0] : e.target.valueAsNumber,
            range[1],
          ]);
        }}
      />
      <span>&le; {label} &le;</span>
      <input
        value={range[1] ?? computed[1]}
        type="number"
        className={inputClasses.concat(["text-start"]).join(" ")}
        onChange={(e) => {
          onChange([
            range[0],
            e.target.value === "" ? computed[1] : e.target.valueAsNumber,
          ]);
        }}
      />
    </span>
  );
}

export class ChartOptions {
  scaleType: Point<"linear" | "log">;
  nTicks: Point<number>;
  drawLine: boolean;
  columns: Point<string>;
  locked: boolean;
  userRange: Point<[number?, number?]>;
  computedRange: Point<[number, number]>;

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
}

export function ChartControls({
  ctrls,
  setCtrls,
  open,
}: {
  ctrls: ChartOptions;
  setCtrls: (x: ChartOptions) => void;
  open: boolean;
}) {
  const scales = (
    <div
      id="control-scaleType"
      className="border-[1px] border-egg-400 rounded-md p-2 space-y-[0.5px] w-full"
    >
      <div className="font-bold truncate flex items-center space-x-2">
        <span>
          <fa6.FaChartLine />
        </span>
        <span>Scales:</span>
      </div>
      <div className="space-x-1 truncate overflow-hidden">
        <span>Scale to fit:</span>
        <input
          type="checkbox"
          checked={!ctrls.locked}
          onChange={(_) => {
            ChartOptions.lockRange(ctrls, !ctrls.locked);
            setCtrls(new ChartOptions(ctrls));
          }}
        />
      </div>
      <div
        className={[
          "transition-opacity",
          !ctrls.locked && "opacity-50",
          "w-max",
        ].join(" ")}
      >
        <RangeSelect
          range={ctrls.userRange.x}
          computed={ctrls.computedRange.x}
          label="x"
          onChange={(v) => {
            ctrls.userRange.x = v;
            setCtrls(new ChartOptions(ctrls));
          }}
        />
      </div>
      <div
        className={[
          "transition-opacity",
          !ctrls.locked && "opacity-50",
          "w-max",
        ].join(" ")}
      >
        <RangeSelect
          range={ctrls.userRange.y}
          computed={ctrls.computedRange.y}
          label="y"
          onChange={(v) => {
            ctrls.userRange.y = v;
            setCtrls(new ChartOptions(ctrls));
          }}
        />
      </div>
      <div className="space-x-2 w-max">
        <span>X: </span>
        <ButtonGroup<"linear" | "log">
          options={["linear", "log"]}
          value={ctrls.scaleType.x}
          onChange={(v) => {
            const c = new ChartOptions(ctrls);
            c.scaleType.x = v;
            setCtrls(c);
          }}
        />
      </div>
      <div className="space-x-2 w-max">
        <span>Y: </span>
        <ButtonGroup<"linear" | "log">
          options={["linear", "log"]}
          value={ctrls.scaleType.y}
          onChange={(v) => {
            const c = new ChartOptions(ctrls);
            c.scaleType.y = v;
            setCtrls(c);
          }}
        />
      </div>
    </div>
  );

  const columnValues = useTables({
    select: useCallback((table: PivotTable) => table.value_names, []),
    combine: (queries: UseQueryResult<string[]>[]) =>
      queries
        ?.filter((t) => !!t.data)
        .map((t) => t.data)
        .reduce<string[] | undefined>(setIntersect, undefined) ?? [],
  });

  const columns = (
    <div
      id="control-columns"
      className="border-[1px] border-egg-400 rounded p-2 space-y-[0.5px] w-full"
    >
      <div className="font-bold truncate flex items-center space-x-2">
        <span>
          <fa6.FaTable />
        </span>
        <span>Column Types:</span>
      </div>
      <div className="space-x-2 w-max">
        <span className="inline-block w-4">X:</span>
        <select
          onChange={(e) => {
            const c = new ChartOptions(ctrls);
            c.columns.x = e.target.value;
            setCtrls(c);
          }}
          value={ctrls.columns.x}
          className="rounded-md px-2 py-[0.75px] hover:bg-eggshell-hover hover:text-white"
        >
          <option value="index">Index</option>
          {columnValues.map((v) => (
            <option key={`x-${v}`} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="space-x-2 w-max">
        <span className="inline-block w-4">Y:</span>
        <select
          onChange={(e) => {
            const c = new ChartOptions(ctrls);
            c.columns.y = e.target.value;
            setCtrls(c);
          }}
          value={ctrls.columns.y}
          className="rounded-md px-2 py-[0.75px] hover:bg-eggshell-hover hover:text-white"
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
  );

  const drawLine = (
    <div
      id="control-drawLine"
      className="border-[1px] border-egg-400 rounded p-2 w-full"
    >
      <div className="space-x-2 w-max flex items-center">
        <span>
          <fa6.FaPenClip />
        </span>
        <span className="font-bold truncate">Draw Lines:</span>
        <button
          onClick={(_) => {
            const c = new ChartOptions(ctrls);
            c.drawLine = !ctrls.drawLine;
            setCtrls(c);
          }}
          className={[
            "rounded-md",
            "px-2",
            "py-[0.75px]",
            "hover:bg-eggshell-hover",
            "hover:text-gray-100",
            "hover:shadow-lg",
            "hover:z-10",
            ctrls.drawLine ? "bg-eggshell-active" : "bg-white",
            "text-black",
          ].join(" ")}
        >
          true
        </button>
      </div>
    </div>
  );

  const [settingsOpen, setSettingsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    placement: "top-start",
    open: settingsOpen,
    onOpenChange: setSettingsOpen,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  return (
    <div>
      {
        <div
          className={[
            "space-y-1 flex flex-col bg-egg-300 p-1 rounded-md",
            "transition-all",
            open ? "opacity-1" : "opacity-0",
            open ? "visible" : "invisible",
          ].join(" ")}
        >
          {scales}
          {columns}
          {drawLine}
        </div>
      }
      <button
        className={[
          "text-lg align-center p-2 bg-egg-300 fixed bottom-[14px] right-[14px] rounded-md",
          "transition-all",
          "disabled:pointer-events-none",
          "opacity-1",
          "disabled:opacity-0",
          "visible",
          "disable:invisible",
          "hover:bg-egg-400",
        ].join(" ")}
        disabled={open}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <div className="hover:animate-spin-slow">
          <fa6.FaGear size="1.5rem" />
        </div>
      </button>
      {settingsOpen && (
        <FloatingPortal>
          <div
            className={[
              "w-max",
              "z-40",
              "space-y-1",
              "bg-egg-300",
              "p-2",
              "border-egg-400",
              "border-[1px]",
              "rounded-md",
              "drop-shadow-md",
            ].join(" ")}
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {scales}
            {columns}
            {drawLine}
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
