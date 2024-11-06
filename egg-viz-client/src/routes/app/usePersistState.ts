import * as idb from "idb-keyval";
import {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { useEffect, useState } from "react";
import * as aq from "arquero";
import { PivotTable2 } from "./DataProcessing";

export default function usePersistState<T>(
  initial_value: T,
  id: string,
  serialize: (x: T) => string = JSON.stringify,
  deserialize: (x: string) => T = JSON.parse,
): [T, (new_state: T) => void] {
  const [state, setState] = useState<T>(initial_value);
  const [loaded, setLoaded] = useState(false);

  // Load state from local storage
  useEffect(() => {
    const local_storage_value_str = localStorage.getItem("state:" + id);
    // If there is a value stored in localStorage, use that
    if (local_storage_value_str) {
      setState(deserialize(local_storage_value_str));
    }

    setLoaded(true);
  }, []);

  const wrapSetState = (x: T) => {
    if (!loaded) return;

    const state_str = serialize(x); // Stringified state
    localStorage.setItem("state:" + id, state_str); // Set stringified state as item in localStorage
    setState(x);
  };

  return [state, wrapSetState];
}

export function createIDBPersister(idbValidKey: IDBValidKey = "reactQuery") {
  return {
    persistClient: async (client: PersistedClient) => {
      await idb.set(idbValidKey, client);
    },
    restoreClient: async () => {
      const client = await idb.get<PersistedClient>(idbValidKey);

      // restore object prototypes for downloads
      for (const query of client?.clientState.queries ?? []) {
        if (query.queryKey.length > 0 && query.queryKey[0] === "download") {
          Object.setPrototypeOf(query.state.data, PivotTable2.prototype);
          Object.setPrototypeOf(
            (query.state.data as PivotTable2).data,
            aq.ColumnTable.prototype,
          );
        }
      }

      return client;
    },
    removeClient: async () => {
      await idb.del(idbValidKey);
    },
  } as Persister;
}
