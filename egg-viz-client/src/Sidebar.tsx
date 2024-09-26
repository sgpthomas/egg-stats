import { PropsWithChildren } from "react";

type Props = {};

export function Sidebar(props: PropsWithChildren<Props>) {
  return (
    <div
      className={[
        "z-30",
        "w-64",
        "h-screen",
        // "transition-transform",
        // "-translate-x-full",
        // "sm:translate-x-0",
      ].join(" ")}
    >
      <div
        className={[
          "h-full",
          "px-3",
          "py-4",
          "overflow-y-auto",
          "bg-gray-50",
          "dark:bg-gray-800",
          "drop-shadow-md",
        ].join(" ")}
      >
        {props.children}
      </div>
    </div>
  );
}
