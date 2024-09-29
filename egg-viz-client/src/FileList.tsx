import * as d3 from "d3";
import * as fa6 from "react-icons/fa6";
import { AvailableResponse } from "./App";
import { PropsWithChildren, useMemo, useState } from "react";
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

function FileItem({
  path,
  id,
  table,
  onSelect,
  open,
  selected,
  colors,
}: {
  path: string;
  id: number;
  table?: PivotTable;
  onSelect: (id: number) => void;
  open: boolean;
  selected: Set<number>;
  colors: readonly string[];
}) {
  const [exp, setExp] = usePersistState<boolean>(false, `file-item-${id}`);
  const [numRules, setNumRules] = useState<number>(0);

  const ruleList = useMemo(() => {
    if (!table) return [];
    const uniqueRules: Set<string> = PivotTable.map(
      table,
      (row) => row.rule,
    ).reduce((acc: Set<string>, el: string) => {
      acc.add(el);
      return acc;
    }, new Set());
    setNumRules(uniqueRules.size);
    return (
      table && (
        <div className="h-28 overflow-scroll">
          {[...uniqueRules.values()].map((rule, idx) => {
            return <div key={idx}>{rule}</div>;
          })}
        </div>
      )
    );
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
              borderColor: colors[id],
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

              "before:border-[1px]",
              "before:border-egg-500",
              "before:rounded-full",
              "before:min-w-[18px]",
              "before:min-h-[18px]",
              "before:absolute",
              "before:top-[-1px]",
              "before:start-[-1px]",
              "before:content-['']",

              "after:border-[1px]",
              "after:border-egg-500",
              "after:rounded-full",
              "after:min-w-[26px]",
              "after:min-h-[26px]",
              "after:absolute",
              "after:top-[-5px]",
              "after:start-[-5px]",
              "after:content-['']",
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
                  <div className="flex flex-row flex-wrap gap-1">
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
                {numRules} {numRules > 1 ? "rules" : "rule"} used:
              </div>
              <div className="border-2 border-egg-400 bg-egg-300 rounded-md pl-2 shadow-inner">
                {ruleList}
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
}: {
  knownFiles?: AvailableResponse;
  tables?: PivotTable[];
  onSelect: (id: number) => void;
  open: boolean;
  selected: Set<number>;
  colors?: readonly string[];
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
        />
      ))}
    </ul>
  );
}
