import * as d3 from "d3";
import * as fa6 from "react-icons/fa6";
import * as convert from "color-convert";
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import usePersistState from "./usePersistState";
import { PivotTable } from "./DataProcessing";
import { useKnownFiles, useTables } from "./Fetch";
import { UseQueryResult } from "@tanstack/react-query";
import { PiWaveSineBold } from "react-icons/pi";
import { IoRemoveOutline } from "react-icons/io5";
import { HoverTooltip, useDarkMode } from "./hooks";

function CollapseDiv({
  expanded,
  open,
  children,
}: PropsWithChildren<{ open: boolean; expanded: boolean }>) {
  const [animate, setAnimate] = useState(true);

  // lags behind a render cycle
  // creates the effect of only animating if we are open and expanded changed
  useEffect(() => {
    setAnimate(open);
  }, [open]);

  return (
    <div
      style={{
        gridTemplateRows: open && expanded ? "1fr" : "0fr",
      }}
      className={[
        "ease-in-out grid",
        open && animate && "transition-[grid-template-rows]",
      ].join(" ")}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function darkenColor(color?: string, amount = 1.3): string | undefined {
  if (!color) return;
  const [hue, sat, light] = convert.hex.hsl(color);
  return `#${convert.hsl.hex([hue, sat, light / amount])}`;
}

function FileItemLoaded({
  table,
  onRule,
}: {
  table: PivotTable;
  onRule: (rule: string | null) => void;
}) {
  // TODO move this into pivot table
  const ruleList: string[] = useMemo(() => {
    if (!table) return [];
    const uniqueRules: Set<string> = PivotTable.map(
      table,
      (row) => row.rule || row.rule_name,
    ).reduce((acc: Set<string>, el: string) => {
      acc.add(el);
      return acc;
    }, new Set());
    return [...uniqueRules];
  }, [table]);

  const [selRule, setSelRul] = usePersistState<number | null>(
    null,
    `file-item-sel-rule-${table.file_id}`,
  );

  const selRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (selRule === null || !(0 <= selRule && selRule < ruleList.length)) {
      onRule(null);
    } else {
      onRule(ruleList[selRule] as string);
    }
  }, [selRule]);

  return (
    <div
      className="mt-1 space-y-1"
      onKeyDown={(e) => {
        if (!selRule) return;
        if (e.key === "ArrowUp") {
          setSelRul(Math.max(0, selRule - 1));
        } else if (e.key === "ArrowDown") {
          setSelRul(Math.min(ruleList.length - 1, selRule + 1));
        } else {
          return;
        }
        e.stopPropagation();
        e.preventDefault();
        selRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }}
    >
      {table && (
        <>
          <div className="font-bold dark:text-white">Value names:</div>
          <div className="flex flex-row gap-[2px] overflow-x-auto no-scrollbar">
            {table.value_names.map((value, idx) => (
              <div
                key={idx}
                className={[
                  "border-2",
                  "rounded-full",
                  "border-egg-500",
                  "bg-egg-400",
                  "dark:bg-mixed-60",
                  "dark:border-mixed-80",
                  "dark:text-white",
                  "px-1",
                  "drop-shadow-sm",
                ].join(" ")}
              >
                {value}
              </div>
            ))}
          </div>{" "}
        </>
      )}
      <div className="font-bold dark:text-white">
        {ruleList?.length} {ruleList?.length > 1 ? "rules" : "rule"} used:
      </div>
      <div
        className={[
          "border-2",
          "border-egg-400 dark:border-mixed-60",
          "bg-egg-300 dark:bg-mixed-40",
          "rounded-md",
          "shadow-inner",
        ].join(" ")}
      >
        {ruleList && (
          <div className="h-32 overflow-auto grid grid-rows-1">
            {[...ruleList.values()].map((rule, idx) => {
              return (
                <div key={idx}>
                  <button
                    ref={selRule === idx ? selRef : undefined}
                    tabIndex={1}
                    className={[
                      "h-full w-full",
                      "text-nowrap",
                      "text-left pl-2",
                      selRule === idx && "bg-egg-500 dark:bg-mixed-80",
                      selRule === idx && "text-white dark:text-black",
                      "text-black dark:text-white",
                      "focus:outline-none",
                      "foucs:outline-1",
                      "focus:-outline-offset-2",
                      "focus:outline-egg-700",
                      "focus:rounded-md",
                      "font-mono text-xs",
                    ].join(" ")}
                    key={idx}
                    onClick={(e) => {
                      if (selRule === idx) {
                        setSelRul(null);
                      } else {
                        setSelRul(idx);
                      }
                      e.stopPropagation();
                    }}
                  >
                    {rule}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FileItem({
  path,
  id,
  table,
  onSelect,
  open,
  selected,
  colors,
  onRule,
}: {
  path: string;
  id: number;
  table?: UseQueryResult<PivotTable>;
  onSelect: (id: number) => void;
  open: boolean;
  selected: Set<number>;
  colors: readonly string[];
  onRule: (rule: string | null) => void;
}) {
  const [exp, setExp] = usePersistState<boolean>(false, `file-item-${id}`);

  const dark = useDarkMode();

  return (
    <>
      <li key={id}>
        <HoverTooltip content=<span>{path}</span> enabled={!open}>
          <div
            tabIndex={1}
            className={[
              "border-[1px]",
              "border-egg-400 dark:border-mixed-40",
              "hover:bg-egg-400 dark:hover:bg-mixed-40",
              "p-2",
              "rounded-md",
              "w-64",
              "cursor-pointer",
              "focus:outline-none",
            ].join(" ")}
            onClick={(e) => {
              e.stopPropagation();
              if (open) {
                setExp(!exp);
              } else {
                onSelect(id);
              }
            }}
          >
            <div
              className="flex relative transition-transform"
              style={{ transform: `translate(${open ? 0 : "13.3rem"}, 0)` }}
            >
              <input
                type="checkbox"
                checked={selected.has(id)}
                onChange={(_) => {}}
                className="mr-2 sr-only peer"
              />
              <div
                style={{
                  background: selected.has(id)
                    ? colors[id]
                    : dark
                      ? "#4c4c4c"
                      : "#fedbaa",
                  borderColor: selected.has(id)
                    ? darkenColor(colors[id])
                    : colors[id],
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(id);
                }}
                className={[
                  "relative",
                  "min-w-[26px]",
                  "min-h-[26px]",
                  "rounded-full",
                  "peer",
                  "border-[5px]",
                  "shadow-inner",
                  "cursor-pointer",
                  "before:hover:border-[0.5px]",
                  "before:absolute",
                  "before:border-black",
                  "before:w-[26px]",
                  "before:h-[26px]",
                  "before:rounded-full",
                  "before:bottom-[-5px]",
                  "before:left-[-5px]",
                  "transition-all",
                  "before:transition-all",
                  "peer-focus:ring-[2px]",
                  "peer-focus:ring-egg-700",
                ].join(" ")}
              >
                {selected.has(id) ? (
                  <PiWaveSineBold
                    className="absolute top-[1px] z-10"
                    size="15px"
                    color={darkenColor(colors[id], 2.0)}
                  />
                ) : (
                  <IoRemoveOutline color={colors[id]} />
                )}
              </div>

              {open ? (
                <>
                  <span
                    className={[
                      "ms-3",
                      "text-sm",
                      "font-medium",
                      "text-black",
                      "dark:text-white",
                      "truncate",
                      "grow",
                      "place-self-center",
                      "select-none",
                      "transition-opacity",
                      !selected.has(id) && "opacity-50",
                    ].join(" ")}
                  >
                    {path}
                  </span>
                  <div
                    className={[
                      "transition-all",
                      exp && "rotate-90",
                      "place-self-center",
                      "dark:text-white",
                    ].join(" ")}
                  >
                    <fa6.FaCaretRight />
                  </div>
                </>
              ) : undefined}
            </div>
            <CollapseDiv expanded={exp} open={open}>
              {table && table.data ? (
                <FileItemLoaded table={table.data} onRule={onRule} />
              ) : (
                <div className="p-1 mt-2 bg-egg-400 dark:bg-mixed-40 rounded-md flex space-x-1 items-center animate-subtle-pulse justify-center">
                  <span className="text-sm text-center font-bold truncate grow">
                    Downloading
                  </span>
                </div>
              )}
            </CollapseDiv>
          </div>
        </HoverTooltip>
      </li>
    </>
  );
}

export function FileList({
  onSelect,
  open,
  selected,
  colors = d3.schemeAccent,
  onRuleChange = (_i, _r) => {},
}: {
  onSelect: (id: number) => void;
  open: boolean;
  selected: Set<number>;
  colors?: readonly string[];
  onRuleChange?: (id: number, rule: string | null) => void;
}) {
  const knownFiles = useKnownFiles();
  const tables = useTables({});

  if (knownFiles.isPending)
    return (
      <div className="p-1 bg-egg-300 rounded-md flex space-x-1 items-center animate-subtle-pulse justify-center">
        <span className={[open && "ml-1"].join("")}>
          <fa6.FaCircleNotch className="animate-spin" />
        </span>
        {open && (
          <span className="text-sm text-center font-bold truncate grow">
            Connecting to port 8080
          </span>
        )}
      </div>
    );

  if (knownFiles.error)
    return (
      <div className="p-1 bg-egg-300 rounded-md flex space-x-1 items-center justify-center">
        <span className={[open && "ml-1"].join("")}>
          <fa6.FaCircleExclamation className="fill-red-800" />
        </span>
        {open && (
          <span className="text-sm text-center text-red-800 font-bold grow truncate">
            Could not find server
          </span>
        )}
      </div>
    );

  if (!knownFiles.data)
    return (
      <div className="p-1 bg-egg-300 rounded-md flex space-x-1 items-center">
        <span>
          <fa6.FaCircleExclamation className="ml-1" />
        </span>
        <span className="text-sm text-center grow">Invalid data</span>
      </div>
    );

  return (
    <ul className="space-y-1 font-medium p-1 rounded-md bg-egg-300 dark:bg-mixed-20">
      {knownFiles.data.paths.map(([id, path], idx) => (
        <FileItem
          key={idx}
          id={id}
          path={path}
          table={tables.find(
            (query) => query.data && query.data.file_id === id,
          )}
          onSelect={onSelect}
          open={open}
          selected={selected}
          colors={colors}
          onRule={(rule) => onRuleChange(id, rule)}
        />
      ))}
    </ul>
  );
}