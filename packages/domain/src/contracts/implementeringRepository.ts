// Kontrakt for implementerings-persistens.

import type { Implementering } from "../domain/implementering";
import type { OpgaveId } from "../domain/opgave";

export type NyImplementering = Pick<
  Implementering,
  "id" | "opgaveId" | "beslutningspunktId" | "agentId" | "gren" | "worktreeSti"
>;

export type ImplementeringsOpdatering = Partial<
  Omit<Implementering, "id" | "opgaveId" | "beslutningspunktId" | "agentId" | "oprettetTidspunkt">
>;

export interface IImplementeringRepository {
  opret(ny: NyImplementering): Promise<Implementering>;
  hent(id: string): Promise<Implementering | null>;
  hentForOpgave(opgaveId: OpgaveId): Promise<Implementering[]>;
  opdater(id: string, felter: ImplementeringsOpdatering): Promise<Implementering | null>;
  /** Kørsler, der stod som "koerer", da serveren stoppede, markeres som fejlet */
  markerAfbrudte(): Promise<Implementering[]>;
  /** Fotograferinger, der blev afbrudt af en genstart, markeres som fejlet */
  markerAfbrudteBilleder(): Promise<Implementering[]>;
}
