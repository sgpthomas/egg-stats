import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Reset from "./reset";
import { App, ServerConfigProvider } from "@repo/chart";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
    },
    {
      path: "/reset/:port/:buster?",
      element: <Reset />,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ServerConfigProvider>
      <RouterProvider router={router} />
    </ServerConfigProvider>
  </StrictMode>,
);
