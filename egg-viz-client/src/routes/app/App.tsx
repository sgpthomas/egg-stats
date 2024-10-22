import { Chart } from "./Chart";
import { FileList } from "./FileList";
import { QueryClient } from "@tanstack/react-query";
import usePersistState, { createIDBPersister } from "./usePersistState";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Sidebar } from "./Sidebar";
import { useContext } from "react";
import { ChartControls } from "./ChartControls";
import { ChartOptionsProvider } from "./ChartOptions";
import { ServerConfigContext } from "../../ServerContext";

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

  const [open, setOpen] = usePersistState<boolean>(true, "app-sidebar-state");

  const [selectedRules, setSelectedRules] = usePersistState<
    Map<number, string | null>
  >(
    new Map(),
    "app-selected-rules",
    (map) => JSON.stringify([...map.entries()]),
    (str) => new Map(JSON.parse(str)),
  );

  const renderedChart = (
    <Chart
      selected={selected}
      marginLeft={open ? 340 : 130}
      selectedRules={selectedRules}
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
            />
          </div>
        </Sidebar>
        <ChartControls open={open} />
        <div id="chart" className="h-screen w-screen fixed">
          {renderedChart}
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const serverConfig = useContext(ServerConfigContext);
  return (
    <ChartOptionsProvider>
      {
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister, buster: serverConfig?.buster }}
        >
          <Home />
        </PersistQueryClientProvider>
      }
    </ChartOptionsProvider>
  );
}
