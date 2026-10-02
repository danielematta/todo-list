import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { enableMocking } from "./mocks/setup.ts";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { routes } from "./routes.tsx";

const router = createBrowserRouter(routes);

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
});
