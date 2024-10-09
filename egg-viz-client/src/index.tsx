import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./routes/app/App";
import Reset from "./routes/reset";
import { ServerConfigProvider } from "./ServerContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/reset/:port",
    element: <Reset />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ServerConfigProvider>
      <RouterProvider router={router} />
    </ServerConfigProvider>
  </React.StrictMode>,
);
