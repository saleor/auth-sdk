import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    passWithNoTests: true,
    environment: "jsdom",
    setupFiles: "./setup-tests.ts",
    css: false,
    outputFile: {
      json: "coverage/report.json",
    },
    coverage: {
      reporter: ["text", "json", "html", "text-summary"],
    },
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
  },
});
