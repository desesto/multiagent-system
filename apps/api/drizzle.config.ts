// Drizzle Kit-konfiguration. Køres fra apps/api-mappen:
//   npx drizzle-kit generate   → genererer SQL-migration i db/migrations
//   npx drizzle-kit migrate    → kører migrationerne mod databasen

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  // Migrationer bor i projektroden — de er en delt kontrakt, ikke api-intern
  out: "../../db/migrations",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://multiagent:multiagent_dev@localhost:5432/multiagent",
  },
});
