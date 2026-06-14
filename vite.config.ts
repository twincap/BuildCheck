import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { handleDanawaSearchRequest } from "./server/danawaSearch.mjs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "danawa-search-api",
      configureServer(server) {
        server.middlewares.use("/api/danawa-search", async (request, response) => {
          try {
            const items = await handleDanawaSearchRequest(request.url ?? "");
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ items }));
          } catch (error) {
            response.statusCode = 500;
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Danawa search failed" }));
          }
        });
      }
    }
  ]
});
