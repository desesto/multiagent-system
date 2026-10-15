// Databaseklienten — det ENESTE sted forbindelsen oprettes.
// Alle repositories får db-instansen injiceret, så tests kan give
// dem en anden (fx mod en testdatabase) uden at ændre koden.

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://multiagent:multiagent_dev@localhost:5432/multiagent",
});

export const db = drizzle(pool, { schema });

/** Typen på klienten — brug denne i repository-constructors */
export type Db = typeof db;
