// AgentRepository — oversætter agent-rækker til domænet.

import { eq } from "drizzle-orm";
import type { Db } from "../db/db";
import { agenter, roller, type AgentRow } from "../db/schema";
import type { AiAgent } from "../../../../packages/domain/src/domain/agent";
import type { IAgentRepository } from "../../../../packages/domain/src/contracts/agentRepository";

export class AgentRepository implements IAgentRepository {
  constructor(private readonly db: Db) {}

  async hentAlle(): Promise<AiAgent[]> {
    const rows = await this.db.select().from(agenter);
    return rows.map(tilDomaene);
  }

  async hentMedRolle(rolleNavn: string): Promise<AiAgent[]> {
    const rows = await this.db
      .select({ agent: agenter })
      .from(agenter)
      .innerJoin(roller, eq(agenter.rolleId, roller.id))
      .where(eq(roller.navn, rolleNavn));
    return rows.map((r) => tilDomaene(r.agent));
  }
}

function tilDomaene(row: AgentRow): AiAgent {
  return {
    id: row.id,
    rolleId: row.rolleId,
    navn: row.navn,
    personlighed: row.personlighed,
    fokuspunkter: row.fokuspunkter,
    sparringsNiveau: row.sparringsNiveau,
    oprettetTidspunkt: row.oprettetTidspunkt.toISOString(),
  };
}
