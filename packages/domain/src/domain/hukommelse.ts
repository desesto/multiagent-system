// Domæne: AgentHukommelse — den treladede hukommelsesmodel fra
// designdokumentet (afsnit 4). Tre lag med hver sin ændringstakt:
//   identitet: aldrig | config: langsomt, kun med godkendelse | memory: konstant, append-only

import type { AgentId, ProjektLogEntry } from "./agent";
import type { OpgaveId } from "./opgave";

/** Ankeret. Skrives én gang ved spawn og låses. Agent Zero rekonstrueres herfra. */
export interface IdentityLayer {
  agentId: AgentId;
  oprindeligtFormaal: string;
  scopeGraenser: string[];
  oprettetTidspunkt: string;
}

/** Ændres kun efter orchestrator-godkendelse af en foreslået ændring. */
export interface ConfigLayer {
  systemPrompt: string;
  foretrukneVaerktoejer: string[];
  outputFormatPraeferencer: string;
  kendteFejlmoenstre: string[];
  version: number;
}

/** Struktureret selv-evaluering efter hver opgave (afsnit 4.4). */
export interface Refleksion {
  opgaveId: OpgaveId;
  hvadVirkede: string[];
  hvadFejlede: string[];
  generaliserbareMoenstre: string[];
  /** Forslag — skrives kun til ConfigLayer efter orchestrator-godkendelse */
  foreslaaedeConfigAendringer: Partial<ConfigLayer> | null;
  /** false = agenten følte opgaven lå udenfor dens formål (drift-signal) */
  indenforScope: boolean;
  oprettetTidspunkt: string;
}

/** Vokser kontinuerligt. Fuld log i kold lagring, wisdom injiceres i kontekst. */
export interface MemoryLayer {
  projektLog: ProjektLogEntry[];
  refleksioner: Refleksion[];
  /** Komprimeret destillat af alle refleksioner — injiceres øverst i nye opgavekontekster */
  wisdomDokument: string;
  sidstKomprimeretTidspunkt: string | null;
}

export interface AgentHukommelse {
  identitet: IdentityLayer;
  config: ConfigLayer;
  memory: MemoryLayer;
}
