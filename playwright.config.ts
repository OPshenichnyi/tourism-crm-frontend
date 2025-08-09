import { defineConfig } from "@playwright/test";

export default defineConfig({
  timeout: 30000,
  retries: 0,
  testDir: "e2e",
  reporter: "list",
  use: {
    baseURL: "http://localhost:3001",
    headless: true,
  },
});
