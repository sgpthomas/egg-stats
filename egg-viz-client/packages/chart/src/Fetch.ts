import {
  useQueries,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { PivotTable2 } from "./DataProcessing";
import { useCallback, useContext } from "react";
import { ServerConfigContext } from "./ServerContext";
import * as aq from "arquero";

export interface AvailableResponse {
  paths: [number, string][];
}

async function fetchAvailable(port: string): Promise<AvailableResponse> {
  return fetch(`http://localhost:${port}/available`)
    .then(throwResponseError)
    .then((res) => res.json())
    .then((data: AvailableResponse) => ({
      paths: data.paths.sort(byKey((x) => x[0])),
    }));
}

export function useKnownFiles<T = AvailableResponse>(
  select?: (x: AvailableResponse) => T,
): UseQueryResult<T> {
  const serverConfig = useContext(ServerConfigContext);
  return useQuery({
    queryKey: ["knownFiles"],
    queryFn: async () => await fetchAvailable(serverConfig?.port ?? "8080"),
    retry: 2,
    staleTime: 1,
    refetchInterval: 30 * 1000, // 30 secs
    select,
  });
}

export interface DownloadResponse {
  path: string;
  headers: string[];
  rows: string[][];
}

async function fetchFileId(
  port: string,
  file_id: number,
): Promise<PivotTable2> {
  const headers = await fetch(
    `http://localhost:${port}/download_headers/${file_id}`,
  ).then((res) => res.json());

  return new PivotTable2(
    file_id,
    await aq.loadCSV(`http://localhost:${port}/download/${file_id}`, {
      header: false,
      names: headers.headers,
    }),
  );
}

export function useTables<
  T = PivotTable2,
  U = UseQueryResult<unknown extends T ? PivotTable2 : T>[],
>({
  select,
  combine,
}: {
  select?: (table: PivotTable2) => T;
  combine?: (
    results: UseQueryResult<unknown extends T ? PivotTable2 : T>[],
  ) => U;
}): U {
  const { data: fileIds } = useKnownFiles<number[]>(
    useCallback(
      (x: AvailableResponse) => [...x.paths.map(([id, _]) => id)],
      [],
    ),
  );
  const serverConfig = useContext(ServerConfigContext);
  return useQueries({
    queries: fileIds
      ? fileIds.map((id) => {
          return {
            queryKey: ["download", id],
            queryFn: async () =>
              await fetchFileId(serverConfig?.port ?? "8080", id),
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
