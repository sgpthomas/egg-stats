import * as fa6 from "react-icons/fa6";
import {
  autoPlacement,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStyles,
} from "@floating-ui/react";
import {
  type ChangeEvent,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTables } from "./Fetch";
import { PivotTable2, setIntersect } from "./DataProcessing";
import { type UseQueryResult } from "@tanstack/react-query";
import { HoverTooltip } from "./hooks";
import {
  ChartDispatchContext,
  ChartOptions,
  ChartOptionsContext,
  type DarkModeOpts,
} from "./ChartOptions";

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
            opt === value ? "text-white" : "text-black dark:text-white",
            rounded(idx),
            "ring-[0.5px]",
            "ring-egg-700",
            "hover:bg-egg-600",
            "hover:text-white",
            "hover:shadow-lg",
            "hover:ring-1",
            "hover:ring-egg-700",
            "hover:z-10",
            opt === value ? "bg-egg-500" : "bg-white dark:bg-mixed-40",
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

export function roundUpperBound(input: number): number {
  const nZeros = Math.floor(Math.log10(input));
  if (nZeros === 0) {
    return 10;
  }

  return (Math.floor(input / Math.pow(10, nZeros)) + 1) * Math.pow(10, nZeros);
}

export function lowerBound(typ: "linear" | "log", value: number): number {
  if (typ === "linear") {
    return Math.max(0, value);
  } else if (typ === "log") {
    return Math.max(1, value);
  } else {
    return Math.max(0, value);
  }
}

function RangeSelect({
  label,
  range,
  computed,
  locked,
  onChange = (_) => {},
}: {
  label: string;
  range: [number?, number?];
  computed: [number, number];
  locked: boolean;
  onChange?: (r: [number?, number?]) => void;
}) {
  const inputClasses = [
    "max-w-16",
    "bg-egg-300 dark:bg-mixed-40",
    "border-b-[1.5px]",
    "border-black dark:border-white",
    "text-black dark:text-white",
    "h-5",
    "text-md",
    "appearance-none",
  ];

  const lower = roundUpperBound(range[0] ?? computed[0]);
  const lowerRef = useRef<HTMLInputElement | null>(null);

  const upper = roundUpperBound(range[1] ?? computed[1]);
  const upperRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (lowerRef.current && upperRef.current) {
      lowerRef.current.value = lower.toExponential();
      upperRef.current.value = upper.toExponential();
    }
  }, [locked]);

  const onEvent = () => {
    const lowerVal = Number(lowerRef.current?.value);
    const upperVal = Number(upperRef.current?.value);
    if (
      lowerRef.current &&
      (isNaN(lowerVal) || lowerRef.current?.value === "")
    ) {
      lowerRef.current.value = `${lower.toExponential()}`;
    }
    if (
      upperRef.current &&
      (isNaN(upperVal) || upperRef.current?.value === "")
    ) {
      upperRef.current.value = `${upper.toExponential()}`;
    }
    onChange([
      isNaN(lowerVal) ? computed[0] : lowerVal,
      isNaN(upperVal) ? computed[1] : upperVal,
    ]);
  };

  return (
    <span className="space-x-1 text-md flex items-center">
      <input
        ref={lowerRef}
        defaultValue={lower.toExponential()}
        className={inputClasses.concat(["text-end"]).join(" ")}
        disabled={!locked}
        onBlur={(_) => onEvent()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onEvent();
          }
        }}
      />
      <span className="text-black dark:text-white">&le; {label} &le;</span>
      <input
        ref={upperRef}
        defaultValue={upper.toExponential()}
        className={inputClasses.concat(["text-start"]).join(" ")}
        disabled={!locked}
        onBlur={(_) => onEvent()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onEvent();
          }
        }}
      ></input>
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
          "bg-white dark:bg-mixed-40",
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
        "hover:bg-egg-600 dark:hover:bg-mixed-80",
        "text-black dark:text-white",
        "hover:text-white dark:hover:text-black",
        "bg-white dark:bg-mixed-40",
        "appearance-none",
        "py-0",
        "my-[1px]",
        "pr-5",
        "ring-[0.5px]",
        "hover:ring-[1px]",
        "focus:outline-none",
        "focus:ring-[2px]",
        "ring-egg-700 dark:ring-mixed-80",
        "transition-all",
        "text-black dark:text-white",
      ].join(" ")}
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='currentColor' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`,
        backgroundRepeat: "no-repeat",
        backgroundPositionX: "100%",
        backgroundPositionY: "50%",
      }}
    >
      {children}
    </select>
  );
}

function ChartControlItem(props: PropsWithChildren<{}>) {
  return (
    <div
      className={[
        "border-[1px]",
        "border-egg-400 dark:border-mixed-60",
        "rounded-md",
        "p-2",
        "space-y-[0.5px]",
        "w-full",
      ].join(" ")}
    >
      {props.children}
    </div>
  );
}

function ChartControlTitle({
  label,
  children,
}: PropsWithChildren<{ label: string }>) {
  return (
    <div className="font-bold truncate flex items-center space-x-2 text-black dark:text-white">
      <span>{children}</span>
      <span>{label}:</span>
    </div>
  );
}

interface ChartControlProps {
  open: boolean;
}

function ChartControlColumns({}: ChartControlProps) {
  const ctrls = useContext(ChartOptionsContext);
  const setCtrls = useContext(ChartDispatchContext);

  const columnValues = useTables({
    select: useCallback((table: PivotTable2) => table.value_names, []),
    combine: useCallback(
      (queries: UseQueryResult<string[]>[]) =>
        queries
          ?.filter((t) => !!t.data)
          .map((t) => t.data)
          .reduce<string[] | undefined>(
            (a, b) => setIntersect(a, b),
            undefined,
          ) ?? [],
      [],
    ),
  });

  return (
    <ChartControlItem>
      <ChartControlTitle label="Column Types">
        <fa6.FaTable />
      </ChartControlTitle>
      <div className="space-x-2 w-max">
        <span className="inline-block w-4 text-black dark:text-white">X:</span>
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
        <span className="inline-block w-4 text-black dark:text-white">Y:</span>
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

function ChartControlScale({}: ChartControlProps) {
  const ctrls = useContext(ChartOptionsContext);
  const setCtrls = useContext(ChartDispatchContext);

  return (
    <ChartControlItem>
      <ChartControlTitle label="Scales">
        <fa6.FaChartLine />
      </ChartControlTitle>
      <div className="space-x-2 truncate overflow-hidden flex items-center">
        <span className="text-black dark:text-white">Scale to fit:</span>
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
          locked={ctrls.locked}
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
          locked={ctrls.locked}
          onChange={(v) => {
            ctrls.userRange.y = v;
            setCtrls(new ChartOptions(ctrls));
          }}
        />
      </div>
      <div className="space-x-2 w-max">
        <span className="inline-block w-4 text-black dark:text-white">X:</span>
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
        <span className="inline-block w-4 text-black dark:text-white">Y:</span>
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

function ChartControlMinDist({}: ChartControlProps) {
  const ctrls = useContext(ChartOptionsContext);
  const setCtrls = useContext(ChartDispatchContext);

  return (
    <ChartControlItem>
      <ChartControlTitle label="Minimum Distance">
        <fa6.FaArrowsLeftRightToLine />
      </ChartControlTitle>
      <div className="flex gap-x-2">
        <input
          type="range"
          min="0"
          max="50"
          id="min-dist"
          name="min-dist"
          value={ctrls.minDist}
          onChange={(e) => {
            ctrls.minDist = e.target.valueAsNumber;
            setCtrls(new ChartOptions(ctrls));
          }}
          className="accent-egg-500"
        />
        <label
          htmlFor="min-dist"
          className={["text-black dark:text-white"].join(" ")}
        >
          {ctrls.minDist}
        </label>
      </div>
    </ChartControlItem>
  );
}

function ChartControlDrawLine({}: ChartControlProps) {
  const ctrls = useContext(ChartOptionsContext);
  const setCtrls = useContext(ChartDispatchContext);

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

function ChartControlDarkMode({}: ChartControlProps) {
  const ctrls = useContext(ChartOptionsContext);
  const setCtrls = useContext(ChartDispatchContext);

  return (
    <ChartControlItem>
      <ButtonGroup<DarkModeOpts>
        options={["system", "light", "dark"]}
        labels={["System", "Light", "Dark"]}
        value={ctrls.darkMode}
        onChange={(v) => {
          ctrls.darkMode = v;
          setCtrls(new ChartOptions(ctrls));
        }}
      />
    </ChartControlItem>
  );
}

export function ChartControls(props: ChartControlProps) {
  const body = (
    <>
      {<ChartControlColumns {...props} />}
      {<ChartControlScale {...props} />}
      {<ChartControlDrawLine {...props} />}
      {<ChartControlMinDist {...props} />}
      {<ChartControlDarkMode {...props} />}
    </>
  );

  const [settingsOpen, setSettingsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    placement: "bottom-end",
    open: settingsOpen,
    onOpenChange: setSettingsOpen,
    middleware: [offset(50)],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  const { isMounted, styles } = useTransitionStyles(context, {
    initial: {
      opacity: 0,
      translate: "0 -10px",
    },
    duration: 100,
  });

  return (
    <div id="chart-settings">
      <HoverTooltip
        content=<span>Chart Controls</span>
        floating={{
          placement: "left",
          middleware: [autoPlacement(), shift(), offset(5)],
        }}
        ref={refs.setReference}
        toplevelProps={getReferenceProps()}
      >
        <button
          className={[
            "text-lg align-center p-2 rounded-md",
            "fixed top-2 right-2 z-[60]",
            "transition-all",
            "disabled:pointer-events-none",
            "opacity-1",
            "disabled:opacity-0",
            "visible",
            "disable:invisible",
            "hover:bg-egg-400 hover:dark:bg-mixed-60",
            "drop-shadow-lg",
            "bg-egg-300 dark:bg-mixed-40",
            "text-black dark:text-white",
            "focus:outline-none",
            "focus:ring-[2px]",
            "ring-egg-700",
            "group",
          ].join(" ")}
        >
          <div className="group-hover:animate-spin-slow">
            <fa6.FaGear size="1.5rem" />
          </div>
        </button>
      </HoverTooltip>

      {isMounted && (
        <FloatingPortal>
          <div
            className={[
              "z-40",
              "space-y-1",
              "bg-egg-300 dark:bg-mixed-40",
              "p-2",
              "border-egg-400 dark:border-mixed-60",
              "border-[1px]",
              "rounded-md",
              "drop-shadow-md",
            ].join(" ")}
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              ...styles,
            }}
            {...getFloatingProps()}
          >
            {body}
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
