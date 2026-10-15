// Domæne: AiAgent — den persistente agent-record.
// Bemærk: "KodeAgent extends AiAgent" fra klassediagrammet bliver til
// et diskriminerende felt i stedet for arv. Data der ligger i en
// database arver ikke — det diskriminerer. Orkestratoren bruger
// feltet til at åbne den ekstra sparringskanal til brugeren.

import type { RolleId } from "./rolle";
import type { OpgaveId } from "./opgave";

export type AgentId = string;

export type SparringsNiveau =
  /** Normal: agenten sparrer med brugeren via orchestratorens beslutningspunkter */
  | "normal"
  /** Ekstra: direkte arkitektur-sparring med brugeren (kodeagenten) */
  | "ekstra_arkitektur";

export interface AiAgent {
  id: AgentId;
  rolleId: RolleId;
  navn: string;
  personlighed: string;
  /** Agentens generelle fokuspunkter — supplerer opgavens fokuspunkter */
  fokuspunkter: string[];
  sparringsNiveau: SparringsNiveau;
  oprettetTidspunkt: string;
}

export interface ProjektLogEntry {
  opgaveId: OpgaveId;
  opgaveTitel: string;
  udfald: "succes" | "delvis" | "fejlet";
  afsluttetTidspunkt: string;
}
