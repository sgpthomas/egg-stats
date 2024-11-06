import * as fa6 from "react-icons/fa6";
import * as convert from "color-convert";
import {
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import usePersistState from "./usePersistState";
import { arraysEqual, ASet, PivotTable2, setAdd } from "./DataProcessing";
import { useKnownFiles, useTables } from "./Fetch";
import { UseQueryResult } from "@tanstack/react-query";
import { PiWaveSineBold } from "react-icons/pi";
import { IoRemoveOutline } from "react-icons/io5";
import { HoverTooltip } from "./hooks";
import { ServerConfigContext } from "../../ServerContext";
import { queryClient } from "./App";
import { useColors } from "./colors";

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
  enabled,
  fetching = false,
}: {
  table: PivotTable2;
  onRule: (rule: string | null) => void;
  enabled: boolean;
  fetching?: boolean;
}) {
  const ruleList: ASet<[string, string]> = useMemo(() => {
    if (!table) return [];
    const uniqueRules: ASet<[string, string]> = [
      ...table.data
        .select(["when", "rule_name", "rule"])
        .filter((d) => d.when === "before_rewrite")
        .dedupe(),
    ].map(
      (row: any) => [row["rule_name"], row["rule"] || ""] as [string, string],
    );
    return [...uniqueRules];
  }, [table]);

  const [selRule, setSelRul] = usePersistState<number | null>(
    null,
    `file-item-sel-rule-${table.file_id}`,
  );

  const selRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (
      selRule === null ||
      !(0 <= selRule && selRule < ruleList.length) ||
      !ruleList[selRule]
    ) {
      onRule(null);
    } else {
      const [rule_name, _rule] = ruleList[selRule];
      onRule(rule_name);
    }
  }, [selRule]);

  return (
    <div
      className={`space-y-1 transition-opacity ${!enabled && "opacity-50"}`}
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
      {!fetching && (
        <button
          className={[
            "font-bold text-black dark:text-white",
            "bg-egg-400 dark:bg-mixed-60",
            enabled && "hover:bg-egg-500",
            "rounded-md",
            "px-2",
            "select-none",
            "group",
            "flex w-full justify-center",
          ].join(" ")}
          onClick={(e) => {
            if (!enabled) return;
            e.stopPropagation();
            queryClient.invalidateQueries({
              queryKey: ["download", table.file_id],
            });
          }}
        >
          <div className="flex flex-row items-center gap-x-1">
            <fa6.FaArrowRotateRight
              className={enabled ? "group-hover:animate-spin-bobble" : ""}
            />
            Refresh
          </div>
        </button>
      )}
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
          <div className="h-32 overflow-auto grid">
            {[...ruleList.values()].map(([rule_name, rule], idx) => {
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
                      if (!enabled) return;
                      if (selRule === idx) {
                        setSelRul(null);
                      } else {
                        setSelRul(idx);
                      }
                      e.stopPropagation();
                    }}
                  >
                    {rule === "" ? (
                      rule_name
                    ) : (
                      <span>
                        <span className="font-bold">{rule_name}: </span>
                        {rule}
                      </span>
                    )}
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
  onRule,
}: {
  path: string;
  id: number;
  table?: UseQueryResult<PivotTable2>;
  onSelect: (id: number) => void;
  open: boolean;
  selected: Set<number>;
  onRule: (rule: string | null) => void;
}) {
  const [exp, setExp] = usePersistState<boolean>(false, `file-item-${id}`);
  const colors = useColors();

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
                  background: selected.has(id) ? colors(id) : undefined,
                  borderColor: selected.has(id)
                    ? darkenColor(colors(id))
                    : colors(id),
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
                  "bg-egg-200 dark:bg-mixed-40",
                ].join(" ")}
              >
                {selected.has(id) ? (
                  <PiWaveSineBold
                    className="absolute top-[1px] z-10"
                    size="15px"
                    color={darkenColor(colors(id), 2.0)}
                  />
                ) : (
                  <IoRemoveOutline color={colors(id)} />
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
              <div className="mt-1"></div>
              {table?.isFetching && (
                <div className="bg-egg-400 dark:bg-mixed-60 rounded-md flex items-center animate-subtle-pulse justify-center mb-1">
                  <span className="text-center font-bold truncate grow text-black dark:text-white select-none">
                    Downloading
                  </span>
                </div>
              )}
              {table && table.data && (
                <FileItemLoaded
                  table={table.data}
                  onRule={onRule}
                  enabled={selected.has(id)}
                  fetching={table.isFetching}
                />
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
  onRuleChange = (_i, _r) => {},
}: {
  onSelect: (id: number) => void;
  open: boolean;
  selected: Set<number>;
  onRuleChange?: (id: number, rule: string | null) => void;
}) {
  const knownFiles = useKnownFiles();
  const tables = useTables({});

  const serverConfig = useContext(ServerConfigContext);

  const errorClasses = [
    "p-1",
    "bg-egg-300 dark:bg-mixed-20",
    "rounded-md",
    "flex",
    "space-x-1",
    "items-center",
    !open && "ml-[13.5rem] mr-[0.45rem]",
  ].join(" ");

  if (knownFiles.isPending) {
    const text = `Connecting to port ${serverConfig?.port}`;
    return (
      <HoverTooltip content={text} enabled={!open}>
        <div className={`${errorClasses} animate-subtle-pulse`}>
          <span className={[open && "ml-1", !open && "grow"].join(" ")}>
            <fa6.FaCircleNotch className="animate-spin text-black dark:text-white mx-auto" />
          </span>
          {open && (
            <span className="text-sm text-center font-bold truncate grow text-black dark:text-white">
              {text}
            </span>
          )}
        </div>
      </HoverTooltip>
    );
  }

  if (knownFiles.error) {
    const text = "Could not find server";
    return (
      <HoverTooltip content={text} enabled={!open}>
        <div className={`${errorClasses}`}>
          <span className={[open && "ml-1", !open && "grow"].join(" ")}>
            <fa6.FaCircleExclamation className="fill-red-800 dark:fill-red-400 mx-auto" />
          </span>
          {open && (
            <span className="text-sm text-center text-red-800 dark:text-red-400 font-bold grow truncate">
              {text}
            </span>
          )}
        </div>
      </HoverTooltip>
    );
  }

  if (!knownFiles.data) {
    const text = "Invalid data";
    return (
      <HoverTooltip content={text} enabled={!open}>
        <div className={`${errorClasses}`}>
          <span className={[open && "ml-1", !open && "grow"].join(" ")}>
            <fa6.FaCircleExclamation className="text-black dark:text-white mx-auto" />
          </span>
          <span className="text-sm text-center grow">{text}</span>
        </div>
      </HoverTooltip>
    );
  }

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
          onRule={(rule) => onRuleChange(id, rule)}
        />
      ))}
    </ul>
  );
}
