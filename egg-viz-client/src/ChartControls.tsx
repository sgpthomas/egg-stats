import { Point } from "./Chart";
import * as fa6 from "react-icons/fa6";
import {
  FloatingPortal,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { ChangeEvent, PropsWithChildren, useCallback, useState } from "react";
import { useTables } from "./Fetch";
import { PivotTable, setIntersect } from "./DataProcessing";
import { UseQueryResult } from "@tanstack/react-query";
import { HoverTooltip } from "./hooks";

function ButtonGroup<T>({
  options,
  labels = options as string[],
  value,
  onChange = (_) => {},
}: {
  options: T[];
  labels?: string[];
  value?: T;
  onChange?: (v: T) => void;
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
    <span className="inline-flex shadow-sm">
      {options.map((opt, idx) => (
        <button
          key={idx}
          type="button"
          className={[
            "px-2",
            "py-[0.75px]",
            "text-sm",
            "font-medium",
            opt === value ? "text-white" : "text-gray-900",
            rounded(idx),
            "ring-[0.5px]",
            "ring-egg-700",
            "hover:bg-egg-600",
            "hover:text-white",
            "hover:shadow-lg",
            "hover:ring-1",
            "hover:ring-egg-700",
            "hover:z-10",
            opt === value ? "bg-egg-500" : "bg-white",
            "focus:outline-none",
            "focus:ring-[2px]",
          ].join(" ")}
          onClick={(_) => onChange(opt)}
        >
          {labels[idx]}
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

function CheckBox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex items-center relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={[
          "cursor-pointer",
          "appearance-none",
          "bg-white",
          "checked:bg-egg-500",
          "w-4",
          "h-4",
          "rounded-md",
          "border-[1px]",
          "border-egg-600",
          "hover:border-[1.5px]",
          "hover:border-egg-700",
          "hover:checked:bg-egg-600",
          "transition-all",
          "peer",
          "focus:outline-none",
          "focus:ring-[2px]",
          "ring-egg-700",
        ].join(" ")}
      />
      <span
        className={[
          "absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none",
          "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        ].join(" ")}
      >
        <fa6.FaCheck size="110%" />
      </span>
    </label>
  );
}

function ChartSelect({
  children,
  onChange,
  value,
}: PropsWithChildren<{
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  value: string;
}>) {
  return (
    <select
      onChange={onChange}
      value={value}
      className={[
        "rounded-md",
        "px-2",
        "py-[0.75px]",
        "hover:bg-egg-600",
        "hover:text-white",
        "appearance-none",
        "py-0",
        "my-[1px]",
        "pr-5",
        "ring-[0.5px]",
        "hover:ring-[1px]",
        "focus:outline-none",
        "focus:ring-[2px]",
        "ring-egg-700",
        "transition-all",
      ].join(" ")}
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`,
        backgroundRepeat: "no-repeat",
        backgroundPositionX: "100%",
        backgroundPositionY: "50%",
      }}
    >
      {children}
    </select>
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

function ChartControlItem(props: PropsWithChildren<{}>) {
  return (
    <div className="border-[1px] border-egg-400 rounded-md p-2 space-y-[0.5px] w-full">
      {props.children}
    </div>
  );
}

function ChartControlTitle({
  label,
  children,
}: PropsWithChildren<{ label: string }>) {
  return (
    <div className="font-bold truncate flex items-center space-x-2">
      <span>{children}</span>
      <span>{label}:</span>
    </div>
  );
}

interface ChartControlProps {
  ctrls: ChartOptions;
  setCtrls: (x: ChartOptions) => void;
  open: boolean;
}

function ChartControlColumns({ ctrls, setCtrls }: ChartControlProps) {
  const columnValues = useTables({
    select: useCallback((table: PivotTable) => table.value_names, []),
    combine: (queries: UseQueryResult<string[]>[]) =>
      queries
        ?.filter((t) => !!t.data)
        .map((t) => t.data)
        .reduce<string[] | undefined>(setIntersect, undefined) ?? [],
  });

  return (
    <ChartControlItem>
      <ChartControlTitle label="Column Types">
        <fa6.FaTable />
      </ChartControlTitle>
      <div className="space-x-2 w-max">
        <span className="inline-block w-4">X:</span>
        <ChartSelect
          onChange={(e) => {
            const c = new ChartOptions(ctrls);
            c.columns.x = e.target.value;
            setCtrls(c);
          }}
          value={ctrls.columns.x}
        >
          <option value="index">Index</option>
          {columnValues.map((v) => (
            <option key={`x-${v}`} value={v}>
              {v}
            </option>
          ))}
        </ChartSelect>
      </div>
      <div className="space-x-2 w-max">
        <span className="inline-block w-4">Y:</span>
        <ChartSelect
          onChange={(e) => {
            const c = new ChartOptions(ctrls);
            c.columns.y = e.target.value;
            setCtrls(c);
          }}
          value={ctrls.columns.y}
        >
          <option value="index">Index</option>
          {columnValues.map((v) => (
            <option key={`y-${v}`} value={v}>
              {v}
            </option>
          ))}
        </ChartSelect>
      </div>
    </ChartControlItem>
  );
}

function ChartControlScale({ ctrls, setCtrls }: ChartControlProps) {
  return (
    <ChartControlItem>
      <ChartControlTitle label="Scales">
        <fa6.FaChartLine />
      </ChartControlTitle>
      <div className="space-x-2 truncate overflow-hidden flex items-center">
        <span>Scale to fit:</span>
        <CheckBox
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
        <span className="inline-block w-4">X: </span>
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
        <span className="inline-block w-4">Y: </span>
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
    </ChartControlItem>
  );
}

function ChartControlDrawLine({ ctrls, setCtrls }: ChartControlProps) {
  return (
    <ChartControlItem>
      <div className="space-x-2 w-max flex items-center">
        <ChartControlTitle label="Draw Lines">
          <fa6.FaPenClip />
        </ChartControlTitle>
        <CheckBox
          checked={ctrls.drawLine}
          onChange={(_) => {
            ctrls.drawLine = !ctrls.drawLine;
            setCtrls(new ChartOptions(ctrls));
          }}
        />
      </div>
    </ChartControlItem>
  );
}

export function ChartControls(props: ChartControlProps) {
  const body = (
    <>
      {<ChartControlColumns {...props} />}
      {<ChartControlScale {...props} />}
      {<ChartControlDrawLine {...props} />}
    </>
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
            props.open ? "opacity-1" : "opacity-0",
            props.open ? "visible" : "invisible",
          ].join(" ")}
        >
          {body}
        </div>
      }
      <HoverTooltip content=<span>Chart Controls</span>>
        <button
          className={[
            "text-lg align-center p-2 bg-egg-300 absolute bottom-[14px] right-[14px] rounded-md",
            "transition-all",
            "disabled:pointer-events-none",
            "opacity-1",
            "disabled:opacity-0",
            "visible",
            "disable:invisible",
            "hover:bg-egg-400",
            "focus:outline-none",
            "focus:ring-[2px]",
            "ring-egg-700",
          ].join(" ")}
          disabled={props.open}
          ref={refs.setReference}
          {...getReferenceProps()}
        >
          <div className="hover:animate-spin-slow">
            <fa6.FaGear size="1.5rem" />
          </div>
        </button>
      </HoverTooltip>
      {settingsOpen && (
        <FloatingPortal>
          <div
            className={[
              // "w-max",
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
            {body}
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
