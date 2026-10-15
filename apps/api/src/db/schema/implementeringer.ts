// Skema: implementeringer — agenternes kørsler på egne git-grene.

import { pgTable, pgEnum, uuid, text, jsonb, timestamp, index, doublePrecision } from "drizzle-orm/pg-core";
import type { TokenForbrug } from "../../../../../packages/domain/src/domain/forbrug";
import type { AendretFil } from "../../../../../packages/domain/src/domain/implementering";
import { opgaver } from "./opgaver";
import { agenter } from "./agenter";
import { beslutningspunkter } from "./beslutninger";

export const implementeringStatus = pgEnum("implementering_status", [
  "koerer",
  "klar",
  "fejlet",
  "kasseret",
  "flettet",
]);

export const billedStatus = pgEnum("billed_status", ["tages", "klar", "fejlet"]);

export const implementeringer = pgTable(
  "implementeringer",
  {
    // Id'et gives af koordinatoren, fordi grennavnet bygger på det
    id: uuid("id").primaryKey(),
    opgaveId: uuid("opgave_id")
      .notNull()
      .references(() => opgaver.id),
    beslutningspunktId: uuid("beslutningspunkt_id")
      .notNull()
      .references(() => beslutningspunkter.id),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agenter.id),
    status: implementeringStatus("status").notNull().default("koerer"),
    gren: text("gren").notNull(),
    worktreeSti: text("worktree_sti").notNull(),
    commitHash: text("commit_hash"),
    aendredeFiler: jsonb("aendrede_filer").$type<AendretFil[]>().notNull().default([]),
    laesteFiler: jsonb("laeste_filer").$type<string[]>().notNull().default([]),
    opsummering: text("opsummering"),
    fejl: text("fejl"),
    tokenforbrug: jsonb("tokenforbrug").$type<TokenForbrug>(),
    prisUsd: doublePrecision("pris_usd"),
    // Før/efter-billeder (se skaermbilleder.ts) — null ved ikke-visuelle opgaver
    billedStatus: billedStatus("billed_status"),
    billedBesked: text("billed_besked"),
    prUrl: text("pr_url"),
    oprettetTidspunkt: timestamp("oprettet_tidspunkt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    afsluttetTidspunkt: timestamp("afsluttet_tidspunkt", { withTimezone: true }),
  },
  (t) => [index("idx_implementeringer_opgave").on(t.opgaveId)]
);
