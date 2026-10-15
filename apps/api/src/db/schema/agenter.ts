// Skema: roller og agenter — hvem der arbejder, og med hvilket formål.

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  jsonb,
  integer,
  timestamp,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import type { Karakteristik } from "../../../../../packages/domain/src/domain/rolle";

export const rolleStatus = pgEnum("rolle_status", [
  "aktiv",
  "drifting",
  "deprecated",
  "suspenderet",
]);

export const sparringsNiveau = pgEnum("sparrings_niveau", [
  "normal",
  "ekstra_arkitektur",
]);

export const roller = pgTable(
  "roller",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    navn: text("navn").notNull(),
    // NB: pgvector-kolonne til dedup-embeddings kommer i senere migration
    formaal: text("formaal").notNull(),
    scopeGraenser: jsonb("scope_graenser")
      .$type<string[]>()
      .notNull()
      .default([]),
    anbefaledeKarakteristika: jsonb("anbefalede_karakteristika")
      .$type<Karakteristik[]>()
      .notNull()
      .default([]),
    valgfrieKarakteristika: jsonb("valgfrie_karakteristika")
      .$type<Karakteristik[]>()
      .notNull()
      .default([]),
    // Selvreference (split-lineage) kræver eksplicit AnyPgColumn-annotation
    parentRolleId: uuid("parent_rolle_id").references(
      (): AnyPgColumn => roller.id
    ),
    status: rolleStatus("status").notNull().default("aktiv"),
    version: integer("version").notNull().default(1),
    oprettetTidspunkt: timestamp("oprettet_tidspunkt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_roller_status").on(t.status)]
);

export const agenter = pgTable(
  "agenter",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rolleId: uuid("rolle_id")
      .notNull()
      .references(() => roller.id),
    navn: text("navn").notNull(),
    personlighed: text("personlighed").notNull().default(""),
    fokuspunkter: jsonb("fokuspunkter")
      .$type<string[]>()
      .notNull()
      .default([]),
    sparringsNiveau: sparringsNiveau("sparrings_niveau")
      .notNull()
      .default("normal"),
    oprettetTidspunkt: timestamp("oprettet_tidspunkt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_agenter_rolle").on(t.rolleId)]
);
