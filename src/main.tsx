import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { enableMocking } from "./mocks/setup.ts";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { routes } from "./routes.tsx";
import { Provider } from "react-redux";
import { store } from "./store/store.ts";

const router = createBrowserRouter(routes);

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </StrictMode>,
  );
});
