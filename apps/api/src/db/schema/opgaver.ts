// Skema: opgaver.

import { pgTable, pgEnum, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { brugere } from "./brugere";
import { projekter } from "./projekter";

// Enums — matcher 1:1 union-typerne i packages/domain
export const opgaveType = pgEnum("opgave_type", [
  "bugfix",
  "ny_feature",
  "system_fra_bunden",
  "prototype",
]);

export const opgaveOmraade = pgEnum("opgave_omraade", [
  "frontend",
  "backend",
  "fuldstack",
  "andet",
]);

export const opgaveStatus = pgEnum("opgave_status", [
  "oprettet",
  "nedbrudt",
  "i_gang",
  "afventer_beslutning",
  "afsluttet",
]);

export const opgaver = pgTable(
  "opgaver",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    titel: text("titel").notNull(),
    beskrivelse: text("beskrivelse").notNull().default(""),
    type: opgaveType("type").notNull(),
    /** null = ikke angivet */
    omraade: opgaveOmraade("omraade"),
    status: opgaveStatus("status").notNull().default("oprettet"),
    fokuspunkter: jsonb("fokuspunkter")
      .$type<string[]>()
      .notNull()
      .default([]),
    oprettetAfBrugerId: uuid("oprettet_af_bruger_id")
      .notNull()
      .references(() => brugere.id),
    /** Projektet, opgaven hører til. Nullable kun for opgaver fra før projekterne */
    projektId: uuid("projekt_id").references(() => projekter.id),
    /** Kopi af projektets sti — det er den, agenterne læser og skriver i */
    projektSti: text("projekt_sti"),
    /** Soft delete — historik slettes aldrig, den skjules */
    slettetTidspunkt: timestamp("slettet_tidspunkt", { withTimezone: true }),
    oprettetTidspunkt: timestamp("oprettet_tidspunkt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_opgaver_status").on(t.status),
    index("idx_opgaver_bruger").on(t.oprettetAfBrugerId),
    index("idx_opgaver_projekt").on(t.projektId),
  ]
);
