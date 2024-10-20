import {
  autoPlacement,
  autoUpdate,
  FloatingPortal,
  shift,
  useFloating,
  UseFloatingOptions,
  useHover,
  useInteractions,
} from "@floating-ui/react";
import {
  Children,
  PropsWithChildren,
  ReactElement,
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import usePersistState from "./usePersistState";

export function timeFn<T>(fn: () => T, label?: string): T {
  const start = performance.now();
  const res = fn();
  if (!!label) console.log(`finished ${label} in ${performance.now() - start}`);
  return res;
}

export function useDeferredRender<T, U = T>(
  drawFn: () => T,
  initVal: U,
  deps: any[],
  label?: string,
): T | U {
  const [state, setState] = useState<T | U>(initVal);
  useEffect(() => {
    startTransition(() => setState(timeFn(drawFn, label)));
  }, deps);
  const deferred = useDeferredValue(state);
  return deferred;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const matchQueryList = window.matchMedia(query);
    setMatches(matchQueryList.matches);
    function handleChange(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }
    matchQueryList.addEventListener("change", handleChange);
    return () => {
      matchQueryList.removeEventListener("change", handleChange);
    };
  }, [query]);
  return matches;
}

// export function useDarkMode(): [
//   boolean,
//   DarkModeOpts,
//   (v: DarkModeOpts) => void,
// ] {
//   const [darkMode, setDarkMode] = usePersistState<DarkModeOpts>(
//     "system",
//     "dark-mode",
//   );
//   const systemDark = useMediaQuery("(prefers-color-scheme: dark)");

//   useEffect(() => {
//     switch (darkMode) {
//       case "system":
//         if (systemDark) {
//           document.documentElement.classList.add("dark");
//         } else {
//           document.documentElement.classList.remove("dark");
//         }
//         return;
//       case "light":
//         document.documentElement.classList.remove("dark");
//         return;
//       case "dark":
//         document.documentElement.classList.add("dark");
//         return;
//     }
//   }, [darkMode, systemDark]);

//   useEffect(() => {
//     console.log("mode changed...");
//   }, [darkMode]);

//   const isDark = darkMode === "system" ? systemDark : darkMode === "dark";

//   return [isDark, darkMode, setDarkMode];
// }

export function HoverTooltip({
  children,
  content,
  enabled = true,
  floating = {
    placement: "top",
    middleware: [autoPlacement(), shift()],
    transform: true,
    whileElementsMounted: autoUpdate,
  },
}: PropsWithChildren<{
  content: ReactElement | string;
  enabled?: boolean;
  floating?: UseFloatingOptions;
}>) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    ...floating,
    open: open,
    onOpenChange: setOpen,
  });
  const hover = useHover(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  const innerContent = Children.only(children);

  return (
    <>
      {enabled && open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={[
              "z-40",
              "bg-white dark:bg-mixed-40",
              "text-black dark:text-white",
              "drop-shadow-md",
              "rounded-md",
              "border-[1px]",
              "border-egg-900 dark:border-mixed-60",
              "px-1",
            ].join(" ")}
          >
            {content}
          </div>
        </FloatingPortal>
      )}
      <div ref={refs.setReference} {...getReferenceProps()}>
        {innerContent}
      </div>
    </>
  );
}
