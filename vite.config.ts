import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { handleMockBackend } from "./src/mocks/mockBackend.ts";
import { attachSocketIO } from "./src/mocks/socketServer.ts";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "mock-backend",

      configureServer(server) {
        server.middlewares.use(
          async (req, res, next) => {
            const handled =
              await handleMockBackend(
                req,
                res,
              );

            if (!handled) {
              next();
            }
          },
        );

        return () => {
          if (server.httpServer) {
            attachSocketIO(
              server.httpServer,
            );
          }
        };
      },
    },
  ],
});