// Kontrakt for kommentarer.

import type { Kommentar } from "../domain/kommentar";

export interface IKommentarRepository {
  opret(beslutningspunktId: string, tekst: string): Promise<Kommentar>;
  /** Returnerer false, hvis kommentaren ikke findes */
  slet(id: string): Promise<boolean>;
}
