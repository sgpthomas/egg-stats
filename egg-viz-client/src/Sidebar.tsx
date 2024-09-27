import { PropsWithChildren } from "react";
import usePersistState from "./usePersistState";

type Props = {
  onChange?: (open: boolean) => void;
};

export function Sidebar(props: PropsWithChildren<Props>) {
  const [open, setOpen] = usePersistState<boolean>(true, "sidebar-open");
  const width = open ? "16rem" : "5rem";

  return (
    <div
      style={{ width: width }}
      className={[
        "z-30",
        "transition-all",
        "translate-x-0",
        "will-change",
      ].join(" ")}
    >
      <div
        className={[
          "h-screen",
          "max-h-screen",
          "px-3",
          "py-4",
          "overflow-y-auto",
          "bg-egg-200",
          "drop-shadow-md",
          "sm:px-3",
          "sm:py-4",
          "flex",
          "flex-col",
        ].join(" ")}
      >
        <button
          className={[
            "bg-egg-300",
            "hover:bg-egg-400",
            "mb-2",
            "rounded-lg",
            "p-2",
            "self-end",
          ].join(" ")}
          onMouseDown={(_e) => {
            if (props.onChange) props.onChange(!open);
            setOpen(!open);
          }}
        >
          <svg
            className="w-6 h-6"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              clipRule="evenodd"
              fillRule="evenodd"
              d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
            ></path>
          </svg>
        </button>
        {props.children}
      </div>
    </div>
  );
}
