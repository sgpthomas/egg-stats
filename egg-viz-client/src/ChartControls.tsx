import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Point } from "./Chart";
import usePersistState from "./usePersistState";
import { FaGear } from "react-icons/fa6";

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

export function ChartControls({
  onChange,
  columnValues,
  open,
}: {
  onChange: (x: ChartOptions) => void;
  columnValues: string[];
  open: boolean;
}) {
  const [ctrls, setCtrls] = usePersistState<ChartOptions>(
    new ChartOptions(),
    "chart-options",
  );

  const scales = (
    <div
      id="control-scaleType"
      className="bg-egg-300 rounded p-2 space-y-[0.5px]"
    >
      <div className="font-bold">Scales:</div>
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
  );

  const columns = (
    <div
      id="control-columns"
      className="bg-egg-300 rounded p-2 space-y-[0.5px]"
    >
      <div className="font-bold">Column Types:</div>
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
    <div id="control-drawLine" className="bg-egg-300 rounded p-2 space-x-2">
      <span className="font-bold">Draw Lines:</span>
      <button
        onClick={(_) => {
          const c = new ChartOptions(ctrls);
          c.drawLine = !ctrls.drawLine;
          setCtrls(c);
          onChange(c);
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
  );

  return (
    <div className="space-y-2 flex flex-col">
      {open ? scales : undefined}
      {open ? columns : undefined}
      {open ? drawLine : undefined}

      {!open ? (
        <Popover className="relative self-end">
          <PopoverButton className="self-end bg-egg-300 hover:bg-egg-400 rounded-md">
            <button className="text-lg hover:animate-spin-slow align-center p-2">
              <FaGear size="1.5rem" />
            </button>
          </PopoverButton>
          <PopoverPanel
            anchor="bottom start"
            className="flex flex-col z-40 drop-shadow-md"
          >
            <div className="space-y-2 bg-egg-200 p-2 border-egg-900 border-[1px] rounded-md">
              {scales}
              {columns}
              {drawLine}
            </div>
          </PopoverPanel>
        </Popover>
      ) : undefined}
    </div>
  );
}
