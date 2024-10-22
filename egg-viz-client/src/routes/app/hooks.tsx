import {
  autoPlacement,
  autoUpdate,
  FloatingPortal,
  offset,
  shift,
  useFloating,
  UseFloatingOptions,
  useHover,
  useInteractions,
} from "@floating-ui/react";
import {
  Children,
  cloneElement,
  forwardRef,
  PropsWithChildren,
  ReactElement,
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
} from "react";

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

export const HoverTooltip = forwardRef(function HoverTooltip(
  {
    children,
    content,
    enabled = true,
    toplevelProps = {},
    floating = {
      placement: "top",
      middleware: [autoPlacement(), shift(), offset(5)],
      transform: true,
      whileElementsMounted: autoUpdate,
    },
  }: PropsWithChildren<{
    content: ReactElement | string;
    enabled?: boolean;
    toplevelProps?: any;
    floating?: UseFloatingOptions;
  }>,
  forwardRef,
) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    ...floating,
    open: open,
    onOpenChange: setOpen,
  });
  const hover = useHover(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  // make sure that we are passed only a single child
  const onlyChild = Children.only(children);

  return (
    <div ref={forwardRef} {...toplevelProps}>
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
      {cloneElement(onlyChild as any, {
        ref: refs.setReference,
        ...getReferenceProps(),
      })}
    </div>
  );
});
