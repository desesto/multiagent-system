// Kontrakter for forbrug og budget.

import type { Koersel } from "../domain/forbrug";

export interface IForbrugRepository {
  /** Alle kørsler fra og med tidspunktet — evt. kun for én opgave */
  hentKoersler(fra: Date, opgaveId?: string): Promise<Koersel[]>;
}

/**
 * Tjekker dagens forbrug FØR en betalt kørsel starter. Kaster, hvis
 * dagsbudgettet er brugt. Slået fra i mock-tilstand og uden budget.
 */
export interface IBudgetvagt {
  tjek(): Promise<void>;
}
