import { useQueries, useQuery, UseQueryResult } from "@tanstack/react-query";
import { PivotTable } from "./DataProcessing";
import { useCallback } from "react";

export interface AvailableResponse {
  paths: [number, string][];
}

async function fetchAvailable(): Promise<AvailableResponse> {
  return fetch("http://localhost:8080/available")
    .then(throwResponseError)
    .then((res) => res.json())
    .then((data: AvailableResponse) => ({
      paths: data.paths.sort(byKey((x) => x[0])),
    }));
}

export function useKnownFiles<T = AvailableResponse>(
  select?: (x: AvailableResponse) => T,
): UseQueryResult<T> {
  return useQuery({
    queryKey: ["knownFiles"],
    queryFn: fetchAvailable,
    retry: 3,
    select,
  });
}

interface Row {
  id: string;
  iteration: number;
  rule: string;
  when: string;
  name: string;
  value: string;
}

export interface DownloadResponse {
  path: string;
  rows: Row[];
}

async function fetchFileId(file_id: number): Promise<PivotTable> {
  console.log(`fetching ${file_id}`);
  return fetch(`http://localhost:8080/download/${file_id}`)
    .then(throwResponseError)
    .then((res) => res.json())
    .then((data: DownloadResponse) => {
      const table = new PivotTable(file_id, [
        "id",
        "iteration",
        "rule",
        "when",
      ]);
      PivotTable.addRows(table, data.rows);
      return table;
    });
}

export function useTables<
  T = PivotTable,
  U = UseQueryResult<unknown extends T ? PivotTable : T>[],
>({
  select,
  combine,
}: {
  select?: (table: PivotTable) => T;
  combine?: (
    results: UseQueryResult<unknown extends T ? PivotTable : T>[],
  ) => U;
}): U {
  const { data: fileIds } = useKnownFiles<number[]>(
    useCallback(
      (x: AvailableResponse) => [...x.paths.map(([id, _]) => id)],
      [],
    ),
  );
  return useQueries({
    queries: fileIds
      ? fileIds.map((id) => {
          return {
            queryKey: ["download", id],
            queryFn: () => fetchFileId(id),
            staleTime: 1000 * 60 * 5,
            select,
          };
        })
      : [],
    combine,
  });
}

export function throwResponseError(res: Response) {
  if (!res.ok) {
    throw new Error("Network response");
  }

  return res;
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
