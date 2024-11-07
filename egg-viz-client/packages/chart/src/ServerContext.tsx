import { createContext, Dispatch, PropsWithChildren, useReducer } from "react";

interface ServerConfig {
  port?: string;
  buster: string;
}

export const ServerConfigContext = createContext<ServerConfig | undefined>(
  undefined,
);
export const ServerConfigDispatchContext = createContext<
  Dispatch<UpdateConfigAction> | undefined
>(undefined);

export function ServerConfigProvider({ children }: PropsWithChildren<{}>) {
  const savedContext = localStorage.getItem("server-context");
  let loadedConfig = initialConfig;
  if (savedContext) {
    loadedConfig = JSON.parse(savedContext);
  }

  const [config, dispatch] = useReducer(configReducer, loadedConfig);

  return (
    <ServerConfigContext.Provider value={config}>
      <ServerConfigDispatchContext.Provider value={dispatch}>
        {children}
      </ServerConfigDispatchContext.Provider>
    </ServerConfigContext.Provider>
  );
}

export interface UpdateConfigAction {
  port?: string;
  buster?: string;
}

function configReducer(
  config: ServerConfig,
  action?: UpdateConfigAction,
): ServerConfig {
  const newConfig = {
    port: action?.port,
    buster: action?.buster ?? window.crypto.randomUUID(),
  };
  localStorage.setItem("server-context", JSON.stringify(newConfig));
  return newConfig;
}

const initialConfig: ServerConfig = {
  buster: "",
};
