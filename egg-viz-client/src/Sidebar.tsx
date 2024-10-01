import { PropsWithChildren } from "react";
import usePersistState from "./usePersistState";

type Props = {
  onChange?: (open: boolean) => void;
};

export function Sidebar(props: PropsWithChildren<Props>) {
  const [open, setOpen] = usePersistState<boolean>(true, "sidebar-open");
  const width = open ? "16rem" : "68px";

  return (
    <div
      style={{ width: width }}
      className={["z-30", "transition-[width]", "will-change", "fixed"].join(
        " ",
      )}
    >
      <div
        className={[
          "h-screen",
          "max-h-screen",
          "px-2",
          "py-4",
          "overflow-x-hidden",
          "overflow-y-auto",
          "bg-egg-200",
          "drop-shadow-md",
          "flex",
          "flex-col",
          "space-y-2",
        ].join(" ")}
      >
        <div className="flex flex-row mb-2 justify-center">
          {open && (
            <span className="text-xl font-bold grow content-center truncate ml-2">
              Egg Visualizer
            </span>
          )}

          <button
            className={[
              "bg-egg-300",
              "hover:bg-egg-400",
              "rounded-lg",
              "p-2",
              "justify-self-center",
            ].join(" ")}
            onMouseDown={(_e) => {
              if (props.onChange) props.onChange(!open);
              setOpen(!open);
            }}
          >
            <img src="egg.svg" className="w-6 h-6" />
          </button>
        </div>
        {props.children}
      </div>
    </div>
  );
}
