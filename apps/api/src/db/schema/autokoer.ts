// Skema: autokoer — køen af opgaver, som systemet tager hele vejen til en
// pull request. Én række pr. gang en opgave sættes i kø (historikken bevares).

import { pgTable, pgEnum, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import type { TokenForbrug } from "../../../../../packages/domain/src/domain/forbrug";
import { opgaver } from "./opgaver";
import { agenter } from "./agenter";
import { implementeringer } from "./implementeringer";

export const autokoerStatus = pgEnum("autokoer_status", ["venter", "koerer", "faerdig", "fejlet"]);
export const autokoerValgtAf = pgEnum("autokoer_valgt_af", ["bruger", "arkitekt"]);

export const autokoer = pgTable(
  "autokoer",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    opgaveId: uuid("opgave_id")
      .notNull()
      .references(() => opgaver.id, { onDelete: "cascade" }),
    status: autokoerStatus("status").notNull().default("venter"),
    valgtAf: autokoerValgtAf("valgt_af"),
    // Arkitekten, der valgte — så valget tæller med i forbruget under hans navn
    valgtAfAgentId: uuid("valgt_af_agent_id").references(() => agenter.id),
    begrundelse: text("begrundelse"),
    implementeringId: uuid("implementering_id").references(() => implementeringer.id, { onDelete: "set null" }),
    prUrl: text("pr_url"),
    besked: text("besked"),
    tokenforbrug: jsonb("tokenforbrug").$type<TokenForbrug>(),
    tilfoejetTidspunkt: timestamp("tilfoejet_tidspunkt", { withTimezone: true }).notNull().defaultNow(),
    startetTidspunkt: timestamp("startet_tidspunkt", { withTimezone: true }),
    afsluttetTidspunkt: timestamp("afsluttet_tidspunkt", { withTimezone: true }),
  },
  (t) => [index("idx_autokoer_opgave").on(t.opgaveId), index("idx_autokoer_status").on(t.status)]
);
