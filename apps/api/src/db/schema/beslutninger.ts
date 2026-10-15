// Skema: beslutningspunkter og agenternes svar — revisionssporet.

import { pgTable, uuid, text, jsonb, timestamp, index, type AnyPgColumn } from "drizzle-orm/pg-core";
import type { Valgmulighed, TidligereValg } from "../../../../../packages/domain/src/domain/opgave";
import type { TokenForbrug } from "../../../../../packages/domain/src/domain/forbrug";
import { opgaver } from "./opgaver";
import { agenter } from "./agenter";

export const beslutningspunkter = pgTable(
  "beslutningspunkter",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    opgaveId: uuid("opgave_id")
      .notNull()
      .references(() => opgaver.id),
    /** AgentId eller "orchestrator" — bevidst uden FK, så orchestratoren selv kan stille punkter */
    stilletAf: text("stillet_af").notNull(),
    spoergsmaal: text("spoergsmaal").notNull(),
    valgmuligheder: jsonb("valgmuligheder")
      .$type<Valgmulighed[]>()
      .notNull()
      .default([]),
    /** null indtil brugeren har valgt */
    valgtMulighedId: text("valgt_mulighed_id"),
    besluttetTidspunkt: timestamp("besluttet_tidspunkt", {
      withTimezone: true,
    }),
    /** Fortrudte valg med tidsstempler — revisionssporet er helligt */
    tidligereValg: jsonb("tidligere_valg")
      .$type<TidligereValg[]>()
      .notNull()
      .default([]),
    /** Sat ved en ny vurdering: punktet, der erstattede dette. Det gamle bevares. */
    erstattetAf: uuid("erstattet_af").references((): AnyPgColumn => beslutningspunkter.id),
    oprettetTidspunkt: timestamp("oprettet_tidspunkt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_beslutningspunkter_opgave").on(t.opgaveId)]
);

export const agentsvar = pgTable(
  "agentsvar",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    opgaveId: uuid("opgave_id")
      .notNull()
      .references(() => opgaver.id),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agenter.id),
    beslutningspunktId: uuid("beslutningspunkt_id").references(
      () => beslutningspunkter.id
    ),
    /** Det FULDE svar — altid tilgængeligt for brugeren, aldrig i orchestratorens kontekst */
    indhold: text("indhold").notNull(),
    /** Destillatet orchestratoren arbejder med */
    resume: text("resume").notNull(),
    /** Filer agenten læste før den svarede — revisionsspor */
    laesteFiler: jsonb("laeste_filer")
      .$type<string[]>()
      .notNull()
      .default([]),
    /** Rådata til analyse af tokens og priser */
    tokenforbrug: jsonb("tokenforbrug").$type<TokenForbrug>(),
    oprettetTidspunkt: timestamp("oprettet_tidspunkt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_agentsvar_punkt").on(t.beslutningspunktId)]
);

export const kommentarer = pgTable(
  "kommentarer",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    beslutningspunktId: uuid("beslutningspunkt_id")
      .notNull()
      .references(() => beslutningspunkter.id),
    tekst: text("tekst").notNull(),
    oprettetTidspunkt: timestamp("oprettet_tidspunkt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_kommentarer_punkt").on(t.beslutningspunktId)]
);
