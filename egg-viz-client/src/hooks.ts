import { startTransition, useDeferredValue, useEffect, useState } from "react";

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
  }, deps);
  const deferred = useDeferredValue(state);
  return deferred;
}
