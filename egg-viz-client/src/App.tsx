import { Chart } from "./Chart";
import {
  QueryClient,
  QueryClientProvider,
  useQueries,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import { PivotTable } from "./DataProcessing";
import usePersistState, { createIDBPersister } from "./usePersistState";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});
const persister = createIDBPersister();

interface Row {
  id: string;
  iteration: number;
  rule: string;
  when: string;
  name: string;
  value: string;
}

// interface RowResponse {
//   Located?: {
//     path: string;
//     row: Row;
//     order: number;
//   };
//   Restart?: {
//     path: string;
//   };
// }

// function beforeCost(yName: string, xName?: string, data?: Row[]): Point[] {
//   if (!xName) {
//     xName = "index";
//   }

//   const sortByOrder = (a: { order: number }, b: { order: number }) => {
//     if (a.order < b.order) {
//       return -1;
//     } else if (b.order < a.order) {
//       return 1;
//     } else {
//       return 0;
//     }
//   };

//   if (data) {
//     if (xName === "index") {
//       return data
//         .filter((row) => row.when === "after_rewrite" && row.name === yName)
//         .sort(sortByOrder)
//         .map((row, idx) => ({ x: idx, y: Number(row.value) }));
//     } else {
//       const dx = data
//         .filter((row) => row.when === "after_rewrite" && row.name === xName)
//         .map((row) => ({ order: row.order, val: Number(row.value) }))
//         .sort(sortByOrder)
//         .map((o) => o.val);
//       const dy = data
//         .filter((row) => row.when === "after_rewrite" && row.name === yName)
//         .map((row) => ({ order: row.order, val: Number(row.value) }))
//         .sort(sortByOrder)
//         .map((o) => o.val);

//       return dx.map((x, idx) => ({ x, y: dy[idx] ?? 0 }));
//     }
//   } else {
//     return [];
//   }
// }

interface AvailableResponse {
  paths: [number, string][];
}

interface DownloadResponse {
  path: string;
  rows: Row[];
}

function byKey<T, U>(keyFn: (x: T) => U): (a: T, b: T) => 1 | 0 | -1 {
  return (a, b) => {
    if (keyFn(a) < keyFn(b)) {
      return -1;
    } else if (keyFn(b) < keyFn(a)) {
      return 1;
    } else {
      return 0;
    }
  };
}

function FileList({
  data,
  onSelect,
  selected,
}: {
  data?: AvailableResponse;
  onSelect: (id: number) => void;
  selected: Set<number>;
}) {
  if (!data) return "Invalid data!";

  return (
    <ul>
      {data.paths.map(([id, path]) => (
        <li key={id}>
          <label>
            <input
              type="checkbox"
              onChange={(_) => onSelect(id)}
              checked={selected.has(id)}
            />
            {path}
          </label>
        </li>
      ))}
    </ul>
  );
}

function FileContents({
  downloads,
}: {
  downloads: UseQueryResult<DownloadResponse, Error>[];
}) {
  return (
    <div>
      {downloads.map((value, idx) => {
        if (value.isPending) return "Downloading...";
        if (value.error) return "Error: " + value.error;
        if (value.data)
          return (
            <div key={`filecontents-${idx}`}>
              <h2>{value.data.path}</h2>
              <ul>
                <li>{JSON.stringify(value.data.rows[0])}</li>
                <li>{JSON.stringify(value.data.rows[1])}</li>
                <li>{JSON.stringify(value.data.rows[2])}</li>
              </ul>
            </div>
          );
      })}
    </div>
  );
}

function throwResponseError(res: Response) {
  if (!res.ok) {
    throw new Error("Network response");
  }

  return res;
}

function Home() {
  let [selected, setSelected] = usePersistState<Set<number>>(
    new Set<number>(),
    "selected-files",
    (set) => JSON.stringify([...set]),
    (str) => new Set(JSON.parse(str)),
  );

  async function fetchAvailable(): Promise<AvailableResponse> {
    return fetch("http://localhost:8080/available")
      .then(throwResponseError)
      .then((res) => res.json())
      .then((data: AvailableResponse) => ({
        paths: data.paths.sort(byKey((x) => x[0])),
      }));
  }

  const knownFiles = useQuery({
    queryKey: ["knownFiles"],
    queryFn: fetchAvailable,
  }).data;

  async function fetchFileId(file_id: number): Promise<PivotTable> {
    console.log(`fetching ${file_id}`);
    return fetch(`http://localhost:8080/download/${file_id}`)
      .then(throwResponseError)
      .then((res) => res.json())
      .then((data: DownloadResponse) => {
        const table = new PivotTable(["id", "iteration", "rule", "when"]);
        PivotTable.addRows(table, data.rows);
        return table;
      });
  }

  const tables: UseQueryResult<PivotTable>[] = useQueries({
    queries: [...selected.values()].map((id) => {
      return {
        queryKey: ["download", id],
        queryFn: () => fetchFileId(id),
        staleTime: 1000 * 60 * 5,
      };
    }),
  });

  return (
    <main>
      <FileList
        data={knownFiles}
        selected={selected}
        onSelect={(id) => {
          if (selected.has(id)) {
            selected.delete(id);
          } else {
            selected.add(id);
          }
          setSelected(new Set(selected));
        }}
      />
      {
        // <FileContents downloads={downloadQueries} />
        // <div>
        //   {tables?.map((table) => {
        //     if (!table.data) return "loading";
        //     return table.data.map((r, idx) =>
        //       idx < 10 ? (
        //         <div key={idx}>{[...Object.values(r)].join(", ")}</div>
        //       ) : undefined,
        //     );
        //   })}
        // </div>
      }
      <Chart
        tables={tables
          .filter((table) => !!table.data)
          .map((table) => table.data)}
      />
    </main>
  );
}

export default function App() {
  return (
    <>
      {
        // <QueryClientProvider client={queryClient}>
        //   <Home />
        // </QueryClientProvider>
      }
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, buster: "e" }}
      >
        <Home />
      </PersistQueryClientProvider>
    </>
  );
}
