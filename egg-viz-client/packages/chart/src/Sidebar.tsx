import { PropsWithChildren } from "react";
import usePersistState from "./usePersistState";

export function Sidebar({
  children,
  onChange,
}: PropsWithChildren<{ onChange?: (open: boolean) => void }>) {
  const [open, setOpen] = usePersistState<boolean>(true, "sidebar-open");
  const width = open ? "0rem" : "-76%";

  return (
    <div>
      <button
        style={{ transform: `translate(${open ? "13.5rem" : 0}, 0)` }}
        className={[
          "bg-egg-300 dark:bg-mixed-20",
          "hover:bg-egg-400 hover:dark:bg-mixed-60",
          "rounded-lg",
          "p-2",
          "fixed",
          "top-3",
          "left-3",
          "z-20",
          "ease-in-out",
          "transition-transform",
          "focus:outline-none",
          "focus:ring-[2px]",
          "ring-egg-700",
          "drop-shadow-md",
        ].join(" ")}
        onClick={(_e) => {
          if (onChange) onChange(!open);
          setOpen(!open);
        }}
      >
        <img alt="egg logo" src="egg.svg" className="w-6 h-6" />
      </button>
      <div
        style={{ transform: `translate(${width}, 0)` }}
        className={[
          "min-w-[17.5rem]",
          "z-10",
          "fixed",
          "ease-in-out",
          "transition-transform",
        ].join(" ")}
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
            "dark:bg-mixed-0",
            "drop-shadow-md",
            "flex",
            "flex-col",
            "space-y-2",
          ].join(" ")}
        >
          <div className="flex flex-row mb-2 justify-center">
            <h1
              className={[
                "text-xl",
                "font-extrabold",
                "grow",
                "content-center",
                "truncate",
                "ml-2",
                "dark:text-white",
              ].join(" ")}
            >
              Egg Visualizer
            </h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
