// Skema: vedhaeftninger — billeder i opgavebeskrivelser og kommentarer.
// Et billede gemmes først løst (begge koblinger null) og kobles på, når
// opgaven eller kommentaren gemmes. Slettes sammen med det, det hører til.

import { pgTable, uuid, text, integer, timestamp, index, customType } from "drizzle-orm/pg-core";
import type { VedhaeftningType } from "../../../../../packages/domain/src/domain/vedhaeftning";
import { opgaver } from "./opgaver";
import { kommentarer } from "./beslutninger";

const bytea = customType<{ data: Buffer }>({
  dataType: () => "bytea",
});

export const vedhaeftninger = pgTable(
  "vedhaeftninger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    opgaveId: uuid("opgave_id").references(() => opgaver.id, { onDelete: "cascade" }),
    kommentarId: uuid("kommentar_id").references(() => kommentarer.id, { onDelete: "cascade" }),
    navn: text("navn").notNull(),
    // Bestemt ud fra filens indhold, ikke ud fra hvad browseren påstod
    type: text("type").$type<VedhaeftningType>().notNull(),
    stoerrelse: integer("stoerrelse").notNull(),
    data: bytea("data").notNull(),
    oprettetTidspunkt: timestamp("oprettet_tidspunkt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_vedhaeftninger_opgave").on(t.opgaveId),
    index("idx_vedhaeftninger_kommentar").on(t.kommentarId),
  ]
);
