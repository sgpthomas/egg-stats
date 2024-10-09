import { createContext, Dispatch, PropsWithChildren, useReducer } from "react";

interface ServerConfig {
  port?: string;
}

export const ServerConfigContext = createContext<ServerConfig | undefined>(
  undefined,
);
export const ServerConfigDispatchContext = createContext<
  Dispatch<string | undefined> | undefined
>(undefined);

export function ServerConfigProvider({ children }: PropsWithChildren<{}>) {
  const savedContext = localStorage.getItem("server-context");
  let config = initialConfig;
  if (savedContext) {
    config = JSON.parse(savedContext);
  }

  const [tasks, dispatch] = useReducer(portReducer, config);

  return (
    <ServerConfigContext.Provider value={tasks}>
      <ServerConfigDispatchContext.Provider value={dispatch}>
        {children}
      </ServerConfigDispatchContext.Provider>
    </ServerConfigContext.Provider>
  );
}

function portReducer(config: ServerConfig, port?: string): ServerConfig {
  const newConfig = {
    ...config,
    port: port,
  };
  localStorage.setItem("server-context", JSON.stringify(newConfig));
  return newConfig;
}

const initialConfig: ServerConfig = {};
