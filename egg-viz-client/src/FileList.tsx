import * as d3 from "d3";
import * as fa6 from "react-icons/fa6";
import * as convert from "color-convert";
import { PropsWithChildren, useMemo } from "react";
import usePersistState from "./usePersistState";
import { PivotTable } from "./DataProcessing";
import { useKnownFiles, useTables } from "./Fetch";
import { UseQueryResult } from "@tanstack/react-query";
import { PiWaveSineBold } from "react-icons/pi";

function CollapseDiv(props: PropsWithChildren<{ expanded: boolean }>) {
  return (
    <div
      style={{
        gridTemplateRows: props.expanded ? "1fr" : "0fr",
      }}
      className="transition-[grid-template-rows] duration-100 ease-in-out grid"
    >
      <div className="overflow-hidden">{props.children}</div>
    </div>
  );
}

function darkenColor(color?: string): string | undefined {
  if (!color) return;
  const [hue, sat, light] = convert.hex.hsl(color);
  return `#${convert.hsl.hex([hue, sat, light / 1.3])}`;
}

function FileItemLoaded({
  table,
  onRule,
}: {
  table: PivotTable;
  onRule: (rule: string | null) => void;
}) {
  const [selRule, setSelRul] = usePersistState<string | null>(
    null,
    `file-item-sel-rule-${table.file_id}`,
  );

  // TODO move this into pivot table
  const ruleList: Set<string> = useMemo(() => {
    if (!table) return new Set();
    const uniqueRules: Set<string> = PivotTable.map(
      table,
      (row) => row.rule,
    ).reduce((acc: Set<string>, el: string) => {
      acc.add(el);
      return acc;
    }, new Set());
    return uniqueRules;
  }, [table]);

  return (
    <div className="mt-1 space-y-1">
      {table && (
        <>
          <div className="font-bold">Value names:</div>
          <div className="flex flex-row gap-[2px] overflow-x-auto no-scrollbar">
            {table.value_names.map((value, idx) => (
              <div
                key={idx}
                className="border-2 rounded-full border-egg-500 bg-egg-400 px-1 drop-shadow-sm"
              >
                {value}
              </div>
            ))}
          </div>{" "}
        </>
      )}
      <div className="font-bold">
        {ruleList?.size} {ruleList?.size > 1 ? "rules" : "rule"} used:
      </div>
      <div className="border-2 border-egg-400 bg-egg-300 rounded-md shadow-inner">
        {ruleList && (
          <div className="h-28 overflow-scroll">
            {[...ruleList.values()].map((rule, idx) => {
              return (
                <div key={idx}>
                  <button
                    className={[
                      "w-full text-left pl-2",
                      selRule === rule && "bg-eggshell-400",
                    ].join(" ")}
                    key={idx}
                    onMouseDown={(_) => {
                      if (selRule === rule) {
                        setSelRul(null);
                        onRule(null);
                      } else {
                        setSelRul(rule);
                        onRule(rule);
                      }
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

  return (
    <li key={id}>
      <div
        className={[
          "border-[1px]",
          "border-egg-400",
          "hover:bg-egg-400",
          "p-2",
          "rounded-md",
          "w-auto",
        ].join(" ")}
      >
        <div className="flex relative">
          <input
            type="checkbox"
            checked={selected.has(id)}
            onChange={(_) => {}}
            className="mr-2 sr-only peer"
          />
          <div
            style={{
              background: selected.has(id) ? colors[id] : "#fedbaa",
              borderColor: darkenColor(colors[id]),
            }}
            onMouseDown={(_) => onSelect(id)}
            className={[
              "relative",
              "min-w-[26px]",
              "min-h-[26px]",
              "rounded-full",
              "peer",
              "border-[5px]",
              "shadow-inner-lg",
              "transition-[background-color]",
              "cursor-pointer",
              "before:hover:border-[1px]",
              "before:absolute",
              "before:border-black",
              "before:w-[26px]",
              "before:h-[26px]",
              "before:rounded-full",
              "before:bottom-[-5px]",
              "before:left-[-5px]",
            ].join(" ")}
          >
            <PiWaveSineBold
              className="absolute top-[1px] z-10"
              size="15px"
              color={darkenColor(colors[id])}
            />
          </div>

          {open ? (
            <>
              <span
                className={[
                  "ms-3",
                  "text-sm",
                  "font-medium",
                  "text-gray-900",
                  "truncate",
                  "grow",
                  "place-self-center",
                ].join(" ")}
              >
                {path}
              </span>
              <button onMouseDown={(_) => setExp(!exp)}>
                <div
                  className={["transition-all", exp && "rotate-90"].join(" ")}
                >
                  <fa6.FaCaretRight />
                </div>
              </button>
            </>
          ) : undefined}
        </div>
        {open && (
          <CollapseDiv expanded={exp}>
            {table && table.data ? (
              <FileItemLoaded table={table.data} onRule={onRule} />
            ) : (
              <div className="p-1 mt-2 bg-egg-400 rounded-md flex space-x-1 items-center animate-subtle-pulse justify-center">
                <span className="text-sm text-center font-bold truncate grow">
                  Downloading
                </span>
              </div>
            )}
          </CollapseDiv>
        )}
      </div>
    </li>
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
    <ul className="space-y-1 font-medium p-1 rounded-md bg-egg-300">
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
