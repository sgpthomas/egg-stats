import { PropsWithChildren } from "react";
import usePersistState from "./usePersistState";
import { motion } from "framer-motion";

type Props = {
  onChange?: (open: boolean) => void;
};

export function Sidebar(props: PropsWithChildren<Props>) {
  const [open, setOpen] = usePersistState<boolean>(true, "sidebar-open");
  // const width = open ? "16rem" : "68px";
  const width = open ? "0rem" : "-76%";

  return (
    <div>
      <button
        style={{ transform: `translate(${open ? "13.5rem" : 0}, 0)` }}
        className={[
          "bg-egg-300",
          "hover:bg-egg-400",
          "rounded-lg",
          "p-2",
          "fixed",
          "top-3",
          "left-3",
          "z-40",
          "ease-in-out",
          "transition-transform",
          // !open && "drop-shadow-md",
        ].join(" ")}
        onMouseDown={(_e) => {
          if (props.onChange) props.onChange(!open);
          setOpen(!open);
        }}
      >
        <img src="egg.svg" className="w-6 h-6" />
      </button>
      <motion.div
        style={{ translateX: width }}
        className={[
          "z-30",
          "fixed",
          "ease-in-out",
          "transition-transform",
        ].join(" ")}
      >
        <motion.div
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
          <motion.div className="flex flex-row mb-2 justify-center">
            <span className="text-xl font-bold grow content-center truncate ml-2">
              Egg Visualizer
            </span>
          </motion.div>
          {props.children}
        </motion.div>
      </motion.div>
    </div>
  );
}
