import * as d3 from "d3";
import * as fa6 from "react-icons/fa6";
import { AvailableResponse } from "./App";
import { PropsWithChildren, useState } from "react";
import usePersistState from "./usePersistState";

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
  data,
  onSelect,
  open,
  selected,
  colors,
}: {
  data: [number, string];
  onSelect: (id: number) => void;
  open: boolean;
  selected: Set<number>;
  colors: readonly string[];
}) {
  const [id, path] = data;
  const [exp, setExp] = usePersistState<boolean>(false, `file-item-${id}`);

  return (
    <li key={id}>
      <div
        className={[
          // "bg-egg-200",
          "border-[1px]",
          "border-egg-400",
          "hover:bg-egg-400",
          "p-2",
          "rounded-md",
          "w-full",
        ].join(" ")}
      >
        <div className="flex align-center">
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
              <span className="ms-3 text-sm font-medium text-gray-900 truncate grow">
                {path}
              </span>
              <button onMouseDown={(_) => setExp(!exp)}>
                {exp ? <fa6.FaCaretDown /> : <fa6.FaCaretRight />}
              </button>
            </>
          ) : undefined}
        </div>
        {open ? (
          <CollapseDiv expanded={exp}>
            <div className="mt-1">File Id: {id}</div>
          </CollapseDiv>
        ) : undefined}
      </div>
    </li>
  );
}

export function FileList({
  data,
  onSelect,
  open,
  selected,
  colors = d3.schemeAccent,
}: {
  data?: AvailableResponse;
  onSelect: (id: number) => void;
  open: boolean;
  selected: Set<number>;
  colors?: readonly string[];
}) {
  if (!data) return "Invalid data!";

  return (
    <ul className="space-y-1 font-medium p-1 rounded-md bg-egg-300">
      {data.paths.map(([id, path], idx) => (
        <FileItem
          key={idx}
          data={[id, path]}
          onSelect={onSelect}
          open={open}
          selected={selected}
          colors={colors}
        />
      ))}
    </ul>
  );
}
