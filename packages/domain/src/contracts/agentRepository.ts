// Kontrakt for agent-persistens.

import type { AiAgent } from "../domain/agent";

export interface IAgentRepository {
  hentAlle(): Promise<AiAgent[]>;
  /** Agenter med en bestemt rolle, fx "Programmør" til implementering */
  hentMedRolle(rolleNavn: string): Promise<AiAgent[]>;
}
