// AgentSvarRepository — persistens for agenternes fulde svar.

import { desc, eq } from "drizzle-orm";
import type { Db } from "../db/db";
import { agentsvar, type AgentSvarRow } from "../db/schema";
import type {
  IAgentSvarRepository,
  GemtAgentSvar,
} from "../../../../packages/domain/src/contracts/agentSvarRepository";

export class AgentSvarRepository implements IAgentSvarRepository {
  constructor(private readonly db: Db) {}

  async gem(
    svar: Omit<GemtAgentSvar, "id" | "oprettetTidspunkt">
  ): Promise<GemtAgentSvar> {
    const [row] = await this.db
      .insert(agentsvar)
      .values({
        opgaveId: svar.opgaveId,
        agentId: svar.agentId,
        beslutningspunktId: svar.beslutningspunktId,
        indhold: svar.indhold,
        resume: svar.resume,
        laesteFiler: svar.laesteFiler,
        tokenforbrug: svar.forbrug,
      })
      .returning();
    return tilDomaene(row);
  }

  async hentForBeslutningspunkt(punktId: string): Promise<GemtAgentSvar[]> {
    const rows = await this.db
      .select()
      .from(agentsvar)
      .where(eq(agentsvar.beslutningspunktId, punktId))
      .orderBy(desc(agentsvar.oprettetTidspunkt));
    return rows.map(tilDomaene);
  }

  async hentForOpgave(opgaveId: string): Promise<GemtAgentSvar[]> {
    const rows = await this.db
      .select()
      .from(agentsvar)
      .where(eq(agentsvar.opgaveId, opgaveId))
      .orderBy(desc(agentsvar.oprettetTidspunkt));
    return rows.map(tilDomaene);
  }
}

function tilDomaene(row: AgentSvarRow): GemtAgentSvar {
  return {
    id: row.id,
    opgaveId: row.opgaveId,
    agentId: row.agentId,
    beslutningspunktId: row.beslutningspunktId,
    indhold: row.indhold,
    resume: row.resume,
    laesteFiler: row.laesteFiler,
    forbrug: row.tokenforbrug ?? null,
    oprettetTidspunkt: row.oprettetTidspunkt.toISOString(),
  };
}
