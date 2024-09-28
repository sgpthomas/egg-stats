import { Point } from "./Chart";
import usePersistState from "./usePersistState";
import { FaGear } from "react-icons/fa6";
import {
  FloatingPortal,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { useState } from "react";

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
      className="bg-egg-300 rounded p-2 space-y-[0.5px] w-full"
    >
      <div className="font-bold truncate">Scales:</div>
      <div className="space-x-2 w-max">
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
      <div className="space-x-2 w-max">
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
      className="bg-egg-300 rounded p-2 space-y-[0.5px] w-full"
    >
      <div className="font-bold truncate">Column Types:</div>
      <div className="space-x-2 w-max">
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
      <div className="space-x-2 w-max">
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
    <div id="control-drawLine" className="bg-egg-300 rounded p-2 w-full">
      <div className="space-x-2 w-max">
        <span className="font-bold truncate">Draw Lines:</span>
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
            "space-y-2 flex flex-col",
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
        ].join(" ")}
        disabled={open}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <div className="hover:animate-spin-slow">
          <FaGear size="1.5rem" />
        </div>
      </button>
      {settingsOpen && (
        <FloatingPortal>
          <div
            className="w-max z-40 space-y-2 bg-egg-200 p-2 border-egg-900 border-[1px] rounded-md"
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
