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
    startTransition(() => {
      setState(timeFn(drawFn, label));
      return;
    });
  }, [...deps, drawFn, label]);
  const deferred = useDeferredValue(state);
  return deferred;
}

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
  content: ReactElement;
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
            className="z-40 bg-white drop-shadow-md rounded-md border-[1px] border-egg-900 px-1"
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
