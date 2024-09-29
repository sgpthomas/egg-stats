import * as d3 from "d3";
import * as fa6 from "react-icons/fa6";
import * as convert from "color-convert";
import { AvailableResponse } from "./App";
import { PropsWithChildren, useMemo } from "react";
import usePersistState from "./usePersistState";
import { PivotTable } from "./DataProcessing";

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
  table?: PivotTable;
  onSelect: (id: number) => void;
  open: boolean;
  selected: Set<number>;
  colors: readonly string[];
  onRule: (rule: string | null) => void;
}) {
  const [exp, setExp] = usePersistState<boolean>(false, `file-item-${id}`);
  const [selRule, setSelRul] = usePersistState<string | null>(
    null,
    `file-item-sel-rule-${id}`,
  );

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
  }, [table?.file_id]);

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
        <div className="flex">
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
            ].join(" ")}
          ></div>

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
            <div className="mt-1 space-y-1">
              {table && (
                <>
                  <div className="font-bold">Value names:</div>
                  <div className="flex flex-row flex-wrap gap-[0.75px]">
                    {table.value_names.map((value, idx) => (
                      <div
                        key={idx}
                        className="border-2 rounded-md border-egg-400 bg-egg-300 px-1 shadow-inner"
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
          </CollapseDiv>
        )}
      </div>
    </li>
  );
}

export function FileList({
  knownFiles,
  tables,
  onSelect,
  open,
  selected,
  colors = d3.schemeAccent,
  onRuleChange = (_i, _r) => {},
}: {
  knownFiles?: AvailableResponse;
  tables?: PivotTable[];
  onSelect: (id: number) => void;
  open: boolean;
  selected: Set<number>;
  colors?: readonly string[];
  onRuleChange?: (id: number, rule: string | null) => void;
}) {
  if (!knownFiles) return "Loading...";

  return (
    <ul className="space-y-1 font-medium p-1 rounded-md bg-egg-300">
      {knownFiles.paths.map(([id, path], idx) => (
        <FileItem
          key={idx}
          id={id}
          path={path}
          table={tables?.find((table) => table.file_id === id)}
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
