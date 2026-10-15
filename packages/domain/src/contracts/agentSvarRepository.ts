// Kontrakt for persisterede agentsvar. Princippet: det fulde svar
// gemmes ALTID og er ALTID tilgængeligt for brugeren på forlangende —
// resumé-hierarkiet begrænser kun hvad der flyder gennem
// LLM-kontekster, aldrig brugerens indsigt.

import type { OpgaveId } from "../domain/opgave";
import type { AgentId } from "../domain/agent";
import type { TokenForbrug } from "../domain/forbrug";

export interface GemtAgentSvar {
  id: string;
  opgaveId: OpgaveId;
  agentId: AgentId;
  /** Sat hvis svaret førte til et beslutningspunkt */
  beslutningspunktId: string | null;
  /** Det fulde svar */
  indhold: string;
  /** Destillatet (2-3 sætninger) */
  resume: string;
  /** Filer agenten læste, før den svarede */
  laesteFiler: string[];
  /** Rådata til analyse — null for mocken og for svar fra før målingen */
  forbrug: TokenForbrug | null;
  oprettetTidspunkt: string;
}

export interface IAgentSvarRepository {
  gem(
    svar: Omit<GemtAgentSvar, "id" | "oprettetTidspunkt">
  ): Promise<GemtAgentSvar>;
  hentForBeslutningspunkt(punktId: string): Promise<GemtAgentSvar[]>;
  hentForOpgave(opgaveId: OpgaveId): Promise<GemtAgentSvar[]>;
}
