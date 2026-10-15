// Domæne: Opgave og alt der hænger på den.
// Rene data-interfaces — ingen opførsel. Disse former rejser mellem
// PostgreSQL, API'et og websiden som JSON.

import type { AgentId } from "./agent";
import type { BrugerId } from "./bruger";
import type { Kommentar } from "./kommentar";
import type { ProjektId } from "./projekt";

export type OpgaveId = string;

export type OpgaveType =
  | "bugfix"
  | "ny_feature"
  | "system_fra_bunden"
  | "prototype";

/**
 * HVOR i systemet arbejdet foregår — uafhængigt af typen, som siger, HVILKEN
 * slags arbejde det er. Frontend og fuldstack får design-skitser pr. forslag.
 */
export type OpgaveOmraade = "frontend" | "backend" | "fuldstack" | "andet";

/** Områder, hvor agenterne tegner en skitse af hvert forslag */
export const VISUELLE_OMRAADER: readonly OpgaveOmraade[] = ["frontend", "fuldstack"];

export type OpgaveStatus =
  | "oprettet"
  | "nedbrudt"
  | "i_gang"
  | "afventer_beslutning"
  | "afsluttet";

export interface Opgave {
  id: OpgaveId;
  titel: string;
  beskrivelse: string;
  type: OpgaveType;
  /** null = ikke angivet (fx opgaver fra før feltet fandtes) */
  omraade: OpgaveOmraade | null;
  status: OpgaveStatus;
  /** Fokuspunkter valgt af brugeren ved oprettelse */
  fokuspunkter: string[];
  /** Projektet, opgaven hører til — null kun for opgaver fra før projekterne */
  projektId: ProjektId | null;
  /** Kopi af projektets sti — det er den, agenterne læser og skriver i */
  projektSti: string | null;
  oprettetAfBrugerId: BrugerId;
  oprettetTidspunkt: string; // ISO 8601
}

/**
 * Join mellem opgave og agent. De valgfrie karakteristika hører til
 * HER — ikke på rollen eller agenten — fordi de vælges pr. tildeling.
 */
export interface Tildeling {
  id: string;
  opgaveId: OpgaveId;
  agentId: AgentId;
  /** Navne på valgfrie karakteristika fra rollen, valgt af brugeren */
  valgteKarakteristika: string[];
  tildeltTidspunkt: string;
}

export interface Valgmulighed {
  id: string;
  beskrivelse: string;
  fordele: string[];
  ulemper: string[];
  anbefaletAf: AgentId[];
  /** Hvilken agent der foreslog muligheden — vigtigt når flere agenter bidrager */
  foreslaaetAf?: AgentId;
  /** Selvstændig HTML-skitse af retningen — kun ved visuelle opgaver. Vises i en sandkasse */
  designHtml?: string | null;
}

/**
 * Et punkt i opgaven hvor agenterne har fremlagt muligheder og
 * brugeren skal træffe retningsvalget. Append-only pr. opgave,
 * så du får en fuld beslutningshistorik.
 */
export interface TidligereValg {
  mulighedId: string;
  valgtTidspunkt: string;
  fortrudtTidspunkt: string;
}

export interface Beslutningspunkt {
  id: string;
  opgaveId: OpgaveId;
  stilletAf: AgentId | "orchestrator";
  spoergsmaal: string;
  valgmuligheder: Valgmulighed[];
  /** null indtil brugeren har besluttet */
  valgtMulighedId: string | null;
  besluttetTidspunkt: string | null;
  /** Fortrudte valg — historikken overskrives ALDRIG, den flyttes hertil */
  tidligereValg?: TidligereValg[];
  /** Sat, når brugeren har bedt om en ny vurdering: id på det nye punkt */
  erstattetAf?: string | null;
  /** Brugerens kommentarer, ældste først */
  kommentarer?: Kommentar[];
}

export interface Retrospektiv {
  id: string;
  opgaveId: OpgaveId;
  hvadGikGodt: string[];
  hvadGikDaarligt: string[];
  /** Læringer der skal destilleres ind i agenternes wisdom-dokumenter */
  tagesVidere: string[];
  oprettetTidspunkt: string;
}
