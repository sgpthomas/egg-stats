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
              background: selected.has(id) ? colors[id] : undefined,
            }}
            onMouseDown={(_) => onSelect(id)}
            className={[
              "relative",
              "w-9",
              "min-w-9",
              "h-5",
              "bg-egg-200",
              "peer-focus:outline-none",
              "peer-focus:ring-2",
              "peer-focus:ring-eggshell-300",
              "rounded-full",
              "peer",
              "peer-checked:after:translate-x-full",
              "peer-checked:after:border-white",
              "peer-checked:bg-eggshell-active",
              "rtl:peer-checked:after:-translate-x-full",
              "after:content-['']",
              "after:absolute",
              "after:top-[2px]",
              "after:start-[2px]",
              "after:bg-white",
              "after:border-egg-300",
              "after:border",
              "after:rounded-full",
              "after:h-4",
              "after:w-4",
              "after:transition-all",
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
