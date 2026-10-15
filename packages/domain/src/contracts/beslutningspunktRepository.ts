// Kontrakt for beslutningspunkt-persistens.

import type { Beslutningspunkt, OpgaveId } from "../domain/opgave";

export interface IBeslutningspunktRepository {
  /** Punktet kommer færdigbygget fra orchestratoren (inkl. id) */
  opret(punkt: Beslutningspunkt): Promise<Beslutningspunkt>;
  hent(id: string): Promise<Beslutningspunkt | null>;
  /** Alle punkter hvor brugeren endnu ikke har valgt */
  hentAabne(): Promise<Beslutningspunkt[]>;
  hentForOpgave(opgaveId: OpgaveId): Promise<Beslutningspunkt[]>;
  /**
   * Registrerer brugerens valg. Returnerer null hvis punktet ikke
   * findes ELLER allerede er besluttet — beslutninger er endelige.
   */
  registrerValg(
    id: string,
    valgtMulighedId: string
  ): Promise<Beslutningspunkt | null>;
  /**
   * Genåbner et besluttet punkt. Det gamle valg flyttes til
   * tidligereValg-loggen — overskrives aldrig. Returnerer null hvis
   * punktet ikke findes eller ikke er besluttet.
   */
  fortrydValg(id: string): Promise<Beslutningspunkt | null>;
  /** Punktet er erstattet af en ny vurdering — det bevares i historikken */
  markerErstattet(id: string, nytPunktId: string): Promise<void>;
}
