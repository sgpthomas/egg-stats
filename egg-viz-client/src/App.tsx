import { Chart } from "./Chart";
import { FileList } from "./FileList";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import usePersistState, { createIDBPersister } from "./usePersistState";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Sidebar } from "./Sidebar";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { ChartControls, ChartOptions } from "./ChartControls";
import * as d3 from "d3";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const persister = createIDBPersister();

function useAfter(callback: () => void, delay: number, deps: any[]) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      callback();
    }, delay);
    return () => window.clearTimeout(timeout);
  }, deps);
}

function Home() {
  let [selected, setSelected] = usePersistState<Set<number>>(
    new Set<number>(),
    "selected-files",
    (set) => JSON.stringify([...set]),
    (str) => new Set(JSON.parse(str)),
  );

  const [ctrls, setCtrls] = usePersistState<ChartOptions>(
    new ChartOptions(),
    "chart-options",
  );

  const [open, setOpen] = usePersistState<boolean>(true, "app-sidebar-state");

  const [selectedRules, setSelectedRules] = usePersistState<
    Map<number, string | null>
  >(
    new Map(),
    "app-selected-rules",
    (map) => JSON.stringify([...map.entries()]),
    (str) => new Map(JSON.parse(str)),
  );

  const colors = useMemo(() => d3.schemeSet2, []);

  const [ml, setMl] = useState(open ? 320 : 150);
  useAfter(() => setMl(open ? 320 : 150), 175, [open]);

  return (
    <main>
      <div className="">
        <Sidebar onChange={(o) => setOpen(o)}>
          <div className="grow">
            <FileList
              selected={selected}
              open={open}
              onSelect={(id) => {
                if (selected.has(id)) {
                  selected.delete(id);
                } else {
                  selected.add(id);
                }
                setSelected(new Set(selected));
              }}
              onRuleChange={(id, rule) => {
                selectedRules.set(id, rule);
                setSelectedRules(new Map(selectedRules));
              }}
              colors={colors}
            />
          </div>
          <div>
            <ChartControls ctrls={ctrls} setCtrls={setCtrls} open={open} />
          </div>
        </Sidebar>
        <div className="h-screen w-screen fixed">
          {
            <Chart
              selected={selected}
              marginLeft={ml}
              ctrls={ctrls}
              setCtrls={setCtrls}
              selectedRules={selectedRules}
              colors={colors}
            />
          }
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <>
      {
        // <PersistQueryClientProvider
        //   client={queryClient}
        //   persistOptions={{ persister, buster: "e" }}
        // >
        //   <Home />
        // </PersistQueryClientProvider>
      }
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    </>
  );
}
