// Skema: projekter — toppen af hierarkiet (projekt → opgaver).

import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const projekter = pgTable("projekter", {
  id: uuid("id").primaryKey().defaultRandom(),
  navn: text("navn").notNull(),
  beskrivelse: text("beskrivelse").notNull().default(""),
  /** Absolut sti til kodebasen — null = et projekt uden kode endnu */
  sti: text("sti"),
  /** Fjernet fra oversigten, men kan gendannes. Permanent sletning fjerner rækken */
  arkiveretTidspunkt: timestamp("arkiveret_tidspunkt", { withTimezone: true }),
  oprettetTidspunkt: timestamp("oprettet_tidspunkt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
