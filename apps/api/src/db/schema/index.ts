// Drizzle-skema — den ene sandhedskilde for databasen, delt efter område.
// Migrationer genereres herfra med `npx drizzle-kit generate`, og
// rækketyperne udledes med $inferSelect, så skema og typer aldrig
// kan drive fra hinanden.

import { brugere } from "./brugere";
import { projekter } from "./projekter";
import { roller, agenter } from "./agenter";
import { opgaver } from "./opgaver";
import { beslutningspunkter, agentsvar, kommentarer } from "./beslutninger";
import { implementeringer } from "./implementeringer";
import { skaermbilleder } from "./skaermbilleder";
import { vedhaeftninger } from "./vedhaeftninger";
import { autokoer } from "./autokoer";

export * from "./brugere";
export * from "./projekter";
export * from "./agenter";
export * from "./opgaver";
export * from "./beslutninger";
export * from "./implementeringer";
export * from "./skaermbilleder";
export * from "./vedhaeftninger";
export * from "./autokoer";

// Udledte rækketyper — brug disse i repositories
export type BrugerRow = typeof brugere.$inferSelect;
export type RolleRow = typeof roller.$inferSelect;
export type AgentRow = typeof agenter.$inferSelect;
export type OpgaveRow = typeof opgaver.$inferSelect;
export type BeslutningspunktRow = typeof beslutningspunkter.$inferSelect;
export type AgentSvarRow = typeof agentsvar.$inferSelect;
export type ImplementeringRow = typeof implementeringer.$inferSelect;
export type KommentarRow = typeof kommentarer.$inferSelect;
export type ProjektRow = typeof projekter.$inferSelect;
export type SkaermbilledRow = typeof skaermbilleder.$inferSelect;
export type VedhaeftningRow = typeof vedhaeftninger.$inferSelect;
export type AutokoerRow = typeof autokoer.$inferSelect;
