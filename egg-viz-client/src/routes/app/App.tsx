import { Chart } from "./Chart";
import { FileList } from "./FileList";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import usePersistState, { createIDBPersister } from "./usePersistState";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Sidebar } from "./Sidebar";
import { useMemo } from "react";
import { ChartControls } from "./ChartControls";
import * as d3 from "d3";
import { ChartOptionsProvider } from "./ChartOptions";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

const persister = createIDBPersister();

function Home() {
  let [selected, setSelected] = usePersistState<Set<number>>(
    new Set<number>(),
    "selected-files",
    (set) => JSON.stringify([...set]),
    (str) => new Set(JSON.parse(str)),
  );

  // const [ctrls, setCtrls] = usePersistState<ChartOptions>(
  //   new ChartOptions(),
  //   "chart-options",
  // );

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

  const renderedChart = (
    <Chart
      selected={selected}
      marginLeft={open ? 340 : 130}
      // ctrls={ctrls}
      // setCtrls={setCtrls}
      selectedRules={selectedRules}
      colors={colors}
    />
  );

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
            <ChartControls open={open} />
          </div>
        </Sidebar>
        <div className="h-screen w-screen fixed">{renderedChart}</div>
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
      <ChartOptionsProvider>
        <QueryClientProvider client={queryClient}>
          <Home />
        </QueryClientProvider>
      </ChartOptionsProvider>
    </>
  );
}
