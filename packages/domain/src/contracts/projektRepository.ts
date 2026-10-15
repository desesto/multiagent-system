// Kontrakt for projekter.

import type { Projekt, ProjektId, ProjektMedTal } from "../domain/projekt";

export type NytProjekt = Pick<Projekt, "navn" | "beskrivelse" | "sti">;
export type RedigerProjekt = Partial<NytProjekt>;

export interface IProjektRepository {
  opret(nyt: NytProjekt): Promise<Projekt>;
  /** Henter også arkiverede projekter — de kan åbnes og gendannes */
  hent(id: ProjektId): Promise<Projekt | null>;
  /** Aktive (eller kun arkiverede) projekter med tal for deres opgaver, nyeste aktivitet først */
  hentAlle(arkiverede?: boolean): Promise<ProjektMedTal[]>;
  opdater(id: ProjektId, felter: RedigerProjekt): Promise<Projekt | null>;
  /** Fjerner projektet fra oversigten. Opgaverne røres ikke og kommer tilbage ved gendannelse */
  arkiver(id: ProjektId): Promise<Projekt | null>;
  gendan(id: ProjektId): Promise<Projekt | null>;
  /**
   * Sletter projektet og ALT under det for altid: opgaver, beslutninger,
   * kommentarer, agentsvar og implementeringer. Kun for arkiverede projekter.
   */
  sletPermanent(id: ProjektId): Promise<SletResultat>;
  /**
   * Engangsmigrering: opgaver fra før projekterne fandtes, får et projekt
   * ud fra deres sti. Kan køres igen uden at gøre noget. Returnerer antal.
   */
  tildelGamleOpgaver(): Promise<number>;
}

export type SletResultat =
  | "slettet"
  | "findes_ikke"
  /** Sikkerhed: kun et arkiveret projekt kan slettes permanent */
  | "ikke_arkiveret"
  /** En implementering kører eller venter på gennemsyn — dens git-gren skal ryddes op først */
  | "aabne_implementeringer";
