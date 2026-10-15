// Skema: brugere.

import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const brugere = pgTable("brugere", {
  id: uuid("id").primaryKey().defaultRandom(),
  navn: text("navn").notNull(),
  email: text("email").notNull().unique(),
  oprettetTidspunkt: timestamp("oprettet_tidspunkt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
