// Skema: skaermbilleder — før/efter-billeder af implementeringer.
// Billederne ligger i databasen (bytea), så de kommer med i backups
// og overlever, at agentens gren og mappe ryddes op.

import { pgTable, pgEnum, uuid, text, integer, timestamp, index, customType } from "drizzle-orm/pg-core";
import { implementeringer } from "./implementeringer";

const bytea = customType<{ data: Buffer }>({
  dataType: () => "bytea",
});

export const skaermbilledTilstand = pgEnum("skaermbillede_tilstand", ["foer", "efter"]);

export const skaermbilleder = pgTable(
  "skaermbilleder",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Slettes sammen med implementeringen (fx ved permanent sletning af et projekt)
    implementeringId: uuid("implementering_id")
      .notNull()
      .references(() => implementeringer.id, { onDelete: "cascade" }),
    rute: text("rute").notNull(),
    tilstand: skaermbilledTilstand("tilstand").notNull(),
    bredde: integer("bredde").notNull(),
    hoejde: integer("hoejde").notNull(),
    png: bytea("png").notNull(),
    oprettetTidspunkt: timestamp("oprettet_tidspunkt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_skaermbilleder_implementering").on(t.implementeringId)]
);
