import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/kanban-board/",
  build: { sourcemap: false },
  plugins: [react()],
});

